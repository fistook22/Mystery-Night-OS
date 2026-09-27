# Mystery Night OS — Product Plan

_Status: draft · last updated 2026-09-27_

## Decisions log

| Date | Decision |
|---|---|
| 2026-09-27 | **First market: private parties** (birthdays, friend groups, bachelor/ette). Corporate later. |
| 2026-09-27 | **Guest experience moves to a web app (PWA).** WhatsApp is no longer the gameplay channel. |
| 2026-09-27 | **Sellable stories use fictional brands** ("skins"). Real-brand versions are private-use only. |
| 2026-09-27 | **Voice is in V1, powered by NLPearl** (outbound calls + inbound suspect hotline). Twilio stays as fallback only. |
| 2026-09-27 | **V1 launch story: "The Illustrator Heist"** (see `stories/illustrator-heist.md`). |

## Vision

A mystery party where the world is alive. Printed kits are cheap but static, and live actors are great but expensive. Mystery Night OS gets closer to live actors: AI characters call guests, answer their messages, post on fake social feeds and react to what players actually do. The host doesn't need to prepare anything and doesn't know the solution, so the host plays too.

**Core principle:** each story is a fixed, human-written *story bible* (facts, timeline, who knows what). AI improvises the *performance* but never the *truth*.

## Audience & packaging (private parties)

- 6–10 players, 2–2.5 hours, dinner at home, TV in the room.
- Host buys → gets one invite link → pastes it into the friends' WhatsApp group. **No WhatsApp Business API required.**
- Pre-game (3–5 days before): guests open the link, take a short "player type" quiz, receive their character and costume tip, and can browse the fake social feeds.
- Pricing hypothesis: ~₪199 / night (≤10 players) including voice minutes up to a cap; printable props PDF included; physical prop box later.

## V1 scope

### 1. Guest web app (PWA, mobile-first, Hebrew RTL)
| Tab | Content |
|---|---|
| **My File** | Character, secret, personal goal, secret missions as they unlock |
| **Evidence** | Collected clues, zoomable; "share with the table" (pushes to TV) |
| **Pixelgram / Streamly / Huddle** | In-game social feed, stream recording with chat, leaked DMs; "deleted" posts can be recovered |
| **Contacts** | Text chat with AI characters; tap-to-call the suspect hotline |
| **Tools** | QR/NFC scanner for hidden props, SlabCert lookup |
| **Accuse** | Secret vote and final answer |

Mobile requirements: one-handed use, large touch targets, dark UI, works on weak Wi-Fi (reconnect + resync), per-guest token in the link (no login).
**iOS caveat:** web push only works after "Add to Home Screen" → onboarding includes that step; while the app is open we use in-app sound/vibration; the TV says "📱 check your phones".

### 2. TV screen
The shared stage: story beats, stream playback, blackout countdown, "shared" evidence, live accusation counter, awards finale.

### 3. Host console
Setup wizard, enter where the envelope is hidden (feeds the final riddle), pause for dinner, "give the table a hint", emergency skip. **Spoiler-free.**

### 4. Voice (NLPearl)
- **Outbound calls:** the AI game master calls a specific guest in character (e.g. the insurance adjuster pressuring the owner's player).
- **Inbound suspect hotline:** the TV shows a number; guests call to interrogate off-stage characters (Captain Nili, Avner the pawnbroker, the insurance adjuster, Kenji Mori).
- One NLPearl agent per NPC, created per event via NLPearl's API. Each agent's prompt holds only that NPC's **knowledge boundary** (what it knows, what it lies about, what it admits under pressure).
- Post-call webhook → transcript/summary → the clue detector marks which clues were revealed → unlocks them in that guest's Evidence tab.
- Caller identification by matching the caller's phone number to a guest (guests enter their number in the web app, with consent).
- Per-event minute budget with a graceful cutoff message in character.
- To confirm with NLPearl: Hebrew voice selection per character, inbound routing (a number per NPC vs one number with a menu), webhook payload fields, and concurrency (several guests calling at once).

### 5. AI game master (Claude)
Runs every few minutes and on every significant event. It sees a summary of the game state and may only call a fixed set of tools:
`release_clue`, `send_hint`, `assign_mission`, `message_as_character`, `place_call`, `trigger_event`.
It can never state facts that aren't in the story bible. Pacing rules: if the table is stuck for more than N minutes, release a hint; if one player dominates, give a quiet player a mission; keep the finale inside the time budget.

### 6. Text agents
Chat with NPCs and with absent characters in the Contacts tab. The same knowledge-boundary prompts as voice, run on Claude.

## Architecture (target)

```
 Guest PWA ─┐                    ┌─ NLPearl (voice agents, webhooks)
 TV screen ─┼── Node/TS server ──┼─ Claude (game master, text agents)
 Host      ─┘   REST + SSE/WS    └─ DB (SQLite → Postgres/Supabase)
```

- Persistent DB: sessions, guests, clue unlocks, messages, calls. Fixes the in-memory state and lost-consent bugs.
- Per-guest and per-host tokens on every endpoint; webhook signature checks.
- Public hosting (Fly.io / Render class), because guests connect over the internet.
- Story format = the story bible JSON: `facts`, `characters`, `npcs` (with knowledge boundaries), `clues` (content + unlock rule: time / GM / QR / answer / call-mention), `acts` (triggers), `skins` (brand names).

## Roadmap

| Phase | Contents |
|---|---|
| **V1** | PWA + TV + host console, Illustrator Heist, NLPearl voice (outbound + hotline), Claude text agents + game master, printable props, recap poster |
| **Playtests** | 3 real parties before paid launch |
| **V2** | Pre-game hype drip, more stories (Shmil re-done in the new format), awards and shareable recap video |
| **V3** | Story authoring tool, physical prop box, corporate edition |

## Playtest metrics
- % of guests who opened the app before the night
- Clues found per player; calls and messages per player
- Full-solve rate (target 30–50%)
- "Would you buy this for your own party?" and NPS
- Voice cost per event vs. budget

## Risks
| Risk | Mitigation |
|---|---|
| AI character leaks the solution | Knowledge boundaries per NPC; the game master is limited to tools; red-team every story before release |
| Voice cost overrun | Minute caps, hotline hours tied to acts |
| iOS push limitations | Home-screen onboarding, TV cues, in-app alerts |
| Brand/IP | Fictional skins for anything sold or advertised |
| Host setup friction | 15-minute setup target; everything happens through one link |
