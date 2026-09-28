import type { FastifyInstance } from 'fastify';
import type { GuestView, HostView, TvView } from '@mn/shared';
import { buildApp } from '../app.js';
import { loadConfig } from '../config.js';
import type { Game } from '../engine/game.js';
import { guestView } from '../engine/views.js';

// Plays a whole party through the real HTTP API with bots and a fake clock.
// Used by the end-to-end test and by `npm run sim`.

const NAMES = ['דנה', 'אבי', 'מיכל', 'יואב', 'נועם', 'שני', 'רון', 'טל', 'עדי'];

export interface SimReport {
  players: number;
  cast: string[];
  cluesFound: number;
  cluesTotal: number;
  finaleReached: boolean;
  culpritsNamedBy: number;
  log: string[];
  leaks: string[];
}

export async function simulateParty(opts: { players?: number; verbose?: boolean } = {}): Promise<SimReport> {
  const players = opts.players ?? 7;
  let clock = Date.UTC(2026, 9, 14, 18, 0);
  const now = () => clock;
  const { app, game } = await buildApp(loadConfig({ NODE_ENV: 'test' }), { now, noTicker: true });
  const log: string[] = [];
  const leaks: string[] = [];
  const say = (m: string) => {
    log.push(m);
    if (opts.verbose) console.log(m);
  };

  try {
    const call = callFor(app);
    const created = await call<{ hostToken: string; links: { invite: string } }>(
      'POST',
      '/api/sessions',
      undefined,
      { hidingPlace: 'בתוך קופסת הדגנים' },
    );
    const host = created.hostToken;
    const code = created.links.invite.split('/').pop()!;
    const hv0 = await call<HostView>('GET', '/api/view', host);
    const sessionId = hv0.session.id;
    const tv = hv0.links.tv.split('/').pop()!;

    const types = ['talker', 'detective', 'schemer', 'chill'] as const;
    const guests: { name: string; token: string; character: string }[] = [];
    for (let i = 0; i < players; i++) {
      const { token } = await call<{ token: string }>('POST', `/api/join/${code}`, undefined, {
        name: NAMES[i],
        playerType: types[i % 4],
      });
      const v = await call<GuestView>('GET', '/api/view', token);
      guests.push({ name: NAMES[i]!, token, character: v.me.character.characterId });
      say(`${NAMES[i]} joined as ${v.me.character.name}`);
    }

    await call('POST', '/api/host/start', host);
    // Advance the game clock (not the wall clock) in 30-second steps.
    const advance = async (toMin: number) => {
      while (game.elapsedMin(game.repo.session(sessionId)!) < toMin) {
        clock += 30_000;
        game.tick(sessionId);
      }
      checkLeaks(game, sessionId, guests, leaks);
    };
    const by = (character: string) => guests.find((g) => g.character === character) ?? guests[0]!;

    await advance(41);
    const g1 = await call<GuestView>('GET', '/api/view', guests[1]!.token);
    const cert = /#(\d{8})/.exec(g1.evidence.find((e) => e.id === 'fake_photo')?.body ?? '')?.[1];
    say(`min 41: fake discovered, cert number read from evidence: ${cert}`);
    const miss = await call<{ clue: string | null }>('POST', '/api/guest/tool', guests[2]!.token, {
      tool: 'slabcert',
      value: '11112222',
    });
    const hit = await call<{ clue: string | null }>('POST', '/api/guest/tool', guests[1]!.token, {
      tool: 'slabcert',
      value: cert ?? '',
    });
    say(`cert lookup: wrong number → ${miss.clue}, right number → ${hit.clue}`);

    await advance(47);
    const avner = await call<{ reply: string }>('POST', '/api/guest/npc', by('maya').token, {
      npc: 'avner',
      text: 'מי זה היה? תאר לי את הבחור',
    });
    say(`Avner: ${avner.reply}`);
    const dafna = await call<{ reply: string }>('POST', '/api/guest/npc', by('rotem').token, {
      npc: 'dafna',
      text: 'מתי העלו את הביטוח?',
    });
    say(`Dafna: ${dafna.reply}`);

    await advance(60);
    const hint = await call<{ result: string | null }>('POST', '/api/host/hint', host);
    say(`host hint: ${hint.result}`);
    const qr = await call<{ clues: string[] }>('POST', '/api/guest/qr', guests[3]!.token, {
      code: 'noa-2010',
    });
    say(`QR NOA-2010 → ${qr.clues.join(', ')}`);

    await advance(80);
    await call('POST', '/api/host/pause', host);
    clock += 20 * 60_000; // dinner break: the game clock must not move
    await call('POST', '/api/host/resume', host);
    const hv = await call<HostView>('GET', '/api/view', host);
    say(`after a 20-minute pause the game clock reads ${hv.session.elapsedMin} min`);

    await advance(126);
    for (const [i, g] of guests.entries()) {
      const suspects = i % 3 === 0 ? ['eitan', 'gal'] : i % 3 === 1 ? ['eitan'] : ['rotem'];
      await call('POST', '/api/guest/accuse', g.token, {
        suspects: suspects.filter((s) => guests.some((x) => x.character === s)),
      });
    }
    await advance(141);

    const final = await call<GuestView>('GET', '/api/view', guests[0]!.token);
    const tvView = await call<TvView>('GET', '/api/view', tv);
    const hostFinal = await call<HostView>('GET', '/api/view', host);
    say(`TV scene: ${tvView.scene.scene}; riddle: ${final.finale?.riddle}`);
    return {
      players,
      cast: guests.map((g) => g.character),
      cluesFound: hostFinal.progress.found,
      cluesTotal: hostFinal.progress.total,
      finaleReached: !!final.finale && tvView.scene.scene === 'finale',
      culpritsNamedBy: final.finale?.results.filter((r) => r.correct === r.of).length ?? 0,
      log,
      leaks,
    };
  } finally {
    await app.close();
  }
}

