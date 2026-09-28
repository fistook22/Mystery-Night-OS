import { randomBytes, randomUUID } from 'node:crypto';
import type { DB } from './index.js';

export interface SessionRow {
  id: string;
  story_id: string;
  skin: string;
  status: 'pregame' | 'live' | 'paused' | 'finale' | 'ended';
  host_token: string;
  tv_token: string;
  invite_code: string;
  hiding_place: string;
  speed: number;
  created_at: number;
  started_at: number | null;
  paused_at: number | null;
  paused_ms: number;
  skipped_ms: number;
  ended_at: number | null;
}

export interface GuestRow {
  id: string;
  session_id: string;
  token: string;
  name: string;
  character_id: string;
  player_type: string | null;
  joined_at: number;
}

export interface UnlockRow {
  kind: 'clue' | 'beat';
  item_id: string;
  guest_id: string;
  source: string;
  at: number;
  game_min: number;
}

export interface MessageRow {
  id: number;
  guest_id: string;
  npc_id: string;
  sender: 'guest' | 'npc';
  text: string;
  at: number;
}

export const token = (bytes = 18) => randomBytes(bytes).toString('base64url');
/** Short, unambiguous invite code (no 0/O/1/I). */
export const inviteCode = () => {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(randomBytes(6), (b) => abc[b % abc.length]).join('');
};

/** Thin typed wrapper over the SQL. All game rules live in the engine. */
export class Repo {
  constructor(readonly db: DB) {}

  createSession(s: {
    storyId: string;
    skin: string;
    hidingPlace: string;
    speed: number;
    now: number;
  }): SessionRow {
    const row: SessionRow = {
      id: randomUUID(),
      story_id: s.storyId,
      skin: s.skin,
      status: 'pregame',
      host_token: token(),
      tv_token: token(),
      invite_code: inviteCode(),
      hiding_place: s.hidingPlace,
      speed: s.speed,
      created_at: s.now,
      started_at: null,
      paused_at: null,
      paused_ms: 0,
      skipped_ms: 0,
      ended_at: null,
    };
    this.db
      .prepare(
        `INSERT INTO sessions (id, story_id, skin, status, host_token, tv_token, invite_code, hiding_place, speed, created_at)
         VALUES (@id, @story_id, @skin, @status, @host_token, @tv_token, @invite_code, @hiding_place, @speed, @created_at)`,
      )
      .run(row);
    return row;
  }

  session(id: string): SessionRow | undefined {
    return this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as SessionRow | undefined;
  }

  sessionByInvite(code: string): SessionRow | undefined {
    return this.db.prepare('SELECT * FROM sessions WHERE invite_code = ?').get(code.toUpperCase()) as
      SessionRow | undefined;
  }

  liveSessions(): SessionRow[] {
    return this.db.prepare(`SELECT * FROM sessions WHERE status IN ('live', 'finale')`).all() as SessionRow[];
  }

  updateSession(id: string, patch: Partial<Omit<SessionRow, 'id'>>): void {
    const keys = Object.keys(patch);
    if (!keys.length) return;
    this.db
      .prepare(`UPDATE sessions SET ${keys.map((k) => `${k} = @${k}`).join(', ')} WHERE id = @id`)
      .run({ ...patch, id });
  }

  /** Resolve any token to its role. */
  resolveToken(
    t: string,
  ):
    | { role: 'host' | 'tv'; session: SessionRow }
    | { role: 'guest'; session: SessionRow; guest: GuestRow }
    | undefined {
    const s = this.db.prepare('SELECT * FROM sessions WHERE host_token = ? OR tv_token = ?').get(t, t) as
      SessionRow | undefined;
    if (s) return { role: s.host_token === t ? 'host' : 'tv', session: s };
    const g = this.db.prepare('SELECT * FROM guests WHERE token = ?').get(t) as GuestRow | undefined;
    if (!g) return undefined;
    const session = this.session(g.session_id);
    return session ? { role: 'guest', session, guest: g } : undefined;
  }

