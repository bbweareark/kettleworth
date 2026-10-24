# UI-DECISIONS.md

Which Sensational UI reference drove each pillar. Keep current on every UI change, so the next
change extends this design instead of starting a new one. Values live in `DESIGN.md`.

| Pillar | Choice | Reference | Why |
|--------|--------|-----------|-----|
| 7 · DNA | **ORYZO AI** — darkroom product editorial | [styles.refero.design/style/1f204e95…](https://styles.refero.design/style/1f204e95-454a-437e-845b-c1b169d35607) | Warm near-black canvas, one chromatic surface step, cream type, a single ember, hairline/dashed rules, depth without shadows. Kettleworth was already reaching for this; the DNA sharpens it. Departure: ember stays the primary-action colour, because unlike ORYZO this product has a primary action. |
| 1 · Navbar | **Static**, sticky translucent → **pill morph** past the hero | [navbar.gallery](https://www.navbar.gallery/) — Static filter (Linear, Asana, Browserbase) | Marketing site has five destinations, so Static is right. The pill morph is the one "sensational" nav move and costs a single transform. In-app nav keeps its **Side Bar** (desktop) + bottom tab bar (phone). |
| 2 · Hero | **Oversized type + product-as-artifact** | [supahero.io/hero/superpower](https://supahero.io/hero/superpower) | Superpower is the closest adjacent category (health platform) and leads with a promise in oversized type. Pairs exactly with the DNA's "void-mode reveal": the app floating in warm darkness, headline flanking it. |
| 3 · CTA | **Full-bleed pre-footer closer** + hero CTA + **sticky mobile bar** | [cta.gallery](https://www.cta.gallery/) — Get-ripe (fitness), Northeasttomato | One primary action per viewport, verb-first. The closer is full-bleed because signing up is the entire point of the page; the sticky bar catches phone users who never reach it. |
| 4 · Footer | **Typographic / Large Type** | [footer.design](https://www.footer.design/) — Typographic filter | A giant clipped KETTLEWORTH wordmark closes the page the way the DNA closes a product reveal. Links reduce to a thin row; no link soup. |
| 6 · Motion | **Reveal on enter** spine + 2 signature moments | [scrolltide.co](https://www.scrolltide.co/) — Emberkiri, Cinder (Hero Section) | Reveal-on-enter is the cheap correct default. Signature moments: hero line clip-reveal, and a slow ember gradient drift behind the closing CTA. Everything else is a plain reveal, so the page reads as designed rather than templated. |
| 5 · Icons & imagery | **Lucide** inline · **3dicons.co V1** expressive · **Higgsfield** art | [3dicons.co](https://3dicons.co/) · Higgsfield MCP | 3dicons ships exactly the vocabulary a training app needs (Fire, Trophy, Chart, Target, Clock). Higgsfield is connected, so section art is generated to the DNA palette rather than stocked. |

## Applied behind the login, too

| Surface | What changed |
|---|---|
| App nav | Side Bar + Tabs kept, but the two nav landmarks were both named "Main"; they are now Primary and Secondary. The current page is marked by an ember rail, not an ember fill, so the only filled ember on screen is still the primary action. Community and Connected apps were desktop-only and unreachable on a phone: they now live in a **More** sheet on the app bar, which replaced the lone settings gear. The sidebar is translucent to match the public header, and the z-index ladder is consistent. |
| App motion | A dashboard should not animate on scroll, so app routes get `AppStack`: one quiet staggered arrival on mount, capped at six, pure CSS. Applied to Today, Programme, Progress and Nutrition. |
| Accent discipline | Ember was simultaneously action, brand, nav selection, focus ring, rest timer and decoration. Streak, library pattern, build, calories and unread badges moved to amber/outline; the rest timer moved to sky. |
| Components | Buttons now meet the 44px touch target (`md` 44, `lg` 52, `xl` 56) and their icons scale with size instead of being pinned to 16px inside a 56px button. |
| Dialogs & sheets | The overlay carried `animate-in` from a plugin that is not installed, so it never animated. Replaced with real keyframes, gated behind `motion-safe`. |

Picks made offline (gallery unreachable): **none** — all seven were read live. One refero
detail page (Superhuman) failed to hydrate in the browser pane, so ORYZO was compared against
it only by index description; ORYZO was the stronger match regardless.

## Ship gate

- [x] Tokens only, no stray values
- [x] Light + dark
- [x] 360 / 768 / 1440, no horizontal scroll
- [x] Contrast ≥4.5:1, scrims over imagery
- [x] Focus rings, 44px targets, full keyboard path
- [x] `prefers-reduced-motion` honoured
- [x] Hero LCP optimised, no layout shift

## Audit before the revamp (scores 0–3)

| Pillar | Before | Score | Highest-leverage fix |
|--------|--------|-------|----------------------|
| 7 · DNA | Good token set, but a dead second source of truth in `tokens.ts` with drifting values; ~140 hand-written `ring-white/[0.06]` literals duplicating `--color-border`; `bg-black/*` scrims that invert wrongly in light theme; five hand-rolled tracking values; one off-palette `#ff8a3d` | 1 | Warm the ground to the DNA, delete the mirror, repoint every literal at a token |
| 1 · Navbar | Sticky and translucent, but below 768px the nav links simply vanish: no burger, no sheet, no `aria-expanded`, no Escape. A second divergent header on `/library` | 1 | Mobile sheet + unify the two headers + pill morph |
| 2 · Hero | Four CTAs visible at once, two of them competing ember primaries both pointing at `/sign-up` | 1 | One primary, product-as-artifact |
| 3 · CTA | Three primaries to the same destination under three labels and three sizes; ember simultaneously meaning action, brand, nav selection, focus ring and rest timer | 1 | One label, one accent meaning, full-bleed closer, sticky phone bar |
| 4 · Footer | Inlined in the layout, three flat columns, no copyright; absent from `/library`, `/privacy`, `/terms`, so the legal pages are dead ends | 1 | Shared Typographic footer on every public route |
| 6 · Motion | No scroll reveal anywhere. The six pillar cards fade in on mount simultaneously. A `animate-in` class with no plugin installed, so the dialog never animates. One file missing the reduced-motion guard | 0 | Reveal spine + two signature moments |
| 5 · Icons & imagery | One icon set (Lucide) cleanly, but no illustration system at all, raw unicode glyphs used as icons, 16px icons inside 52px buttons | 2 | 3D icon set for the feature grid, Higgsfield art for the closer |
