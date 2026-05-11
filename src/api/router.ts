import type { IncomingMessage, ServerResponse } from "http";
import { handleHostStart } from "./host";
import { handleNext, handlePause, handleResume, handleWildcard } from "./controls";
import { handleSSE } from "./sse";
import { handleWhatsAppWebhook } from "./webhook";
import { handleOnboard } from "./onboard";
import { serveStatic } from "./static";
import { listScenarios } from "../services/scenario";
import { stateManager } from "../services/state";

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(payload);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

export async function route(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method ?? "GET";

  // CORS preflight
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  try {
    // SSE streams
    if (pathname === "/api/events" && method === "GET") {
      const role = (url.searchParams.get("role") as "host" | "screen") ?? "host";
      handleSSE(req, res, role);
      return;
    }

    // WhatsApp webhook
    if (pathname === "/api/webhook/whatsapp") {
      if (method === "GET") {
        const { handleWhatsAppVerify } = await import("./webhook");
        handleWhatsAppVerify(req, res, url);
        return;
      }
      if (method === "POST") {
        const body = await readBody(req);
        await handleWhatsAppWebhook(req, res, JSON.parse(body));
        return;
      }
    }

    // API routes
    if (pathname === "/api/scenarios" && method === "GET") {
      json(res, 200, listScenarios());
      return;
    }

    if (pathname === "/api/state" && method === "GET") {
      json(res, 200, stateManager.getState() ?? { status: "idle" });
      return;
    }

    if (pathname === "/api/host/start" && method === "POST") {
      const body = await readBody(req);
      await handleHostStart(req, res, JSON.parse(body));
      return;
    }

    if (pathname === "/api/host/onboard" && method === "POST") {
      const body = await readBody(req);
      await handleOnboard(req, res, JSON.parse(body));
      return;
    }

    if (pathname === "/api/host/next" && method === "POST") {
      await handleNext(req, res);
      return;
    }

    if (pathname === "/api/host/pause" && method === "POST") {
      await handlePause(req, res);
      return;
    }

    if (pathname === "/api/host/resume" && method === "POST") {
      await handleResume(req, res);
      return;
    }

    if (pathname === "/api/host/wildcard" && method === "POST") {
      await handleWildcard(req, res);
      return;
    }

    // Static files and HTML pages
    await serveStatic(req, res, pathname);
  } catch (err) {
    console.error("[Router] Error:", err);
    json(res, 500, { error: "Internal server error" });
  }
}
