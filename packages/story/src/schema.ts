import { z } from 'zod';

// A story bible is the single source of truth for one mystery. The engine only ever
// reveals what is written here; AI characters perform it but never invent facts.
//
// Strings may contain skin placeholders like {card} or {photoApp}; they are replaced at
// render time from the active skin, so one story ships as both a sellable edition
// (fictional brands) and a private edition.

const Id = z.string().regex(/^[a-z0-9_-]+$/, 'ids are lowercase slugs');

/** When a clue (or post, DM, mission) becomes available. */
export const UnlockRule = z.discriminatedUnion('type', [
  z.object({ type: z.literal('start') }),
  /** Game-clock minute since the party started (pauses excluded). */
  z.object({ type: z.literal('time'), atMin: z.number().min(0) }),
  /** Released by a beat, the host's hint button or the game master. */
  z.object({ type: z.literal('manual') }),
  /** A guest scans a printed QR sticker with this code. */
  z.object({ type: z.literal('qr'), code: z.string().min(3) }),
  /** A guest enters a matching answer in a tool (e.g. a SlabCert lookup). */
  z.object({ type: z.literal('answer'), tool: Id, accept: z.array(z.string()).min(1) }),
  /** A guest's conversation with an NPC mentions one of these keywords. */
  z.object({ type: z.literal('npc'), npc: Id, keywords: z.array(z.string()).min(1) }),
  /** Some minutes after another clue unlocked. */
  z.object({ type: z.literal('after'), clue: Id, delayMin: z.number().min(0).default(0) }),
]);
export type UnlockRule = z.infer<typeof UnlockRule>;

export const Character = z.object({
  id: Id,
  name: z.string(),
  role: z.string(),
  /** Core characters are required for the solution; others are optional or played by AI. */
  core: z.boolean(),
  handle: z.string(),
  bio: z.string(),
  /** Everyone sees this. */
  publicIntro: z.string(),
  /** Only this player sees these. */
  secret: z.string(),
  goal: z.string(),
  costume: z.string(),
  /** Casting hint: which player types fit this role best. */
  fits: z.array(z.enum(['talker', 'detective', 'schemer', 'chill'])).min(1),
  guilty: z.boolean().default(false),
});
export type Character = z.infer<typeof Character>;

export const Npc = z.object({
  id: Id,
  name: z.string(),
  title: z.string(),
  tone: z.string(),
  opening: z.string(),
  /** Facts this NPC knows and will share when asked. */
  knows: z.array(z.string()),
  /** Things it lies about or dodges. */
  dodges: z.array(z.string()),
  /** Things it admits only under pressure (repeated or specific questions). */
  underPressure: z.array(z.string()),
  /** Scripted replies used when no AI is configured; matched by keywords. */
  fallback: z.array(z.object({ keywords: z.array(z.string()), reply: z.string() })),
  fallbackDefault: z.string(),
});
export type Npc = z.infer<typeof Npc>;

export const ClueKind = z.enum([
  'photo',
  'document',
  'email',
  'log',
  'chat',
  'lookup',
  'physical',
  'testimony',
]);

export const Clue = z.object({
  id: Id,
  title: z.string(),
  kind: ClueKind,
  /** Short text shown in the evidence locker. */
  summary: z.string(),
  /** Full content (may be multi-line). */
  body: z.string(),
  /** Visual hint for the renderer, e.g. 'stream-frame', 'security-log'. */
  visual: z.string().optional(),
  unlock: UnlockRule,
  /** Who receives it when it unlocks: the whole table, or specific characters. */
  audience: z.union([z.literal('all'), z.array(Id).min(1)]).default('all'),
  /** Characters this clue points at (for the host's spoiler-free progress meter and tests). */
  pointsTo: z.array(Id).default([]),
  /** Short nudge the host or game master can send if the table is stuck on this clue. */
  hint: z.string().optional(),
  /** Earliest game minute at which the hint makes sense (e.g. after the fake is discovered). */
  hintFromMin: z.number().min(0).default(0),
});
export type Clue = z.infer<typeof Clue>;

