# COMPOSITION — what the references actually do

Written from screenshots I opened and blueprints I measured, in `design/refs/`. Every number
below is measured, not recalled.

---

## 1. teenage engineering — the DNA
`design/refs/dna-teenage-engineering/` · https://teenage.engineering

**The one memorable idea:** the page is a catalogue, and the product is the only rich object
on it. Everything else is whispered — hairline type, hairline rules, nothing else competing.

**What I saw in the screenshot**
- The nav is **not** a logo-plus-links bar. It is a permanent row of five labelled groups,
  each a category heading with its own sub-links stacked beneath in tiny thin type, and a
  line-drawn icon next to each. 25 links visible at rest. **Zero CTA buttons in the nav.**
- The wordmark is plain text, two lines, same thin weight as everything else. No lockup.
- The hero is a **full-bleed product photograph** bleeding off the bottom of the viewport with
  no headline over it. The headline comes *after* the product, further down.
- A block of dense Japanese micro-type sits top-right, used as texture, not as content.
- Buttons are **hard-edged outlined rectangles**: 1px rule, no fill, no radius, uppercase.

**Measured**
| | |
|---|---|
| Ground | `#f6f8f7` canvas (dark pages use `#0f0e12`, not pure black) |
| Palette | exactly five neutrals + one rationed chromatic note |
| Radius | **0px everywhere** |
| Shadows | **none** |
| Cards | **0 card-like surfaces on the whole page** |
| Gradients / blur blobs | **0 / 0** |
| Body type | 13px weight **100**; 19px weight 300 for nav and labels |
| Display | 40px weight **300**, line-height 1.11 |
| Section gap | 66px · element gap 15px · max width 1200px · cell padding **0** |
| Imagery | 1:1, radius 0, `fit: fill`, no frame, runs to the grid edge |
| Footer | 7 columns, 96px tall, 7 tiny links, dark band |
| Motion | 0 animations, 4 transitions. Essentially still. |

**Rules it states outright:** never round a corner, never use a shadow, never use a gradient,
never centre body text, never pad an image cell, never go above weight 300.

---

## 2. Figure&Plot — the signature motion
`design/refs/hero-figure-and-plot/` · https://www.figureandplot.com

**The one memorable idea:** a horizontal conveyor. Small uniform input tiles travel in from
the left, pass through a single node in the centre, and emerge on the right as outputs, with
one quiet label under each group ("Your Input" / "Our Collaboration" / "Your Output").

I am taking **the conveyor and nothing else**. Its ground is dark, its headline is centred and
its node is a gradient — all three fight the DNA and the anti-generic rules, so none is used.

---

## 3. Tines — the button label
`design/refs/cta-tines/` · https://www.tines.com

**Measured button anatomy:** primary is a filled rectangle, 35px tall, 10px/20px padding,
label in **Roobert Mono 13px weight 700, uppercase**. Secondary is the identical size and
padding, outlined instead of filled. Both sit on the same baseline, primary first.

