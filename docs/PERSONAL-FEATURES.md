# Making Kettleworth feel personal

_What would make someone say "this app knows me" and keep paying for it. Ranked by how much it deepens the relationship per week of engineering. Written 14 Sep 2026._

Principle: personal means the app remembers, notices and adapts, then tells you what it did and why. Not more features; more memory and more voice.

## Build next (highest personal value)

1. **Weekly coach letter (Sunday evening).** One short message that reads your week back: what moved, what stalled, what the engine changed for next week and why, one thing to try. Written by the coach from real numbers, delivered in-app and by email or push. This is the single biggest "someone is watching" signal. Engine already produces the adaptations; this is packaging plus a scheduled job.
2. **Talk to the coach.** A chat surface with your full context (profile, plan, last 4 weeks of logs, readiness). "Should I train today, my knee feels tight?" "Swap Thursday to Friday." Every answer is grounded in your data and, where it changes the plan, applied through the rules engine with the change shown. This turns the app from a tool into a relationship.
3. **Rituals you set.** Pick a wake time, a training window, a weigh-in day, a photo day. The app then shows up at those moments (gentle notification, morning readiness, evening reflection) rather than whenever. Time is the most personal signal there is.
4. **Life mode switches.** Travelling, ill, injured, exam week, new baby. One tap tells the coach; the plan flexes (hotel-room bodyweight block, maintenance calories, shorter sessions) and switches back with a re-entry week. People leave apps when life changes and the app doesn't.
5. **Milestone stories.** First pull-up, bodyweight bench, 100th session, 10 kg on the squat. The app marks them with a card that shows the path there (chart plus the sessions that built it) and offers a share image. Growth points are the running score; milestones are the memories.

## Deepens the identity

6. **Your lifts, your names.** Rename exercises ("the Tuesday squat"), pin favourites, mark a lift as "mine". Small, but ownership language matters.
7. **Music and vibe per session type.** The intake already asks for vibe; play a matching Spotify or Apple Music playlist at session start, with a "silent focus" option.
8. **Training age and body age.** Show training age (weeks logged) and a readiness-derived "recovery age" trend. People love a number that is theirs.
9. **Photo-to-form check (mobile).** Record a set; the coach reads bar path and depth against your own previous reps, not a stranger's. Evidence for automated form feedback is thin, so frame it as "compare to your best rep".
10. **Meal plan that learns your kitchen.** Thumbs up/down on recipes, "I always have eggs", "no fish on weekdays". The plan should feel like it was written by someone who has seen your fridge.

## Social, but personal first

11. **One accountability partner before any feed.** Match with one person on the same split and schedule; see each other's completed sessions only; a nudge if one goes quiet. Intimacy beats an audience.
12. **Coach-verified group challenges.** "4 sessions a week for 4 weeks" with the engine confirming it, not screenshots.

## Quiet, high-trust details

13. **"Why this" on every number.** Already the rule in the engine; extend it to nutrition targets and readiness, and make each one tappable to the evidence page.
14. **Undo for the plan.** Any adaptation can be reverted with one tap and the coach learns from it ("keep my squat weight next time").
15. **Data you can leave with.** Export exists; add "send me my year in review" in December.

## What I would not build
- Generic gamification (badges for opening the app). Growth points already reward real work only.
- Public leaderboards by default. Opt-in only, per the brief.
- AI-generated body images. Silhouettes and the user's own photos are more honest and more premium.

## Weekly check-in (added 14 September 2026)
Every Monday the engine runs `runWeeklyAdaptation` (lazily on the Today page, and from the weekly cron before letters). It reads last week's completion and RPE, applies volume, intensity or deload changes, and detects stale exercises. The Today page then asks one question: stay the course, something fresh, or ease off. "Fresh" rotates accessories while anchors stay; "ease" drops loads 8 percent; "keep" leaves the engine's decision in place. Every applied change is stored on the week with a reason and surfaces in the coach pulse and the letter.

## Community (added 14 September 2026)
Private by default. A member creates a handle and picks visibility (private, members, public). Matching runs `rankMatches` over opted-in profiles only, scoring shared goals, styles, level, days per week, preferred time and city. Partners accept each other and get a private thread. Groups have posts, replies and reactions. Challenges score completed sessions automatically. Block and report exist on every card and post.