export const FeedPost = z.object({
  id: Id,
  author: Id,
  time: z.string(),
  text: z.string(),
  /** Image description or visual key for the renderer. */
  image: z.string().optional(),
  likes: z.number().int().default(0),
  /** A deleted post appears only after it is recovered (its clue unlocks). */
  deletedClue: Id.optional(),
  unlock: UnlockRule.default({ type: 'start' }),
});

export const StreamLine = z.object({
  t: z.string(),
  user: z.string(),
  text: z.string(),
  clue: Id.optional(),
});

export const DmThread = z.object({
  id: Id,
  title: z.string(),
  participants: z.array(z.string()).min(2),
  messages: z.array(z.object({ from: z.string(), time: z.string(), text: z.string() })).min(1),
  clue: Id.optional(),
  unlock: UnlockRule,
});

export const TvScene = z.discriminatedUnion('scene', [
  z.object({ scene: z.literal('title'), title: z.string(), subtitle: z.string().optional() }),
  z.object({ scene: z.literal('announcement'), title: z.string(), body: z.string() }),
  z.object({ scene: z.literal('stream'), title: z.string(), body: z.string() }),
  z.object({ scene: z.literal('blackout'), seconds: z.number().int().positive(), caption: z.string() }),
  z.object({ scene: z.literal('uv'), title: z.string(), body: z.string() }),
  z.object({ scene: z.literal('clue'), clue: Id }),
  z.object({ scene: z.literal('hotline'), title: z.string(), body: z.string() }),
  z.object({ scene: z.literal('vote'), title: z.string(), body: z.string() }),
  z.object({ scene: z.literal('finale'), title: z.string(), body: z.string() }),
]);
export type TvScene = z.infer<typeof TvScene>;

export const Beat = z.object({
  id: Id,
  atMin: z.number().min(0),
  label: z.string(),
  tv: TvScene.optional(),
  /** Push to every phone. */
  notify: z.string().optional(),
  release: z.array(Id).default([]),
  /** NPCs that become reachable in the Contacts tab from this beat on. */
  openContacts: z.array(Id).default([]),
  /** Opens the accusation vote. */
  openVote: z.boolean().default(false),
  /** Starts the finale (solution reveal + physical hunt). */
  finale: z.boolean().default(false),
});
export type Beat = z.infer<typeof Beat>;

export const Mission = z.object({
  id: Id,
  character: Id,
  text: z.string(),
  unlock: UnlockRule,
});

export const Story = z.object({
  id: Id,
  version: z.number().int().positive(),
  title: z.string(),
  tagline: z.string(),
  minPlayers: z.number().int().positive(),
  maxPlayers: z.number().int().positive(),
  durationMin: z.number().int().positive(),
  skins: z.record(z.string(), z.record(z.string(), z.string())),
  defaultSkin: z.string(),
  premise: z.string(),
  characters: z.array(Character).min(2),
  npcs: z.array(Npc),
  clues: z.array(Clue).min(1),
  feed: z.array(FeedPost),
  stream: z.object({
    channel: z.string(),
    title: z.string(),
    vodLength: z.string(),
    chat: z.array(StreamLine),
    unlock: UnlockRule,
  }),
  dms: z.array(DmThread),
  missions: z.array(Mission),
  beats: z.array(Beat).min(1),
  /** Tools available in the guest app. */
  tools: z.array(
    z.object({ id: Id, title: z.string(), prompt: z.string(), placeholder: z.string(), miss: z.string() }),
  ),
  solution: z.object({
    culprits: z.array(Id).min(1),
    explanation: z.string(),
    /** Template for the final riddle; {hidingPlace} is filled from the host's setup. */
    finaleRiddle: z.string(),
  }),
  accusation: z.object({ prompt: z.string(), maxSuspects: z.number().int().positive() }),
  awards: z.array(z.object({ id: Id, title: z.string(), description: z.string() })),
});
export type Story = z.infer<typeof Story>;
