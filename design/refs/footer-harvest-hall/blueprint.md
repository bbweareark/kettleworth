# Blueprint: footer / Harvest Hall

Source: https://www.harvesthall.io/
Title: Harvest Hall（ハーベスト・ホール）｜日本の現代アートプラットフォーム

## Type
Fonts by usage: STIX Two Text (1123), GenInterfaceJP (993), Inter Tight (117)
- h1: STIX Two Text 76px/76px w400 ls -1.52px  "Share your thoughts. Share your KANDO."
- h2: GenInterfaceJP 14px/16.1px w400 ls normal  "Features"
- h3: STIX Two Text 64px/63.36px w400 ls -1.536px  "What's on today? What's on today?"
- body: Inter Tight 28px/33.6px w400 ls normal  "Calendar"
- small: Inter Tight 12px/13.8px w400 ls normal  "© 2026 Harvest Hall"
- link: GenInterfaceJP 14px/16.1px w400 ls normal  ""

## Colour
Ground: body rgb(253, 253, 253) / html rgba(0, 0, 0, 0)
Ranked (role colour count):
- fg rgb(70, 70, 90)  x1505
- border rgb(70, 70, 90)  x1371
- fg rgb(20, 115, 200)  x583
- border rgb(20, 115, 200)  x583
- border rgb(229, 229, 231)  x131
- fg rgb(160, 160, 176)  x76
- border rgb(160, 160, 176)  x76
- bg rgb(244, 243, 242)  x73
- bg rgb(20, 115, 200)  x46
- fg rgb(244, 243, 242)  x38
- bg rgb(253, 253, 253)  x37
- border rgb(244, 243, 242)  x37
- fg rgb(253, 253, 253)  x20
- border rgb(253, 253, 253)  x20
- fg rgb(119, 119, 138)  x10
- border rgb(119, 119, 138)  x10
- bg rgb(244, 245, 239)  x3
- border rgb(0, 0, 0)  x3
- bg rgb(70, 70, 90)  x2
- bg rgb(229, 229, 231)  x2

## Layout
Page height 15095px. Container max-widths: 1600px (4), 1440px (2), 1300px (1), 300px (1). Base font 1px.
Radius ramp: 4px (79), 999px (68), 1440px (22), 2px (9), 40px (3), 6px (3)
Shadows: rgba(0, 0, 0, 0.06) 0px 1px 4px 0px

## Sections (top → bottom)
1. y=0 h=14115 pad 0px/0px bg rgba(0, 0, 0, 0) maxW none · "Share your thoughts. Share your KANDO." · flex none gap 6px (2 children) · media 94
2. y=214 h=765 pad 0px/0px bg rgb(249, 249, 249) maxW none · "Share your thoughts. Share your KANDO." · flex none gap 6px (2 children) · media 2
3. y=1566 h=3284 pad 120px/0px bg rgba(0, 0, 0, 0) maxW none · "Features" · flex none gap normal (3 children) · media 3
4. y=4850 h=1065 pad 0px/0px bg rgba(0, 0, 0, 0) maxW none · "# 術 TechDiumMory" · flex none gap 24px (4 children) · media 42
5. y=5914 h=3685 pad 0px/0px bg rgba(0, 0, 0, 0) maxW none · "Category" · flex none gap normal (2 children) · media 14
6. y=9600 h=1716 pad 130px/130px bg rgba(0, 0, 0, 0) maxW 1600px · "Join" · flex none gap 8px (2 children) · media 23
7. y=11315 h=1034 pad 170px/180px bg rgb(20, 115, 200) maxW none · "MyStudio MyStudio" · flex none gap 14px (2 children) · media 6
8. y=12349 h=1166 pad 140px/140px bg rgba(0, 0, 0, 0) maxW 1600px · "Data" · grid 95px 95px 95px 95px 95px 95px 95px 95px 95px 95px 95px 95px gap 60px 20px (2 children) · media 3
9. y=13515 h=600 pad 0px/0px bg rgba(0, 0, 0, 0) maxW none · "JOIN HARVEST HALL JOIN HARVEST HALL" · media 0

