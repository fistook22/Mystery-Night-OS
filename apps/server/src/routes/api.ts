import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { STORIES } from '@mn/story';
import type { View } from '@mn/shared';
import type { GuestRow, SessionRow } from '../db/repo.js';
import { Game, GameError, PLAYER_TYPES } from '../engine/game.js';
import { guestView, hostView, tvView, type Links } from '../engine/views.js';
import type { Hub } from '../realtime/hub.js';

type Auth =
  { role: 'host' | 'tv'; session: SessionRow } | { role: 'guest'; session: SessionRow; guest: GuestRow };

export function registerApi(app: FastifyInstance, game: Game, hub: Hub, links: Links): void {
  const render = (a: Auth): View =>
    a.role === 'guest'
      ? guestView(game, a.guest)
      : a.role === 'tv'
        ? tvView(game, a.session.id, links)
        : hostView(game, a.session.id, links);

  function auth(req: FastifyRequest, role?: Auth['role']): Auth {
    const header = req.headers.authorization;
    const t = header?.startsWith('Bearer ') ? header.slice(7) : (req.query as { token?: string }).token;
    const a = t ? game.repo.resolveToken(t) : undefined;
    if (!a) throw new GameError(401, 'קישור לא תקין');
    if (role && a.role !== role) throw new GameError(403, 'Forbidden');
    return a;
  }
  const guestOf = (req: FastifyRequest) => (auth(req, 'guest') as Extract<Auth, { role: 'guest' }>).guest;

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof GameError) return reply.code(err.status).send({ error: err.message });
    if (err instanceof z.ZodError)
      return reply.code(400).send({ error: 'Invalid request', issues: err.issues });
    const e = err as Error & { statusCode?: number };
    if (e.statusCode && e.statusCode < 500) return reply.code(e.statusCode).send({ error: e.message });
    app.log.error(err);
    return reply.code(500).send({ error: 'Internal server error' });
  });

  // ── Public ────────────────────────────────────────────────────────────────
  app.get('/api/stories', async () =>
    Object.values(STORIES).map((s) => ({
      id: s.id,
      title: s.title,
      tagline: s.tagline,
      minPlayers: s.minPlayers,
      maxPlayers: s.maxPlayers,
      durationMin: s.durationMin,
    })),
  );

  app.post('/api/sessions', async (req) => {
    const body = z
      .object({
        storyId: z.string().default('illustrator-heist'),
        skin: z.string().optional(),
        hidingPlace: z.string().max(200).optional(),
      })
      .parse(req.body ?? {});
    const s = game.createSession(body);
    return { hostToken: s.host_token, links: hostView(game, s.id, links).links };
  });

  app.get('/api/join/:code', async (req) => {
    const { code } = z.object({ code: z.string().max(12) }).parse(req.params);
    const s = game.repo.sessionByInvite(code);
    if (!s) throw new GameError(404, 'הזמנה לא נמצאה');
    const story = game.story(s);
    const joined = game.repo.guests(s.id).length;
    return {
      title: story.title,
      tagline: story.tagline,
      status: s.status,
      joined,
      maxPlayers: story.maxPlayers,
    };
  });

  app.post('/api/join/:code', async (req) => {
    const { code } = z.object({ code: z.string().max(12) }).parse(req.params);
    const body = z
      .object({
        name: z.string().trim().min(1).max(40),
        playerType: z.enum(PLAYER_TYPES).nullable().default(null),
      })
      .parse(req.body);
    const g = game.join(code, body.name, body.playerType);
    return { token: g.token };
  });

  // ── Any role ──────────────────────────────────────────────────────────────
  app.get('/api/view', async (req) => render(auth(req)));

  app.get('/api/events', (req, reply: FastifyReply) => {
    const a = auth(req);
    reply.hijack();
    const res = reply.raw;
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    const send = (e: unknown) => res.write(`data: ${JSON.stringify(e)}\n\n`);
    const remove = hub.add({
      sessionId: a.session.id,
      render: () => render(a),
      send,
      notifications: a.role !== 'host',
    });
    send({ type: 'view', view: render(a) });
    req.raw.on('close', remove);
  });

  // ── Host ──────────────────────────────────────────────────────────────────
  app.post('/api/host/:action', async (req) => {
    const a = auth(req, 'host');
    const { action } = z
      .object({ action: z.enum(['start', 'pause', 'resume', 'skip', 'hint', 'end']) })
      .parse(req.params);
    const id = a.session.id;
    let result: unknown = null;
    if (action === 'start') game.start(id);
    else if (action === 'pause') game.pause(id);
    else if (action === 'resume') game.resume(id);
    else if (action === 'skip') result = game.skip(id);
    else if (action === 'hint') result = game.hint(id);
    else game.end(id);
    return { ok: true, result };
  });

  app.patch('/api/host/setup', async (req) => {
    const a = auth(req, 'host');
    const body = z.object({ hidingPlace: z.string().max(200).optional() }).parse(req.body);
    game.setup(a.session.id, body);
    return { ok: true };
  });

  // ── Guest ─────────────────────────────────────────────────────────────────
  app.post('/api/guest/tool', async (req) => {
    const body = z.object({ tool: z.string().max(40), value: z.string().max(40) }).parse(req.body);
    return game.toolAnswer(guestOf(req), body.tool, body.value);
  });

  app.post('/api/guest/qr', async (req) => {
    const body = z.object({ code: z.string().max(40) }).parse(req.body);
    return game.scanQr(guestOf(req), body.code);
  });

  app.post('/api/guest/npc', async (req) => {
    const body = z.object({ npc: z.string().max(40), text: z.string().min(1).max(500) }).parse(req.body);
    return game.npcMessage(guestOf(req), body.npc, body.text);
  });

  app.post('/api/guest/accuse', async (req) => {
    const body = z.object({ suspects: z.array(z.string().max(40)).min(1).max(5) }).parse(req.body);
    game.accuse(guestOf(req), body.suspects);
    return { ok: true };
  });
}
