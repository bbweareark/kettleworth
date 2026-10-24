# DESIGN.md

The single source of truth for Kettleworth's design values. Nothing in the codebase defines a
colour, size, radius, shadow or duration outside this file and its implementation in
`packages/ui/src/styles/tokens.css`. See `UI-DECISIONS.md` for the references behind each
pillar.

## DNA

- Primary source: **ORYZO AI — "Darkroom product editorial"** —
  https://styles.refero.design/style/1f204e95-454a-437e-845b-c1b169d35607
- Secondary: none. One DNA, carried everywhere.
- Tone: **disciplined, warm, exacting**
- Platform: web (installable PWA), phone-first

**What we took:** the warm near-black canvas with exactly one chromatic surface step above it;
cream rather than white type; hairline and dashed dividers instead of boxes; depth from the
surface stack, never from drop shadows; uppercase 500-weight micro-labels against one
mixed-case body voice; generous negative space with the subject floating in warm darkness.

**Where we depart, deliberately:** ORYZO forbids its ember on buttons because it is a product
showcase with no primary action. Kettleworth is a training app whose whole point is a primary
action, so ember *is* the primary-action colour here, and appears on nothing else. The
Kettleworth ember (a sandier oklch 76% 0.085 68) stays as-is: existing brand beats borrowed
identity.

## Colour

Implemented as `--kw-*` CSS custom properties, exposed to Tailwind v4 as `--color-*`.

| Token | Dark ("Iron") | Light ("Chalk") | Use |
|---|---|---|---|
| `--color-bg` | `oklch(11.5% 0.012 58)` | `oklch(97.5% 0.006 78)` | Page ground. Warm near-black, never pure black |
| `--color-bg-elevated` | `oklch(14% 0.014 58)` | `oklch(99% 0.003 80)` | Raised page areas |
| `--color-surface` | `oklch(17% 0.016 55)` | `oklch(99% 0.003 80)` | Cards, panels. The one chromatic step above ground |
| `--color-surface-2` | `oklch(21% 0.018 52)` | `oklch(95% 0.006 80)` | Hover / nested surface |
| `--color-surface-3` | `oklch(26% 0.020 50)` | `oklch(91% 0.007 80)` | Overlays, popovers, sheets |
| `--color-border` | `oklch(100% 0 0 / 0.07)` | `oklch(0% 0 0 / 0.07)` | Hairlines |
| `--color-border-strong` | `oklch(100% 0 0 / 0.14)` | `oklch(0% 0 0 / 0.14)` | Emphasised dividers, dashed rules |
| `--color-fg` | `oklch(94% 0.012 72)` | `oklch(20% 0.01 60)` | Primary text. Warm cream, never `#fff` |
| `--color-fg-muted` | `oklch(70% 0.012 72)` | `oklch(46% 0.01 60)` | Secondary text (≥4.5:1 on ground) |
| `--color-fg-subtle` | `oklch(56% 0.012 72)` | `oklch(58% 0.01 60)` | Captions, overlines (≥4.5:1) |
| `--color-fg-inverse` | `oklch(12% 0.005 60)` | `oklch(98% 0 0)` | Text on accent fills |
| `--color-ember` | `oklch(76% 0.085 68)` | `oklch(58% 0.10 62)` | **Primary actions only** |
| `--color-ember-hover` | `oklch(81% 0.085 70)` | `oklch(53% 0.10 62)` | Primary action hover |
| `--color-ember-soft` | ember @ 12% | ember @ 10% | Accent wash behind active state |
| `--color-signal` | `oklch(74% 0.075 150)` | `oklch(55% 0.09 150)` | Done, success, PR |
| `--color-amber` | `oklch(78% 0.09 82)` | `oklch(64% 0.11 80)` | Missed, caution |
| `--color-rose` | `oklch(66% 0.11 22)` | `oklch(55% 0.13 22)` | Danger, overreach |
| `--color-sky` | `oklch(74% 0.06 232)` | `oklch(56% 0.08 236)` | Rest, recovery, neutral info |
| `--color-series-1…6` | see tokens.css | see tokens.css | Chart series only |

Dark is the default and is designed first. Light is re-picked, not inverted: the accent drops
to 58% lightness so it stops vibrating on a pale ground.

**Rule:** ember on a non-action is a bug. Status colours (signal/amber/rose/sky) are for state,
never for actions.

## Typography

- Display: **Inter Tight** — 600. Tracking `-0.025em`, tightest `-0.04em` at hero scale.
- Text: **Inter** — 400/500/600.
- Mono: **JetBrains Mono** — weights/reps/load readouts only.

