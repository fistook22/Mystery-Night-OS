# Mystery Night OS

AI-run mystery parties: guests play from their phones, AI characters text and call them, and the TV is the shared stage.

- Product and plans: [`docs/`](docs/README.md) — start with [`docs/dev-plan.md`](docs/dev-plan.md)
- Launch story: [`docs/stories/illustrator-heist.md`](docs/stories/illustrator-heist.md)
- Commercial and visual design: [`marketing/commercial-15s/`](marketing/commercial-15s/README.md)
- The first MVP lives in [`legacy/`](legacy/) for reference; it is not built or run.

## Development

Requires Node 22+.

```bash
npm install
cp .env.example .env     # optional
npm run dev              # server on :3000, web app on :5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Server (Fastify, auto-reload) + web app (Vite) |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | TypeScript project build check |
| `npm run lint` | ESLint |
| `npm run build` | Production build of the web app (served by the server) |
| `npm start` | Run the server (serves `apps/web/dist` if built) |
| `npm run sim` | Play a whole party headless with bots and a fake clock |
| `node scripts/e2e-party.mjs` | Play a party in a real browser (host, TV, phone) with screenshots |

## Play a test party

1. `npm run build && npm start`, then open http://localhost:3000 and press "צרו ערב חדש".
2. The host console shows the invite link/QR. Open it on 6+ phones (or browser tabs), and open the TV link on a big screen.
3. Press "התחלת הערב". The story runs on its own clock (about 150 minutes); the host can pause, hint and skip.
4. Without `ANTHROPIC_API_KEY`, characters answer with scripted replies; with a key they are played by Claude.

## Layout

```
apps/server      Fastify API, game engine, AI and voice integrations
apps/web         React app: guest (/g), TV (/tv), host (/host), join (/join)
packages/story   Story bible schema and bundled stories
packages/shared  Types shared by server and web
```
