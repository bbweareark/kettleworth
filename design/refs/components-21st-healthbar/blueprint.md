# Blueprint: components / 8bitcn health bar (via 21st.dev)

Source: https://www.8bitcn.com/docs/components/health-bar
Title: Health Bar - 8bitcn/ui

## Type
Fonts by usage: ui-sans-serif (381), Press Start 2P (89), ui-monospace (39), GeistMono (5)
- h1: ui-sans-serif 36px/40px w600 ls -0.9px  "Health Bar"
- h2: ui-sans-serif 16px/24px w400 ls normal  "8bitcn/ui"
- h3: ui-sans-serif 14px/20px w700 ls normal  "Shadcn Blocks"
- body: ui-sans-serif 16px/24px w400 ls normal  "Displays an 8-bit health bar component."
- link: ui-sans-serif 16px/24px w400 ls normal  "8bitcn/ui"

## Colour
Ground: body lab(100 0 0) / html rgba(0, 0, 0, 0)
Ranked (role colour count):
- border lab(90.952 0 -0.0000119209)  x445
- fg lab(2.75381 0 0)  x286
- fg lab(48.496 0 0)  x98
- fg lab(15.204 0 -0.00000596046)  x85
- fg lab(7.78201 -0.0000149012 0)  x32
- bg lab(55.4814 75.0732 48.8528)  x10
- bg lab(96.52 -0.0000298023 0.0000119209)  x9
- fg lab(98.26 0 0)  x6
- bg lab(100 0 0)  x6
- border lab(2.75381 0 0)  x4
- bg lab(7.78201 -0.0000149012 0)  x2
- border lab(96.52 -0.0000298023 0.0000119209)  x2
- bg oklab(0.205 -0.00000207871 0.00000478327 / 0.2)  x2
- fg rgb(36, 41, 46)  x2
- bg oklab(0.999998 -0.00000980496 0.0000234246 / 0.95)  x1
- bg oklab(0.969998 -0.00000959635 0.0000227094 / 0.1)  x1
- border oklab(0.921998 -0.00000908971 0.0000215769 / 0.5)  x1
- bg oklab(0.145 -0.00000143796 0.00000340492 / 0.1)  x1
- fg lab(76.8 -0.0000298023 0)  x1

## Layout
Page height 1479px. Container max-widths: 1400px (3), 672px (2). Base font 16px.
Radius ramp: none
Shadows: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px

## Sections (top → bottom)

## Navigation
position sticky, height 56px, bg oklab(0.999998 -0.00000980496 0.0000234246 / 0.95), backdrop none, border 1px dashed lab(90.952 0 -0.0000119209), shadow none
9 links: 8bitcn/ui · Docs · Components · Blocks · Themes · Sponsors · Search documentation...  · 2.1k · Toggle theme
CTAs in nav: 1 [{"text":"Search documentation... ","bg":"oklab(0.969998 -0.00000959635 0.0000227094 / 0.1)","color":"lab(48.496 0 0)","radius":"0px","height":32}]
link style: ui-sans-serif 16px w400 ls normal none
after 900px scroll: height 56px, bg oklab(0.999998 -0.00000980496 0.0000234246 / 0.95), backdrop none, shadow none, top 0

## Buttons (distinct styles, by frequency)
- "Get Started" x61: bg rgba(0, 0, 0, 0), fg lab(2.75381 0 0), border 1px solid rgba(0, 0, 0, 0), radius 0px, h 30px, pad 8px, ui-sans-serif 12.8px w500 ls normal , shadow none
- "Copy Page" x3: bg lab(96.52 -0.0000298023 0.0000119209), fg lab(7.78201 -0.0000149012 0), border 0px solid lab(90.952 0 -0.0000119209), radius 0px, h 28px, pad 0px 10px, ui-sans-serif 12.8002px w500 ls normal , shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px
- "Components" x2: bg lab(96.52 -0.0000298023 0.0000119209), fg lab(7.78201 -0.0000149012 0), border 1px solid lab(96.52 -0.0000298023 0.0000119209), radius 0px, h 30px, pad 8px, ui-sans-serif 12.8px w500 ls normal , shadow none
- "Search documentation... cmd+" x1: bg oklab(0.969998 -0.00000959635 0.0000227094 / 0.1), fg lab(48.496 0 0), border 1px solid lab(90.952 0 -0.0000119209), radius 0px, h 32px, pad 8px 47.994px 8px 16px, Press Start 2P 7.5px w400 ls 0.5px , shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px
- "2.1k" x1: bg rgba(0, 0, 0, 0), fg lab(2.75381 0 0), border 0px solid lab(90.952 0 -0.0000119209), radius 0px, h 32px, pad 0px 10px, ui-sans-serif 14px w500 ls normal , shadow none
- "Open in" x1: bg lab(7.78201 -0.0000149012 0), fg lab(98.26 0 0), border 0px solid lab(90.952 0 -0.0000119209), radius 0px, h 36px, pad 8px 12px, ui-sans-serif 12px w500 ls normal , shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px
- "pnpm" x1: bg rgba(0, 0, 0, 0), fg lab(2.75381 0 0), border , radius 0px, h 31px, pad 4px 8px, ui-sans-serif 14px w500 ls normal , shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px
- "Shadcn Blocks The ultimate b" x1: bg rgba(0, 0, 0, 0), fg lab(2.75381 0 0), border 1px dashed lab(90.952 0 -0.0000119209), radius 0px, h 74px, pad 8px, ui-sans-serif 15px w400 ls normal , shadow none

## Imagery
0 images/videos; 0 large SVGs; 2 gradient surfaces; 0 blur blobs

## Cards
0 card-like surfaces

## Footer
h 56px, bg rgba(0, 0, 0, 0), pad 0px/0px, border-top 1px dashed lab(90.952 0 -0.0000119209)
0 columns (-), 3 links
largest text: "Built by OrcDev and Contributors. The so" Press Start 2P 9px w400 lab(2.75381 0 0)

## Motion
libs: motion; transitions 94, animations 0, transforms 1, sticky 5, video 0, canvas 0, scroll-behavior auto

## Mobile nav (390px)
height 56px, menu button true, visible: ☰ · Search... · 2.1k · Toggle theme
