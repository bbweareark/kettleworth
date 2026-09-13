/**
 * Rest Deck content: what the app offers during rest countdowns. Every fact and quiz answer is drawn from docs/EVIDENCE.md
 * so nothing is trivia for its own sake: the user learns the reasoning behind their own plan while they recover.
 */
export type Quiz = { id: string; q: string; options: string[]; answer: number; why: string; tag: "volume" | "effort" | "frequency" | "nutrition" | "recovery" | "technique" | "variety" };
export type Fact = { id: string; text: string; tag: Quiz["tag"] };

export const QUIZ_BANK: Quiz[] = [
  { id: "q1", q: "For muscle growth, how close to failure do sets need to be?", options: ["Every set to failure", "1 to 3 reps in reserve is nearly as good", "Stop at 5 reps in reserve"], answer: 1, why: "Meta-analyses show hypertrophy rises only modestly as sets approach failure; 1 to 2 reps in reserve matched failure in a 2024 trial, with far less fatigue.", tag: "effort" },
  { id: "q2", q: "Does training to failure improve strength gains?", options: ["Yes, a lot", "No meaningful effect", "Only for beginners"], answer: 1, why: "Robinson et al. 2024: strength gains were essentially unrelated to proximity to failure. Heavy, well-practised reps drive strength.", tag: "effort" },
  { id: "q3", q: "Volume is equal. Does training a muscle 3 times a week beat once a week for size?", options: ["Yes, much more growth", "About the same growth, modestly better strength", "Once a week is better"], answer: 1, why: "Schoenfeld 2019: with volume matched, frequency doesn't change hypertrophy, but 2+ sessions a week give modestly better strength.", tag: "frequency" },
  { id: "q4", q: "Roughly how many weekly working sets per muscle does growth start to flatten around?", options: ["4", "10 to 20", "40"], answer: 1, why: "Dose-response meta-analyses show more volume helps with diminishing returns; ~10 sets is a solid floor and gains flatten past ~20 for most people.", tag: "volume" },
  { id: "q5", q: "Which protein intake is enough to maximise muscle gain for most lifters?", options: ["0.8 g per kg", "1.6 g per kg", "4 g per kg"], answer: 1, why: "Morton et al. 2018 (49 trials): fat-free mass gains plateau at about 1.6 g/kg/day, with the range extending to 2.2 g/kg.", tag: "nutrition" },
  { id: "q6", q: "In athletes cutting weight, which loss rate gained lean mass and strength?", options: ["0.7% bodyweight a week", "1.4% bodyweight a week", "3% bodyweight a week"], answer: 0, why: "Garthe 2011: the slower group (0.7%/week) gained lean mass and 1RM; the faster group did not.", tag: "nutrition" },
  { id: "q7", q: "A full week off mid-block versus training through. What did the 2024 trial find?", options: ["Week off grew more muscle", "Same muscle, slightly less strength with the week off", "Week off doubled strength"], answer: 1, why: "Coleman 2024: hypertrophy was equal; the full week off cost a little strength. That's why Kettleworth deloads lightly instead of stopping.", tag: "recovery" },
  { id: "q8", q: "What does a light deload week keep that a week off loses?", options: ["The skill and the load", "Nothing", "Only motivation"], answer: 0, why: "Half volume at 90% load clears fatigue while keeping technique practice and neural drive.", tag: "recovery" },
  { id: "q9", q: "Randomly changing exercises every session versus a fixed list: what happened to strength?", options: ["Random was worse", "Same strength, better motivation", "Random was much better"], answer: 1, why: "Baz-Valle 2019: strength and thickness matched; the varied group reported higher intrinsic motivation. Systematic variety is the sweet spot.", tag: "variety" },
  { id: "q10", q: "Why do main lifts stay fixed inside a block in your plan?", options: ["To save time", "Skill and load need repeated practice to climb", "Because variety is bad"], answer: 1, why: "Anchors give you the repetitions to master the movement and progress load; accessories carry the variety.", tag: "variety" },
  { id: "q11", q: "Which rep range grows muscle best when effort is matched?", options: ["Only 8 to 12", "Anything from about 6 to 30", "Only 1 to 5"], answer: 1, why: "Loading meta-analyses find similar growth from 6 to 30 reps when sets are hard. Ranges are chosen for practicality and joints.", tag: "volume" },
  { id: "q12", q: "How long should you rest between heavy compound sets for strength?", options: ["30 seconds", "2 to 3 minutes or more", "It doesn't matter"], answer: 1, why: "Longer rests preserve output on compounds; 3 minutes beat 1 minute for strength and size in Schoenfeld's 2016 trial.", tag: "recovery" },
  { id: "q13", q: "Your HRV is well below your 7-day average. What does Kettleworth do?", options: ["Cancels the session", "Eases loads up to 15%", "Adds volume"], answer: 1, why: "Readiness only modulates intensity, never skips training. HRV-guided training shows equal or better gains with fewer hard days.", tag: "recovery" },
  { id: "q14", q: "You did a hard 50 minute ride this morning. Tonight's lifting?", options: ["Same loads", "Loads eased, technique first", "Skip it"], answer: 1, why: "Acute fatigue from hard endurance work reduces same-day strength output; easing protects form.", tag: "recovery" },
  { id: "q15", q: "Which of these preserves lean mass most in a calorie deficit?", options: ["Cardio only", "Lifting plus 2 g/kg protein", "Very low calories"], answer: 1, why: "Resistance training with high protein is what keeps muscle while fat comes off; crash deficits cost lean mass.", tag: "nutrition" },
  { id: "q16", q: "In the bench press, where should your shoulder blades be?", options: ["Relaxed", "Pulled back and down, pinned to the bench", "Shrugged up"], answer: 1, why: "Retracted and depressed scapulae give a stable base and protect the shoulder.", tag: "technique" },
  { id: "q17", q: "Deadlift: what should happen before the bar leaves the floor?", options: ["Yank it", "Pull the slack out and build tension", "Look at the ceiling"], answer: 1, why: "Taking the slack out puts the whole body under tension so the hips and bar rise together.", tag: "technique" },
  { id: "q18", q: "Squat: the hips shoot up first and the chest drops. What is it?", options: ["Perfect", "A good-morning squat; keep chest and hips rising together", "Extra glute work"], answer: 1, why: "Hips rising early shifts load to the lower back. Drive the chest up with the hips.", tag: "technique" },
  { id: "q19", q: "Double progression means:", options: ["Two exercises per muscle", "Add reps to the top of the range, then add load", "Double the sets each week"], answer: 1, why: "Once every set hits the top of the range at target RPE, load goes up and reps reset to the bottom.", tag: "volume" },
  { id: "q20", q: "RPE 8 means:", options: ["8 reps", "About 2 reps left in the tank", "80% of max"], answer: 1, why: "RPE 8 ≈ 2 reps in reserve. Kettleworth's hypertrophy sets live at RPE 8 to 9.", tag: "effort" },
  { id: "q21", q: "What does the deload week change in your plan?", options: ["Volume to 50%, load to 90%", "Nothing", "Only rest times"], answer: 0, why: "Half the working sets, 10% lighter: fatigue drops while the skill is kept.", tag: "recovery" },
  { id: "q22", q: "Which sleep amount starts easing your loads in Kettleworth?", options: ["Under 8 hours", "Under 6 hours", "Sleep doesn't matter"], answer: 1, why: "Short sleep impairs recovery and force output; below 6 hours the plan eases target loads.", tag: "recovery" },
  { id: "q23", q: "Training-day calories in your plan are:", options: ["Same as rest days", "About 8% higher, mostly carbs", "Half"], answer: 1, why: "Carbohydrate availability supports high-volume lifting; the weekly average still lands on target.", tag: "nutrition" },
  { id: "q24", q: "Why does the app never program an exercise you marked as hated?", options: ["It might", "Adherence beats optimality: the best plan is the one you do", "For legal reasons"], answer: 1, why: "Consistency is the biggest predictor of results, so disliked movements are excluded and substitutes are offered instead.", tag: "variety" },
];

