import { mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

export type DB = Database.Database;

// Ordered migrations; PRAGMA user_version records how many have run.
const MIGRATIONS: string[] = [
  `
  CREATE TABLE sessions (
    id           TEXT PRIMARY KEY,
    story_id     TEXT NOT NULL,
    skin         TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pregame',
    host_token   TEXT NOT NULL UNIQUE,
    tv_token     TEXT NOT NULL UNIQUE,
    invite_code  TEXT NOT NULL UNIQUE,
    hiding_place TEXT NOT NULL DEFAULT '',
    speed        REAL NOT NULL DEFAULT 1,
    created_at   INTEGER NOT NULL,
    started_at   INTEGER,
    paused_at    INTEGER,
    paused_ms    INTEGER NOT NULL DEFAULT 0,
    skipped_ms   INTEGER NOT NULL DEFAULT 0,
    ended_at     INTEGER
  );
  CREATE TABLE guests (
    id           TEXT PRIMARY KEY,
    session_id   TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    token        TEXT NOT NULL UNIQUE,
    name         TEXT NOT NULL,
    character_id TEXT NOT NULL,
    player_type  TEXT,
    joined_at    INTEGER NOT NULL,
    UNIQUE (session_id, character_id)
  );
  CREATE TABLE unlocks (
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    kind       TEXT NOT NULL,            -- 'clue' | 'beat'
    item_id    TEXT NOT NULL,
    guest_id   TEXT NOT NULL DEFAULT '', -- who found it ('' = the game)
    source     TEXT NOT NULL,
    at         INTEGER NOT NULL,
    game_min   REAL NOT NULL DEFAULT 0,  -- game-clock minute when it unlocked
    PRIMARY KEY (session_id, kind, item_id)
  );
  CREATE TABLE messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    guest_id   TEXT NOT NULL,
    npc_id     TEXT NOT NULL,
    sender     TEXT NOT NULL,            -- 'guest' | 'npc'
    text       TEXT NOT NULL,
    at         INTEGER NOT NULL
  );
  CREATE INDEX messages_thread ON messages (session_id, guest_id, npc_id, id);
  CREATE TABLE accusations (
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    guest_id   TEXT NOT NULL,
    suspects   TEXT NOT NULL,            -- JSON array of character ids
    at         INTEGER NOT NULL,
    PRIMARY KEY (session_id, guest_id)
  );
  CREATE TABLE events (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    type       TEXT NOT NULL,
    payload    TEXT NOT NULL,
    at         INTEGER NOT NULL
  );
  CREATE INDEX events_session ON events (session_id, id);
  `,
];

export function openDb(file: string): DB {
  if (file !== ':memory:') mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

function migrate(db: DB): void {
  const current = db.pragma('user_version', { simple: true }) as number;
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[v]!);
      db.pragma(`user_version = ${v + 1}`);
    })();
  }
}
