# Mystery Night OS: Business Plan & Roadmap (v0.1 draft)

_Status: working draft for co-founder review. Every number marked **[A]** is an assumption to validate, not a fact._

---

## 1. What we actually have today (honest audit)

**The product:** a host runs an at-home murder-mystery night. A TV shows cinematic "events" (CCTV stills, news flashes, newspapers, social posts). Each guest gets secret character messages on WhatsApp, and some get a "voice call" from a character. The host drives the pacing from a dashboard. Guest-facing content is in Hebrew, and there are two hand-written scenarios (`corporate-betrayal`, `shmil-cat`).

**Where AI is used today:** only in three thin places (`src/services/claude.ts`):
1. A personalized character briefing
2. A cryptic WhatsApp opener
3. On-demand "wildcard" plot twists

Everything that makes the night good (the plot, the clues, the reveal) is hand-written JSON. **Today this is a well-produced party kit with an AI garnish. It is not yet an AI product.** That's fine for now, but we shouldn't pitch it as more than that.

**Blockers before anyone pays us:**

| Issue | Where | Why it matters |
|---|---|---|
| One global in-memory game per server | `src/services/state.ts` | Only one party can run at a time, and a restart wipes it |
| No accounts, payments, or scenario purchase flow | — | We can't take money |
| Voice calls use an **English** voice (`Polly.Matthew-Neural`, `en-US`) | `src/services/twilio.ts:47` | Hebrew scripts will be read out as gibberish. The "wow" feature becomes the "cringe" feature |
| Reveal title is hard-coded to "THE MERIDIAN VERDICT" | `src/services/orchestrator.ts:61` | The Shmil-the-cat comedy ends with a corporate-thriller banner |
| Wildcard and opener prompts are hard-coded to "corporate thriller" tone | `src/services/claude.ts:93` | Wrong tone for every other genre |
| Inbound guest messages are only logged for the host | `src/api/webhook.ts` | Guests can't interact with the story. Interaction is the biggest AI opportunity |

---

## 2. The core question: where does AI earn money?

Garnish doesn't earn money. In order of value, AI can:

1. **"A mystery written about *your* people." (the wedge)** The host fills in a 5-minute form: guest names, inside jokes, the birthday person, the office drama. AI generates a custom scenario where the victim is the boss's plant and the suspects are the actual guests' exaggerated selves. No boxed kit can do this. That makes it both the premium price point and the thing guests talk about afterwards.
2. **Live AI game master on WhatsApp.** Guests can message a character ("Where were you at 11?") and get in-character answers that follow the rules of the case. This turns a passive script into an interrogation game and uses the inbound webhook we already have.
3. **Adaptive pacing and hints.** AI watches progress and the host's "they're stuck / they're bored" buttons, and releases or holds back clues.
4. **Content velocity.** Internally, AI plus human editing lets us ship a new catalog scenario every week instead of every month.

**Critical risk:** an AI-written mystery with a logic hole ruins the night. The reveal feels unfair, and the NPS collapses. A custom mystery needs a **validation pipeline**: generate the case, then have a separate AI pass try to solve it from the clues alone, check the clues against the timeline, and flag any second suspect who also fits. For the first 50 custom games, a human editor also reviews every case. This pipeline is our real IP. Prompts are not.

---

## 3. Customer & business model: what I'd bet on, and what I'd avoid

**Avoid: consumer subscriptions.** People host mystery parties 1–3 times a year. A monthly plan would churn in month 2.

| Segment | Offer | Price **[A]** | Why |
|---|---|---|---|
| **B2C host (birthday, bachelorette, friends)** | Catalog scenario, self-run | ₪149–199 per game | Low cost to acquire, and every game exposes 6–10 guests. That's our growth loop |
| **B2C premium** | Custom AI mystery about your group | ₪349–499 per game | The wedge. High margin, highly shareable |
| **B2B corporate team-building (gibush)** | Custom mystery about the company, 15–60 people, optional live facilitator | ₪2,500–8,000 per event | Israeli companies already pay this much per head for team-building. Few customers are needed to reach real revenue |
| **B2B2C (later)** | White-label license for venues, restaurants, escape rooms, event producers | ₪500–1,500/month SaaS | Recurring revenue, but only once the product runs without us |

**My recommendation:** lead with **corporate plus B2C premium**, and use catalog B2C as the acquisition funnel. Corporate buyers pay for the novelty, forgive a rough v1 if a human facilitator is in the room, and give us testimonials we can sell with.

### Unit economics sketch (per game, 8 guests) **[A] validate all of these**
- Claude API: a full custom scenario plus validation plus live GM chat comes to roughly $1–4. That's negligible.
- WhatsApp Business API: per-message template pricing for Israel, plus free replies inside the 24-hour service window. Likely ₪5–20 per game.
- Voice calls (Twilio to Israeli mobiles): a few minutes per game. Likely ₪5–15.
- **Variable costs come to roughly ₪20–50 per game.** At ₪349 that's a gross margin above 85%. Margin isn't the problem. **Getting customers and delivering reliably are the problems.**

