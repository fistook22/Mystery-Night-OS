import { applySkin, type Clue, type Story } from '@mn/story';
import type {
  CastMember,
  EvidenceItem,
  FinaleView,
  GuestView,
  HostView,
  Notification,
  SessionInfo,
  TvScene,
  TvView,
} from '@mn/shared';
import type { GuestRow } from '../db/repo.js';
import { Game, type Ctx } from './game.js';

// Views are what each role is allowed to see. Nothing here leaks the solution
// before the finale, and phone-only data (secrets, missions) goes to its owner only.

const NEW_FOR_MS = 3 * 60_000;

export interface Links {
  base: string;
}

function skin<T>(c: Ctx, value: T): T {
  return applySkin(value, c.story.skins[c.session.skin] ?? {}, {
    hidingPlace: c.session.hiding_place || '…',
  });
}

function sessionInfo(c: Ctx): SessionInfo {
  return {
    id: c.session.id,
    title: c.story.title,
    tagline: c.story.tagline,
    status: c.session.status,
    elapsedMin: Math.floor(c.elapsedMin),
    durationMin: c.story.durationMin,
    voteOpen: Game.voteOpen(c),
  };
}

function castOf(c: Ctx, guests: GuestRow[]): CastMember[] {
  return guests.flatMap((g) => {
    const ch = c.story.characters.find((x) => x.id === g.character_id);
    if (!ch) return [];
    return [
      {
        guestName: g.name,
        characterId: ch.id,
        name: ch.name,
        role: ch.role,
        handle: ch.handle,
        bio: ch.bio,
        publicIntro: ch.publicIntro,
      },
    ];
  });
}

function evidenceItem(c: Ctx, clue: Clue, guests: GuestRow[], now: number): EvidenceItem {
  const u = c.unlocks.find((x) => x.kind === 'clue' && x.item_id === clue.id);
  const finder = u?.guest_id ? guests.find((g) => g.id === u.guest_id)?.name : undefined;
  return {
    id: clue.id,
    title: clue.title,
    kind: clue.kind,
    summary: clue.summary,
    body: clue.body,
    visual: clue.visual,
    foundBy: finder,
    isNew: !!u && now - u.at < NEW_FOR_MS,
  };
}

function visibleClues(c: Ctx, characterId: string | null): Clue[] {
  return c.story.clues.filter(
    (k) =>
      c.clues.has(k.id) &&
      (k.audience === 'all' || (characterId !== null && k.audience.includes(characterId))),
  );
}

function finaleView(
  c: Ctx,
  story: Story,
  guests: GuestRow[],
  accusations: { guest_id: string; suspects: string[] }[],
): FinaleView {
  const culprits = story.solution.culprits;
  return {
    culprits: culprits.map((id) => ({
      characterId: id,
      name: story.characters.find((ch) => ch.id === id)?.name ?? id,
      guestName: guests.find((g) => g.character_id === id)?.name ?? '',
    })),
    explanation: story.solution.explanation,
    riddle: story.solution.finaleRiddle,
    results: guests.map((g) => {
      const mine = accusations.find((a) => a.guest_id === g.id)?.suspects ?? [];
      return {
        guestName: g.name,
        characterName: story.characters.find((ch) => ch.id === g.character_id)?.name ?? '',
        correct: mine.filter((s) => culprits.includes(s)).length,
        of: culprits.length,
      };
    }),
  };
}

function notifications(game: Game, sessionId: string, limit: number): Notification[] {
  return game.repo
    .events(sessionId, 'notify', limit)
    .map((e) => ({ text: (e.payload as { text: string }).text, at: e.at }));
}

export function guestView(game: Game, guest: GuestRow): GuestView {
  const c = game.ctx(guest.session_id);
  const now = game.now();
  const { story } = c;
  const guests = game.repo.guests(c.session.id);
  const ch = story.characters.find((x) => x.id === guest.character_id)!;
  const contacts = Game.openContacts(c);
  const messages = game.repo.messages(c.session.id, guest.id);
  const accusations = game.repo.accusations(c.session.id);
  const started = c.session.started_at != null;
  const byId = new Map(story.characters.map((x) => [x.id, x]));

  const view: GuestView = {
    role: 'guest',
    session: sessionInfo(c),
    premise: story.premise,
    me: {
      guestId: guest.id,
      guestName: guest.name,
      character: {
        guestName: guest.name,
        characterId: ch.id,
        name: ch.name,
        role: ch.role,
        handle: ch.handle,
        bio: ch.bio,
        publicIntro: ch.publicIntro,
        secret: ch.secret,
        goal: ch.goal,
        costume: ch.costume,
      },
      missions: story.missions
        .filter((m) => m.character === ch.id && Game.ruleMet(m.unlock, c))
        .map((m) => m.text),
    },
    cast: castOf(c, guests),
    evidence: started
      ? visibleClues(c, ch.id)
          .map((k) => evidenceItem(c, k, guests, now))
          .reverse()
      : [],
    feed: story.feed
      .filter((p) => (p.deletedClue ? c.clues.has(p.deletedClue) : Game.ruleMet(p.unlock, c)))
      .map((p) => {
        const author = byId.get(p.author)!;
        return {
          id: p.id,
          authorName: author.name,
          handle: author.handle,
          time: p.time,
          text: p.text,
          image: p.image,
          likes: p.likes,
          recovered: !!p.deletedClue,
        };
      })
      .reverse(),
    stream: Game.ruleMet(story.stream.unlock, c)
      ? {
          channel: story.stream.channel,
          title: story.stream.title,
          vodLength: story.stream.vodLength,
          chat: story.stream.chat.map((l) => ({
            t: l.t,
            user: l.user,
            text: l.text,
            flagged: !!l.clue && c.clues.has(l.clue),
          })),
        }
      : null,
    dms: story.dms
      .filter((d) => (d.clue ? c.clues.has(d.clue) : Game.ruleMet(d.unlock, c)))
      .map((d) => ({ id: d.id, title: d.title, messages: d.messages })),
    contacts: story.npcs
      .filter((n) => contacts.has(n.id))
      .map((n) => ({
        id: n.id,
        name: n.name,
        title: n.title,
        opening: n.opening,
        messages: messages
          .filter((m) => m.npc_id === n.id)
          .map((m) => ({ sender: m.sender, text: m.text, at: m.at })),
      })),
    tools: started ? story.tools : [],
    accusation: {
      prompt: story.accusation.prompt,
      maxSuspects: story.accusation.maxSuspects,
      mine: accusations.find((a) => a.guest_id === guest.id)?.suspects ?? null,
    },
    finale:
      c.session.status === 'finale' || c.session.status === 'ended'
        ? finaleView(c, story, guests, accusations)
        : null,
    notifications: notifications(game, c.session.id, 10),
  };
  return skin(c, view);
}

