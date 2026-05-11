import type { IncomingMessage, ServerResponse } from "http";
import fs from "fs";
import path from "path";

const publicDir = path.join(process.cwd(), "public");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".woff2": "font/woff2",
};

export async function serveStatic(
  _req: IncomingMessage,
  res: ServerResponse,
  pathname: string
): Promise<void> {
  // Route / to host dashboard
  let filePath = pathname === "/" ? "/host/index.html" : pathname;

  // Route /host -> /host/index.html and /screen -> /screen/index.html
  if (filePath === "/host" || filePath === "/host/") filePath = "/host/index.html";
  if (filePath === "/screen" || filePath === "/screen/") filePath = "/screen/index.html";

  const fullPath = path.join(publicDir, filePath);

  // Security: prevent path traversal
  if (!fullPath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(fullPath)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }

  const ext = path.extname(fullPath).toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";

  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-cache",
  });
  fs.createReadStream(fullPath).pipe(res);
}
