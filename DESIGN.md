# Kettleworth: DESIGN.md

**Rewritten 27 Oct 2026.** Path B full revamp. The owner judged the previous direction wrong
("the direction is wrong, redesign it completely"), so this replaces the teenage engineering
system entirely: new DNA, new typefaces, new ground, new composition. See `design/CONCEPT.md`
for why the old one could not be fixed by changing screens.

**DNA: Integrated Biosciences**, "bioluminescent laboratory at midnight", ported from
https://styles.refero.design/style/80099f79-72b7-4367-b2e9-6a3d4a3e9e6a and the live site
https://integratedbiosciences.com (`design/refs/dna-integrated-biosciences`).

What the reference actually does, measured and seen: a near-black canvas, restrained white
type, and a single high-chroma accent that activates **only on small interactive elements**.
The entire type system runs at one weight, hierarchy is carved by **size and tightening
negative tracking**, which is what makes 111px and 158px display lines read as architecture
rather than decoration. Surfaces are flat, no shadows, no gradients, hairline borders do the
delineation. The page sits as a rounded inset canvas, and the nav floats over the imagery as a
pill group.

That method is why it was chosen: *hierarchy by size* is the mechanism this product needs,
because the one memorable idea is **the load is the largest thing on every screen**.

---

## Colour

Near-black with a cool undertone, exactly as the reference specifies; the accent is flipped
from the reference's bioluminescent lime to an electric chartreuse, because two independent
references for this product's category (Lando Norris, Get Ripe) both land on high-chroma
yellow-green on near-black as the *performance* language.

| Token | Value | Role |
|---|---|---|
| `--kw-ink` | `#16191a` | Page ground. Near-black, cool undertone. Not pure black |
| `--kw-ink-raised` | `#1e2223` | Raised surface: sheets, dialogs, the session console |
| `--kw-void` | `#000000` | True black. Footer anchor and full-bleed image letterboxing only |
| `--kw-chalk` | `#f4f5f2` | Primary text on ink. Warm off-white, never pure white |
| `--kw-graphite` | `#8b9391` | Secondary text, metadata, muted labels. 5.9:1 on ink |
| `--kw-hairline` | `#2c3133` | Hairline borders and dividers |
| `--kw-hairline-strong` | `#434a4c` | Emphasised rule, focused field edge |
| `--kw-volt` | `#ccff1a` | **The accent.** Electric chartreuse. Only where effort is: the live set, the one action, the figure being changed |
| `--kw-volt-ink` | `#16191a` | Text on a volt fill |
| `--kw-bone` | `#f4f5f2` | Light-mode ground (daylight, same composition) |

**Contrast, measured against `#16191a`:** chalk 15.6:1 · graphite 5.9:1 · volt 14.8:1. Every
pairing clears AA for body text; volt on ink clears AAA.

**The accent is rationed.** It marks the current set, the live figure, and the single primary
action. If more than one volt element is visible at a time, something is wrong.

## Type

Two families, which is what the reference uses (a display/body face plus a mono for technical
labels). Self-hosted latin subsets, **79KB total**, under the 120KB budget.

| Role | Family | Licence | File | Use |
|---|---|---|---|---|
| Display + figures | **Antonio** variable 100–700 | OFL | `antonio-variable.woff2` (26.5KB) | Every number that matters, every headline. Condensed, so a 5-digit load still fits a phone at display size |
| Text + UI | **Geist** variable 100–900 | OFL | `geist-variable.woff2` (29.3KB) | Body, labels, buttons |
| Technical | **Geist Mono** variable | OFL | `geist-mono-variable.woff2` (23.1KB) | Counters, timers, set markers, metadata |

None is on the ban list. None is used by another app in this portfolio (checked against 11:
archivo expanded, newsreader, bespoke slab, big shoulders display, bricolage grotesque, source
serif 4, clash display, syne, switzer, host grotesk, nippo, martian mono).

**Antonio replaces Archivo Expanded** because the signature idea is a huge number: condensed
display keeps a four- or five-character load legible at 96px on a 390px screen, which an
expanded face cannot.

