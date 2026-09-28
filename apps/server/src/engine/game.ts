import { applySkin, getStory, type Beat, type Story, type UnlockRule } from '@mn/story';
import type { GuestRow, Repo, SessionRow, UnlockRow } from '../db/repo.js';

export type Now = () => number;

/** Where the engine reports changes; the realtime hub implements it. */
export interface Outbox {
  changed(sessionId: string): void;
  notify(sessionId: string, text: string): void;
}

export type NpcReplier = (args: {
  story: Story;
  session: SessionRow;
  guest: GuestRow;
  npcId: string;
  history: { sender: 'guest' | 'npc'; text: string }[];
  text: string;
}) => Promise<string>;

export class GameError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const PLAYER_TYPES = ['talker', 'detective', 'schemer', 'chill'] as const;
export type PlayerType = (typeof PLAYER_TYPES)[number];

/** Snapshot of everything the rules need for one session. */
export interface Ctx {
  session: SessionRow;
  story: Story;
  elapsedMin: number;
  unlocks: UnlockRow[];
  clues: Set<string>;
  beats: Set<string>;
  firedBeats: Beat[];
}

export class Game {
  constructor(
    readonly repo: Repo,
    readonly now: Now,
    private readonly out: Outbox,
    private readonly replier: NpcReplier,
  ) {}

  // ── Reading state ────────────────────────────────────────────────────────

  story(session: SessionRow): Story {
    const s = getStory(session.story_id);
    if (!s) throw new GameError(500, `Unknown story ${session.story_id}`);
    return s;
  }

  elapsedMin(s: SessionRow, now = this.now()): number {
    if (!s.started_at) return 0;
    const until = s.ended_at ?? s.paused_at ?? now;
    const ms = (until - s.started_at - s.paused_ms) * s.speed + s.skipped_ms;
    return Math.max(0, ms / 60_000);
  }

  ctx(sessionId: string): Ctx {
    const session = this.repo.session(sessionId);
    if (!session) throw new GameError(404, 'Session not found');
    const story = this.story(session);
    const unlocks = this.repo.unlocks(sessionId);
    const beats = new Set(unlocks.filter((u) => u.kind === 'beat').map((u) => u.item_id));
    return {
      session,
      story,
      elapsedMin: this.elapsedMin(session),
      unlocks,
      clues: new Set(unlocks.filter((u) => u.kind === 'clue').map((u) => u.item_id)),
      beats,
      firedBeats: story.beats.filter((b) => beats.has(b.id)),
    };
  }

  /** Whether a time/start rule is satisfied (used for posts, missions, the stream VOD). */
  static ruleMet(rule: UnlockRule, c: Ctx): boolean {
    switch (rule.type) {
      case 'start':
        return true;
      case 'time':
        return c.session.started_at != null && c.elapsedMin >= rule.atMin;
      default:
        return false;
    }
  }

  static openContacts(c: Ctx): Set<string> {
    return new Set(c.firedBeats.flatMap((b) => b.openContacts));
  }

  static voteOpen(c: Ctx): boolean {
    return c.firedBeats.some((b) => b.openVote);
  }

  // ── Host actions ─────────────────────────────────────────────────────────

  createSession(opts: { storyId: string; skin?: string; hidingPlace?: string; speed?: number }): SessionRow {
    const story = getStory(opts.storyId);
    if (!story) throw new GameError(404, 'Unknown story');
    const skin = opts.skin ?? story.defaultSkin;
    if (!story.skins[skin]) throw new GameError(400, 'Unknown skin');
    const now = this.now();
    const s = this.repo.createSession({
      storyId: story.id,
      skin,
      hidingPlace: opts.hidingPlace ?? '',
      speed: opts.speed ?? 1,
      now,
    });
    for (const c of story.clues)
      if (c.unlock.type === 'start')
        this.repo.unlock({ sessionId: s.id, kind: 'clue', itemId: c.id, source: 'start', now, gameMin: 0 });
    this.repo.event(s.id, 'created', { storyId: story.id, skin }, now);
    return s;
  }

