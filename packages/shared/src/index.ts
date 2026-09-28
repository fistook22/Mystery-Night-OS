// Types shared by the server and the web app. Kept free of runtime dependencies.

export type Role = 'guest' | 'tv' | 'host';

export type SessionStatus = 'pregame' | 'live' | 'paused' | 'finale' | 'ended';

/** Server-sent events pushed to connected clients. */
export type ServerEvent =
  { type: 'hello'; role: Role; sessionId: string } | { type: 'state'; state: unknown } | { type: 'ping' };
