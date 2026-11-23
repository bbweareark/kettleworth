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


## The style system, as built (23 Nov 2026)

What shipped, and what the per-style table above still describes rather than records.

**Built.** `data-style` on `<html>`, read on the server from a cookie so the first paint is
already in the member's world, with the profile as the record of record and a `styleLockedAt`
stamp. Three complete token worlds (ground, surfaces, rules, text ramp, radius ramp, fonts)
crossed with both lights, six combinations, all measured. Both signatures: Arc's impact frame
and struck figure on a committed set, Sanctuary's arch of wedge stones replacing the session
progress bar. A voice per world for the four places a member is addressed directly, so the
reward language changes and the coaching facts do not. A picker at `/app/style` that renders
each world in its own tokens and its own light rather than describing it, with the lock asking
before it moves anyone.

**Two things a token could not carry**, both written as one unlayered rule each: Arc's figure
weight, because Locomotive's single 400 is unreadable at arm's length as a load, and
Sanctuary's lining figures, because Young Serif defaults to old-style and a zero read as a
letter o. A third, `rounded-full`, needed the same treatment: Tailwind compiles it to a literal
`calc(infinity * 1px)` rather than to the radius ramp, so the pills could not take each
world's shape from a variable.

**Not built yet**, and still only described above: Arc's scattered-label screen head and
episode week, and Sanctuary's figure-inside-an-arch head. Those are per-surface compositions on
Today and Programme rather than token work, and they are the next piece.

**One fix the styles turned up.** The session screen never had the page gutter or the top
clearance every other screen gets from `Screen`: the console ran to the bezel on a phone and
the floating nav pill sat on top of the restart control. Both are now the same spine as
everywhere else.


## Arc's screen head and episode week, as built (23 Nov 2026)

**The head**, every screen, replacing the photograph-and-figure stack in Arc only. An L rather
than a stack, which is what Locomotive's own head does
(`design/refs/dna-locomotive/scrolled.png`): the date up and to the left with the episode
opposite it, a hairline, a hard-edged character top right, the screen's own name set
vertically down the left edge, the figure bottom left crossing the character on the diagonal,
a hairline, and the wordmark with an arrow in the bottom corner. Nothing is centred and
nothing is a card.

| Element | Measurement | From |
|---|---|---|
| Character | 270px phone / 340px desktop, right aligned, top aligned, at most 66% of the column | Locomotive's image block, which is never full bleed |
| Figure | `--text-figure`, bottom left, overlapping the character's lower edge | the through-line: one number, larger than anything else |
| Vertical label | `meta`, `writing-mode: vertical-rl`, bottom left | Locomotive's caps label beside its image |
| Rules | one above, one below, both hairline | Locomotive's own frame |
| Speed lines | six hairlines, drawn right to left behind the character | the one drawn mark this world adds |

**The episodes.** "Week ahead" becomes "The arc": every session numbered from the first one
ever completed, the current one inverted to the band colour and carrying the only red mark on
the screen, the rest listed as a chapter index with a hairline each and the metadata pushed
right. No cards, which is what the four-card grid it replaces was.

**Motion**, inside the two-signature budget and all of it gated by `useReducedMotion`: the
character arrives by a hard wipe from the right rather than a fade, the speed lines draw
themselves outward, each episode row wipes in left to right with a capped stagger, and the
current episode's red mark scales in last. None of it moves again once it has landed.

**Still not built:** Sanctuary's own head, where the figure sits inside a drawn arch. Carbon
and Sanctuary share the photograph head until then.
