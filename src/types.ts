export type EventType =
  | "screen_broadcast"
  | "character_buzz"
  | "ai_call"
  | "reveal";

export type DeliveryChannel = "screen" | "whatsapp" | "call";

export type GameStatus = "idle" | "onboarding" | "active" | "paused" | "ended";

export interface Character {
  id: string;
  name: string;
  role: string;
  motive: string;
  alibi: string;
  secrets: string[];
  instructions: string;
  phone?: string;
  whatsappId?: string;
}

export interface ScreenEvent {
  type: "video" | "news" | "audio" | "announcement";
  title: string;
  body: string;
  mediaUrl?: string;
  duration?: number;
}

export interface BuzzEvent {
  characterId: string;
  message: string;
  isSecret?: boolean;
}

export interface CallEvent {
  characterId: string;
  callerName: string;
  script: string;
}

export interface TimelineEvent {
  id: string;
  order: number;
  label: string;
  triggerAfterMinutes?: number;
  channels: DeliveryChannel[];
  screenEvent?: ScreenEvent;
  buzzEvents?: BuzzEvent[];
  callEvent?: CallEvent;
}

export interface Scenario {
  id: string;
  title: string;
  genre: string;
  minPlayers: number;
  maxPlayers: number;
  difficulty: "easy" | "medium" | "hard";
  durationMinutes: number;
  synopsis: string;
  characters: Character[];
  timeline: TimelineEvent[];
  resolution: {
    murderer: string;
    explanation: string;
    revealScript: string;
  };
}

export interface GuestAssignment {
  guestName: string;
  characterId: string;
  phone: string;
  whatsappId?: string;
  onboarded: boolean;
  consentGiven: boolean;
}

export interface GameState {
  sessionId: string;
  scenarioId: string;
  status: GameStatus;
  startedAt?: Date;
  pausedAt?: Date;
  currentEventIndex: number;
  guests: GuestAssignment[];
  completedEventIds: string[];
  wildcardCount: number;
  hostPhone?: string;
}

export interface SSEMessage {
  type: "state" | "event_fired" | "screen_update" | "buzz" | "call" | "error";
  payload: unknown;
  timestamp: string;
}
