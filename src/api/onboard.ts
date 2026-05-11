import type { IncomingMessage, ServerResponse } from "http";
import { loadScenario } from "../services/scenario";
import { sendOnboardingMessage, sendCharacterBriefing } from "../services/whatsapp";
import { generatePersonalizedOnboarding, personalizeCharacterBriefing } from "../services/claude";

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(body));
}

interface OnboardPayload {
  scenarioId: string;
  guests: Array<{ guestName: string; characterId: string; phone: string }>;
  sendBriefingsNow?: boolean;
}

export async function handleOnboard(
  _req: IncomingMessage,
  res: ServerResponse,
  body: OnboardPayload
): Promise<void> {
  const { scenarioId, guests, sendBriefingsNow = false } = body;

  if (!scenarioId || !guests?.length) {
    json(res, 400, { error: "scenarioId and guests are required" });
    return;
  }

  const scenario = loadScenario(scenarioId);
  const results: Array<{ phone: string; guestName: string; status: string }> = [];

  for (const guest of guests) {
    const character = scenario.characters.find((c) => c.id === guest.characterId);
    if (!character) {
      results.push({ phone: guest.phone, guestName: guest.guestName, status: "character_not_found" });
      continue;
    }

    try {
      if (sendBriefingsNow) {
        const personalizedBriefing = await personalizeCharacterBriefing(
          character,
          guest.guestName,
          { title: scenario.title, synopsis: scenario.synopsis }
        );
        await sendCharacterBriefing(guest.phone, {
          name: character.name,
          role: character.role,
          motive: character.motive,
          alibi: character.alibi,
          instructions: personalizedBriefing,
        });
      } else {
        const openingMessage = await generatePersonalizedOnboarding(
          guest.guestName,
          character.name,
          scenario.title
        );
        await sendOnboardingMessage(guest.phone, character.name, character.role);
        console.log(`[Onboard] Opening message for ${guest.guestName}: ${openingMessage}`);
      }
      results.push({ phone: guest.phone, guestName: guest.guestName, status: "sent" });
    } catch (err) {
      console.error(`[Onboard] Failed for ${guest.guestName}:`, err);
      results.push({ phone: guest.phone, guestName: guest.guestName, status: "failed" });
    }
  }

  json(res, 200, { ok: true, results });
}
