# Evidence base for the Kettleworth engine

_Every rule in `packages/core` maps to a line here. When a rule changes, this file changes. Last reviewed 13 Sep 2026._

Kettleworth is not medical advice. The evidence below is from peer-reviewed meta-analyses and randomised trials in healthy adults; individual responses vary, which is exactly why the engine adapts from logged data rather than trusting averages.

## Programme design

| Rule in the engine | What we do | Evidence | Confidence |
|---|---|---|---|
| Train each muscle at least twice a week when days allow (`split.ts`) | 2 to 3 days: full-body; 4: upper/lower; 5 to 6: PPL variants | Schoenfeld, Grgic & Krieger 2019 meta-analysis: with volume equated, frequency does not change hypertrophy, but training a muscle 2+ times a week produces modestly better strength gains. Pelland et al. 2025 meta-regression (67 studies) supports a positive volume dose-response with diminishing returns. | High |
| Start volume around 10 to 12 working sets per muscle per week and ramp ~10% per week inside a block (`generate.ts`) | Volume scalar 1.0 to 1.2 over 3 weeks | Schoenfeld, Ogborn & Krieger 2017 dose-response meta-analysis: 10+ weekly sets per muscle produce greater growth than fewer; Pelland 2025 shows gains continue with more volume but flatten. Ramping lets us find each person's ceiling from soreness and RPE logs instead of guessing. | High for the direction, moderate for the exact numbers |
| Hypertrophy sets stop 1 to 3 reps short of failure (`prescription.ts` RIR 1 to 3) | RPE 8 to 9 targets | Robinson et al. 2024 meta-regression: hypertrophy rises modestly as sets get closer to failure; strength gains are essentially unrelated to proximity to failure. Refalo et al. 2024 RCT: 1 to 2 RIR matched training to failure for quadriceps growth in trained adults. Leaving reps in reserve preserves quality and recovery at little cost. | High |
| Strength work at 3 to 5 reps around RPE 8, long rests | `prescription.ts` strength branch | Same Robinson 2024 finding (failure not needed for strength) plus the specificity principle: heavy loads drive 1RM. 3-minute rests preserve output on compounds (Schoenfeld 2016 rest-interval RCT). | High |
| Deload = 50% volume and 10% lighter, not a week off (`generate.ts`) | Every 4th week | Coleman et al. 2024 RCT: a complete week off mid-block did not hurt hypertrophy but slightly reduced strength versus continuous training. A light week keeps the skill and load while dropping fatigue, which is the standard periodisation compromise; we also trigger an unplanned deload only when fatigue, soreness and sleep signals stack (`adaptation.ts`). | Moderate |
| Anchor lifts fixed within a block, accessories rotate between blocks (`varietyPreference`) | balanced = rotate accessories per block; high = every 2 weeks; steady = never | Kassiano et al. 2022 systematic review: systematic exercise variation can improve regional hypertrophy and strength; excessive or random variation hinders gains. Baz-Valle et al. 2019 RCT: randomly varied exercise selection matched fixed selection for strength and thickness while improving intrinsic motivation. So: enough variety to stay motivated, never at the cost of practising the big lifts. | Moderate |
| Double progression: add load once every set hits the top of the rep range at target RPE (`progression.ts`) | +1.25 kg upper, +2.5 kg lower; drop 7.5% after repeated misses | Progressive overload is the foundational principle (ACSM position stand 2009). Double progression is the standard auto-regulated implementation used in the trials above; RIR-based prescriptions are feasible and reliable in trained lifters (Helms et al. 2016; scoping review 2024). | High |
| Same-day activity (a run, a ride, a class) eases tonight's session (`readiness.ts`) | Penalty scaled by minutes × intensity | Concurrent training interference is small overall but acute fatigue from hard endurance work reduces same-day strength output (Wilson et al. 2012 meta-analysis; Schumann et al. 2022 meta-analysis on concurrent training). Easing loads on those days protects technique. | Moderate |
| Readiness from HRV, resting HR and sleep vs your own 7-day baseline | Low readiness = loads eased 15% | HRV-guided training meta-analyses (Manresa-Rocamora 2021; Düking 2021) show equal or better aerobic gains with fewer hard sessions when training is adjusted to daily HRV. Evidence in strength training is thinner, so we use readiness only to modulate intensity by up to 15%, never to skip sessions. | Moderate for endurance, low-moderate for strength |