### Scale: carved by size, tightened by tracking

Ported from the reference's own ramp (16 → 158px, tracking −0.001em → −0.03em), compressed at
the top for a phone-first product.

| Token | Size | Line height | Tracking | Use |
|---|---|---|---|---|
| `--text-2xs` | 11px | 1.2 | 0.08em | Micro labels, uppercase |
| `--text-xs` | 13px | 1.3 | 0.01em | Metadata |
| `--text-sm` | 15px | 1.4 | 0 | Secondary body |
| `--text-base` | 17px | 1.45 | −0.001em | Body |
| `--text-lg` | 21px | 1.3 | −0.006em | Lead |
| `--text-xl` | 27px | 1.2 | −0.01em | Section head |
| `--text-2xl` | 36px | 1.15 | −0.015em | Screen head |
| `--text-3xl` | 52px | 1.05 | −0.02em | Hero line |
| `--text-figure` | 96px | 0.95 | −0.03em | **The load.** One per screen |
| `--text-figure-xl` | 132px | 0.92 | −0.035em | The load, when it is the only thing |

## Shape, spacing, elevation

The reference uses **real radius**, this is the sharpest break from the old system, which was
radius 0 everywhere.

| Token | Value | From |
|---|---|---|
| `--radius-sm` | 8px | reference: buttons 8px |
| `--radius-md` | 12px | reference: nav 12px |
| `--radius-lg` | 18px | reference: cards 16–20px |
| `--radius-xl` | 28px | reference: large cards 40px, reduced for phone |
| `--radius-pill` | 9999px | reference: tags 9999px. Buttons are pills here |
| Base unit | 4px | reference |
| Section gap | 56px phone / 96px desktop | reference: 80–120px |
| Page max | 1200px | reference |
| Shadow | none | reference: no shadows, no gradients |

Surfaces are flat. Separation comes from the raised ink value and hairlines, never from a drop
shadow or a blur.

## Motion

`motion/react` only, every entrance gated by `useReducedMotion()`.

- **Signature 1, the counting figure.** When a load or a total changes, the figure counts to
  it rather than snapping. The number is the subject of the design, so it is the thing that
  moves.
- **Signature 2, the edge-to-edge image reveal.** Photography enters by unmasking from the
  bottom edge, never by fading.

Everything else is a 150ms colour transition. No scroll-reveal on everything, five apps in
this portfolio already do that.

## What is banned here

No card grids of three. No gradient headlines. No glassmorphism. No drop shadows. No stock
illustration and no 3D icon set: the product's own photography and its own figures are the art.
Never the word "AI" in user-facing copy, the engine, the evidence base, or your coach.


---

# The style system (23 Nov 2026)

Three surfaces, one app. **Carbon is the default and is unchanged**, the owner signed it off
and nothing above this line moves. A style is chosen once and locked; see
`design/CONCEPT.md` for why.

Fonts are declared per style and a browser never downloads an `@font-face` it does not render,
so each style stays inside the 120KB budget on its own rather than the three of them together.

| Style | Display | Text | Payload |
|---|---|---|---|
| Carbon | Antonio variable (26.5KB) | Geist + Geist Mono (52.4KB) | **79KB** |
| Arc | Darker Grotesque variable 300–900 (23KB) | Schibsted Grotesk variable 400–900 (45KB) | **68KB** |
| Sanctuary | Young Serif (18KB) | Schibsted Grotesk (45KB) | **63KB** |

All OFL. None on the ban list. None used by another app in this portfolio, checked against
archivo expanded, newsreader, bespoke slab, big shoulders display, bricolage grotesque, source
serif 4, clash display, syne, switzer, host grotesk, nippo, martian mono, prata, caprasimo,
cormorant garamond and literata.

## Arc: re-founded on Agence Foudre (23 Nov 2026)