| Token | Size / line-height / tracking | Use |
|---|---|---|
| `--text-hero` | `clamp(2.75rem, 9vw, 5.5rem)` / 0.92 / -0.04em | Landing hero only |
| `--text-5xl` | 4rem / 1 / -0.04em | Page display |
| `--text-4xl` | 3rem / 3.25rem / -0.025em | Section heads |
| `--text-3xl` | 2.25rem / 2.5rem / -0.025em | Sub-sections |
| `--text-2xl` | 1.75rem / 2.125rem / -0.025em | Card titles |
| `--text-xl` | 1.375rem / 1.75rem | Lead-in |
| `--text-lg` | 1.125rem / 1.625rem | Body large |
| `--text-base` | 1rem / 1.5rem | Body |
| `--text-sm` | 0.875rem / 1.25rem | UI, nav, labels |
| `--text-xs` | 0.75rem / 1rem | Meta |
| `--text-2xs` | 0.6875rem / 1rem | Overlines (uppercase, 600, `0.14em`) |

Measure capped at 45–70 characters (`--measure: 62ch`). Headlines carry `text-wrap: balance`.
The overline (`.eyebrow`) is the DNA's uppercase micro-label and is the only uppercase text.

## Spacing

Base unit 4px. Ramp: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 160.

| Token | Value | Use |
|---|---|---|
| `--section-y` | `clamp(4rem, 10vw, 9.5rem)` | Marketing section rhythm (64→152px) |
| `--app-section-y` | `clamp(1.25rem, 4vw, 2rem)` | In-app stack rhythm |
| `--gutter` | `max(1rem, env(safe-area-inset-left))` | Page gutter; never below 16px on phone |
| `--measure` | `62ch` | Prose width cap |
| `--content-max` | `72rem` | Content column |

## Radius & elevation

`--radius-sm 4px` · `md 6px` · `lg 8px` · `xl 12px` · `2xl 16px` · `3xl 20px` · `full 9999px`.
Containers never go below `--radius-xl` (12px): the geometry is deliberately chunky.

**Lane: crisp hairlines, not soft elevation.** Depth comes from the surface stack
(`bg → surface → surface-2`) plus a 1px inset top highlight. The two shadow tokens that remain
are reserved for genuinely floating layers:

- `--shadow-pop` — popovers, sheets, the scrolled nav pill.
- `--shadow-glow` — the single primary action, and nothing else.

`--shadow-card` is now a hairline + inset highlight with no blur, per the DNA's "no drop
shadows on cards".

## Motion

```
--ease-out:    cubic-bezier(.16, 1, .3, 1)       /* entrances, reveals */
--ease-in-out: cubic-bezier(.65, 0, .35, 1)      /* state changes */
--ease-spring: cubic-bezier(.34, 1.56, .64, 1)   /* one accent use only */
--dur-fast: 150ms   --dur-base: 240ms   --dur-slow: 420ms   --dur-hero: 600ms
```

- Page spine: **reveal on enter** — 20px translate + fade as a section crosses ~15% of the
  viewport, via `IntersectionObserver`, revealed once and never re-hidden.
- Signature moments (max 2, landing page only):
  1. **Hero line reveal** — the headline's three lines clip-mask up, staggered 70ms.
  2. **Ember sweep on the pre-footer CTA** — a slow warm gradient drift behind the closing ask.
- Micro-interactions 120–200ms. Stagger 60–70ms, capped at 6 items.
- `transform` and `opacity` only. Never animate width/height/top/left/margin/box-shadow.
- Everything is neutralised under `prefers-reduced-motion: reduce`, and reveal elements start
  **visible** so content reads with JS disabled or before hydration.

## Components

- **Button** — height 44px (`sm` 36, `lg` 52), padding 16–28px, label `--text-sm` 600,
  radius `--radius-lg`. States: rest · hover (≤2px lift) · active (0.98 scale) ·
  focus-visible · disabled · loading. One filled ember button per viewport; everything else is
  `secondary` (surface + hairline) or `ghost`.
- **Input** — height 44px, 1px `--color-border`, focus ring as below, `--radius-lg`.
- **Card** — `--color-surface`, 1px `--color-border`, `--radius-2xl`, padding 16–24px,
  `--shadow-card` (hairline + inset highlight, no blur).
- **Divider** — 1px `--color-border`. Section separators on the landing page use the DNA's
  1px **dashed** rule in `--color-border-strong` (`.rule-dashed`).
- **Focus ring** — `2px solid var(--color-ember)`, 2px offset. Visible on both themes.
- **Touch target** — ≥44px on every interactive element.

## Icons

- Inline UI: **Lucide**, 1.5px stroke, 20px default (16px in dense rows). One set, no mixing.
- Expressive (landing feature grid, empty states): **3dicons.co** V1 — single camera angle,
  single light direction, tinted to ember/neutral. Budget ≤150KB each, lazy below the fold,
  explicit width/height, `aria-hidden` when decorative.

## Imagery

- Direction: *warm darkroom*. A single subject — a lifter, a bar, the app itself — floating in
  warm darkness with deliberate negative space reserved for type. No gym stock photography.
- Source: Higgsfield MCP for section art and the hero backdrop; the product's own real
  screenshots for anything showing the app.
- Ratios: 3:2 hero backdrop, 1:1 section art, 4:5 phone frames.
- Every image carries honest `alt` text; generated people are never presented as real users.
- Text over imagery always sits on a scrim (`linear-gradient` to ≥55% ground).
