import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import type { Config } from './config.js';

const WEB_DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web/dist');

export async function buildApp(config: Config): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.NODE_ENV === 'test' ? false : { level: 'info' },
    bodyLimit: 64 * 1024,
  });

  app.get('/api/health', async () => ({ ok: true, version: '0.2.0' }));

  // In production the server also serves the built web app (single-page app fallback).
  if (existsSync(WEB_DIST)) {
    await app.register(fastifyStatic, { root: WEB_DIST, wildcard: false });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api/')) return reply.code(404).send({ error: 'Not found' });
      return reply.sendFile('index.html');
    });
  }

  return app;
}