The first Arc was ported from Locomotive: Swiss, whisper-weight, zero accent, hierarchy from
white space. The owner's verdict was that it looked weak and amateur, and he was right about
the cause rather than the execution. Locomotive is a beautiful DNA for a studio portfolio and
the exact opposite of a power-up; a world about effort cannot be built on restraint.

DNA now: **Agence Foudre** (https://styles.refero.design/style/c1534c74-f7b8-44de-a913-586d0f78fb08,
live at agencefoudre.com, captured in `design/refs/dna-agence-foudre`). What is taken is its
typographic language, not its palette: ultra-black display type at a 0.7 line-height set as
dense blocks that own the viewport, almost no chrome, and colour used as emotional punctuation
rather than as decoration. Foudre is magenta and forest green on cream; Arc is ink and one
hot red.

| Token | Value | Role |
|---|---|---|
| `--kw-bg` (night) | `#0a0a0a` | the ground. Not pure black: a manga page is printed, not void |
| `--kw-fg` (night) | `#ffffff` | all type |
| `--kw-accent` (night) | `#ff2d1f` | the energy: the live figure, rules, the primary block. 5.32:1 as text on ink, and it carries ink at 6.0:1 |
| `--kw-accent` (day) | `#d61a0f` | the same red taken down: `#ff2d1f` is 3.72:1 on paper and fails as a label |
| `--kw-charge` | `#ffd34d` / `#c98a00` | the white-hot core of an aura. Never text, only inside a charge |
| `--kw-impact` | `#ff2d1f` | the burst. Flash, speed lines, ring, field |
| radius | `0` everywhere | a panel has corners, pills included |

Type: **Anton** (12KB, OFL) for display, **Schibsted Grotesk** (45KB) for language, so Arc's
payload is **57KB**, down from 68. Foudre's minor third from a 15px base, with the top of the
ramp compressed for a phone and its tight leading opened where two lines actually meet:

| Token | Size | Line height |
|---|---|---|
| `--text-figure` | 96px | 0.72 |
| `--text-4xl` | 56px | 0.86 |
| `--text-3xl` | 44px | 0.92 |
| `--text-2xl` | 30px | 1.0 |
| `--text-base` | 15px | 1.45 |

Tracking is `0` at every size: an ultra-black face needs no negative tracking, the weight does
the work. Caps are applied per surface, never globally, because a world where everything
shouts has no emphasis left.

**Effects** (`components/style/arc-fx.tsx`, keyframes in `tokens.css`). Transform and opacity
only, no filters and no layout, so they run on the compositor:

| Effect | What it does | Where |
|---|---|---|
| `Aura` | two radial fields breathing out of phase, embers rising, four lightning strokes flickering | behind the character: idle between sets, charging through rest, white hot on the set |
| `Burst` | white flash, 36 speed lines thrown from the middle, an expanding charge ring, the red field | a set landing |
| `Shake` | the screen takes the hit, 420ms, stepped | the same moment |
| `Slam` | the title thrown in from above on a spring, under a `-6deg` lean | both full-screen cards |

## Sanctuary: ported from Structured

DNA: **Structured** (https://styles.refero.design/style/6c0b77d3-71f9-469d-98aa-4ce1d6d76ac8),
"Renaissance gallery on putty paper". Warm daylight stone, the opposite of Carbon's midnight
and of Arc's hard ink.

| Token | Value | Role |
|---|---|---|
| `--sanct-putty` | `#c4c3b6` | the ground, the gallery wall |
| `--sanct-bone` | `#e7e5e4` | raised surfaces |
| `--sanct-vellum` | `#dfdcd5` | hairlines, read as a printed page edge |
| `--sanct-graphite` | `#595855` | secondary text, warm, never pure black |
| `--sanct-ink` | `#1a1a18` | primary text |
| `--sanct-gold` | `#8a6d3b` | the single accent, hairline and small marks only |

**Chosen against walkwithme**, which is the owner's actual faith app: that one is dusk indigo,
Bricolage Grotesque and Literata, an illustrative footer and a lamp on a path. Sanctuary is
daylight stone, Young Serif, and an arch. Nothing is shared.
