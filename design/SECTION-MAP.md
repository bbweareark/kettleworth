# SECTION-MAP — what each surface replicates

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
| **Navigation** | Clonix full-screen nav (`navbar-clonix`), triggered by a floating pill — the pill group is IB's and Get Ripe's | Trigger: 44px pill, top-right, floats over content. Open: full-screen, items at `--text-2xl`, one per row, thumb-reachable |
| **Today hero** | Lando Norris (`hero-lando-norris/scrolled.png`): full-bleed photograph bleeding edge to edge, the figure carried on black beneath it | Image 16:9 full-bleed, no border, no radius at the top edge. Figure at 96px directly under it, accent on the second line |
| **Primary action** | Get Ripe (`cta-get-ripe/mobile.png`): a filled pill in the nav, paired pills under the headline | Sticky bottom pill, 56px tall, `--radius-pill`, volt fill, ink text. Exactly one per viewport |
| **Session console** | 21st.dev Number Pad (`components-21st-numberpad`), kept — it is the only control that reaches every value | Figure at 96px, keypad 3×4, keys 56px, one commit |
| **Footer** | Decimals (`footer-decimals`), Bold | Oversized wordmark, few links, volt rule above |
| **Figures** | IB's display treatment | Antonio, tracking −0.03em at 96px, tabular |

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