  setup(sessionId: string, patch: { hidingPlace?: string }): void {
    if (patch.hidingPlace !== undefined)
      this.repo.updateSession(sessionId, { hiding_place: patch.hidingPlace.trim().slice(0, 200) });
    this.out.changed(sessionId);
  }

  start(sessionId: string): void {
    const s = this.mustSession(sessionId);
    if (s.status !== 'pregame') throw new GameError(409, 'Already started');
    const story = this.story(s);
    const cast = this.repo.guests(sessionId).map((g) => g.character_id);
    const missingCore = story.characters.filter((c) => c.core && !cast.includes(c.id));
    if (missingCore.length)
      throw new GameError(409, `חסרים שחקנים לדמויות: ${missingCore.map((c) => c.name).join(', ')}`);
    const now = this.now();
    this.repo.updateSession(sessionId, { status: 'live', started_at: now });
    this.repo.event(sessionId, 'started', {}, now);
    this.tick(sessionId);
    this.out.changed(sessionId);
  }

  pause(sessionId: string): void {
    const s = this.mustSession(sessionId);
    if (s.status !== 'live') throw new GameError(409, 'Not live');
    this.repo.updateSession(sessionId, { status: 'paused', paused_at: this.now() });
    this.out.changed(sessionId);
  }

  resume(sessionId: string): void {
    const s = this.mustSession(sessionId);
    if (s.status !== 'paused' || s.paused_at == null) throw new GameError(409, 'Not paused');
    const now = this.now();
    this.repo.updateSession(sessionId, {
      status: 'live',
      paused_at: null,
      paused_ms: s.paused_ms + (now - s.paused_at),
    });
    this.tick(sessionId);
    this.out.changed(sessionId);
  }

  /** Jump the game clock to the next beat. */
  skip(sessionId: string): string | null {
    const c = this.ctx(sessionId);
    if (c.session.status !== 'live') throw new GameError(409, 'Not live');
    const next = c.story.beats.find((b) => !c.beats.has(b.id));
    if (!next) return null;
    const gap = Math.max(0, next.atMin - c.elapsedMin) * 60_000;
    this.repo.updateSession(sessionId, { skipped_ms: c.session.skipped_ms + gap + 1 });
    this.tick(sessionId);
    return next.label;
  }

  /** Nudge the table toward the earliest clue they could find now but haven't. */
  hint(sessionId: string): string | null {
    const c = this.ctx(sessionId);
    const contacts = Game.openContacts(c);
    const clue = c.story.clues.find(
      (k) =>
        k.hint &&
        !c.clues.has(k.id) &&
        c.elapsedMin >= k.hintFromMin &&
        (k.unlock.type === 'qr' ||
          k.unlock.type === 'answer' ||
          (k.unlock.type === 'npc' && contacts.has(k.unlock.npc))),
    );
    if (!clue?.hint) return null;
    const now = this.now();
    this.repo.event(sessionId, 'hint', { clue: clue.id }, now);
    this.notify(sessionId, `💡 רמז: ${clue.hint}`);
    return clue.hint;
  }

  end(sessionId: string): void {
    this.repo.updateSession(sessionId, { status: 'ended', ended_at: this.now() });
    this.out.changed(sessionId);
  }

  // ── Guests ───────────────────────────────────────────────────────────────

  join(inviteCode: string, name: string, playerType: PlayerType | null): GuestRow {
    const s = this.repo.sessionByInvite(inviteCode);
    if (!s) throw new GameError(404, 'הזמנה לא נמצאה');
    if (s.status === 'ended') throw new GameError(409, 'הערב הסתיים');
    const story = this.story(s);
    const taken = new Set(this.repo.guests(s.id).map((g) => g.character_id));
    if (taken.size >= story.maxPlayers) throw new GameError(409, 'כל הדמויות תפוסות');
    const characterId = Game.cast(story, taken, playerType);
    if (!characterId) throw new GameError(409, 'כל הדמויות תפוסות');
    const guest = this.repo.addGuest({
      sessionId: s.id,
      name: name.trim().slice(0, 40),
      characterId,
      playerType,
      now: this.now(),
    });
    this.repo.event(s.id, 'joined', { guest: guest.id, character: characterId }, this.now());
    this.out.changed(s.id);
    return guest;
  }