I take the **label treatment** — uppercase, mono-ish, small, heavy, letterspaced — and the
primary/secondary pairing at identical size. I do **not** take its 990px pill radius (the DNA
forbids radius, and four of this owner's six apps already use pills), its purple, its warm
paper ground, or the grey "trusted by" logo row directly under the hero, which is on the
slop list.

---

## 4. Harvest Hall — rejected
`design/refs/footer-harvest-hall/` · Captured as a footer candidate and rejected: its footer
is a 980px tall animated Lenis/Three.js panel, which is the opposite of the ruled grid this
product needs. **The footer reference is teenage engineering's own**: 7 columns, 96px, tiny
links, dark band. Recorded here so the rejection is on the record rather than silent.

---

## What this means for Kettleworth

| Decision | Because |
|---|---|
| **Zero cards.** Rows separated by hairline rules instead. | The DNA page has 0 card surfaces. The anti-generic rule says do not exceed the reference's card count. |
| **Zero radius, zero shadow, zero gradient.** | Measured 0/none/0 on the reference. Also the cleanest break from the previous build, which was all soft surfaces and a glow. |
| **Type runs thin and small.** Body at 13–16px weight 100–300; display compact at 40–56px, not 88px. | The reference deliberately rejects large display type. The previous Kettleworth build led with a 88px hero; this one must not. |
| **Left-aligned everything.** | The reference states it outright: never centre body text. |
| **Images 1:1, unframed, edge-to-edge.** | Measured. No rounded photo cards. |
| **Footer is a 7-column grid of tiny links,** not a giant wordmark. | Measured. Also diverges from the five large-type footers already in this portfolio. |
| **Motion is near-still, with one conveyor.** | The reference has 0 animations. Five of six apps in this portfolio use scroll-reveal; this one must not. |
| **One accent, rationed.** | The reference allows exactly one chromatic note. Kettleworth's ember becomes it. |

---

## 5. 21st.dev — Number Pad, by Bankk roll (pillar 8)
`design/refs/components-21st-numberpad/` · https://21st.dev/@bankkroll/components/number-pad

**The composition I am porting:** one dominant readout at the top carrying the value and a
quiet sub-line, a hard grid of equal keys beneath it, and a single commit action. The keys are
the whole interface; there is no second competing control.

Its own source needs a paid account, so what I port is the **composition from the preview and
its description**, rethemed to Kettleworth tokens: square keys, no radius, no fill, hairline
rules. None of its palette, radius or type comes across.

**Why it fits the problem.** The set console measured **579px tall** on a phone, so logging a
set mid-set meant scrolling. It stacked three equally weighted boxes (weight, reps, effort) so
nothing dominated, and the effort row read as RPE jargon (`8 · 2 LEFT IN THE TANK`). The
Number Pad's answer is: one readout dominates, everything else is a key.

**What changes, against the measured problems**

| Problem measured | Fix ported |
|---|---|
| 579px, needs scrolling one-handed | One screen: readout, key grid, effort row, commit bar |
| Three boxes of equal weight | One dominant readout; the keys are secondary; nothing else competes |
| Weight and reps are separate controls | One key grid, and tapping either figure in the readout chooses which it drives |
| `RPE 8 · 2 LEFT IN THE TANK` | Three plain words, with the precise RPE kept small beneath |
| Ringed boxes | Ruled rows and hard square keys, per the DNA |

## 6. uupm.cc — baseline only (pillar 9)
`design/refs/intel-uupm/` · https://uupm.cc

Taken: its UX-guideline baseline as a completeness check — loading states, empty states and
z-index discipline. **Nothing of its taste.** Its own front page recommends Inter, Space
Grotesk and Playfair as font pairings and lists Glassmorphism, Neumorphism and Aurora UI as
styles; all six are banned here, by `typography.md` and `anti-generic.md` respectively. The
skill's own precedence rule says this skill wins, and it does.

## 7. The rest game — loop reference, not a visual one
`packages/core/src/word-rush.ts`

The owner named the reference himself: "something like a flappy bird or temple run … really
addictive, but also good to the cognitive skill, or learn a new language". That is a reference
to a **loop**, not to a surface, so what is replicated is the mechanic and the pacing, and the
surface stays on the DNA.

**The one memorable idea of Flappy Bird:** the restart screen is the game screen. There is no
menu, no score summary to dismiss, no "play again" buried in a dialog. The distance between
failing and trying again is one tap on the spot your thumb already is.

Ported: one input (two targets), the run-over screen as the start button, a visible best
during the run, difficulty that rises continuously rather than in levels, death in one
mistake, and the "one short of your best" callout.

Not ported: its art, its physics, its sound, its endless-scroll background, and its lack of
any purpose beyond itself — the words here are gym Spanish, so the run teaches.

**Surface** is unchanged from section 5's Number Pad port: two large hard targets, one
dominant readout, hairline rules, radius 0, no shadow. The only moving thing is a 2px bar
reading the run clock, which turns ember under 30%. The rest deck's five modes use the same
key grid, so the console and the deck read as one instrument.
