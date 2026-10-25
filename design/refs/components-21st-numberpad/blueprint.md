# Blueprint: components / 21st Number Pad

Source: https://21st.dev/@bankkroll/components/number-pad
Title: Number Pad | Community Components | 21st

## Type
Fonts by usage: ui-monospace (1251), Inter (647), General Sans (1)
- h1: Inter 32px/38.4px w600 ls -0.32px  "Number Pad"
- h2: Inter 16px/28px w500 ls -0.176px  "Code"
- h3: Inter 13px/18px w500 ls -0.176px  "Animated Testimonials"
- body: Inter 15px/22.5px w450 ls -0.176px  "Bankk roll"
- link: Inter 16px/24px w450 ls -0.176px  ""

## Colour
Ground: body oklch(0.141 0.004 285.824) / html oklch(0.141 0.004 285.824)
Ranked (role colour count):
- border oklch(0.24 0.004 286)  x1895
- fg rgb(225, 228, 232)  x704
- fg oklch(0.975 0.002 286)  x281
- fg rgb(249, 117, 131)  x168
- fg rgb(121, 184, 255)  x138
- fg oklch(0.68 0.008 286)  x131
- fg rgb(179, 146, 240)  x117
- fg rgb(158, 203, 255)  x104
- fg oklch(0.485 0.291 264.121)  x93
- fg oklab(0.975 0.000551274 -0.00192252 / 0.6)  x80
- fg oklab(0.975 0.000551274 -0.00192252 / 0.75)  x27
- bg oklch(0.19 0.004 286)  x17
- fg rgb(133, 232, 157)  x16
- fg oklab(0.975 0.000551274 -0.00192252 / 0.8)  x16
- fg oklab(0.975 0.000551274 -0.00192252 / 0.85)  x12
- fg oklch(1 0 0)  x6
- fg rgb(255, 255, 255)  x5
- bg oklab(0.19 0.00110255 -0.00384505 / 0.5)  x5
- bg oklch(0.485 0.291 264.121)  x2
- fg oklch(0.141 0.004 285.824)  x1

## Layout
Page height 3794px. Container max-widths: 1152px (5), 732.665px (1). Base font 16px.
Radius ramp: 6px (18), 14px (16), 3.35544e+07px (6), 8px (5), 10px (3), 12px (2)
Shadows: rgba(255, 255, 255, 0.22) 0px 1px 0px 0px inset | rgba(0, 0, 0, 0.25) 0px 0.5px 1px 0px | rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.975 0.000551274 -0.00192252 / 0.08) 0px 0px 0px 1px, rgba(0, 0, 0, 0.25) 0px 25px 50px -12px | rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklch(0.24 0.004 286) 0px 0px 0px 1px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | rgba(0, 0, 0, 0.04) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.07) 0px 1px 3px 0px

## Sections (top → bottom)
1. y=56 h=3008 pad 48px/96px bg rgba(0, 0, 0, 0) maxW none · "Number Pad" · flex none gap 6px (4 children) · media 58
2. y=104 h=2864 pad 0px/0px bg rgba(0, 0, 0, 0) maxW 1152px · "Number Pad" · flex none gap 6px (4 children) · media 58
3. y=940 h=701 pad 24px/0px bg rgba(0, 0, 0, 0) maxW none · "Code" · media 0
4. y=1833 h=528 pad 0px/0px bg rgba(0, 0, 0, 0) maxW none · "More by Bankk roll" · flex none gap 16px (2 children) · media 25
5. y=2441 h=528 pad 0px/0px bg rgba(0, 0, 0, 0) maxW none · "More in Forms" · flex none gap 16px (2 children) · media 24
6. y=3064 h=190 pad 0px/0px bg rgba(0, 0, 0, 0) maxW 1152px · "Explore more" · flex none gap 8px (5 children) · media 0
7. y=3064 h=190 pad 24px/64px bg rgba(0, 0, 0, 0) maxW none · "Explore more" · flex none gap 8px (5 children) · media 0

## Navigation
position sticky, height 56px, bg rgba(0, 0, 0, 0), backdrop none, border 0px solid rgba(0, 0, 0, 0), shadow none
7 links:  · Library · Product · Pricing · Search ⌘K · Log in · Get 21st free
CTAs in nav: 1 [{"text":"Get 21st free","bg":"oklch(0.485 0.291 264.121)","color":"oklch(1 0 0)","radius":"10px","height":32}]
link style: Inter 16px w450 ls -0.176px none
after 900px scroll: height 56px, bg rgba(0, 0, 0, 0), backdrop none, shadow none, top 0

