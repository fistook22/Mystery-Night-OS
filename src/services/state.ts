import { randomUUID } from "crypto";
import type { GameState, GameStatus, GuestAssignment, SSEMessage } from "../types";
import type { ServerResponse } from "http";

type SSEClient = { id: string; res: ServerResponse; role: "host" | "screen" };

class StateManager {
  private state: GameState | null = null;
  private clients: SSEClient[] = [];

  createSession(
    scenarioId: string,
    guests: GuestAssignment[],
    hostPhone?: string
  ): GameState {
    this.state = {
      sessionId: randomUUID(),
      scenarioId,
      status: "idle",
      currentEventIndex: -1,
      guests,
      completedEventIds: [],
      wildcardCount: 0,
      hostPhone,
    };
    this.broadcast("state", this.state);
    return this.state;
  }

  getState(): GameState | null {
    return this.state;
  }

  setStatus(status: GameStatus): void {
    if (!this.state) throw new Error("No active session");
    if (status === "paused") this.state.pausedAt = new Date();
    if (status === "active" && !this.state.startedAt)
      this.state.startedAt = new Date();
    this.state.status = status;
    this.broadcast("state", this.state);
  }

  advanceEvent(): number {
    if (!this.state) throw new Error("No active session");
    this.state.currentEventIndex++;
    this.broadcast("state", this.state);
    return this.state.currentEventIndex;
  }

  markEventCompleted(eventId: string): void {
    if (!this.state) throw new Error("No active session");
    if (!this.state.completedEventIds.includes(eventId)) {
      this.state.completedEventIds.push(eventId);
    }
  }

  incrementWildcard(): void {
    if (!this.state) throw new Error("No active session");
    this.state.wildcardCount++;
  }

  updateGuestOnboarding(phone: string, consentGiven: boolean): void {
    if (!this.state) return;
    const guest = this.state.guests.find((g) => g.phone === phone);
    if (guest) {
      guest.consentGiven = consentGiven;
      if (consentGiven) guest.onboarded = true;
      this.broadcast("state", this.state);
    }
  }

  registerSSEClient(res: ServerResponse, role: "host" | "screen"): string {
    const id = randomUUID();
    this.clients.push({ id, res, role });
    // Send current state immediately on connect
    this.sendToClient({ id, res, role }, "state", this.state);
    return id;
  }

  removeSSEClient(id: string): void {
    this.clients = this.clients.filter((c) => c.id !== id);
  }

  broadcast(type: SSEMessage["type"], payload: unknown): void {
    const msg = this.formatSSE({ type, payload, timestamp: new Date().toISOString() });
    for (const client of this.clients) {
      try {
        client.res.write(msg);
      } catch {
        this.removeSSEClient(client.id);
      }
    }
  }

  broadcastToRole(role: "host" | "screen", type: SSEMessage["type"], payload: unknown): void {
    const msg = this.formatSSE({ type, payload, timestamp: new Date().toISOString() });
    for (const client of this.clients.filter((c) => c.role === role)) {
      try {
        client.res.write(msg);
      } catch {
        this.removeSSEClient(client.id);
      }
    }
  }

  private sendToClient(client: SSEClient, type: SSEMessage["type"], payload: unknown): void {
    try {
      client.res.write(this.formatSSE({ type, payload, timestamp: new Date().toISOString() }));
    } catch {
      this.removeSSEClient(client.id);
    }
  }

  private formatSSE(msg: SSEMessage): string {
    return `data: ${JSON.stringify(msg)}\n\n`;
  }
}

export const stateManager = new StateManager();
