import type { IncomingMessage, ServerResponse } from "http";
import { stateManager } from "../services/state";

export function handleSSE(req: IncomingMessage, res: ServerResponse, role: "host" | "screen"): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();

  const clientId = stateManager.registerSSEClient(res, role);

  // Heartbeat every 25s to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      cleanup();
    }
  }, 25000);

  function cleanup() {
    clearInterval(heartbeat);
    stateManager.removeSSEClient(clientId);
  }

  req.on("close", cleanup);
  req.on("error", cleanup);
}
