import https from "https";

const { WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_VERIFY_TOKEN } = process.env;

interface TextMessage {
  to: string;
  body: string;
}

interface TemplateMessage {
  to: string;
  templateName: string;
  languageCode: string;
  components?: unknown[];
}

function postToWhatsApp(payload: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = {
      hostname: "graph.facebook.com",
      path: `/v19.0/${WHATSAPP_PHONE_ID}/messages`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

export async function sendTextMessage({ to, body }: TextMessage): Promise<unknown> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.log(`[WhatsApp MOCK] To: ${to} | ${body}`);
    return { mock: true };
  }
  return postToWhatsApp({
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body },
  });
}

export async function sendTemplateMessage({ to, templateName, languageCode, components }: TemplateMessage): Promise<unknown> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.log(`[WhatsApp MOCK Template] To: ${to} | Template: ${templateName}`);
    return { mock: true };
  }
  return postToWhatsApp({
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  });
}

export function verifyWebhook(mode: string, token: string, challenge: string): string | null {
  if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
    return challenge;
  }
  return null;
}

export function parseInboundMessage(body: unknown): { from: string; text: string } | null {
  try {
    const entry = (body as any).entry?.[0];
    const changes = entry?.changes?.[0];
    const msg = changes?.value?.messages?.[0];
    if (!msg) return null;
    return {
      from: msg.from,
      text: msg.text?.body ?? "",
    };
  } catch {
    return null;
  }
}

export async function sendOnboardingMessage(phone: string, characterName: string, characterRole: string): Promise<void> {
  const greeting = `🕵️ *Mystery Night — Confidential Briefing*\n\nYou have been selected to play *${characterName}*, ${characterRole}.\n\nYour full briefing will arrive in 24 hours. Until then — trust no one.\n\nReply YES to confirm your participation and receive your character file.`;
  await sendTextMessage({ to: phone, body: greeting });
}

export async function sendCharacterBriefing(phone: string, character: {
  name: string;
  role: string;
  motive: string;
  alibi: string;
  instructions: string;
}): Promise<void> {
  const briefing = `📁 *YOUR CHARACTER FILE — CONFIDENTIAL*\n\n*Name:* ${character.name}\n*Role:* ${character.role}\n\n*Your motive (known only to you):*\n${character.motive}\n\n*Your alibi:*\n${character.alibi}\n\n*Your instructions:*\n${character.instructions}\n\n---\nThis message will not be repeated. The evening begins when your host presses Start. Stay in character.`;
  await sendTextMessage({ to: phone, body: briefing });
}

export async function sendBuzzMessage(phone: string, message: string): Promise<void> {
  const buzz = `🔔 *PRIVATE MESSAGE — FOR YOUR EYES ONLY*\n\n${message}\n\n_Delete this after reading._`;
  await sendTextMessage({ to: phone, body: buzz });
}

export async function sendRevealMessage(phone: string, revealText: string): Promise<void> {
  await sendTextMessage({ to: phone, body: `🎭 *THE MYSTERY IS SOLVED*\n\n${revealText}` });
}

export { WHATSAPP_VERIFY_TOKEN };
