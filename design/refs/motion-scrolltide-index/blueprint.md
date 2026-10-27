# Blueprint: motion / scrolltide index

Source: https://www.scrolltide.co/
Title: Scrolltide — Cinematic website prompts & templates

## Type
Fonts by usage: Inter (1889), Space Mono (60), Bricolage Grotesque (25)
- h1: Bricolage Grotesque 88px/83.6px w800 ls -2.64px  "Ship websites that move like the tide."
- h2: Bricolage Grotesque 36px/40px w700 ls -0.9px  "The library, at a glance"
- h3: Inter 15px/22.5px w600 ls -0.375px  "Fabrica"
- body: Inter 18px/29.25px w400 ls normal  "A curated library of scroll-driven templates and prompts. Copy one, pa"
- link: Inter 16px/24px w400 ls normal  "scrolltide"

## Colour
Ground: body rgb(7, 8, 10) / html rgba(0, 0, 0, 0)
Ranked (role colour count):
- fg rgb(243, 245, 248)  x1613
- border rgb(243, 245, 248)  x1470
- border rgba(255, 255, 255, 0.08)  x172
- fg rgb(91, 99, 110)  x152
- border rgb(91, 99, 110)  x152
- bg rgb(11, 13, 16)  x127
- bg oklab(0.134026 -0.000681959 -0.00509647 / 0.7)  x123
- fg rgb(154, 162, 173)  x111
- bg rgb(0, 0, 0)  x96
- border rgb(154, 162, 173)  x69
- fg rgb(139, 243, 230)  x40
- bg oklab(0.746639 -0.0703368 -0.1263 / 0.1)  x31
- border oklab(0.746639 -0.0703368 -0.1263 / 0.4)  x28
- border rgba(255, 255, 255, 0.14)  x27
- fg rgba(255, 255, 255, 0.14)  x20
- fg rgb(7, 8, 10)  x19
- border rgb(7, 8, 10)  x18
- bg rgb(243, 245, 248)  x10
- border rgb(139, 243, 230)  x9
- fg rgb(4, 18, 31)  x8

## Layout
Page height 17793px. Container max-widths: 1280px (12), 384px (5), 448px (2), 896px (1). Base font 16px.
Radius ramp: 16px (251), 3.35544e+07px (240), 9px (2), 4px (1)
Shadows: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.14) 0px 0px 0px 1px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.89744 -0.098873 -0.00909621 / 0.5) 0px 0px 10px 2px

## Sections (top → bottom)
1. y=105 h=774 pad 0px/0px bg rgba(0, 0, 0, 0) maxW none · "Ship websites that move like the tide." · flex none gap normal (6 children) · media 2
2. y=941 h=3458 pad 32px/32px bg rgba(0, 0, 0, 0) maxW 1280px · "The library, at a glance" · flex none gap 24px (4 children) · media 29
3. y=4399 h=3689 pad 32px/32px bg rgba(0, 0, 0, 0) maxW 1280px · "One piece at a time" · flex none gap 24px (4 children) · media 30
4. y=8089 h=3418 pad 32px/32px bg rgba(0, 0, 0, 0) maxW 1280px · "Motion behind everything" · flex none gap 24px (4 children) · media 30
5. y=11506 h=2485 pad 32px/32px bg rgba(0, 0, 0, 0) maxW 1280px · "Build a page a band at a time" · flex none gap 24px (4 children) · media 20
6. y=13992 h=1863 pad 32px/32px bg rgba(0, 0, 0, 0) maxW 1280px · "The screen behind the landing page" · flex none gap 24px (4 children) · media 14
7. y=15855 h=757 pad 112px/112px bg rgba(0, 0, 0, 0) maxW 1280px · "Copy, paste, launch." · flex none gap 12px (4 children) · media 0

## Navigation
position sticky, height 65px, bg rgba(0, 0, 0, 0), backdrop none, border 0px solid rgb(243, 245, 248), shadow none
13 links: scrolltide · Library · Components · Shaders · Sections · UI · MCPNEW · eBook · Pricing · FAQ
CTAs in nav: 1 [{"text":"Go Unlimited","bg":"rgb(243, 245, 248)","color":"rgb(7, 8, 10)","radius":"3.35544e+07px","height":36}]
link style: Inter 16px w400 ls normal none
after 900px scroll: height 65px, bg rgba(0, 0, 0, 0), backdrop none, shadow none, top 0

