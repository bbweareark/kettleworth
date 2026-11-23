# Kettleworth: concept

*Rewritten 27 Oct 2026. The owner judged the previous direction wrong: "the direction is
wrong, redesign it completely." The old note is kept below the line, because what it got
wrong is the most useful thing in this file.*

---

**Physical metaphor, the loaded bar under the platform floodlight.**
Not a catalogue, not a drafting sheet, not an instrument on a bench. A lifting platform in a
dark room with one hard light overhead: the iron is the only thing that matters, it is heavy,
and it is lit. Everything the app knows is in service of the number on the bar.

**Tone, heavy, hot, exact. The one it is not: delicate.**
The previous build was cool, flat and observational, and that is exactly why it kept reading
as austere rather than as something you want to open at 6am. Training is effort and
accumulation. The surface should have mass.

**The one memorable idea, the load is always the largest thing on the screen.**
Every screen is organised around a single number rendered at a scale nothing else approaches:
the weight on the bar in a session, the week's tonnage on Today, the estimated max on
Progress, the calories on Nutrition. You should be able to read the one number that matters
from arm's length, sweating, in bad light. Everything else is support type around it.

**Ground and light, deep ink, lit from above.**
A near-black ground with the light falling from the top of each screen, so the page has a
direction. One hot accent, used only where effort is: the current set, the live figure, the
action you are meant to take. Light mode is the same composition under daylight, not a
separate design.

**What imagery is real here.**
Real gym photography already in the repo (`public/art/*.jpg`), the plate diagram drawn from
actual plate maths, and the figures themselves. No stock illustration, no 3D icon set, no
abstract blobs. The product's own data is the richest thing it owns, so the data is the art.

**Two modes of use, acknowledged.**
In the gym the app is a heavy instrument: one hand, big targets, almost no reading. Out of the
gym it is a record: the curve, the history, the proof it is working. The design must serve
both without pretending they are the same screen.

---

## Superseded: the teenage engineering note (Sep–Oct 2026)

Metaphor was "an industrial catalogue under studio light": radius 0, no shadows, zero cards,
five neutrals and one accent, hairline rules, near-still motion.

**Why it was replaced.** It is a coherent design and it was executed faithfully, but it is the
wrong design for this product. A catalogue is for browsing goods you do not own; a training
app is used mid-effort by someone who needs one number fast. Every round of feedback on it
came back to the same shape of problem, screens that read as thin, controls that were elegant
but slow, a surface with no hierarchy of heat, and those are properties of the DNA, not of
the screens built on it. Changing the screens could not fix it.

---

# The style system (23 Nov 2026)

The owner asked for an anime-inspired surface "to inspire the people to do", and for a picker
offering several worlds - anime, neutral, Christian-inspired - each a genuinely different
experience, locked once chosen. Carbon, the Integrated Biosciences surface below, was signed
off as good and stays exactly as it is, as one of the choices.

## The through-line, which no style may break

A style changes the world the number lives in. It never changes these:

- **One number per screen, larger than anything else on it.** The load is still the subject.
- **One primary action per viewport**, at the thumb.
- The same information architecture, routes, data and accessibility floor.
- Legible in a gym, in bad light, one-handed, mid-effort.

If a style cannot carry a 96px figure and a 56px action, it is not a style for this app.

## Why a picker at all

Because the thing that makes someone train is not the same thing for everyone. One person
wants an instrument that tells them the truth; one wants a training arc where finishing a set
means something; one wants to be reminded their body is worth looking after. That is not a
palette preference, it is a different reason to open the app - so the copy, the motion and the
reward language change with the surface, not just the colours.

**Locked on purpose.** A style you can flip hourly is a toy and a support burden: every
screenshot, every piece of help, every bit of coaching copy would have to hold in all of them
at once. Choosing one is a commitment, the way picking a gym is.

## Carbon - the instrument *(shipped, unchanged)*

See below the line. Near-black, Antonio, one volt accent, hierarchy by size. Tone: heavy,
hot, exact. For the person who wants the truth and nothing else.

## Arc - the training arc *(new, the lead)*

**Physical metaphor:** a chapter in a fight. Not a cute mascot - the shonen training arc,
where the work is the drama and the number going up is the plot.

**Tone:** charged, defiant, cinematic. The one it is not: *cute*. No mascots, no chibi, no
pastel. This is ink, impact and speed, the language of a title card.

**The one memorable idea:** **a set lands.** Completing a set is an impact frame - the figure
hits, the ground flashes, the screen takes the blow - and the week reads as episodes with the
current one marked. Nothing else in this portfolio hits back when you press it.

**Ground and light:** ink black and paper white in hard contrast, with one hot accent used as
an impact colour rather than a fill. Light is a blade, not a glow: edges, speed lines, halftone.

**What imagery is real here:** *(revised 23 Nov 2026, on the owner's "where is the anime
style")* the characters themselves. Four original figures mid-effort, drawn in a 1990s
sports-manga register, generated through Higgsfield and cut out against nothing so they can
stand on ink or on paper. They are the room the figure stands in, never the subject: the load
is still the largest thing on every screen.

They are original characters. No existing property is referenced, named or resembled, nothing
here is licensed anime art, and no character could be mistaken for someone else's. The drawn
marks that go with them, the speed lines and the vertical caps label down the left edge, stay
SVG.

The line this replaces said the imagery here was treated photography and explicitly no anime
art. That was a misreading of the brief: anime inspiration is what was asked for in the first
place, and ink and impact with nobody in them is just Swiss typography.

**Must not collide with:** walkwithme's amaterasu (whisper-weight giant type, dusk indigo,
luminous object in the headline) or chinju-glam-night's gilt proscenium. Arc is loud where
amaterasu is quiet, and flat ink where chinju is gold.

## Sanctuary - stewardship *(new)*

**Physical metaphor:** a stone hall with light coming through high glass. The body as
something you are keeping, not punishing.

**Tone:** steady, warm, reverent. The one it is not: *severe*. No black ground, no shouting.

**The one memorable idea:** **the arch** - every figure sits inside a drawn arch, and the week
fills the arch as you train, so progress reads as something being built rather than a bar
going up.

**Ground and light:** warm limestone, ink text, and a single aged-gold accent. Light falls
from above and to one side, as it does through a clerestory.

**What imagery is real here:** the product's own photography, warm-graded and softly vignetted.
No crosses as decoration, no stock piety, no stained-glass pastiche.

**Must not collide with:** walkwithme, which is the owner's actual faith app - dusk indigo,
Bricolage Grotesque, Literata, an illustrative footer and a lamp on a path. Sanctuary is
daylight stone where walkwithme is dusk, an arch where walkwithme has a flame, and must take a
different display face from both walkwithme and webber (Cormorant Garamond).
