import type { Scenario, TimelineEvent, GameState } from "../types";
import { stateManager } from "./state";
import { sendBuzzMessage, sendRevealMessage } from "./whatsapp";
import { initiateCall } from "./twilio";
import { generateWildcardEvent } from "./claude";

export async function fireEvent(scenario: Scenario, event: TimelineEvent, state: GameState): Promise<void> {
  console.log(`[Orchestrator] Firing event: ${event.id} — ${event.label}`);

  // Screen broadcast
  if (event.screenEvent) {
    stateManager.broadcastToRole("screen", "screen_update", event.screenEvent);
    stateManager.broadcast("event_fired", {
      eventId: event.id,
      label: event.label,
      screenEvent: event.screenEvent,
    });
  }

  // Individual WhatsApp buzzes
  if (event.buzzEvents?.length) {
    for (const buzz of event.buzzEvents) {
      const assignment = state.guests.find((g) => g.characterId === buzz.characterId);
      if (assignment?.phone) {
        stateManager.broadcastToRole("host", "buzz", {
          characterId: buzz.characterId,
          guestName: assignment.guestName,
          preview: buzz.message.slice(0, 50) + "…",
        });
        try {
          await sendBuzzMessage(assignment.phone, buzz.message);
        } catch (err) {
          console.error(`[Orchestrator] WhatsApp buzz failed for ${assignment.guestName}:`, err);
        }
      }
    }
  }

  // Voice call
  if (event.callEvent) {
    const assignment = state.guests.find((g) => g.characterId === event.callEvent!.characterId);
    if (assignment?.phone) {
      stateManager.broadcast("call", {
        characterId: event.callEvent.characterId,
        guestName: assignment.guestName,
        callerName: event.callEvent.callerName,
      });
      try {
        await initiateCall(assignment.phone, event.callEvent.script, event.callEvent.callerName);
      } catch (err) {
        console.error(`[Orchestrator] Twilio call failed for ${assignment.guestName}:`, err);
      }
    }
  }

  // Reveal sequence
  if (event.id === "evt_reveal") {
    const revealText = scenario.resolution.revealScript;
    stateManager.broadcastToRole("screen", "screen_update", {
      type: "announcement",
      title: "THE MERIDIAN VERDICT",
      body: revealText,
    });
    for (const guest of state.guests) {
      if (guest.phone) {
        try {
          await sendRevealMessage(guest.phone, revealText);
        } catch (err) {
          console.error(`[Orchestrator] Reveal message failed for ${guest.guestName}:`, err);
        }
      }
    }
    stateManager.setStatus("ended");
  }

  stateManager.markEventCompleted(event.id);
}

export async function fireWildcard(scenario: Scenario, state: GameState): Promise<void> {
  stateManager.incrementWildcard();
  const currentEvent = scenario.timeline[state.currentEventIndex];
  const characterNames = state.guests.map((g) => {
    const char = scenario.characters.find((c) => c.id === g.characterId);
    return char?.name ?? g.guestName;
  });

  const wildcard = await generateWildcardEvent(
    scenario.title,
    currentEvent?.label ?? "opening",
    characterNames
  );

  const wildcardEvent = {
    type: "news" as const,
    title: `⚡ ${wildcard.title}`,
    body: wildcard.body,
  };

  stateManager.broadcastToRole("screen", "screen_update", wildcardEvent);
  stateManager.broadcast("event_fired", {
    eventId: `wildcard_${state.wildcardCount}`,
    label: "Wildcard",
    screenEvent: wildcardEvent,
  });
}
