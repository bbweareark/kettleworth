# SECTION-MAP: what each surface replicates

**Rewritten 27 Oct 2026 for the Path B revamp.** One row per surface, mapped to the reference
section it ports, with the values it must hit. Build against this file, not against memory.

## The through-line

Every screen answers one question with one number, rendered at `--text-figure` (96px) or
larger, with everything else as support type around it. That is the signature idea, and it is
the reason the DNA was chosen: Integrated Biosciences carves hierarchy by size, not weight.

| Screen | The one number | Supporting |
|---|---|---|
| Today | Load lifted this week | Session to do, readiness, streak |
| Session | The weight on the bar | Set track, reps, effort |
| Progress | Estimated max on the lift in view | Curve, history |
| Nutrition | Calories remaining today | Macro bars |
| Programme | Week number of the block | Day table |
| Community | Your Growth | Board |

## Surface map

| Surface | Replicates | Measured target |
|---|---|---|
| **App shell** | IB's rounded inset canvas over a darker ground (`dna-integrated-biosciences/desktop.png`) | Ground `#16191a`, content inset with `--radius-xl` at desktop, full-bleed on phone |
| **Navigation** | Clonix full-screen nav (`navbar-clonix`) for the overflow, triggered by a floating pill, the pill group is IB's and Get Ripe's | Trigger: 44px pill, top-right, floats over content. Open: full-screen, items at `--text-2xl`, one per row, thumb-reachable. **The five-tab strip stays** (h-16, volt disc on the current tab): it was removed for one build and the owner asked for it back, and it is one tap where the thumb already is. Desktop gets the same five as a pill group |
| **Today hero** | Lando Norris (`hero-lando-norris/scrolled.png`): full-bleed photograph bleeding edge to edge, the figure carried on black beneath it | Image 16:9 full-bleed, no border, no radius at the top edge. Figure at 96px directly under it, accent on the second line |
| **Primary action** | Get Ripe (`cta-get-ripe/mobile.png`): a filled pill in the nav, paired pills under the headline | Sticky bottom pill, 56px tall, `--radius-pill`, volt fill, ink text. Exactly one per viewport |
| **Session console** | 21st.dev Number Pad (`components-21st-numberpad`), kept, it is the only control that reaches every value | Figure at 96px, keypad 3×4, keys 56px, one commit |
| **Footer** | Decimals (`footer-decimals`), Bold | Oversized wordmark, few links, volt rule above |
| **Figures** | IB's display treatment | Antonio, tracking −0.03em at 96px, tabular. The label is the page's `h1`; an empty figure drops to `--text-2xl` rather than rendering a dash at 96px |

## Carried over unchanged

Not everything from the old system was wrong, and a revamp that throws away working parts to
look busy is its own failure:

- **The keypad.** It is the only weight control that reaches 0, 0.5, 1 and 137.5. Rethemed,
  not replaced.
- **`loadLadder()`** and the plate maths. Correct domain logic, now feeding the keypad's quick row.
- **One statement of the target**, the plain-word effort scale, and the set track reading
  "done / now / to come". Those were comprehension wins, not styling.

## Deliberate deviations from the references

| Deviation | Why |
|---|---|
| Accent is chartreuse `#ccff1a`, not IB's pale lime `#cef79e` | IB's is a biological signal at low chroma; this product needs a floodlit one. Lando Norris and Get Ripe both land on high-chroma yellow-green for performance |
| Two display sizes (96/132px), not IB's six above 58px | A phone-first product. The reference is a desktop marketing site |
| Section gap 56px on phone, against the reference's 80–120px | Same reason |
| Pill buttons, where IB uses 8px radius | Taken from Get Ripe and Lando Norris, both of which use pills for actions; IB's own CTA is a pill pair too |


## Built, 27 Oct 2026

Every row above is implemented and verified against a running server (see the verification log
in `UI-DECISIONS.md`). Two deviations were added during the build and are recorded in the
table: the tab strip stays alongside the full-screen menu, and the hero renders as a sibling of
the content column rather than inside it, because a negative gutter cannot reach the canvas
edge on a wide screen.


---

# Style system: section map (23 Nov 2026)

