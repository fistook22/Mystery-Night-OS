import type { ServerEvent, View } from '@mn/shared';
import type { Outbox } from '../engine/game.js';

export interface Client {
  sessionId: string;
  render: () => View;
  send: (event: ServerEvent) => void;
  /** Guests and the TV get push notifications; the host sees them in its log. */
  notifications: boolean;
}

/**
 * Keeps SSE clients per session. On change, every client gets a fresh full view
 * of its own role (simple, and reconnects resync for free). Changes are batched
 * per tick so a burst of unlocks sends one update.
 */
export class Hub implements Outbox {
  private readonly clients = new Map<string, Set<Client>>();
  private readonly pending = new Set<string>();

  add(client: Client): () => void {
    let set = this.clients.get(client.sessionId);
    if (!set) this.clients.set(client.sessionId, (set = new Set()));
    set.add(client);
    return () => {
      set.delete(client);
      if (!set.size) this.clients.delete(client.sessionId);
    };
  }

  count(sessionId: string): number {
    return this.clients.get(sessionId)?.size ?? 0;
  }

  changed(sessionId: string): void {
    if (this.pending.has(sessionId)) return;
    this.pending.add(sessionId);
    setImmediate(() => {
      this.pending.delete(sessionId);
      for (const c of this.clients.get(sessionId) ?? []) {
        try {
          c.send({ type: 'view', view: c.render() });
        } catch {
          // A broken client is removed when its connection closes.
        }
      }
    });
  }

  notify(sessionId: string, text: string): void {
    const at = Date.now();
    for (const c of this.clients.get(sessionId) ?? [])
      if (c.notifications) c.send({ type: 'notify', text, at });
  }

  ping(): void {
    for (const set of this.clients.values()) for (const c of set) c.send({ type: 'ping' });
  }
}