  addGuest(g: {
    sessionId: string;
    name: string;
    characterId: string;
    playerType: string | null;
    now: number;
  }): GuestRow {
    const row: GuestRow = {
      id: randomUUID(),
      session_id: g.sessionId,
      token: token(),
      name: g.name,
      character_id: g.characterId,
      player_type: g.playerType,
      joined_at: g.now,
    };
    this.db
      .prepare(
        `INSERT INTO guests (id, session_id, token, name, character_id, player_type, joined_at)
         VALUES (@id, @session_id, @token, @name, @character_id, @player_type, @joined_at)`,
      )
      .run(row);
    return row;
  }

  guests(sessionId: string): GuestRow[] {
    return this.db
      .prepare('SELECT * FROM guests WHERE session_id = ? ORDER BY joined_at')
      .all(sessionId) as GuestRow[];
  }

  unlocks(sessionId: string): UnlockRow[] {
    return this.db
      .prepare(
        'SELECT kind, item_id, guest_id, source, at, game_min FROM unlocks WHERE session_id = ? ORDER BY at',
      )
      .all(sessionId) as UnlockRow[];
  }

  /** Returns true if newly unlocked. */
  unlock(u: {
    sessionId: string;
    kind: 'clue' | 'beat';
    itemId: string;
    source: string;
    now: number;
    gameMin: number;
    guestId?: string;
  }): boolean {
    const r = this.db
      .prepare(
        'INSERT OR IGNORE INTO unlocks (session_id, kind, item_id, guest_id, source, at, game_min) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run(u.sessionId, u.kind, u.itemId, u.guestId ?? '', u.source, u.now, u.gameMin);
    return r.changes > 0;
  }

  addMessage(m: {
    sessionId: string;
    guestId: string;
    npcId: string;
    sender: 'guest' | 'npc';
    text: string;
    now: number;
  }): void {
    this.db
      .prepare(
        'INSERT INTO messages (session_id, guest_id, npc_id, sender, text, at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(m.sessionId, m.guestId, m.npcId, m.sender, m.text, m.now);
  }

  messages(sessionId: string, guestId: string): MessageRow[] {
    return this.db
      .prepare(
        'SELECT id, guest_id, npc_id, sender, text, at FROM messages WHERE session_id = ? AND guest_id = ? ORDER BY id',
      )
      .all(sessionId, guestId) as MessageRow[];
  }

  accuse(sessionId: string, guestId: string, suspects: string[], now: number): void {
    this.db
      .prepare(
        `INSERT INTO accusations (session_id, guest_id, suspects, at) VALUES (?, ?, ?, ?)
         ON CONFLICT (session_id, guest_id) DO UPDATE SET suspects = excluded.suspects, at = excluded.at`,
      )
      .run(sessionId, guestId, JSON.stringify(suspects), now);
  }

  accusations(sessionId: string): { guest_id: string; suspects: string[] }[] {
    const rows = this.db
      .prepare('SELECT guest_id, suspects FROM accusations WHERE session_id = ?')
      .all(sessionId) as {
      guest_id: string;
      suspects: string;
    }[];
    return rows.map((r) => ({ guest_id: r.guest_id, suspects: JSON.parse(r.suspects) as string[] }));
  }

  event(sessionId: string, type: string, payload: unknown, now: number): void {
    this.db
      .prepare('INSERT INTO events (session_id, type, payload, at) VALUES (?, ?, ?, ?)')
      .run(sessionId, type, JSON.stringify(payload), now);
  }

  events(sessionId: string, type?: string, limit = 50): { type: string; payload: unknown; at: number }[] {
    const rows = (
      type
        ? this.db
            .prepare(
              'SELECT type, payload, at FROM events WHERE session_id = ? AND type = ? ORDER BY id DESC LIMIT ?',
            )
            .all(sessionId, type, limit)
        : this.db
            .prepare('SELECT type, payload, at FROM events WHERE session_id = ? ORDER BY id DESC LIMIT ?')
            .all(sessionId, limit)
    ) as { type: string; payload: string; at: number }[];
    return rows.reverse().map((r) => ({ ...r, payload: JSON.parse(r.payload) as unknown }));
  }
}
