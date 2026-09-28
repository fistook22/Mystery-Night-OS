import { describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';

describe('app', () => {
  it('reports health', async () => {
    const { app } = await buildApp(loadConfig({ NODE_ENV: 'test' }), { noTicker: true });
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ ok: true });
  });

  it('rejects oversized bodies instead of crashing', async () => {
    const { app } = await buildApp(loadConfig({ NODE_ENV: 'test' }), { noTicker: true });
    app.post('/api/echo', async (req) => req.body);
    const res = await app.inject({ method: 'POST', url: '/api/echo', payload: { x: 'a'.repeat(70 * 1024) } });
    expect(res.statusCode).toBe(413);
  });
});
