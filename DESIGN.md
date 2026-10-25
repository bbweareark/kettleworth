# DESIGN.md

The only source of design values for Kettleworth. Every value below is **measured** from the
reference pack in `design/refs/`, not recalled. Composition lives in
`design/reference/COMPOSITION.md`; it outranks this file, because tokens are the least of the
design. Picks and sources: `UI-DECISIONS.md`. Concept: `design/CONCEPT.md`.

## DNA

- Source: **teenage engineering — "industrial catalogue under studio light"**
  https://styles.refero.design/style/aecf9dda-5cba-4dc7-9e73-59b65d895cdf
  Live site measured at https://teenage.engineering → `design/refs/dna-teenage-engineering/`
- Secondary: none. One DNA.
- Tone: **exacting · plainspoken · industrial.** It is *not* cinematic.
- Signature idea: **the whole app is one continuous ruled training sheet.**

## Colour

Five neutrals and exactly one chromatic note, as the reference rations them. A sixth colour
only ever means a state.

| Token | Light ("Sheet") | Dark ("Carbon") | Use |
|---|---|---|---|
| `--kw-bg` | `#F6F8F7` | `#0F0E12` | Ground. Cool, not warm paper |
| `--kw-surface` | `#F6F8F7` | `#141318` | Same as ground: surfaces are ruled, not filled |
| `--kw-surface-2` | `#EFF1F0` | `#191820` | The one recessed step, used sparingly |
| `--kw-band` | `#0F0E12` | `#F6F8F7` | The inverted band, a display-case wall |
| `--kw-fg` | `#000000` | `#F1F2F2` | Body and headings |
| `--kw-fg-muted` | `#5A5A5A` | `#A9A9AD` | Secondary text (>=4.5:1 on ground) |
| `--kw-fg-subtle` | `#8A8A8A` | `#76767C` | Meta, column heads |
| `--kw-rule` | `#E5E5E5` | `#2A2930` | Hairline. The structural element of the whole system |
| `--kw-rule-strong` | `#000000` | `#F1F2F2` | The one heavy rule that carries the eye |
| `--kw-accent` | `#A8431A` | `#D98049` | **The single chromatic note.** 7.4:1 on the light ground |

Status is not decoration and never borrows the accent:
`--kw-done #1F6B4A` / `--kw-attention #8A5D0F` / `--kw-danger #96231C` / `--kw-rest #3A5A77`
(dark: `#5FA880` / `#C9A227` / `#D4706A` / `#7FA3C0`)

## Typography

- One family: **Archivo** (Google Fonts, OFL, free for commercial use), variable on both
  axes - weight 100-900 and width 62-125%. Self-hosted, **34KB**, one file.
  The width axis gives the expanded display cut without a second family.
- Display uses `font-stretch: 112%` and weight 300. Text sits at width 100%.
- Tabular figures (`font-variant-numeric: tabular-nums`) on every number: the product is a
  table and the columns must line up.

Measured from the reference, then adapted:

| Token | Size / weight / line-height | Use |
|---|---|---|
| `--text-display` | `clamp(2rem, 4.2vw, 3.5rem)` / 300 / 1.08 | Page titles. Compact on purpose |
| `--text-h2` | 26px / 300 / 1.11 | Section heads |
| `--text-h3` | 19px / 400 / 1.15 | Row titles, nav |
| `--text-body` | 16px / 300 / 1.5 | Running copy |
| `--text-sm` | 14px / 400 / 1.4 | Dense rows, table cells |
| `--text-meta` | 12px / 500 / 1.11, `0.08em`, uppercase | Column heads, overlines |

**Deviation, recorded:** the reference runs body at 13px weight **100**. That is a hairline on
a studio-lit catalogue read at a desk. Kettleworth is read one-handed in a gym, mid-set, so
body sits at 16px/300 and the floor is 12px/500. The wire-like register is kept through width
and rules rather than through an unreadable weight. Display stays compact (max 56px) exactly
as the reference does; the previous build's 88px hero is gone.

## Spacing

Measured: section gap **66px**, element gap **15px**, max width **1200px**, cell padding **0**.

| Token | Value |
|---|---|
| `--gap-section` | `66px` (phone `40px`) |
| `--gap-element` | `15px` |
| `--row-h` | `44px` minimum, the sheet's line height |
| `--measure` | `62ch` |
| `--content-max` | `1200px` |
| `--gutter` | `max(16px, env(safe-area-inset-left))` |

## Shape and elevation

```
--radius: 0;        /* every component, no exceptions */
--shadow: none;     /* elevation is a dark band, never a shadow */
```

Measured on the reference: radius 0px, shadows none, 0 gradient surfaces, 0 blur blobs,
**0 card-like surfaces on the entire page**. Kettleworth matches all five.

Depth comes from three rule weights only:
`--rule-hair 1px var(--kw-rule)` / `--rule-half 1px var(--kw-fg-subtle)` /
`--rule-heavy 2px var(--kw-rule-strong)`

## Components

- **Button** - hard rectangle, radius 0, height 44px (`sm` 36, `lg` 52), padding 10px/20px.
  Label **uppercase, 12px, weight 600, letter-spacing 0.08em** (label treatment measured from
  Tines; the pill it sits in is rejected). Primary: accent fill, ground-coloured text.
  Secondary: 1px rule, no fill, identical size. Tertiary: underline only.
- **Row** - the atom. 44px minimum, hairline rule beneath, a numbered margin on the left,
  content left-aligned, numbers right-aligned and tabular. Not a card.
- **Table** - column heads in `--text-meta`, a heavy rule under the head, hairlines between
  rows, no zebra striping, no container.
- **Image** - 1:1 or 3:2, radius 0, no frame, no padding, run to the grid edge.
- **Focus ring** - `2px solid var(--kw-accent)`, 2px offset. Visible on both grounds.
- **Touch target** - 44px minimum on everything interactive.

## Motion

The reference has **0 animations and 4 transitions**. Kettleworth is nearly as still.

```
--ease: cubic-bezier(.2, 0, 0, 1);
--dur-fast: 120ms;  --dur-base: 200ms;
```

- No scroll-reveal spine. Five of the six apps in this portfolio already use one.
- **One signature moment:** the block conveyor - the weeks of the training block as a
  horizontal track that scrolls under a fixed "now" marker (ported from Figure&Plot).
- State changes only: hover rules darken, the current row's margin number fills.
- Everything neutralised under `prefers-reduced-motion: reduce`; the conveyor becomes a
  static strip with the current week marked.

## Icons and imagery

- **Flat line only**, Lucide at 1.5px, 16-18px. No 3D icon family: the reference has no
  illustration at all and a glossy 3D set would break the register. Recorded as a deliberate
  deviation from the usual pillar-5 pick.
- **Imagery**: the product's own exercise photography, cropped square, unframed, edge-to-edge,
  used sparingly as a full-bleed band. No photo cards, no rounded corners, no scrims except
  where type sits over an image.