export function tvView(game: Game, sessionId: string, links: Links): TvView {
  const c = game.ctx(sessionId);
  const now = game.now();
  const guests = game.repo.guests(sessionId);
  const accusations = game.repo.accusations(sessionId);
  const last = [...c.firedBeats].reverse().find((b) => b.tv);
  let scene: TvScene;

  if (c.session.status === 'pregame') {
    scene = {
      scene: 'lobby',
      title: c.story.title,
      tagline: c.story.tagline,
      joinUrl: `${links.base}/join/${c.session.invite_code}`,
      inviteCode: c.session.invite_code,
      joined: guests.map((g) => g.name),
    };
  } else if (c.session.status === 'paused') {
    scene = { scene: 'paused' };
  } else if (!last?.tv) {
    scene = { scene: 'title', title: c.story.title };
  } else {
    const tv = last.tv;
    const beatAt = c.unlocks.find((u) => u.kind === 'beat' && u.item_id === last.id)?.at ?? now;
    switch (tv.scene) {
      case 'blackout':
        scene = { scene: 'blackout', seconds: tv.seconds, caption: tv.caption, startedAt: beatAt };
        break;
      case 'clue': {
        const clue = c.story.clues.find((k) => k.id === tv.clue)!;
        scene = { scene: 'clue', clue: evidenceItem(c, clue, guests, now) };
        break;
      }
      case 'finale':
        scene = {
          scene: 'finale',
          title: tv.title,
          body: tv.body,
          finale: finaleView(c, c.story, guests, accusations),
        };
        break;
      default:
        scene = tv;
    }
  }

  const n = notifications(game, sessionId, 1);
  return skin(c, {
    role: 'tv',
    session: sessionInfo(c),
    scene,
    cast: castOf(c, guests),
    evidenceCount: visibleClues(c, null).length,
    votes: { cast: accusations.length, of: guests.length },
    lastNotification: n[0] ?? null,
  });
}

export function hostView(game: Game, sessionId: string, links: Links): HostView {
  const c = game.ctx(sessionId);
  const guests = game.repo.guests(sessionId);
  const accusations = game.repo.accusations(sessionId);
  const cast = new Set(guests.map((g) => g.character_id));
  return skin(c, {
    role: 'host',
    session: sessionInfo(c),
    links: {
      invite: `${links.base}/join/${c.session.invite_code}`,
      tv: `${links.base}/tv/${c.session.tv_token}`,
      host: `${links.base}/host/${c.session.host_token}`,
    },
    inviteCode: c.session.invite_code,
    hidingPlace: c.session.hiding_place,
    guests: guests.map((g) => {
      const ch = c.story.characters.find((x) => x.id === g.character_id);
      return { name: g.name, characterName: ch?.name ?? '', core: !!ch?.core };
    }),
    missingCore: c.story.characters.filter((ch) => ch.core && !cast.has(ch.id)).map((ch) => ch.name),
    minPlayers: c.story.minPlayers,
    maxPlayers: c.story.maxPlayers,
    beats: c.story.beats.map((b) => ({ label: b.label, atMin: b.atMin, fired: c.beats.has(b.id) })),
    progress: {
      found: visibleClues(c, null).length,
      total: c.story.clues.filter((k) => k.audience === 'all').length,
    },
    votes: { cast: accusations.length, of: guests.length },
    finale:
      c.session.status === 'finale' || c.session.status === 'ended'
        ? finaleView(c, c.story, guests, accusations)
        : null,
    notifications: notifications(game, sessionId, 20),
    stickers: [...new Set(c.story.clues.flatMap((k) => (k.unlock.type === 'qr' ? [k.unlock.code] : [])))].map(
      (code, i) => ({
        label: `מדבקה ${i + 1}`,
        url: `${links.base}/qr/${encodeURIComponent(code)}`,
      }),
    ),
  });
}
