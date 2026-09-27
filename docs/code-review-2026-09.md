# Code Review — MVP (2026-09-27)

Review of the MVP at commit `9a7f3af`. Items marked **confirmed** were reproduced against a running server; the rest come from reading the code. The V1 rebuild should fix these or remove the affected code.

## Confirmed
1. **`GET /host//` crashes the server.** `src/api/static.ts:56` streams a directory, and the resulting `EISDIR` error is never handled, so the process exits.
2. **Scenario path traversal.** `src/services/scenario.ts:8` builds a path from the raw `scenarioId`; `"../package"` loads `package.json` and leaves a half-created session. A missing scenario returns 500 instead of 404.
3. **Shmil never ends.** `src/services/orchestrator.ts:57` hardcodes `evt_reveal` (Shmil uses `evt-07-reveal`), so no reveal messages are sent and the status stays `active`. The reveal title "THE MERIDIAN VERDICT" is also hardcoded.
4. **Consent never recorded.** WhatsApp sends `972…` but guests are stored as `+972…` and compared exactly (`state.ts:64`). Replies that arrive before Start are dropped because state is in-memory and created on Start.

## Host UI
5. `public/host/index.html` hardcodes the Meridian characters, timeline and `total = 7`. With Shmil, guests are assigned non-existent character IDs, so no buzzes are delivered.
6. The setup text promises onboarding on Start, but nothing sends it. `/api/host/onboard` has no UI, and consent dots never update.
7. The SSE `onerror` handlers open a new connection on every error (`host:808`, `screen:939`), so connections multiply and log entries duplicate.
8. After a page refresh, the guest list and timer come from page defaults, not from server state.

## Content / integrations
9. Claude prompts are English with a "corporate thriller" tone (`claude.ts:93`), and the fallbacks are English.
10. Twilio reads Hebrew scripts with an English Polly voice (`twilio.ts:47`). `CallerId` doesn't show a character name.
11. `onboard.ts:54` generates a Claude message and only logs it.
12. HTTP errors from Anthropic, WhatsApp and Twilio are treated as success (`claude.ts:33` returns `""` on a 401 or 429). There are no request timeouts.
13. No auth anywhere. `/api/state` exposes guest phone numbers. No webhook signature check.
14. Invalid JSON → 500; no body size limit.
15. The model ID `claude-sonnet-4-6` is outdated (current: `claude-sonnet-5`); make it configurable.

## Tooling
16. `start.sh` uses a global `ts-node` and TypeScript (which failed with TS 6), and the `.env` loader breaks on inline comments. `npm start` never loads `.env`.
17. `nodemon` is missing from the dependencies. There is no typecheck script, README or tests.