## Nutrition

| Rule | Evidence | Confidence |
|---|---|---|
| Protein 1.6 to 2.2 g/kg (2.0 in a deficit) | Morton et al. 2018 meta-analysis (49 RCTs, 1,863 people): fat-free mass gains plateau at ~1.6 g/kg/day; the upper end of the CI supports up to 2.2 g/kg. Higher intake in a deficit protects lean mass (Helms et al. 2014 review). | High |
| Fat loss deficit ~18% with a target loss of ~0.5 to 0.7% bodyweight a week; add calories back if losing >1 kg/week | Garthe et al. 2011 RCT in athletes: 0.7%/week loss gained lean mass and strength; 1.4%/week did not. | High |
| Calorie floors (1,200 F / 1,500 M and never below BMR × 1.05) | Very-low-calorie approaches without supervision increase lean mass loss and dropout; floors follow common clinical guidance for unsupervised dieting. | Moderate (safety rule, deliberately conservative) |
| Training-day calories +8% (carb-biased), rest days −8% | Carbohydrate availability supports high-volume resistance performance (Henselmans et al. 2022 review of carbohydrate and resistance training); calorie cycling keeps the weekly average identical, so adherence, not physiology, is the main reason. | Moderate |

## What we deliberately do not claim
- That any rep range is "the" hypertrophy range: 6 to 30 reps produce similar growth when effort is matched (Schoenfeld 2021 loading meta-analysis). We choose ranges for practicality and joint tolerance.
- That HRV can diagnose overtraining. It modulates a day, it does not diagnose.
- That AI improves outcomes. The model writes explanations and asks questions; every number comes from the rules above.

## Sources
- Pelland JC et al. The Resistance Training Dose Response: meta-regressions of weekly volume and frequency. Sports Medicine 2025. https://pubmed.ncbi.nlm.nih.gov/41343037/
- Schoenfeld BJ, Ogborn D, Krieger JW. Dose-response between weekly volume and hypertrophy. J Sports Sci 2017. https://pubmed.ncbi.nlm.nih.gov/27433992/
- Schoenfeld BJ, Grgic J, Krieger J. Training frequency and hypertrophy meta-analysis. J Sports Sci 2019. https://pubmed.ncbi.nlm.nih.gov/30558493/
- Robinson ZP et al. Proximity to failure, strength and hypertrophy meta-regressions. Sports Medicine 2024. https://pubmed.ncbi.nlm.nih.gov/38970765/
- Refalo MC et al. Failure vs repetitions-in-reserve RCT. J Sports Sci 2024. https://www.tandfonline.com/doi/full/10.1080/02640414.2024.2321021
- Coleman M et al. One-week deload RCT. PeerJ 2024. https://peerj.com/articles/16777/
- Kassiano W et al. Does varying resistance exercises promote superior gains? Systematic review. 2022. https://pubmed.ncbi.nlm.nih.gov/35438660/
- Baz-Valle E et al. Exercise variation, muscle thickness, strength and motivation RCT. PLOS One 2019. https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0226989
- Morton RW et al. Protein supplementation meta-analysis. Br J Sports Med 2018. https://pubmed.ncbi.nlm.nih.gov/28698222/
- Garthe I et al. Two weight-loss rates in elite athletes. IJSNEM 2011. https://pubmed.ncbi.nlm.nih.gov/21558571/
- Manresa-Rocamora A et al. HRV-guided training systematic review with meta-analysis. 2021. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8507742/
- Düking P et al. Monitoring and adapting endurance training on HRV. J Sci Med Sport 2021. https://www.sciencedirect.com/science/article/pii/S1440244021001080
