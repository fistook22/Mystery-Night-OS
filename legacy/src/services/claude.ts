import https from "https";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-6";

function anthropicRequest(messages: unknown[], systemPrompt: string, maxTokens = 500): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    });

    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "content-length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.content?.[0]?.text ?? "");
        } catch {
          reject(new Error(`Failed to parse Anthropic response: ${data}`));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

export async function personalizeCharacterBriefing(
  character: { name: string; role: string; motive: string; alibi: string; instructions: string },
  guestName: string,
  scenario: { title: string; synopsis: string }
): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    return `Welcome, ${guestName}. You are playing ${character.name}. ${character.instructions}`;
  }

  const system = `You are writing character briefings for a live mystery dinner experience called "${scenario.title}".
Briefings should feel thrilling, personal, and cinematic. Keep them under 200 words.
Address the guest directly. Use their real name once. Stay in the genre.`;

  const response = await anthropicRequest(
    [
      {
        role: "user",
        content: `Write a personalized character briefing for guest "${guestName}" who is playing ${character.name} (${character.role}).

Scenario: ${scenario.synopsis}

Character details:
- Motive: ${character.motive}
- Alibi: ${character.alibi}
- Instructions: ${character.instructions}

Make it feel real, urgent, and personal. Start with their guest name.`,
      },
    ],
    system,
    300
  );

  return response;
}

export async function generateWildcardEvent(
  scenarioTitle: string,
  currentEventLabel: string,
  characterNames: string[]
): Promise<{ title: string; body: string }> {
  if (!ANTHROPIC_API_KEY) {
    return {
      title: "BREAKING: Unexpected Development",
      body: "A new piece of evidence has emerged that changes everything. Discuss among yourselves.",
    };
  }

  const system = `You write surprise plot twists for a live corporate murder mystery dinner called "${scenarioTitle}".
Twists should be dramatic, short, and instantly discussable. Max 80 words for the body. Keep it corporate thriller tone.`;

  const response = await anthropicRequest(
    [
      {
        role: "user",
        content: `The dinner is currently at the "${currentEventLabel}" stage.
Characters present: ${characterNames.join(", ")}.
Generate a short unexpected wildcard news bulletin that throws new suspicion or information into the mix.
Return JSON: { "title": "...", "body": "..." }`,
      },
    ],
    system,
    200
  );

  try {
    const match = response.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch {
    // fallback below
  }

  return {
    title: "ALERT: Anonymous Tip Received",
    body: response.slice(0, 300),
  };
}

export async function generatePersonalizedOnboarding(
  guestName: string,
  characterName: string,
  scenarioTitle: string
): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    return `You've been selected. ${scenarioTitle} begins tonight. You are ${characterName}. More details to follow. — M`;
  }

  const system = `You write cryptic, cinematic opening WhatsApp messages for a mystery dinner experience.
One paragraph, maximum 60 words. No explanation. Create intrigue. Sign it "— M". Corporate thriller tone.`;

  return anthropicRequest(
    [
      {
        role: "user",
        content: `Write the opening WhatsApp message for guest "${guestName}" who will play "${characterName}" in "${scenarioTitle}". Make it feel like they've been contacted by a whistleblower.`,
      },
    ],
    system,
    120
  );
}
