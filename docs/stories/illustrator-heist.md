# Story Bible — "The Illustrator Heist" / "השוד של המאייר"

_Status: draft v0.1 · V1 launch story · 6–9 players · ~2.5 h_

> **This file is the truth.** AI characters and the game master may only reveal facts written here, and only through the channels and conditions listed.

## Skins (brand names)

The sellable edition is the default. The private edition may swap in real names for personal use only; never in anything sold or advertised.

| Key | Sellable edition (default) | Private edition |
|---|---|---|
| `tcg` | Wildlore TCG | Pokémon TCG |
| `card` | Noctyra Illustrator | Pikachu Illustrator |
| `grader` | SlabCert | PSA |
| `photo_app` | Pixelgram | Instagram |
| `stream_app` | Streamly | Twitch |
| `chat_app` | Huddle | Discord |

_"Wildlore" and "Noctyra" are placeholders pending a trademark check. The full creature set (Nightglass series) is in `marketing/commercial-15s/cards.js`; UV twist: genuine Noctyra prints have UV-reactive ink in the wing cells._

## Premise

Tel Aviv, 21:00. It's a private preview party at the auction house **Hammer & Holo**. Tomorrow it sells the most famous card in the country: **Noctyra Illustrator, SlabCert GEM 10**. The card was a prize in a 1998 illustration contest, and only about 40 were ever printed. The estimate is ₪18–22M.

- **21:43:** the power goes out for **94 seconds**. When the lights return, the card is still in its sealed case.
- **22:10:** the grading expert runs a UV test for the guests' photos. The card glows wrong. **It's a fake.**

## The truth (solution)

There are **two crimes on one night**.

1. **Eitan Barak (owner) staged a theft for insurance money.** He has crypto debts of about ₪6M. Three weeks ago he raised the insurance cover from ₪8M to ₪20M. He had Noa make a "display replica" slab. Using admin access to the building's security app, which Shira gave him as a favor, he triggered "blackout mode" at 21:43. In the dark he swapped the real card for the replica and put the real one in his jacket in the coat room, planning to "discover" the theft after the party.
2. **Gal Peretz (17, shop kid) stole the real card from Eitan.** Gal was watching Yoni's live-stream monitor and saw Eitan's hand at the case. At 21:51 Gal went to the coat room and took the card from Eitan's jacket. Gal owes money to a loan shark on Huddle.
3. **Where the card is now:** hidden in the house. **This is the physical finale:** the host hides a real envelope at setup, and the final riddle points to it.

Scoring: naming Eitan = half the case. Naming Gal = the other half. Finding the envelope = bonus.

Noa and Shira are accessories without criminal intent; they are red herrings with guilty consciences. Rotem, Maya and Kenji are innocent red herrings with real motives.

## Characters (players)

| ID | Character | Pixelgram persona | Secret | Personal goal | Required? |
|---|---|---|---|---|---|
| `eitan` | Eitan Barak, owner | @noctyra_king (watches, slabs) | Debt; staged the theft | Get the blame onto Rotem | ✔ core |
| `noa` | Noa Levi, grading expert | @noa.grades ("Slab Queen") | Made the replica slab | Stop anyone recovering her 20:10 story | ✔ core |
| `yoni` | Yoni Barak, Eitan's brother, streamer | @YoniOpensPacks | His stream caught the swap and he didn't notice | Reach 100 "viewers" by getting players to do things on stream | ✔ core |
| `gal` | Gal Peretz, 17, shop kid | @gal.flips | Took the real card; owes the loan shark | Not get caught, or cut a deal | ✔ core |
| `maya` | Maya Cohen, auction house rep | @maya.hammerandholo | The house is nearly broke | Keep the auction alive | ✔ core |
| `rotem` | Rotem Shani, Eitan's ex | @rotem.after | Divorce dispute over half the collection | Prove half the card is hers | ✔ core |
| `shira` | Shira Avrahami, security installer | @shira.secure | Gave Eitan admin access | Protect her company | optional |
| `kenji` | Kenji Mori, collector | @mori.collection | Says the card was taken from his father in 1998 | Recover it legally | optional (NPC if unassigned) |
| `ido` | Ido, Streamly mod / Yoni's best friend | @ido.mod | Has the full raw stream file | Sell the footage to the highest bidder | optional |

If a core role is unfilled, an AI character plays it on text and voice.

## NPCs (AI only: NLPearl voice + text)

| NPC | Voice/tone | Knows | Lies about / withholds | Admits under pressure |
|---|---|---|---|---|
| **Captain Nili Dagan**, police | Dry, funny, tired | Timeline of the blackout; fake confirmed at 22:10 | Nothing, but won't guess | Hints at the coat room if players mention the stream |
| **Avner**, pawnbroker (Jaffa) | Fast talker, nervous | A teen called this morning asking what a Noctyra Illustrator is worth "hypothetically" | Says he "doesn't remember" the voice | "A kid, school bag, smelled like the shop's cleaning spray" |
| **Dafna Roth**, insurance adjuster | Polite, cold | Cover raised 3 weeks ago | Won't say by whom | "The policyholder requested it himself" |
| **Kenji Mori** (if NPC) | Formal, sad | His father's story | — | Has no proof; is innocent |

## Clues

| ID | Clue | Channel | Unlock | Points to |
|---|---|---|---|---|
| C1 | Stream frame 21:43:07: a hand with Eitan's watch at the case | Streamly VOD | Act 2 start | Eitan |
| C2 | Stream chat: *"yo who's in the coat room??"* at 21:51 | Streamly chat | Players scrub the VOD, or GM hint | Gal |
| C3 | Fake's cert number → a different card graded in 2019 | SlabCert lookup | Players enter the number from the evidence photo | Staged fake |
| C4 | Noa's deleted 20:10 story: blank slab + label printer | Pixelgram "recovered" | GM, or a QR prop | Noa made the replica |
| C5 | Security log: "blackout mode" by `eitan.b` at 21:43 | Evidence (from Shira) | Shira shares it, or Act 3 | Eitan |
| C6 | Insurance email: ₪8M → ₪20M | Evidence | Adjuster call / Act 3 | Eitan's motive |
| C7 | Huddle DM, Gal → loan shark: *"I'll have it by Friday"* | Huddle | GM mission or Ido | Gal's motive |
| C8 | UV test on two printed cards | Physical prop | Host props kit | Which card is fake |
| C9 | Avner's description of the teen | Hotline call | Call Avner | Gal |
| C10 | Final riddle → the envelope's hiding place | TV + app | After both accusations | Physical finale |

Red herrings: Rotem's angry posts about "my half"; Maya's layoff emails; Kenji's old newspaper clipping.

## Acts

| Act | Time | Beats |
|---|---|---|
| **1. The Preview** | 0–40 min | Characters introduced; Pixelgram opens; Yoni goes "live" on TV. Blackout at minute 30 (TV goes dark, countdown). False calm. |
| **2. The Fake** | 40–100 min | UV test on TV → fake. Captain Nili calls a random guest. Hotline opens. C1, C3, C4 released over time. Secret missions assigned. |
| **3. Two Thieves** | 100–150 min | C5, C6 leak. Adjuster calls Eitan's player. Secret accusation vote. First reveal (Eitan) is **not the end**: "…so where is the card?" C10 → envelope hunt → awards. |

## Awards (finale)
Sharpest Detective · Best Liar · Most Streamly Viewers (Yoni) · The One Who Suspected Everyone · Best Costume (host vote)

## Host props kit (printable)
Two card replicas (one printed with UV ink, plus instructions), a UV flashlight (~₪20), 3 QR stickers to hide, the envelope and "real card" print, and character name badges.
