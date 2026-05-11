import type { IncomingMessage, ServerResponse } from "http";
import type { GuestAssignment } from "../types";
import { stateManager } from "../services/state";
import { loadScenario } from "../services/scenario";
import { fireEvent } from "../services/orchestrator";

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(body));
}

interface StartPayload {
  scenarioId: string;
  guests: Array<{ guestName: string; characterId: string; phone: string }>;
  hostPhone?: string;
}

export async function handleHostStart(
  _req: IncomingMessage,
  res: ServerResponse,
  body: StartPayload
): Promise<void> {
  const { scenarioId, guests, hostPhone } = body;

  if (!scenarioId || !guests?.length) {
    json(res, 400, { error: "scenarioId and guests are required" });
    return;
  }

  const scenario = loadScenario(scenarioId);

  const guestAssignments: GuestAssignment[] = guests.map((g) => ({
    guestName: g.guestName,
    characterId: g.characterId,
    phone: g.phone,
    onboarded: false,
    consentGiven: false,
  }));

  const state = stateManager.createSession(scenarioId, guestAssignments, hostPhone);
  stateManager.setStatus("active");

  // Fire the first event (welcome)
  const firstEvent = scenario.timeline[0];
  if (firstEvent) {
    stateManager.advanceEvent();
    await fireEvent(scenario, firstEvent, stateManager.getState()!);
  }

  json(res, 200, { ok: true, sessionId: state.sessionId, status: "active" });
}
