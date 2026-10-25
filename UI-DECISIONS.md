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

**Plate Drill** — the rest-period game, `packages/core/src/plate-drill.ts` (11 tests).
Target weight and a bar; load one side from the rack. Three constraints shaped it:

- *It must not compete with training.* It only exists inside a running rest timer, the clock
  stays on screen above it, and Growth is capped at six solves per session (30 points against
  a session's 100). The cap is enforced in SQL at the point the points are counted, not just
  in the UI, so it cannot be farmed.
- *It must calm, not spike.* No round timer, no penalty, no losable streak. The only clock is
  the rest clock that was already running.
- *It should make you better at the thing.* Racking a bar quickly is a real gym skill, so the
  game is the skill.

## Verification log — Plate Drill on production

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

### Not covered

The cap is enforced per session. Solves spread across several sessions each get their own
allowance, which is intended, and was verified locally but not on production.

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