## Buttons (distinct styles, by frequency)
- "Components →" x37: bg rgba(0, 0, 0, 0), fg rgb(154, 162, 173), border 1px solid rgba(255, 255, 255, 0.08), radius 3.35544e+07px, h 34px, pad 6px 14px, Inter 14px w400 ls normal , shadow none
- "Library" x11: bg rgba(0, 0, 0, 0), fg rgb(154, 162, 173), border 0px solid rgb(154, 162, 173), radius 3.35544e+07px, h 32px, pad 6px 14px, Inter 14px w400 ls normal , shadow none
- "Browse the library" x6: bg rgba(0, 0, 0, 0), fg rgb(243, 245, 248), border 1px solid rgba(255, 255, 255, 0.14), radius 3.35544e+07px, h 46px, pad 12px 24px, Inter 14px w500 ls normal , shadow none
- "All" x5: bg rgb(243, 245, 248), fg rgb(7, 8, 10), border 1px solid rgba(0, 0, 0, 0), radius 3.35544e+07px, h 34px, pad 6px 14px, Inter 14px w400 ls normal , shadow none
- "Go Unlimited →" x3: bg rgb(243, 245, 248), fg rgb(7, 8, 10), border 0px solid rgb(7, 8, 10), radius 3.35544e+07px, h 44px, pad 12px 24px, Inter 14px w600 ls normal , shadow none
- "scrolltide" x2: bg rgba(0, 0, 0, 0), fg rgb(243, 245, 248), border 0px solid rgb(243, 245, 248), radius 0px, h 32px, pad 0px, Inter 16px w400 ls normal , shadow none
- "Popular" x2: bg rgba(0, 0, 0, 0), fg rgb(154, 162, 173), border 0px solid rgb(154, 162, 173), radius 3.35544e+07px, h 32px, pad 6px 16px, Inter 14px w500 ls normal , shadow none
- "Go Unlimited" x1: bg rgb(243, 245, 248), fg rgb(7, 8, 10), border 0px solid rgb(7, 8, 10), radius 3.35544e+07px, h 36px, pad 8px 16px, Inter 14px w500 ls normal , shadow none

## Inputs
h 46px, bg oklab(0.185831 -0.00182673 -0.0111374 / 0.6), border 1px solid rgba(255, 255, 255, 0.08), radius 3.35544e+07px, pad 12px 20px, 14px, shadow none

## Imagery
124 images/videos; 1 large SVGs; 150 gradient surfaces; 5 blur blobs
- canvas 1440x774 (1.86) radius 0px fit fill frame rgba(0, 0, 0, 0)  
- video 398x235 (1.69) radius 0px fit contain frame rgba(0, 0, 0, 0)  
- video 398x235 (1.69) radius 0px fit contain frame rgba(0, 0, 0, 0)  
- video 398x236 (1.69) radius 0px fit contain frame rgba(0, 0, 0, 0)  
- video 398x236 (1.69) radius 0px fit contain frame rgba(0, 0, 0, 0)  
- video 398x237 (1.68) radius 0px fit contain frame rgba(0, 0, 0, 0)  
- video 398x234 (1.70) radius 0px fit contain frame rgba(0, 0, 0, 0)  
- video 398x235 (1.69) radius 0px fit contain frame rgba(0, 0, 0, 0)  

## Cards
4 card-like surfaces · sample: bg rgba(0, 0, 0, 0), border 1px solid rgba(255, 255, 255, 0.08), radius 16px, shadow none, pad 24px

## Footer
h 1181px, bg rgba(0, 0, 0, 0), pad 0px/0px, border-top 1px solid rgba(255, 255, 255, 0.08)
4 columns (370.656px 247.109px 247.109px 247.125px), 17 links
largest text: "scrolltide" Bricolage Grotesque 316.8px w800 rgba(0, 0, 0, 0)

## Motion
libs: gsap, lenis, framer, motion, three; transitions 595, animations 2, transforms 8, sticky 1, video 105, canvas 1, scroll-behavior smooth

## Mobile nav (390px)
height 65px, menu button true, visible: scrolltide · Menu