  /** Core characters first (the solution needs them), then the best fit for the player's type. */
  static cast(story: Story, taken: Set<string>, playerType: PlayerType | null): string | undefined {
    const free = story.characters.filter((c) => !taken.has(c.id));
    const core = free.filter((c) => c.core);
    const pool = core.length ? core : free;
    const fit = playerType ? pool.find((c) => c.fits.includes(playerType)) : undefined;
    return (fit ?? pool[0])?.id;
  }

  toolAnswer(guest: GuestRow, toolId: string, value: string): { clue: string | null } {
    const c = this.playing(guest.session_id);
    if (!c.story.tools.some((t) => t.id === toolId)) throw new GameError(404, 'Unknown tool');
    const v = value.replace(/[\s#-]/g, '').toLowerCase();
    const hit = c.story.clues.find(
      (k) =>
        k.unlock.type === 'answer' &&
        k.unlock.tool === toolId &&
        k.unlock.accept.some((a) => a.toLowerCase() === v),
    );
    this.repo.event(
      c.session.id,
      'tool',
      { guest: guest.id, tool: toolId, value: v, hit: hit?.id ?? null },
      this.now(),
    );
    if (hit) this.unlockClue(c, hit.id, 'answer', guest);
    return { clue: hit?.id ?? null };
  }

  scanQr(guest: GuestRow, code: string): { clues: string[] } {
    const c = this.playing(guest.session_id);
    const v = code.trim().toUpperCase();
    const hits = c.story.clues.filter((k) => k.unlock.type === 'qr' && k.unlock.code.toUpperCase() === v);
    for (const h of hits) this.unlockClue(c, h.id, 'qr', guest);
    return { clues: hits.map((h) => h.id) };
  }

  async npcMessage(guest: GuestRow, npcId: string, text: string): Promise<{ reply: string }> {
    const c = this.playing(guest.session_id);
    const npc = c.story.npcs.find((n) => n.id === npcId);
    if (!npc || !Game.openContacts(c).has(npcId)) throw new GameError(404, 'איש הקשר לא זמין');
    const clean = text.trim().slice(0, 500);
    if (!clean) throw new GameError(400, 'Empty message');
    const history = this.repo
      .messages(c.session.id, guest.id)
      .filter((m) => m.npc_id === npcId)
      .map((m) => ({ sender: m.sender, text: m.text }));
    this.repo.addMessage({
      sessionId: c.session.id,
      guestId: guest.id,
      npcId,
      sender: 'guest',
      text: clean,
      now: this.now(),
    });
    this.out.changed(c.session.id);

    const reply = await this.replier({
      story: c.story,
      session: c.session,
      guest,
      npcId,
      history,
      text: clean,
    });
    this.repo.addMessage({
      sessionId: c.session.id,
      guestId: guest.id,
      npcId,
      sender: 'npc',
      text: reply,
      now: this.now(),
    });

    // Keyword rules look at what the guest asked, so clue unlocks don't depend on the AI's wording.
    const lower = clean.toLowerCase();
    const fresh = this.ctx(c.session.id);
    for (const k of fresh.story.clues) {
      if (
        k.unlock.type === 'npc' &&
        k.unlock.npc === npcId &&
        k.unlock.keywords.some((w) => lower.includes(w.toLowerCase()))
      ) {
        this.unlockClue(fresh, k.id, `npc:${npcId}`, guest);
      }
    }
    this.out.changed(c.session.id);
    return { reply };
  }

  accuse(guest: GuestRow, suspects: string[]): void {
    const c = this.ctx(guest.session_id);
    if (!Game.voteOpen(c) || c.session.status === 'ended') throw new GameError(409, 'ההצבעה עוד לא נפתחה');
    const cast = new Set(this.repo.guests(c.session.id).map((g) => g.character_id));
    const unique = [...new Set(suspects)];
    if (
      !unique.length ||
      unique.length > c.story.accusation.maxSuspects ||
      unique.some((s) => !cast.has(s))
    ) {
      throw new GameError(400, 'Invalid suspects');
    }
    this.repo.accuse(c.session.id, guest.id, unique, this.now());
    this.out.changed(c.session.id);
  }

  // ── Clock ────────────────────────────────────────────────────────────────

  /** Fire due beats and time-based unlocks. Returns true if anything changed. */
  tick(sessionId: string): boolean {
    let c = this.ctx(sessionId);
    if (c.session.status !== 'live' && c.session.status !== 'finale') return false;
    let changed = false;
    const now = this.now();

    for (const beat of c.story.beats) {
      if (c.beats.has(beat.id) || beat.atMin > c.elapsedMin) continue;
      this.repo.unlock({
        sessionId,
        kind: 'beat',
        itemId: beat.id,
        source: 'clock',
        now,
        gameMin: c.elapsedMin,
      });
      this.repo.event(sessionId, 'beat', { beat: beat.id }, now);
      for (const id of beat.release)
        this.repo.unlock({
          sessionId,
          kind: 'clue',
          itemId: id,
          source: `beat:${beat.id}`,
          now,
          gameMin: c.elapsedMin,
        });
      if (beat.finale) this.repo.updateSession(sessionId, { status: 'finale' });
      if (beat.notify) this.notify(sessionId, beat.notify, false);
      changed = true;
    }

    // Time and after-rules can chain, so run to a fixpoint.
    for (let guard = 0; guard < 20; guard++) {
      c = this.ctx(sessionId);
      let round = false;
      for (const k of c.story.clues) {
        if (c.clues.has(k.id)) continue;
        const r = k.unlock;
        let due = r.type === 'start' || (r.type === 'time' && c.elapsedMin >= r.atMin);
        if (r.type === 'after') {
          const dep = c.unlocks.find((u) => u.kind === 'clue' && u.item_id === r.clue);
          due = !!dep && c.elapsedMin >= dep.game_min + r.delayMin;
        }
        if (
          due &&
          this.repo.unlock({
            sessionId,
            kind: 'clue',
            itemId: k.id,
            source: r.type,
            now,
            gameMin: c.elapsedMin,
          })
        )
          round = changed = true;
      }
      if (!round) break;
    }

    if (changed) this.out.changed(sessionId);
    return changed;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private notify(sessionId: string, raw: string, push = true): void {
    const s = this.repo.session(sessionId);
    const text = s ? applySkin(raw, this.story(s).skins[s.skin] ?? {}) : raw;
    this.repo.event(sessionId, 'notify', { text }, this.now());
    this.out.notify(sessionId, text);
    if (push) this.out.changed(sessionId);
  }

  private unlockClue(c: Ctx, clueId: string, source: string, guest: GuestRow): void {
    if (
      this.repo.unlock({
        sessionId: c.session.id,
        kind: 'clue',
        itemId: clueId,
        source,
        now: this.now(),
        gameMin: c.elapsedMin,
        guestId: guest.id,
      })
    ) {
      const clue = c.story.clues.find((k) => k.id === clueId);
      this.notify(c.session.id, `🔍 ראיה חדשה: ${clue?.title ?? clueId} (נמצאה ע״י ${guest.name})`);
    }
  }

  private mustSession(id: string): SessionRow {
    const s = this.repo.session(id);
    if (!s) throw new GameError(404, 'Session not found');
    return s;
  }

  private playing(sessionId: string): Ctx {
    const c = this.ctx(sessionId);
    if (c.session.status !== 'live' && c.session.status !== 'finale')
      throw new GameError(409, 'הערב לא פעיל כרגע');
    return c;
  }
}