---

## 4. Competition & moat

- **Boxed and printable kits** (Hunt a Killer, Etsy PDFs, local Hebrew kits): cheap and static. We beat them with the TV production, the phones, and personalization.
- **Live actor companies and event producers:** expensive and hard to scale. We can be ~70% of the experience at ~20% of the price, or we can become *their* tool (B2B2C).
- **Escape rooms:** they compete for the same "group night out" budget. They're also potential licensees.
- **Anyone with ChatGPT:** can write a mystery, but can't *run the night*. Our moat is the **orchestration layer** (TV + WhatsApp + calls + pacing), the **validation pipeline** that produces fair cases, and a **library of proven scenarios plus play data** (which clues confused people, where groups got stuck).

---

## 5. Roadmap with gates

Each phase ends in a **go / no-go gate**. If we miss a gate, we change course; we don't just keep building.

### Phase 0: Prove people pay (weeks 0–6)
**Goal:** 10 paid games, run as a concierge service. We operate the dashboard ourselves, and custom cases are written with AI and edited by hand.
- [ ] Fix the Hebrew voice (a Hebrew TTS voice, or pre-recorded audio from a voice actor), the reveal title, and genre-aware prompts
- [ ] Take payment manually (Bit/PayBox or a payment link). Build nothing
- [ ] Run 3 free friends-and-family games, then 10 paid games (at least 3 corporate)
- [ ] After every game: a 3-question survey (NPS, "would you pay X", "would you host one")

**Gate:** 10 paid games, NPS ≥ 50, and **at least 2 guests who went on to buy their own game** (that proves the growth loop). If no guest converts, the viral thesis is wrong and we go B2B-only.

### Phase 1: Productize the core (months 2–4)
- [ ] Multiple games at once, with persistence (Postgres/SQLite), and session isolation for host, screen, and guests
- [ ] Host accounts plus self-serve checkout with an Israeli payment processor (Stripe doesn't support Israeli merchants, so look at Cardcom, Grow/Meshulam, PayPlus, or Tranzila)
- [ ] 5–6 catalog scenarios across genres (comedy, noir, corporate, kids/family)
- [ ] "Light personalization": AI rewrites names, jokes, and locations inside a proven catalog plot. That's safe because the logic doesn't change
- [ ] Get WhatsApp templates approved, plus a consent and privacy flow (we store guests' phone numbers, so we need to follow Israeli privacy law)

**Gate:** 50 self-serve games per month, at least 30% of games with no support contact, and first-game-to-repeat-host conversion ≥ 10% **[A]**.

### Phase 2: The AI product (months 4–8)
- [ ] Custom-mystery generator plus the automated **solve-check validation pipeline**
- [ ] Live WhatsApp interrogation: guests message characters and get in-character, rule-bound answers
- [ ] Adaptive pacing and hint engine
- [ ] A corporate package: sales deck, facilitator playbook, invoices (חשבונית מס)

**Gate:** custom-game NPS ≥ catalog NPS, and fewer than 5% of custom games flagged as having "unfair/broken logic."

### Phase 3: Scale (months 8–18)
- [ ] English version, then US/UK launch. This is the big market, and Hebrew-first is our test lab, not our ceiling
- [ ] White-label licensing for venues and event producers
- [ ] Creator tools: writers publish scenarios and we share the revenue

---

## 6. Metrics we watch from day 1
- **Guest-to-host conversion** (the growth engine)
- NPS per game, and "reveal fairness" score
- Games per month, revenue per game, and B2B share of revenue
- Support contacts per game (operational reliability)
- Variable cost per game

## 7. Top risks
1. **A broken night.** A tech failure mid-party, like WhatsApp going down or the TV disconnecting, is fatal to word of mouth. We need an offline fallback on the host dashboard.
2. **Unfair AI mysteries.** Mitigated by the validation pipeline plus human review early on.
3. **Meta/WhatsApp policy and cost changes.** Keep a fallback channel (SMS or a web-app link) so we're not locked to one platform.
4. **Hebrew is a small market.** Treat Israel as the proving ground. Design i18n in from Phase 1.
5. **Founder bandwidth.** Concierge operations in Phase 0 don't scale. That's intentional, but we need an end date.

## 8. Decisions we need to make together
1. **B2B-first or B2C-first?** I'd go corporate-led, with B2C as the funnel.
2. **Keep AI voice calls?** They're high-wow and high-risk in Hebrew. I'd use pre-recorded voice-actor audio for catalog games and only use AI TTS once a Hebrew voice passes a blind test.
3. **When do we start on English?** I'd say at the Phase 1 gate, not before.
4. **Who does sales vs. product?** Corporate sales needs a person, not a landing page.
