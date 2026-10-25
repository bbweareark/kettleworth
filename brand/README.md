# Kettleworth brand mark

## The idea

One plate, split by a line of light, the right half lifted by **exactly one increment**.

That is the product in a single move. The load goes up in the smallest honest step, and the
gap is where the engine decides. It reads left to right as progress.

It is deliberately **not** a kettlebell, a barbell, a flame, a bicep or a letter: those are the
category's clichés, and two of them had already been rejected for this brand as meaningless.

## Geometry

On a 256 grid, two half-discs of radius 96:

| | Flat edge | Centre y | Top | Bottom |
|---|---|---|---|---|
| Left half | x = 121 | 144 (16 below centre) | 48 | 240 |
| Right half | x = 135 | 112 (16 above centre) | 16 | 208 |

The gap is 14 units on the centre line. The step is 32 units: one increment.
Footprint 206 x 224, optically centred on 128,128.

`kw-symbol-small.svg` is the small-size cut: radius 92, gap 20, step 32, so both the gap and
the step survive a 16px favicon.

## Files

| File | Use |
|---|---|
| `kw-symbol.svg` | The master. One colour, no text, no filters. |
| `kw-symbol-small.svg` | 16–32px cut. Wider gap, same step. |
| `kw-symbol-black.svg` / `-white.svg` | One-colour cuts for print and reversed use. |
| `kw-app-icon-ember.svg` | App icon: ember mark on the warm ground, 56px corner radius. |
| `kw-maskable-ember.svg` | PWA maskable: mark inside the inner 56% safe zone. |
| `kw-favicon-ember.svg` | Favicon source. |
| `kw-seal.svg` | The mark in a dark disc, used where the coach speaks. |
| `kw-wordmark.svg` | "Kettleworth" outlined from Clash Display 600. No live text. |
| `kw-wordmark-uppercase.svg` | "KETTLEWORTH" outlined, for the oversized footer wordmark. |
| `kw-lockup-horizontal.svg` | Mark + wordmark. Cap height is half the mark height; gap is 22% of it. |
| `kw-lockup-stacked.svg` | Mark over wordmark, for square and narrow placements. |

In the app the mark is a React component, `BrandMark` in `packages/ui/src/components/logo.tsx`,
which draws the same geometry and takes its colour from `currentColor`.

## Colour

- **In UI chrome** the mark is `currentColor`, which resolves to cream. Ember is reserved for
  the primary action and the current page, so the logo does not compete with them.
- **At rest** (app icon, favicon, seal) the mark is ember `#C9A97A` on the warm ground
  `#141110`. That is the brand, not an action.
- The mark must always be one colour. No gradients: the previous mark used three bronze stops
  and they were the only hard-coded hexes left in the component layer.

## Clear space and minimum size

- Clear space: the width of the gap (14 units, about 5.5% of the mark) on every side.
- Minimum size: 16px for the small cut, 24px for the master.
- Never place the master cut below 24px; the gap closes.

## Misuse

Do not rotate it, do not mirror it (the step must rise to the right), do not close the gap,
do not add a gradient or a shadow, do not outline it, do not place it on a mid-tone where
neither the cream nor the ember cut has 4.5:1.

## The wordmark

Outlined, not set. The glyphs were shaped with HarfBuzz using the font's own kerning, then
converted to paths with fontTools, so the outlines are exactly what Clash Display 600 draws.

This matters because live text renders in a fallback face for the instant before the font
loads, and in the wrong face entirely if it never loads. The logo no longer depends on a
network request: with every woff2 blocked, the header lockup and the footer wordmark still
render correctly while the rest of the page falls back.

In the app the wordmark is the `Wordmark` component, sized by **cap height** rather than
bounding box, because cap height is what the eye measures a wordmark against. `Logo` composes
`BrandMark` + `Wordmark` at the lockup's proportions and carries the accessible name.

To regenerate after a font change: shape the string, convert with `SVGPathPen` under a
`Transform(1, 0, 0, -1, x, 0)` to flip font units into SVG's y-down space, and take the tight
bounds from a `BoundsPen`. HarfBuzz cannot read woff2, so unpack to TTF with fontTools first,
or every glyph silently resolves to `.notdef`.

## Open items

- Trademark clearance has not been done. A professional search is worth doing before this is
  used commercially.

## Licence

Mark: original work for Kettleworth. Clash Display: Fontshare, free for commercial use.
