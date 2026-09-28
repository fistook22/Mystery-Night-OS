// Types shared by the server and the web app. Kept free of runtime dependencies.
// Views are computed per role on the server, already skinned (brand names filled in).

export type Role = 'guest' | 'tv' | 'host';
export type SessionStatus = 'pregame' | 'live' | 'paused' | 'finale' | 'ended';
export type PlayerType = 'talker' | 'detective' | 'schemer' | 'chill';

export interface SessionInfo {
  id: string;
  title: string;
  tagline: string;
  status: SessionStatus;
  elapsedMin: number;
  durationMin: number;
  voteOpen: boolean;
}

export interface CastMember {
  guestName: string;
  characterId: string;
  name: string;
  role: string;
  handle: string;
  bio: string;
  publicIntro: string;
}

export interface EvidenceItem {
  id: string;
  title: string;
  kind: string;
  summary: string;
  body: string;
  visual?: string;
  foundBy?: string;
  isNew: boolean;
}

export interface FeedPostView {
  id: string;
  authorName: string;
  handle: string;
  time: string;
  text: string;
  image?: string;
  likes: number;
  recovered: boolean;
}

export interface StreamView {
  channel: string;
  title: string;
  vodLength: string;
  chat: { t: string; user: string; text: string; flagged: boolean }[];
}

export interface DmView {
  id: string;
  title: string;
  messages: { from: string; time: string; text: string }[];
}

export interface ContactView {
  id: string;
  name: string;
  title: string;
  opening: string;
  messages: { sender: 'guest' | 'npc'; text: string; at: number }[];
}

export interface ToolView {
  id: string;
  title: string;
  prompt: string;
  placeholder: string;
  miss: string;
}

export interface FinaleView {
  culprits: { characterId: string; name: string; guestName: string }[];
  explanation: string;
  riddle: string;
  results: { guestName: string; characterName: string; correct: number; of: number }[];
}

export interface Notification {
  text: string;
  at: number;
}

export interface GuestView {
  role: 'guest';
  session: SessionInfo;
  premise: string;
  me: {
    guestId: string;
    guestName: string;
    character: CastMember & { secret: string; goal: string; costume: string };
    missions: string[];
  };
  cast: CastMember[];
  evidence: EvidenceItem[];
  feed: FeedPostView[];
  stream: StreamView | null;
  dms: DmView[];
  contacts: ContactView[];
  tools: ToolView[];
  accusation: { prompt: string; maxSuspects: number; mine: string[] | null };
  finale: FinaleView | null;
  notifications: Notification[];
}

export type TvScene =
  | { scene: 'lobby'; title: string; tagline: string; joinUrl: string; inviteCode: string; joined: string[] }
  | { scene: 'title'; title: string; subtitle?: string }
  | { scene: 'announcement' | 'stream' | 'uv' | 'hotline' | 'vote'; title: string; body: string }
  | { scene: 'blackout'; seconds: number; caption: string; startedAt: number }
  | { scene: 'clue'; clue: EvidenceItem }
  | { scene: 'paused' }
  | { scene: 'finale'; title: string; body: string; finale: FinaleView };

export interface TvView {
  role: 'tv';
  session: SessionInfo;
  scene: TvScene;
  cast: CastMember[];
  evidenceCount: number;
  votes: { cast: number; of: number };
  lastNotification: Notification | null;
}

export interface HostView {
  role: 'host';
  session: SessionInfo;
  links: { invite: string; tv: string; host: string };
  inviteCode: string;
  hidingPlace: string;
  guests: { name: string; characterName: string; core: boolean }[];
  missingCore: string[];
  minPlayers: number;
  maxPlayers: number;
  beats: { label: string; atMin: number; fired: boolean }[];
  progress: { found: number; total: number };
  votes: { cast: number; of: number };
  finale: FinaleView | null;
  notifications: Notification[];
  /** Printable QR stickers to hide around the house (labels carry no spoilers). */
  stickers: { label: string; url: string }[];
}

export type View = GuestView | TvView | HostView;

/** Server-sent events pushed to connected clients. */
export type ServerEvent =
  { type: 'view'; view: View } | { type: 'notify'; text: string; at: number } | { type: 'ping' };
