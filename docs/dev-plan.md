# Mystery Night OS — V1 Development Plan

_Status: draft · 2026-09-28 · companion to [product-plan.md](product-plan.md)_

**Goal:** a playable, paid-ready V1 of *The Illustrator Heist* for private parties: a guest web app, TV screen, host console, Claude-driven game master and text characters, and NLPearl voice. It must survive 3 real playtests before launch.

**Estimate:** about 11–12 weeks for one developer working with Claude Code. Content writing (phase 6) runs in parallel.

---

## 1. Technical decisions (proposed)

| Area | Choice | Why |
|---|---|---|
| Language | TypeScript everywhere (Node 22) | Already the codebase's language; shared types between server and clients |
| Repo layout | Monorepo: `apps/server`, `apps/web`, `packages/story`, `packages/shared` | One place for the story schema, types and UI tokens |
| Server | Fastify + Zod validation | Replaces the hand-rolled `http` router (see code review #1, #2, #14) |
| Realtime | SSE for server→client, REST for client→server | Already used in the MVP; works through proxies and on mobile |
| Database | SQLite + Drizzle ORM (one server instance) → Postgres when we scale | Zero ops for V1; persistence fixes review #4 |
| Web | React + Vite + TypeScript, one app with three routes: `/g/:token` (guest), `/tv/:token`, `/host/:token` | Pixelgram, Streamly etc. need real components; RTL-first |
| Styling | CSS variables and design tokens from `marketing/commercial-15s` (cards, slab, app skins) | The commercial's look *is* the product's look |
| PWA | Service worker + Web Push (VAPID) | Push notifications; iOS needs "Add to Home Screen" |
| AI | Anthropic API: `claude-sonnet-5` for the game master and characters, `claude-haiku-4-5` for fast classification (clue detection) | Quality where it matters, speed and cost where it doesn't |
| Voice | NLPearl (outbound + inbound), Twilio only as fallback | Product decision; Hebrew speech-to-speech |
| Hosting | Fly.io (or Render): one region close to Israel, persistent volume for SQLite | Public HTTPS for phones and webhooks |
| Observability | Structured logs + Sentry + a per-session event log | Needed to debug a live party afterwards |
| Tests | Vitest (unit), a headless **game simulator**, Playwright (UI), AI eval suite | See section 4 |
| CI | GitHub Actions: typecheck, lint, tests, simulator run on every PR | |

## 2. Core data model

```
Story (from packages/story, versioned JSON)
  facts, characters, npcs{knowledge boundary}, clues{content, unlockRule}, acts{triggers}, skins
Session        id, storyId, skin, status, hostToken, startedAt, pausedAt, envelopeHint, voiceBudgetSec
Guest          id, sessionId, token, name, phone?, consentVoice, characterId, quizAnswers, pushSub?
ClueUnlock     sessionId, clueId, guestId|table, source(time|gm|qr|answer|call), at
Message        sessionId, guestId, npcId, role, text, at             (text chats with NPCs)
Call           sessionId, guestId, npcId, direction, nlpearlCallId, durationSec, summary, cluesMentioned[]
Accusation     sessionId, guestId, suspects[], at
Event          sessionId, type, payload, at                          (append-only log for everything)
```

**Clue unlock rules** (in the story file): `time(act, minute)`, `gm()`, `qr(code)`, `answer(field, expected)`, `callMention(npcId, keywords|intent)`, `after(clueId)`.

## 3. Phases

### Phase 0: Foundations (week 1)
- Monorepo scaffold, strict TS, ESLint + Prettier, Vitest, GitHub Actions CI.
- Replace the MVP server with Fastify. The legacy `src/` moves to `legacy/` for reference and is deleted after phase 3.
- Config via `.env` (dotenv / `--env-file`), a validated config schema, secrets documented in `.env.example`.
- Staging deploy on Fly.io with HTTPS and a health check.
- **Done when:** CI is green, and staging serves "hello" over HTTPS.

### Phase 1: Story engine & session state (weeks 2–3)
- Story bible schema (Zod) in `packages/story`. Convert *The Illustrator Heist* from `docs/stories/illustrator-heist.md` to JSON. Skins swap names at render time.
- DB schema + migrations. Session lifecycle: `draft → pregame → live → paused → finale → ended`.
- Engine: act timers, clue unlock evaluation, event log, SSE fan-out per role (guest, tv, host).
- Auth: an unguessable token per guest, TV and host. Every endpoint is scoped to its session. Phone numbers are never sent to other guests or the TV.
- **Game simulator:** a CLI that runs a whole party headless with scripted bots and fast-forwarded time, asserting every clue is reachable and the finale triggers.
- **Done when:** the simulator finishes the Heist end to end in under 10 seconds, in CI.

### Phase 2: Guest web app (weeks 3–5)
- Onboarding from the invite link: name, "player type" quiz → casting, phone + voice consent (optional), Add to Home Screen, push opt-in.
- Tabs: **My File**, **Evidence** (zoom, share to TV), **Pixelgram** (feed, stories, recovered deleted posts), **Streamly** (VOD with scrubbing and chat, where timestamps are clues), **Huddle** (leaked DMs), **Contacts** (NPC chat + tap-to-call), **Tools** (QR scanner, SlabCert lookup), **Accuse**.
- Hebrew RTL, dark UI, large touch targets, reconnect with full resync, and graceful behavior on weak Wi-Fi.
- **Done when:** a 10-guest simulated session runs on real iOS and Android phones with no stuck state after airplane-mode toggles.

### Phase 3: TV screen & host console (week 6)
- TV: scene renderer reusing the commercial's components (museum, blackout countdown, UV reveal, stream playback, shared evidence, accusation counter, awards).
- Host: setup wizard (players, character assignment override, where the envelope is hidden), start, pause for dinner, "give a hint", skip beat, end. **No spoilers are ever shown.**
- **Done when:** a full simulated party can be run from the host console alone.

### Phase 4: AI characters & game master (weeks 6–8)
- **Text agents:** one prompt per NPC built only from its knowledge boundary: what it knows, what it lies about, and what it admits under pressure. It is never given the solution.
- **Game master:** runs on a timer and on events. It sees a compact state summary and can act *only* through tools: `release_clue`, `send_hint`, `assign_mission`, `message_as_character`, `place_call`, `trigger_event`. The engine validates every tool call against the story's rules.
- Guardrails: an output filter for solution leaks, and per-session token and cost tracking with limits.
- **AI eval suite:** 50+ red-team prompts per NPC ("just tell me who did it"), checks that stories stay consistent, and a GM pacing test inside the simulator.
- **Done when:** 0 solution leaks across the eval suite, and the game master keeps the simulated party within its 150-minute budget.

### Phase 5: Voice with NLPearl (weeks 8–9)
- Create agents per session and per NPC through NLPearl's API, with the same knowledge-boundary prompt as the text agent plus a Hebrew voice per character.
- **Outbound:** the game master's `place_call` → NLPearl call to the guest's phone (consent required).
- **Inbound hotline:** the number is shown on the TV and in Contacts. Routing: first confirm with NLPearl whether it's one number per NPC or one number with a menu. The caller is matched to a guest by phone number.
- Post-call webhook (signature verified) → transcript/summary → Haiku classifies which clues were mentioned → unlocks them for that guest.
- Minute budget per session, a polite in-character cutoff, and a Twilio fallback if NLPearl is down.
- **To confirm with NLPearl first (week 1, not week 8):** Hebrew voices, inbound routing, webhook payload, concurrent calls, pricing per minute, and data retention.
- **Done when:** 5 simultaneous calls in a staging party are all logged and unlock the right clues.

### Phase 6: Content & props (in parallel, weeks 3–9)
- All Hebrew in-game content: character files, Pixelgram posts and stories, Streamly VOD script and chat, Huddle DMs, clue texts, hints, awards.
- Final creature art direction (the commercial's Wildlore set, or commissioned art).
- Printable props kit PDF: two card replicas (one with UV ink), 3 QR stickers, envelope, name badges, host one-pager.
- Trademark check on "Wildlore", "Noctyra", "Pixelgram", "Streamly", "Huddle", "SlabCert".

### Phase 7: Playtests (weeks 10–11)
- 3 real parties (friends, 6–10 players). Record the session event log, ask players to rate it, and debrief the host.
- Measure: pre-game app opens, clues per player, calls and messages per player, full-solve rate (target 30–50%), "would you buy this?", voice cost per night.
- Fix the top issues after each party.

### Phase 8: Launch prep (week 12)
- Landing page + waitlist (using the commercial), checkout (Israeli processor such as Cardcom/Grow, or Stripe), invoices.
- Legal: privacy policy, voice consent and recording notice, terms of use, age guidance.
- Support playbook for a party in progress (host hotline or WhatsApp).

## 4. Testing strategy

| Layer | What |
|---|---|
| Unit | Clue rules, act timers, skins, token scoping, webhook signature verification |
| Simulator | Full party with bots in CI: every clue reachable, the finale triggers, no dead ends |
| UI | Playwright on guest, TV and host flows; RTL snapshots; small-phone viewport |
| AI evals | Leak red-team per NPC, consistency, GM pacing; runs nightly and before each release |
| Load | 10 guests + TV + 5 calls on staging, with Wi-Fi drop and recovery |
| Real devices | iPhone (Safari + installed PWA), Android Chrome, TV browser/cast |

## 5. Code review items: where each is fixed

| Review item | Fixed by |
|---|---|
| #1 server crash, #2 path traversal, #14 bad JSON | Phase 0 (Fastify, Zod, story IDs from registry only) |
| #3 reveal hardcoded, #5 host UI hardcoded | Phase 1 (engine driven by the story file) + phase 3 |
| #4 consent lost / in-memory state | Phase 1 (DB) + phase 2 (consent in the web app) |
| #7 SSE reconnect storm, #8 refresh loses state | Phase 2 (resync protocol) |
| #9 English prompts, #10 English voice | Phases 4–5 (Hebrew prompts per story; NLPearl Hebrew voices) |
| #12 unchecked API errors, #13 no auth | Phases 0–1 (typed clients with timeouts; tokens) |
| #15 model ID, #16–17 tooling | Phase 0 |

## 6. Risks

| Risk | Mitigation |
|---|---|
| NLPearl Hebrew quality, latency or routing doesn't fit | Validate in week 1 with a spike; Twilio fallback path |
| AI leaks the solution | Knowledge boundaries, tool-only game master, eval suite gate before every release |
| iOS push limitations | Home-screen onboarding step, TV cues, in-app alerts |
| Cost per party (voice + LLM) | Per-session budgets, cached prompts, Haiku for classification, dashboards |
| Party-night failure | Host "skip/hint" controls, offline-tolerant client, event log for support |
| Scope creep | V1 = one story, one language, private parties only |

## 7. Immediate next steps (this week)
1. Confirm the stack in section 1 (or adjust).
2. Open an NLPearl developer account and API key → run the week-1 voice spike (Hebrew voice, inbound routing, webhook payload).
3. Anthropic API key for staging; Fly.io account.
4. Start phase 0 on a new branch; open a PR per phase.