function callFor(app: FastifyInstance) {
  return async <T = unknown>(
    method: 'GET' | 'POST' | 'PATCH',
    url: string,
    token?: string,
    body?: unknown,
  ): Promise<T> => {
    const res = await app.inject({
      method,
      url,
      payload: body as object | undefined,
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
    if (res.statusCode >= 400) throw new Error(`${method} ${url} → ${res.statusCode}: ${res.body}`);
    return res.json() as T;
  };
}

/** Before the finale, no guest may see the solution or another player's secret. */
function checkLeaks(
  game: Game,
  sessionId: string,
  guests: { token: string; character: string }[],
  leaks: string[],
): void {
  const c = game.ctx(sessionId);
  if (c.session.status === 'finale' || c.session.status === 'ended') return;
  for (const g of guests) {
    const a = game.repo.resolveToken(g.token);
    if (a?.role !== 'guest') continue;
    // Rendered through the same function the API uses.
    const text = JSON.stringify(guestView(game, a.guest));
    if (text.includes(c.story.solution.explanation.slice(0, 40)))
      leaks.push(`solution visible to ${g.character}`);
    for (const ch of c.story.characters) {
      if (ch.id !== g.character && text.includes(ch.secret.slice(0, 30)))
        leaks.push(`${ch.id}'s secret visible to ${g.character}`);
    }
  }
}

// CLI: npm run sim
if (process.argv[1]?.endsWith('simulate.ts')) {
  const players = Number(process.argv[2] ?? 7);
  const r = await simulateParty({ players, verbose: true });
  console.log(
    `\n${r.players} players · clues ${r.cluesFound}/${r.cluesTotal} · finale ${r.finaleReached ? 'yes' : 'NO'} · solved by ${r.culpritsNamedBy} · leaks ${r.leaks.length}`,
  );
  if (!r.finaleReached || r.leaks.length) process.exit(1);
}
