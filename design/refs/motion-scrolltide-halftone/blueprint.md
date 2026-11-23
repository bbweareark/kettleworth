# Blueprint: motion / scrolltide halftone mono

Source: https://www.scrolltide.co/shaders
Title: Animated shader backgrounds · Scrolltide

## Type
Fonts by usage: Inter (923), Space Mono (10), Bricolage Grotesque (9)
- h1: Bricolage Grotesque 48px/48.96px w800 ls -1.44px  "Motion behind everything"
- h2: Bricolage Grotesque 72px/68.4px w800 ls -2.16px  "Ride the tide."
- h3: Inter 15px/22.5px w600 ls -0.375px  "Tide Swirl"
- body: Space Mono 11px/16.5px w400 ls 0.55px uppercase "SHADERS"
- link: Inter 16px/24px w400 ls normal  "scrolltide"

## Colour
Ground: body rgb(7, 8, 10) / html rgba(0, 0, 0, 0)
Ranked (role colour count):
- fg rgb(243, 245, 248)  x725
- border rgb(243, 245, 248)  x663
- fg rgb(154, 162, 173)  x117
- border rgb(154, 162, 173)  x106
- border rgba(255, 255, 255, 0.08)  x70
- fg rgb(91, 99, 110)  x68
- border rgb(91, 99, 110)  x68
- bg rgb(0, 0, 0)  x57
- bg rgb(11, 13, 16)  x56
- bg oklab(0.134026 -0.000681959 -0.00509647 / 0.7)  x56
- fg rgb(139, 243, 230)  x11
- border rgb(139, 243, 230)  x10
- fg rgb(4, 18, 31)  x8
- border rgb(4, 18, 31)  x8
- fg rgb(7, 8, 10)  x8
- border rgb(7, 8, 10)  x7
- bg rgb(243, 245, 248)  x4
- bg rgb(4, 18, 31)  x2
- bg oklab(0.134026 -0.000681959 -0.00509647 / 0.4)  x1
- fg lab(80.8059 21.7313 50.4455)  x1

## Layout
Page height 8831px. Container max-widths: 1280px (7), 448px (3), 768px (2), 320px (1). Base font 16px.
Radius ramp: 16px (110), 3.35544e+07px (89), 9px (2), 4px (1), 24px (1)
Shadows: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.14) 0px 0px 0px 1px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.8) 0px 30px 80px -20px

## Sections (top → bottom)
1. y=563 h=6991 pad 0px/0px bg rgba(0, 0, 0, 0) maxW none · "Tide Swirl" · flex none gap 8px (8 children) · media 55

## Navigation
position sticky, height 65px, bg rgba(0, 0, 0, 0), backdrop none, border 0px solid rgb(243, 245, 248), shadow none
13 links: scrolltide · Library · Components · Shaders · Sections · UI · MCPNEW · eBook · Pricing · FAQ
CTAs in nav: 1 [{"text":"Go Unlimited","bg":"rgb(243, 245, 248)","color":"rgb(7, 8, 10)","radius":"3.35544e+07px","height":36}]
link style: Inter 16px w400 ls normal none
after 900px scroll: height 65px, bg rgba(0, 0, 0, 0), backdrop none, shadow none, top 0

## Buttons (distinct styles, by frequency)
- "Library" x11: bg rgba(0, 0, 0, 0), fg rgb(154, 162, 173), border 0px solid rgb(154, 162, 173), radius 3.35544e+07px, h 32px, pad 6px 14px, Inter 14px w400 ls normal , shadow none
- "Gradient" x11: bg rgba(0, 0, 0, 0), fg rgb(154, 162, 173), border 1px solid rgba(255, 255, 255, 0.08), radius 3.35544e+07px, h 34px, pad 6px 14px, Inter 14px w400 ls normal , shadow none
- "scrolltide" x2: bg rgba(0, 0, 0, 0), fg rgb(243, 245, 248), border 0px solid rgb(243, 245, 248), radius 0px, h 32px, pad 0px, Inter 16px w400 ls normal , shadow none
- "Subscribe newsletter" x2: bg rgb(243, 245, 248), fg rgb(7, 8, 10), border 0px solid rgb(7, 8, 10), radius 3.35544e+07px, h 46px, pad 12px 24px, Inter 14px w600 ls normal , shadow none
- "Go Unlimited" x1: bg rgb(243, 245, 248), fg rgb(7, 8, 10), border 0px solid rgb(7, 8, 10), radius 3.35544e+07px, h 36px, pad 8px 16px, Inter 14px w500 ls normal , shadow none
- "Why Scrolltide? 3 min 35 sec" x1: bg oklab(0.746639 -0.0703368 -0.1263 / 0.07), fg rgb(243, 245, 248), border 1px solid oklab(0.746639 -0.0703368 -0.1263 / 0.35), radius 3.35544e+07px, h 66px, pad 14px 24px, Inter 16px w400 ls normal , shadow none
- "All" x1: bg rgb(243, 245, 248), fg rgb(7, 8, 10), border 1px solid rgba(0, 0, 0, 0), radius 3.35544e+07px, h 34px, pad 6px 14px, Inter 14px w400 ls normal , shadow none
- "Not now" x1: bg rgba(0, 0, 0, 0), fg rgb(91, 99, 110), border 0px solid rgb(91, 99, 110), radius 0px, h 28px, pad 6px 0px, Inter 12px w400 ls normal , shadow none

## Inputs
h 46px, bg oklab(0.185831 -0.00182673 -0.0111374 / 0.6), border 1px solid rgba(255, 255, 255, 0.08), radius 3.35544e+07px, pad 12px 20px, 14px, shadow none

## Imagery
55 images/videos; 1 large SVGs; 61 gradient surfaces; 1 blur blobs
- video 395x222 (1.78) radius 0px fit contain frame rgb(0, 0, 0)  
- video 395x222 (1.78) radius 0px fit contain frame rgb(0, 0, 0)  
- video 395x222 (1.78) radius 0px fit contain frame rgb(0, 0, 0)  
- video 395x222 (1.78) radius 0px fit contain frame rgb(0, 0, 0)  
- video 395x222 (1.78) radius 0px fit contain frame rgb(0, 0, 0)  
- video 395x222 (1.78) radius 0px fit contain frame rgb(0, 0, 0)  
- video 395x222 (1.78) radius 0px fit contain frame rgb(0, 0, 0)  
- video 395x222 (1.78) radius 0px fit contain frame rgb(0, 0, 0)  

## Cards
1 card-like surfaces · sample: bg rgb(11, 13, 16), border 1px solid rgba(255, 255, 255, 0.14), radius 24px, shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.8) 0px 30px 80px -20px, pad 32px

## Footer
h 1181px, bg rgba(0, 0, 0, 0), pad 0px/0px, border-top 1px solid rgba(255, 255, 255, 0.08)
4 columns (370.656px 247.109px 247.109px 247.125px), 17 links
largest text: "scrolltide" Bricolage Grotesque 316.8px w800 rgba(0, 0, 0, 0)

## Motion
libs: motion, three; transitions 268, animations 2, transforms 1, sticky 1, video 55, canvas 0, scroll-behavior smooth

## Mobile nav (390px)
height 65px, menu button true, visible: scrolltide · Menu
