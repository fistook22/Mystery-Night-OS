import http from "http";
import { route } from "./api/router";

const PORT = parseInt(process.env.PORT ?? "3000", 10);

const server = http.createServer((req, res) => {
  route(req, res).catch((err) => {
    console.error("[Server] Unhandled error:", err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║         MYSTERY NIGHT OS — v0.1          ║
╠══════════════════════════════════════════╣
║  Server running on http://localhost:${PORT}  ║
║                                          ║
║  Host dashboard:  /host                  ║
║  TV main screen:  /screen                ║
║  API base:        /api                   ║
╚══════════════════════════════════════════╝
`);
});

server.on("error", (err) => {
  console.error("[Server] Fatal error:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[Server] Shutting down gracefully...");
  server.close(() => process.exit(0));
});
