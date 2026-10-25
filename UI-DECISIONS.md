# UI-DECISIONS.md

Path: **B — full revamp.** The owner said he does not like the UI and UX and asked for it to
be completely rewired. That settles it. The previous build was also, by the skill's own
description, the portfolio's house style: oversized-type hero with the product as an artifact,
pill buttons, and a giant clipped wordmark footer. Three of the banned default-kit items.

Reference pack on disk: `design/refs/` (7 folders, each with desktop, mobile, scrolled,
full-page screenshots and a measured blueprint). Composition read: `design/reference/COMPOSITION.md`.
Concept written before any gallery was opened: `design/CONCEPT.md`.

| Pillar | Choice | Reference (opened this session) | What was taken |
|--------|--------|--------------------------------|----------------|
| 7 · DNA | **teenage engineering** — industrial catalogue | [styles.refero.design/style/aecf9dda…](https://styles.refero.design/style/aecf9dda-5cba-4dc7-9e73-59b65d895cdf) then measured live at [teenage.engineering](https://teenage.engineering) | Zero radius, zero shadow, zero gradient, **zero cards**; five rationed neutrals plus one chromatic note; hairline rules as the structural element; 66px section gap, 15px element gap, 1200px max; images 1:1 unframed edge-to-edge; body left-aligned always. Not their products, photography or wordmark. |
| 7 · Typeface | **Archivo** variable (weight 100–900, width 62–125%) | [Google Fonts](https://fonts.google.com/specimen/Archivo), OFL | One family, two axes, 34KB. The reference's own face (te-20) is custom and unlicensable; its suggested fallback is Inter, which is banned. Archivo carries the same engineered, wire-like register at width 112% / weight 300. |
| 1 · Navbar | **Mega menu**, permanent labelled row | [navbar.gallery](https://www.navbar.gallery/) taxonomy; structure replicated from teenage.engineering's own nav | Category headings with sub-links always visible, tiny thin type, **no CTA button in the nav**. Diverges from the five static/sidebar navs already in this portfolio. |
| 2 · Hero | **Table hero** | teenage.engineering catalogue grid (`design/refs/dna-teenage-engineering/`) | The week's training *is* the hero: a ruled table, edge-to-edge cells, zero cell padding, column heads in 12px uppercase. No headline over a photograph, no product-as-artifact. |
| 3 · CTA | **Square pair, uppercase label** | [cta.gallery](https://www.cta.gallery/) → [tines.com](https://www.tines.com) (`design/refs/cta-tines/`) | Measured: primary filled + secondary outlined at identical size, label uppercase 13px weight 700. Taken: the label treatment and the pairing. **Rejected:** its 990px pill radius, its purple, its warm paper, and the grey "trusted by" logo row under the hero. |
| 4 · Footer | **Grid** | footer.design taxonomy; structure from teenage.engineering (7 columns, 96px, 7 tiny links) | A quiet multi-column grid of small links on the dark band. Explicitly not the large-type wordmark footer used by four other apps here. Harvest Hall was captured as a candidate and rejected (980px animated panel) — `design/refs/footer-harvest-hall/`. |
| 6 · Motion | **Near-still + one conveyor** | [scrolltide.co](https://www.scrolltide.co/) (`design/refs/motion-scrolltide/`); conveyor from [figureandplot.com](https://www.figureandplot.com) (`design/refs/hero-figure-and-plot/`) | The DNA measures 0 animations, so the page is still. The one signature moment is Figure&Plot's horizontal conveyor, re-cast as the training block's weeks travelling under a fixed "now" marker. **No scroll-reveal spine** — five of six apps here already have one. |
| 5 · Icons & imagery | **Flat line only** (Lucide 1.5px) | [3dicons.co](https://3dicons.co/) (`design/refs/icons-3dicons/`) — reviewed and declined | The DNA has no illustration whatsoever; a glossy 3D set would break the register. Recorded as a deliberate deviation. Imagery is the product's own photography, square and unframed. |

| 8 · Components | **Number Pad** by Bankk roll | [21st.dev/@bankkroll/components/number-pad](https://21st.dev/@bankkroll/components/number-pad) | One dominant readout, a hard grid of equal keys, one commit action. Ported as composition only: its source is behind a paid account, and everything is rethemed to Kettleworth tokens. Nothing of its palette, radius or type. |
| 9 · Design intelligence | **uupm.cc**, baseline only | [uupm.cc](https://uupm.cc) | Its UX-guideline baseline for loading, empty and z-index. **None of its taste**: its own examples name Inter, Space Grotesk and Playfair, and list Glassmorphism and Aurora UI. All banned here; the skill's precedence rule applies. |

Picks made offline (source unreachable): **none** — all were opened and captured this session.

## Divergence from the rest of the portfolio

Checked against `~/.claude/sensational-ui/registry.json` (5 other projects); `registry.py check`
passes. The portfolio had converged on warm-paper grounds (4 of 6), large-type footers (5 of 6),
pill buttons (4 of 6) and a scroll-reveal spine (5 of 6). Kettleworth now uses a cool drafting
ground, a grid footer, hard square buttons and a conveyor instead of a reveal.

## Round 2 — the remaining app screens, and the rest game

**Screens.** The fills are gone app-wide: 46 background-fill and backdrop-blur classes removed
across 22 files, so content now sits on the ground with hairline rules doing the structural
work, exactly as the DNA states. Radius and shadow were already neutralised at the token
layer. Community's three stat boxes and its people and group cards became ruled rows. The
rest panel lost its tinted surface for a heavy rule, and the rest deck's tab strip now scrolls
instead of clipping its fifth tab on a phone.

**Word Rush** — the rest-period game, `packages/core/src/word-rush.ts` (10 tests). It replaces
Plate Drill, which the owner judged not addictive: "something like a flappy bird or temple run
… but also good to the cognitive skill, or learn a new language".

Plate Drill's design brief had explicitly ruled out tension — no timer, no streak, no failure.
That is exactly what made it calm and forgettable. The replacement takes the opposite position
on tension and keeps the training guard, so the mechanic changes and the protection does not.

Each Flappy Bird mechanic is mapped, not gestured at:

| Flappy Bird | Word Rush |
|---|---|
| One input | Two targets, left or right. One thumb, no aiming |
| Instant restart, no menu | The run-over screen **is** the start button |
| A visible best to beat | Your best sits on screen during the run |
| Difficulty rises every moment | The answer window shrinks 85ms per correct word, 3200ms down to a 1150ms floor |
| Death in one mistake | One wrong answer, or one timeout, ends the run |
| "So close" | Ending one short of your best is called out by name |

The content is gym, body and food Spanish, and the decoy is drawn from the **same group** as
the answer (chest against back, never chest against tomorrow), which is what makes it teach
rather than test shape-matching. A test asserts that property over 100 generated questions.

The training guard is carried over unchanged: the game exists only inside a running rest
timer, the clock is `sticky` so it stays on screen while you play, Growth is capped at six
scoring runs a session (30 points against a session's 100), the cap is enforced in SQL where
the points are counted rather than in the UI, and a run under five words pays nothing so a
lucky tap earns nothing.

**Rest deck surface.** The five modes became a 5-up grid of hard hairline-separated keys, the
same key language as the set console, which also ends the strip clipping its fifth tab. Quiz,
Breathe, Call it and Tip had never been brought across from the old DNA and still carried
`rounded-lg`, `rounded-full`, `bg-white/10` and a 40px glow; those are now ruled rows, a square
that breathes, and a hard number pad. Switching tab pulls the chosen card's foot to the
viewport foot, because on a phone the card previously opened entirely below the fold.

## Verification log — Plate Drill on production (predecessor)

Kept because the two bugs it found were real, and both fixes live on in Word Rush: the scoring
path, the SQL cap and the leaderboard exclusion are the same code, now keyed on `drill` rows
written by the new game.

Run 25 Oct 2026 against https://kettleworth.vercel.app. Both runs used **throwaway accounts
created and deleted for the purpose**, never the owner's own account: logging fake sets there
would have written into real training history, triggered autoregulation on future loads and
could have recorded a false personal record.

### Run 1 — does the breakdown read correctly?

Signed up, completed the intake, generated a programme, opened the day's session, logged a
set at 40 kg x 8 to start the rest timer, then solved two rounds (50 kg = 15 a side,
70 kg = 25 a side).

| Line | Value | Reading |
|---|---|---|
| Plate drill | **10** | Two solves at five points. Correct |
| Rest deck | absent | Correct. Drill rows did **not** leak into the rest-deck count, which was the main risk, since both write to `rest_activity` |
| Sets logged | 2 | One set at two points |

### Run 2 — does the cap hold?

Played **eight** rounds inside a single rest window, then forged four extra drill rows
straight at `/api/rest` to simulate a tampered client.

| Layer | Observed |
|---|---|
| Interface | Header counted `0/6` through `5/6`, then switched to "Session limit reached" on attempts 7 and 8. The game kept playing, as designed |
| Client requests | **6 POSTs for 8 solves.** The client stops paying itself without the server's help |
| Forged API writes | Accepted with 200, which is correct: the endpoint records activity, it does not award points |
| Rows for that session | 10 |
| Growth shown | **30, not 50.** The per-session cap in SQL held |

Final state of that account: 332 points, with Plate drill at 30 beside Showing up at 280 and
Sets logged at 2. That ratio is the design intent: a whole session of the game is worth less
than a third of finishing the session itself.

### Run 3 — does each session get its own allowance?

Verified on production after a deploy had settled: two sessions each at the cap returned
**45**, not 30, so the allowance is per session as intended. The first attempt returned 30
twice; that was a false negative from my own "deploy settled" check looking for text that was
already on the page, not a product bug.

## Verification log — Word Rush

Run 25 Oct 2026 against a local build on an iPhone 15 viewport, driving the real UI.

| Check | Observed |
|---|---|
| Start | Button measures 56px and starts a run. (An earlier "it is 14px and does nothing" was my own test selector: `/start/i` matched **Restart**, the first button on the page) |
| Nine correct answers | Score read 9, window tightening each word |
| One wrong answer | Run ended immediately, message "New best: 9." |
| Scoring | Exactly **one** POST to `/api/rest`, `{kind:"drill", detail:{points:5, game:"word-rush"}}` |
| Counter | Advanced 0/6 to 1/6 |
| Sub-threshold run | A run ending at 0 produced **no** POST, so a lucky tap pays nothing |
| Layout | Options land at y=279 in a 659px viewport, rest clock still visible at y=75, no horizontal scroll |

### Live run on production

Run 25 Oct 2026 against https://kettleworth.vercel.app, on a **throwaway account created and
deleted for the purpose** (delete confirmed: sign-in afterwards returns 401). Never the
owner's own account, because logging fake sets there would write into real training history,
drive autoregulation on future loads and could record a false personal record.

| Check | Observed |
|---|---|
| Deck tabs | `RUSH QUIZ BREATHE CALL IT TIP` all present, none clipped |
| Clock while playing | Visible, sticky under the header |
| Seven correct answers | Score 7, "New best: 7." |
| Scoring | One POST, `{kind:"drill", detail:{points:5, game:"word-rush"}}`, counter 0/6 to 1/6 |
| Growth breakdown | `Rest game 5` beside Showing up 280, Sets logged 2, Weigh-ins 20 = 307 |
| Cap, six more scoring runs on a fresh page load | Header switched to **SESSION LIMIT** on run 6; **7 drill rows in that session, Growth shows 30, not 35.** The client counter resets on reload, the SQL cap does not, which is the behaviour that matters |

**Bug found by this run.** Scoring 5 against a best of 5 said "One short of your best".
`soClose` used `previousBest - score <= 1`, so a tie counted as one short. Tightened to `=== 1`
and a tie now reads "Level with your best". Regression test added (104 core tests).


## App screens brought onto the DNA (Path A restyle)

The landing and the session screens had been replicated against the reference pack; the rest
of the app had only had its **fills** swept. Radius and shadow were already neutralised at the
token layer, so `rounded-xl` and `shadow-lg` were dead class names rather than visible defects.
What still rendered was audited and converted:

| Residue | Count | Converted to |
|---|---|---|
| `ring-1` / `ring-2` | 72 | Hairline `border` on the same token. A ring is a soft-UI mechanism; the DNA rules |
| `rounded-full` on bars and chips | 92 | Hard bars and hard rectangles. Dots and 1:1 tiles keep it; containers do not |
| `bg-white/*`, `backdrop-blur` | 24 | Removed. The DNA forbids tinted and blurred surfaces |
| `bg-*-soft` fills | 40 | Removed, or inverted to `bg-fg text-bg` where the fill meant "done" |
| `text-amber/sky/rose/signal` | 13 | Collapsed onto the one rationed accent, or onto fill weight |
| dead `rounded-*` class names | 146 | Deleted, so the code states what it renders |

**Shared primitives were the real leverage.** `Chip` alone accounted for 83 of the pills across
settings, library, nutrition and progress. Badge, Chip, Segmented, Tabs, Switch, Slider, Input,
Progress, Ring, Sheet, Dialog, EmptyState and Skeleton were rebuilt: selection now **inverts**
(`bg-fg text-bg`) everywhere, the same signal the set track and the rest-deck keys already used,
so one reading of "chosen" works across the whole app.

**Badge tone** no longer invents five hues. It carries meaning in fill weight: outline for
neutral, solid foreground for positive, accent fill for highlight, accent outline for caution,
double accent rule for negative.

### Two composition changes, not restyles

- **Macro rings became ruled bars.** Three concentric arcs in three hues were the soft-UI motif
  the DNA exists to avoid, and they laid low-contrast strokes over a photograph. Now one
  dominant calorie figure over three hard bars, told apart by label.
- **The nutrition photograph became its own 1:1 cell.** Small grey type over the image measured
  **3.7:1 at the scrim's weakest point** even after the scrim was strengthened, under the 4.5
  the gate requires. The reference frames images 1:1 and unframed, so the figures moved onto
  the ground and the photo stands on its own, below the numbers on a phone.

### Accessibility defect found by this pass

`--color-fg-subtle` was `#8a8a8a`, which is **3.24:1 on the sheet ground** and fails AA for the
small uppercase labels it is used on throughout the app. Now `#6e6e6e` (4.78:1); the carbon
theme went `#76767c` to `#8a8a90` (4.26:1 to 5.60:1).

### Correctness defect found by this pass

The community leaderboard threw on every load: the capped-drill subquery added earlier in this
session selected and grouped by `restActivity.userId` while its `FROM` was the aliased subquery,
so Drizzle refused the query with "the table rest_activity is not part of the query". The page
had never been opened after that change. The outer query now addresses the subquery's own
columns. **This was live on production.**

### Verified

Nine screens at 390px, 768px and 1440px: zero rounded containers over 8px, zero shadows, zero
backdrop blur, no horizontal scroll, no page errors. Carbon theme measured separately
(`bg #0f0e12`, `fg #f1f2f2`), equally clean. 104 core tests, typecheck, production build and
both Playwright projects pass.

**Stale test corrected, not masked:** the core-flow spec asserted the commit button reads
"Update set" after logging. Logging advances focus to the next set, so it reads "Log set"; the
spec now asserts the set track recorded the set, which is the stronger check.

## Set console, second pass — ported from 21st.dev Unit Field

The first pass fixed height (579px → 494px) but not comprehension, which is what the owner
actually reported: "crowded and hard to understand". Measured on an iPhone 15 before touching
anything, the console carried **16 interactive controls, 11 bordered regions and 12 uppercase
micro-labels in 494px**, and it stated the same instruction **three times in three dialects**:

    SET 2 OF 3 · TARGET 12 TO 15 @ 9      (header)
    REPS · AIM 12 TO 15                    (readout caption)
    RPE 9                                  (effort row)

Weight and reps sat either side of a 19px `×` at 40px each, so neither dominated, and which one
the keys drove was signalled by **nothing but 45% opacity**.

**Reference: 21st.dev Unit Field by arikchakma** (`design/refs/components-21st-unitfield`,
https://21st.dev/@arikchakma/components/unit-field). Its composition is one labelled row per
quantity, a quiet fixed label column, and the value right-aligned **with its unit inline**
(`200px`, `0°`) rather than captioned beneath.

| Taken | Not taken |
|---|---|
| One labelled row per quantity | Its drag-to-scrub: a horizontal drag fights a scrolling page on touch |
| Unit inline in the value (`0 kg`, `15 reps`) | Its type — 21st.dev's own site runs on Inter, banned here |
| Hairline-ruled rows, zero fills | Its palette and its grey-on-white surfaces |

**The one change that answers "hard to understand": the key row now sits directly beneath the
row it drives.** Position answers "what do these keys change?", so the question no longer
depends on noticing an opacity difference.

### Measured, before and after

| | Before | After |
|---|---|---|
| Height | 494px | **476px** |
| Statements of the same target | **3** | **1** |
| Duplicate "set N of M" (the track already says it) | 1 | **0** |
| Uppercase micro-labels | 12 | **8** |
| Enclosed or differently-filled boxes | ~11 (4-sided borders on every key and effort cell) | **6**, all hairline strips |
| Touch targets under 44px | — | **0** |
| Pills / shadows | 0 / 0 | 0 / 0 |

A first attempt measured *worse* on height (528px) and I kept it only after removing a tinted
active-row fill (a fill the DNA forbids anyway), unboxing the benchmark note into a ruled band,
and tightening the rows. An intermediate "regions 15" reading was my own metric mismeasuring:
it counted `bg-bg` cells, which are the same colour as the ground, as separate regions.

**Behaviour proven, not assumed:** tapping Reps moves the keys to that row, `+2` takes reps
15 → 17, and the weight row stays at 0. The e2e spec now drives and asserts exactly that.

## Replication score: 8/10

Scored by comparing `design/refs/ours-landing/blueprint.md` against
`design/refs/dna-teenage-engineering/blueprint.md`. Minimum to ship is 8.

| # | Criterion | Score | Evidence |
|---|---|---|---|
| 1 | Nav height, position, scroll behaviour | 1 | Permanent labelled row, no scroll change, 0 CTAs in nav - same as the reference |
| 2 | h1 within 10% of reference | **0** | Reference display is 40px; ours is 56px. Deliberate: the reference is a product catalogue, ours has to carry a page title. Still far below the previous build's 88px |
| 3 | Section rhythm within 15% | 1 | 66px token, measured 66px on the reference |
| 4 | Primary button shape, height, label | 1 | Hard rectangle, radius 0, uppercase letterspaced label |
| 5 | Column count in the main layout | 1 | Table replaces the catalogue grid, same ruled-column structure |
| 6 | Imagery framing | 1 | 1:1, radius 0, unframed, edge-to-edge |
| 7 | Footer style and column count | **0** | Style matches (grid of tiny links on the dark band) but ours has 4 columns to the reference's 7, because there are fewer real destinations. Inventing three more would be worse |
| 8 | Ground and surface relationship | 1 | Near-white ground, one inverted band, flat throughout |
| 9 | Motion spec implemented | 1 | The conveyor is built, not a generic fade |
| 10 | "Same family" in three seconds | 1 | Both read as an industrial catalogue |

Measured parity: **cards 0 vs 0 · shadows none vs none · radius none vs 7.3px** (ours is
stricter than the reference) · **link type 16px/24px on both**.

## Ship gate

- [x] Seven pillars recorded with URLs opened this session
- [x] Zero hard-coded values outside DESIGN.md tokens
- [x] Light and dark both render
- [x] 360 / 768 / 1440 with no horizontal scroll
- [x] Contrast >= 4.5:1
- [x] Focus rings, 44px targets, full keyboard path
- [x] prefers-reduced-motion honoured
- [x] No banned typeface
- [x] Screenshot comparison against the reference, scored
- [x] Card count <= reference (reference = 0)
- [x] Ledger row appended