Three worlds, one app. A style never changes the information architecture, the routes or the
through-line (one number per screen, one action per viewport); it changes the surface that
number lives on. Carbon is shipped and signed off and appears here unchanged for comparison.

| | **Carbon** *(shipped)* | **Arc** *(new, lead)* | **Sanctuary** *(new)* |
|---|---|---|---|
| DNA | Integrated Biosciences | **Locomotive** + Charlie's red wall | **Structured** |
| Ground | ink `#16191a`, dark | **paper `#ffffff`, light** | **putty `#c4c3b6`, warm** |
| Type | Antonio condensed | one grotesk, **weight 400 only** | a classical serif |
| Hierarchy | size + negative tracking | **size and white space alone** | size + a drawn arch |
| Radius | 8/12/18/28 + pills | **0 everywhere** | 0 on surfaces, pill on actions |
| Accent | volt, on small elements | **alarm red, full-bleed only** | aged gold, hairline only |
| Figure | 96px on ink | **70–110px on paper** | 94px inside an arch |
| Signature | the load is the largest thing | **a set lands** | **the arch fills** |

## What each surface becomes, per style

| Surface | Carbon | Arc, ported from Locomotive | Sanctuary, ported from Structured |
|---|---|---|---|
| **Screen head** | full-bleed photo, figure beneath | **labels scattered around a hard-edged portrait image** (`dna-locomotive/scrolled.png`: "Seven Years" above-left, "Running" offset lower-left, the date right of the image, a hairline rule and an arrow bottom-right), not a stack | figure centred inside a drawn arch on putty |
| **Set track** | pills, volt on the live one | **boxed hairline caps cells**, the `OPS|DES|DEV` device from the hero capture | stone tablet cells, ruled |
| **Set committed** | toast | **impact frame: the screen takes a full-bleed alarm-red slide for 280ms**, Locomotive's blood-red field used as an event, not a colour | the arch gains one filled segment |
| **Nav** | tabs + floating pill | **comma-separated run** ("Work, Agency, Careers, Store"), tabs kept at the thumb | tabs, labels in small caps |
| **Row device** | hairline + arrow | **hairline rule above a right-set label with an arrow** | hairline + arch tick |
| **Rest** | the new rest screen, below | same screen, ink on paper | same screen, warm |

## The rest period, rebuilt (all styles)

The owner's verdict on the rest deck was "its bad and we need to replace that completly", and
on the session "the ui is a lot confusing". Both come from the same cause: the rest screen is
an arcade. Five tabs, Rush, Quiz, Breathe, Call it and Tip, of unrelated content, none of which
is what a person actually needs while resting, and a tab bar inside a screen that already has
a tab bar.

**It is replaced by one screen with one job: what is next, and when to go.**

| Row | What it is | Why it earns the space |
|---|---|---|
| The clock | the countdown, the largest thing on the screen | the only question rest actually asks |
| Next up | the next set stated once - weight, reps or seconds, effort | so nobody has to remember it |
| On the bar | what to load for that weight | the one piece of maths worth doing for someone |
| Breathe | a single optional guided breath, the default content, no tab | slower breathing drops heart rate between sets; it is the one thing on the old deck that was real |

Everything else goes: no quiz, no word game, no prediction, no rotating tips, no tab bar.
Growth still accrues from training, not from playing a game during it.

**As built (23 Nov 2026), with two deviations from the row table above:**

- **On the bar is words, not the plate glyph.** The glyph reads plates by relative height,
  which says nothing when the answer is one plate a side, and the console two rows below the
  clock already draws it. The rest screen says "On the bar: 20 kg a side".
- **Breathe is not a control.** It is a square in the support ramp that grows on the way in and
  shrinks on the way out, with the word under it, and nothing to press. Drawing it in the
  accent made a second volt shape the size of the clock, which competed with the clock; the
  accent on this screen belongs to the figure.

Two things the screen could not state before were fixed underneath it, because the next set
had nothing to show: `repUnitFor` now decides whether a movement is counted in reps or held in
seconds, and a set that lands on target carries its weight onto the sets that remain. The
first session of a block prescribes no load at all, so until that carry existed every set
asked for the weight again from zero.