## Buttons (distinct styles, by frequency)
- "Library" x23: bg rgba(0, 0, 0, 0), fg oklab(0.975 0.000551274 -0.00192252 / 0.75), border 0px solid oklch(0.24 0.004 286), radius 0px, h 29px, pad 4px 0px, Inter 14px w450 ls -0.176px , shadow none
- "Library" x3: bg rgba(0, 0, 0, 0), fg oklch(0.68 0.008 286), border 0px solid oklch(0.24 0.004 286), radius 8px, h 36px, pad 0px 12px, Inter 14px w500 ls -0.176px , shadow none
- "Search ⌘K" x1: bg rgba(0, 0, 0, 0), fg oklch(0.68 0.008 286), border 0px solid oklch(0.24 0.004 286), radius 10px, h 36px, pad 0px 10px, Inter 14px w450 ls -0.176px , shadow none
- "Log in" x1: bg rgba(0, 0, 0, 0), fg oklch(0.68 0.008 286), border 0px solid oklch(0.24 0.004 286), radius 10px, h 36px, pad 0px 12px, Inter 14px w500 ls -0.176px , shadow none
- "Get 21st free" x1: bg oklch(0.485 0.291 264.121), fg oklch(1 0 0), border 0px solid rgba(0, 0, 0, 0), radius 10px, h 32px, pad 0px 12px, Inter 13px w500 ls normal , shadow rgba(255, 255, 255, 0.22) 0px 1px 0px 0px inset
- "Copy prompt" x1: bg oklch(0.485 0.291 264.121), fg oklch(1 0 0), border 0px solid oklch(0.24 0.004 286), radius 8px, h 44px, pad 0px 20px, Inter 16px w500 ls -0.176px , shadow none
- "Preview" x1: bg oklab(0 0 0 / 0.85), fg rgb(255, 255, 255), border 0px solid oklch(0.24 0.004 286), radius 8px, h 40px, pad 0px 14px, Inter 15px w500 ls -0.176px , shadow none
- "lucide-react" x1: bg rgba(0, 0, 0, 0), fg oklab(0.975 0.000551274 -0.00192252 / 0.85), border 1px solid oklch(0.24 0.004 286), radius 6px, h 32px, pad 0px 10px, ui-monospace 13px w450 ls -0.176px , shadow none

## Imagery
17 images/videos; 0 large SVGs; 1 gradient surfaces; 0 blur blobs
- img 674x421 (1.60) radius 12px fit cover frame oklch(0.19 0.004 286) shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.975 0.000551274 -0.00192252 / 0.08) 0px 0px 0px 1px, rgba(0, 0, 0, 0.25) 0px 25px 50px -12px "Number Pad preview"
- img 267x200 (1.33) radius 14px fit cover frame oklch(0.19 0.004 286) shadow rgba(0, 0, 0, 0.04) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.07) 0px 1px 3px 0px "Animated Testimonials"
- img 267x200 (1.33) radius 14px fit cover frame oklch(0.19 0.004 286) shadow rgba(0, 0, 0, 0.04) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.07) 0px 1px 3px 0px "Commerce Hero"
- img 267x200 (1.33) radius 14px fit cover frame oklch(0.19 0.004 286) shadow rgba(0, 0, 0, 0.04) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.07) 0px 1px 3px 0px "Acme Hero"
- img 267x200 (1.33) radius 14px fit cover frame oklch(0.19 0.004 286) shadow rgba(0, 0, 0, 0.04) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.07) 0px 1px 3px 0px "Myna Hero"
- img 267x200 (1.33) radius 14px fit cover frame oklch(0.19 0.004 286) shadow rgba(0, 0, 0, 0.04) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.07) 0px 1px 3px 0px "Single Pricing Card"
- img 267x200 (1.33) radius 14px fit cover frame oklch(0.19 0.004 286) shadow rgba(0, 0, 0, 0.04) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.07) 0px 1px 3px 0px "Pricing Card"
- img 267x200 (1.33) radius 14px fit cover frame oklch(0.19 0.004 286) shadow rgba(0, 0, 0, 0.04) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.07) 0px 1px 3px 0px "File Viewer"

## Cards
0 card-like surfaces

## Footer
h 540px, bg rgba(0, 0, 0, 0), pad 0px/0px, border-top 1px solid oklab(0.975 0.000551274 -0.00192252 / 0.08)
78 columns (none), 108 links
largest text: "" Inter 16px w450 oklch(0.975 0.002 286)

## Motion
libs: motion; transitions 168, animations 0, transforms 0, sticky 1, video 0, canvas 0, scroll-behavior smooth

## Mobile nav (390px)
height 56px, menu button true, visible: 21st home · Search the library · Get 21st free · Open the menu
