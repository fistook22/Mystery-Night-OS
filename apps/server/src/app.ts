import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import type { Config } from './config.js';
import { openDb } from './db/index.js';
import { Repo } from './db/repo.js';
import { Game, type NpcReplier, type Now } from './engine/game.js';
import { Hub } from './realtime/hub.js';
import { createNpcReplier } from './ai/npc.js';
import { registerApi } from './routes/api.js';

const WEB_DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web/dist');

export interface AppDeps {
  now?: Now;
  replier?: NpcReplier;
  /** Disable the background clock (tests drive game.tick() themselves). */
  noTicker?: boolean;
}

export async function buildApp(
  config: Config,
  deps: AppDeps = {},
): Promise<{ app: FastifyInstance; game: Game }> {
  const app = Fastify({
    logger: config.NODE_ENV === 'test' ? false : { level: 'info' },
    bodyLimit: 64 * 1024,
  });

  const db = openDb(config.NODE_ENV === 'test' ? ':memory:' : config.DATABASE_PATH);
  const hub = new Hub();
  const replier = deps.replier ?? createNpcReplier(config, (msg, err) => app.log.warn({ err }, msg));
  const game = new Game(new Repo(db), deps.now ?? Date.now, hub, replier);

  app.get('/api/health', async () => ({ ok: true, version: '0.2.0', ai: !!config.ANTHROPIC_API_KEY }));
  registerApi(app, game, hub, { base: config.PUBLIC_URL.replace(/\/$/, '') });

  // The game clock: advance live sessions every second; keep SSE connections warm.
  if (!deps.noTicker) {
    const ticker = setInterval(() => {
      for (const s of game.repo.liveSessions()) {
        try {
          game.tick(s.id);
        } catch (err) {
          app.log.error({ err, session: s.id }, 'tick failed');
        }
      }
    }, 1000);
    const pinger = setInterval(() => hub.ping(), 20_000);
    app.addHook('onClose', async () => {
      clearInterval(ticker);
      clearInterval(pinger);
    });
  }
  app.addHook('onClose', async () => db.close());

  // In production the server also serves the built web app (single-page app fallback).
  if (existsSync(WEB_DIST)) {
    await app.register(fastifyStatic, { root: WEB_DIST, wildcard: false });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api/')) return reply.code(404).send({ error: 'Not found' });
      return reply.sendFile('index.html');
    });
  }

  return { app, game };
}
