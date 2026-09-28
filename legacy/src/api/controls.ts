import type { IncomingMessage, ServerResponse } from "http";
import { stateManager } from "../services/state";
import { loadScenario } from "../services/scenario";
import { fireEvent, fireWildcard } from "../services/orchestrator";

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(body));
}

export async function handleNext(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const state = stateManager.getState();
  if (!state) { json(res, 400, { error: "No active session" }); return; }
  if (state.status !== "active") { json(res, 400, { error: "Session is not active" }); return; }

  const scenario = loadScenario(state.scenarioId);
  const nextIndex = state.currentEventIndex + 1;

  if (nextIndex >= scenario.timeline.length) {
    json(res, 400, { error: "No more events in timeline" });
    return;
  }

  stateManager.advanceEvent();
  const event = scenario.timeline[nextIndex];
  await fireEvent(scenario, event, stateManager.getState()!);

  json(res, 200, { ok: true, eventId: event.id, label: event.label, index: nextIndex, total: scenario.timeline.length });
}

export async function handlePause(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const state = stateManager.getState();
  if (!state || state.status !== "active") {
    json(res, 400, { error: "No active session to pause" });
    return;
  }
  stateManager.setStatus("paused");
  json(res, 200, { ok: true, status: "paused" });
}

export async function handleResume(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const state = stateManager.getState();
  if (!state || state.status !== "paused") {
    json(res, 400, { error: "Session is not paused" });
    return;
  }
  stateManager.setStatus("active");
  json(res, 200, { ok: true, status: "active" });
}

export async function handleWildcard(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const state = stateManager.getState();
  if (!state || state.status !== "active") {
    json(res, 400, { error: "No active session" });
    return;
  }
  const scenario = loadScenario(state.scenarioId);
  await fireWildcard(scenario, state);
  json(res, 200, { ok: true, wildcardCount: state.wildcardCount });
}
