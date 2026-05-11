import type { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import { verifyWebhook, parseInboundMessage, sendTextMessage } from "../services/whatsapp";
import { stateManager } from "../services/state";

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

export function handleWhatsAppVerify(_req: IncomingMessage, res: ServerResponse, url: URL): void {
  const mode = url.searchParams.get("hub.mode") ?? "";
  const token = url.searchParams.get("hub.verify_token") ?? "";
  const challenge = url.searchParams.get("hub.challenge") ?? "";

  const result = verifyWebhook(mode, token, challenge);
  if (result) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(result);
  } else {
    json(res, 403, { error: "Forbidden" });
  }
}

export async function handleWhatsAppWebhook(
  _req: IncomingMessage,
  res: ServerResponse,
  body: unknown
): Promise<void> {
  const message = parseInboundMessage(body);

  if (message) {
    const { from, text } = message;
    const upperText = text.toUpperCase().trim();

    if (upperText === "YES" || upperText === "כן") {
      stateManager.updateGuestOnboarding(from, true);
      await sendTextMessage({
        to: from,
        body: "✅ Confirmed. Your character file arrives in 24 hours. Stay alert. — M",
      });
    } else if (upperText === "NO" || upperText === "לא") {
      stateManager.updateGuestOnboarding(from, false);
      await sendTextMessage({
        to: from,
        body: "Understood. You will not receive further messages from this number.",
      });
    } else {
      // Log inbound for host visibility
      console.log(`[WhatsApp Inbound] From: ${from} | "${text}"`);
      stateManager.broadcastToRole("host", "buzz", {
        type: "inbound",
        from,
        text,
      });
    }
  }

  // WhatsApp expects a 200 ACK immediately
  json(res, 200, { ok: true });
}