## Navigation
position fixed, height 43px, bg rgb(253, 253, 253), backdrop none, border 1px solid rgb(229, 229, 231), shadow none
6 links:  · Calendar · Artists · MyStudio · アカウント登録 · ログイン
CTAs in nav: 2 [{"text":"アカウント登録","bg":"rgb(20, 115, 200)","color":"rgb(70, 70, 90)","radius":"4px","height":31},{"text":"ログイン","bg":"rgb(244, 243, 242)","color":"rgb(70, 70, 90)","radius":"4px","height":33}]
link style: GenInterfaceJP 14px w400 ls normal none
after 900px scroll: height 43px, bg rgb(253, 253, 253), backdrop none, shadow none, top 0

## Buttons (distinct styles, by frequency)
- "イベント詳細を見る" x20: bg rgb(20, 115, 200), fg rgb(253, 253, 253), border 0px none rgb(253, 253, 253), radius 4px, h 55px, pad 20px 0px, GenInterfaceJP 13px w400 ls normal , shadow none
- "アカウント登録" x5: bg rgb(20, 115, 200), fg rgb(70, 70, 90), border 0px none rgb(70, 70, 90), radius 4px, h 31px, pad 8px 10px 6px, GenInterfaceJP 14px w400 ls normal , shadow none
- "" x5: bg rgba(0, 0, 0, 0), fg rgb(70, 70, 90), border 0px none rgb(70, 70, 90), radius 0px, h 30px, pad 0px, GenInterfaceJP 14px w400 ls normal , shadow none
- "ログイン" x3: bg rgb(244, 243, 242), fg rgb(70, 70, 90), border 1px solid rgb(229, 229, 231), radius 4px, h 33px, pad 8px 10px 6px, GenInterfaceJP 14px w400 ls normal , shadow none
- "アカウント登録" x1: bg rgb(20, 115, 200), fg rgb(244, 243, 242), border 1px solid rgb(229, 229, 231), radius 4px, h 43px, pad 0px 20px, GenInterfaceJP 14px w400 ls normal , shadow none
- "はじめてのHarvest Hall" x1: bg rgb(20, 115, 200), fg rgb(70, 70, 90), border 1px solid rgb(229, 229, 231), radius 4px, h 41px, pad 10px 20px, GenInterfaceJP 14px w400 ls normal , shadow none
- "フィルター" x1: bg rgba(0, 0, 0, 0), fg rgb(70, 70, 90), border 1px solid rgb(229, 229, 231), radius 1440px, h 32px, pad 8px 18px, GenInterfaceJP 12px w400 ls normal , shadow none
- "Discord" x1: bg rgb(244, 243, 242), fg rgb(70, 70, 90), border 1px solid rgb(129, 146, 235), radius 4px, h 40px, pad 10px 18px 10px 14px, GenInterfaceJP 14px w400 ls normal , shadow none

## Inputs
h 15px, bg rgba(0, 0, 0, 0), border 0px none rgb(70, 70, 90), radius 0px, pad 0px, 13px, shadow none

## Imagery
43 images/videos; 0 large SVGs; 0 gradient surfaces; 0 blur blobs
- canvas 1440x765 (1.88) radius 0px fit fill frame rgba(0, 0, 0, 0)  
- video 1308x700 (1.87) radius 0px fit cover frame rgba(0, 0, 0, 0)  
- video 192x386 (0.50) radius 40px fit cover frame rgba(0, 0, 0, 0)  
- video 192x386 (0.50) radius 40px fit cover frame rgba(0, 0, 0, 0)  
- video 245x487 (0.50) radius 40px fit cover frame rgba(0, 0, 0, 0)  
- img 187x280 (0.67) radius 0px fit contain frame rgba(0, 0, 0, 0)  "# 術 TechDiumMory"
- img 198x280 (0.71) radius 0px fit contain frame rgba(0, 0, 0, 0)  "大河紀 個展「穴 THE HOLE」"
- img 187x280 (0.67) radius 0px fit contain frame rgba(0, 0, 0, 0)  "ISO1638400 exhibition「Fūten」"

## Cards
0 card-like surfaces

## Footer
h 980px, bg rgba(0, 0, 0, 0), pad 0px/0px, border-top 0px none rgb(70, 70, 90)
5 columns (none), 6 links
largest text: "Join Harvest Hall NOW 今すぐ登録 コミュニティに参加 Di" GenInterfaceJP 14px w400 rgb(70, 70, 90)

## Motion
libs: lenis, three; transitions 155, animations 1, transforms 575, sticky 5, video 4, canvas 3, scroll-behavior auto

## Mobile nav (390px)
height 53px, menu button true, visible: A · メニューを開く