export const FACT_BANK: Fact[] = [
  { id: "f1", text: "Muscle protein synthesis stays elevated for about 24 to 48 hours after a session. That's why hitting each muscle twice a week fits the biology.", tag: "frequency" },
  { id: "f2", text: "Between sets, the phosphocreatine you use for heavy reps is mostly restored in 2 to 3 minutes. Short rests on heavy work cut the next set's quality.", tag: "recovery" },
  { id: "f3", text: "Slow nasal breathing during rest speeds heart-rate recovery. Try the Breathe card.", tag: "recovery" },
  { id: "f4", text: "A rep with a controlled lowering phase produces more muscle damage signal than a dropped one. Tempo is free volume.", tag: "technique" },
  { id: "f5", text: "Logged sets are the only data the plan uses to progress you. Honest numbers beat impressive ones.", tag: "effort" },
  { id: "f6", text: "The first two weeks of a new exercise are mostly neural: technique, not size. The weight will feel different by week three.", tag: "variety" },
  { id: "f7", text: "Creatine monohydrate is the most researched supplement in sport: 3 to 5 g a day, no loading needed.", tag: "nutrition" },
  { id: "f8", text: "Soreness is a poor gauge of a good session. Progress in the log is a better one.", tag: "recovery" },
];

/** Deterministic pick that avoids repeats within a session. */
export function pickRestContent(seedKey: string, seen: string[], restSeconds: number): { kind: "quiz" | "fact" | "breathe" | "predict"; quiz?: Quiz; fact?: Fact } {
  const h = [...seedKey].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const unseenQ = QUIZ_BANK.filter((q) => !seen.includes(q.id));
  const unseenF = FACT_BANK.filter((f) => !seen.includes(f.id));
  if (restSeconds < 45) return unseenF.length ? { kind: "fact", fact: unseenF[h % unseenF.length] } : { kind: "breathe" };
  const roll = h % 10;
  if (roll < 5 && unseenQ.length) return { kind: "quiz", quiz: unseenQ[h % unseenQ.length] };
  if (roll < 7) return { kind: "breathe" };
  if (roll < 8) return { kind: "predict" };
  return unseenF.length ? { kind: "fact", fact: unseenF[h % unseenF.length] } : unseenQ.length ? { kind: "quiz", quiz: unseenQ[h % unseenQ.length] } : { kind: "breathe" };
}

/** Box breathing pattern sized to the rest available. */
export function breathingPattern(restSeconds: number): { inhale: number; hold: number; exhale: number; cycles: number } {
  const cycle = restSeconds >= 120 ? 16 : 12; // 4-4-8 or 3-3-6
  const cycles = Math.max(2, Math.floor((restSeconds - 5) / cycle));
  return cycle === 16 ? { inhale: 4, hold: 4, exhale: 8, cycles } : { inhale: 3, hold: 3, exhale: 6, cycles };
}
