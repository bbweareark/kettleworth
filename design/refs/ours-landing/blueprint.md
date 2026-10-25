# Blueprint: ours / landing (final)

Source: http://localhost:3000/
Title: Kettleworth

## Type
Fonts by usage: archivo (227)
- h1: archivo 56px/60.48px w300 ls -0.84px  "This is the week. Nothing else is."
- h2: archivo 12px/13.32px w500 ls 0.96px uppercase "HOW IT DECIDES"
- h3: archivo 22px/25.3px w300 ls -0.33px  "It reads the set you just logged"
- body: archivo 12px/13.32px w500 ls 0.96px uppercase "TRAINING"
- link: archivo 16px/24px w300 ls normal  "kettle worth"

## Colour
Ground: body rgb(15, 14, 18) / html rgba(0, 0, 0, 0)
Ranked (role colour count):
- border rgb(42, 41, 48)  x222
- fg rgb(241, 242, 242)  x99
- fg rgb(118, 118, 124)  x55
- fg rgb(15, 14, 18)  x25
- fg rgb(169, 169, 173)  x21
- fg oklab(0.166846 0.0038159 -0.00749546 / 0.55)  x12
- fg oklab(0.166846 0.0038159 -0.00749546 / 0.8)  x10
- bg oklab(0.567811 0.00255615 -0.00875223 / 0.35)  x6
- border rgb(241, 242, 242)  x4
- bg rgb(217, 128, 73)  x3
- fg rgb(217, 128, 73)  x3
- fg rgb(95, 168, 128)  x2
- bg rgb(42, 41, 48)  x2
- bg rgb(246, 248, 247)  x2
- bg oklab(0.213855 0.00555447 -0.0146375 / 0.4)  x1
- bg rgb(241, 242, 242)  x1
- border oklab(0.166846 0.0038159 -0.00749546 / 0.15)  x1

## Layout
Page height 2888px. Container max-widths: 1200px (7), 567.049px (6), 496.168px (1), 425.287px (1). Base font 16px.
Radius ramp: none
Shadows: none

## Sections (top → bottom)
1. y=128 h=640 pad 40px/66px bg rgba(0, 0, 0, 0) maxW 1200px · "This is the week. Nothing else is." · grid 352px 752px gap 48px (2 children) · media 0
2. y=768 h=348 pad 0px/0px bg oklab(0.213855 0.00555447 -0.0146375 / 0.4) maxW none · flex none gap normal (2 children) · media 0
3. y=769 h=346 pad 66px/66px bg rgba(0, 0, 0, 0) maxW 1200px · flex none gap normal (2 children) · media 0
4. y=1116 h=651 pad 66px/66px bg rgba(0, 0, 0, 0) maxW 1200px · "HOW IT DECIDES" · grid 64px 320px 704px gap 8px 32px (3 children) · media 0
5. y=1766 h=548 pad 0px/0px bg rgb(246, 248, 247) maxW none · grid 704px 416px gap 32px (2 children) · media 1
6. y=1766 h=548 pad 66px/66px bg rgba(0, 0, 0, 0) maxW 1200px · media 1
7. y=2314 h=231 pad 66px/66px bg rgba(0, 0, 0, 0) maxW 1200px · "Twenty questions, then an eight-week block." · grid 791.328px 328.672px gap 32px (2 children) · media 0
8. y=2611 h=277 pad 0px/0px bg rgb(246, 248, 247) maxW none · grid 270px 270px 270px 270px gap 32px 24px (4 children) · media 1

## Navigation
position static, height 128px, bg rgba(0, 0, 0, 0), backdrop none, border 1px solid rgb(42, 41, 48), shadow none
8 links: kettle worth · The week · The block · Method · 850 movements · Search · Sign in · Start free
CTAs in nav: 0 []
link style: archivo 16px w300 ls normal none
after 900px scroll: height 128px, bg rgba(0, 0, 0, 0), backdrop none, shadow none, top -900

## Buttons (distinct styles, by frequency)
- "START FREE" x2: bg rgb(217, 128, 73), fg rgb(241, 242, 242), border 0px solid rgb(42, 41, 48), radius 0px, h 52px, pad 0px 28px, archivo 12px w600 ls 0.96px uppercase, shadow none
- "BROWSE 850 MOVEMENTS" x2: bg rgba(0, 0, 0, 0), fg rgb(241, 242, 242), border 1px solid rgb(241, 242, 242), radius 0px, h 52px, pad 0px 28px, archivo 12px w600 ls 0.96px uppercase, shadow none
- "kettle worth" x1: bg rgba(0, 0, 0, 0), fg rgb(241, 242, 242), border 0px solid rgb(42, 41, 48), radius 0px, h 42px, pad 2px 0px 0px, archivo 16px w300 ls normal , shadow none

## Imagery
1 images/videos; 0 large SVGs; 0 gradient surfaces; 0 blur blobs
- img 416x416 (1.00) radius 0px fit cover frame rgba(0, 0, 0, 0)  "Chalked hands gripping a loaded barbell"

## Cards
0 card-like surfaces

## Footer
h 277px, bg rgb(246, 248, 247), pad 0px/0px, border-top 0px solid rgb(42, 41, 48)
4 columns (270px 270px 270px 270px), 10 links
largest text: "TRAINING The week The block Method LIBRA" archivo 16px w300 rgb(15, 14, 18)

## Motion
libs: framer, motion, three; transitions 22, animations 0, transforms 1, sticky 0, video 0, canvas 0, scroll-behavior auto

## Mobile nav (390px)
height 77px, menu button true, visible: kettle
worth · Open menu
