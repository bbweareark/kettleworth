# SECTION-MAP — the replication contract

Every section of the rebuild, mapped to the reference section it replicates, with the measured
values it must hit. Reference measurements come from `design/refs/*/blueprint.md`.

## Marketing page

| # | Our section | Replicates | Reference measurement | Our value |
|---|-------------|-----------|----------------------|-----------|
| 1 | Nav | teenage.engineering nav | permanent row of 5 labelled groups, 25 links visible, **0 CTAs**, link 16px w100, nav bg transparent, no border, no blur, no scroll change | Same: 4 labelled groups + sub-links, no CTA in nav, 14px w400 (readability), transparent, no scroll morph |
| 2 | Hero | teenage.engineering catalogue grid | cells edge-to-edge, **0 cell padding**, radius 0, 1:1 images, label beneath each cell at 19px w300 | **The week as a table.** 7 day-rows, column heads 12px uppercase, heavy rule under head, hairline between rows, zero padding on the number columns |
| 3 | Conveyor | figureandplot.com input→output track | horizontal track of uniform tiles, one quiet label per group, centre node fixed | Block weeks as a horizontal track under a fixed NOW marker. One signature moment |
| 4 | Method | teenage.engineering ruled bands | hairline `#e5e5e5` rules organise content into bands; **no background fills, no cards** | Numbered editorial index 01–04, hairline between, type-led. **Zero cards** |
| 5 | Proof band | teenage.engineering dark band `#0f0e12` | one inverted band acting as a display-case wall | Full-bleed dark band, one sentence, one image at 1:1 unframed |
| 6 | CTA | tines.com button pair | primary filled + secondary outlined, identical size, label uppercase 13px w700 | Same pairing, radius 0 instead of 990px, accent fill |
| 7 | Footer | teenage.engineering footer | 7 columns, 96px tall, 7 tiny links, dark band, largest text 19px w300 | 4 columns of small links on the dark band, 12px meta heads. **No giant wordmark** |

## App surfaces — one language, applied

Every app screen is the same atom: **a ruled row with a numbered margin**. No cards anywhere.

| Surface | Composition |
|---|---|
| Today | Date line, then the session as a **table**: margin number, exercise, sets x reps, target load. Heavy rule under the head. One primary action. |
| Programme | The block as the **conveyor** (weeks across, NOW marker fixed), then this week as ruled day-rows. |
| Session player | The set list as a table; the active row inverted to the dark band. Entry is a row, not a card. |
| Progress | Lifts as a ruled table sorted by the number that matters; charts are hairline, no fills. |
| Nutrition | Targets as a table of numbers; the day's log as ruled rows. |
| Coach | Letters as a dated ruled list; the reading view is a measure-capped column. |
| Community | Ruled list of people and groups, no avatar cards. |
| Settings | Ruled rows, label left, control right. |
| Onboarding | One question per screen, left-aligned, progress as a rule that fills. |

## Score targets (`references/replication.md`)

Nav height within 8px · display within 10% · section rhythm within 15% · button shape class
identical · same column count · imagery framed the same · footer style and column count ·
ground/surface relationship · motion spec implemented · "same family" in three seconds.
Minimum 8/10 to ship.

## Set console, second pass — ported from 21st.dev Unit Field

| What | Reference (Unit Field, arikchakma) | Measured target here |
|---|---|---|
| Quantity | One labelled row per quantity, never a side-by-side split | `WEIGHT` row, `REPS` row |
| Unit | Lives **inside** the value (`200px`, `0°`), never a caption beneath | `0 kg`, `15 reps` |
| Label | Quiet, fixed left column; value right-aligned tabular | `meta` left, `font-display tabular` right |
| Rows | Separated by hairline rules, zero fills | `border-b border-rule` |
| Keys | — (Unit Field scrubs; a scrub fights a scrolling page on touch) | Key row sits **under the selected row**, so position says what it drives |

**Why this replaces the previous pass.** The Number Pad port fixed height (579px → 494px) but not
comprehension. Measured on a phone the console carried 16 interactive controls, 11 bordered
regions and 12 uppercase micro-labels, and it stated the same target three times in three
dialects: `SET 2 OF 3 · TARGET 12 TO 15 @ 9`, `REPS · AIM 12 TO 15`, and `RPE 9`. The weight
and reps figures sat either side of a 19px `×` at 40px each, so neither dominated, and which
one the keys drove was signalled only by 45% opacity.
