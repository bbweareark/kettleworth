/**
 * Physique progression engine. Combines what the coach reads from photos (a body-fat range) with what is measured
 * (weight, waist) into a plausible, smoothed timeline, and turns activity into Growth points that only ever rise.
 * Everything here is deterministic and explainable; the AI only supplies the per-photo read.
 */
export type PhysiqueEntry = { date: string; bfLow?: number | null; bfHigh?: number | null; weightKg?: number | null; waistCm?: number | null; source: "photo" | "measurement" };
export type PhysiquePoint = { date: string; bodyFatPct: number | null; bodyFatLow: number | null; bodyFatHigh: number | null; weightKg: number | null; leanMassKg: number | null; fatMassKg: number | null; waistCm: number | null; confidence: number; note: string | null };

const MAX_BF_CHANGE_PER_WEEK = 0.75; // percentage points; faster than this is measurement noise or lighting, not physiology

export function physiqueTimeline(entries: PhysiqueEntry[]): PhysiquePoint[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const out: PhysiquePoint[] = [];
  let lastWeight: number | null = null, lastBf: number | null = null, lastBfDate: string | null = null;
  for (const e of sorted) {
    if (e.weightKg != null) lastWeight = e.weightKg;
    let bf: number | null = null, lo: number | null = null, hi: number | null = null, note: string | null = null, confidence = 0.5;
    if (e.bfLow != null && e.bfHigh != null) {
      lo = e.bfLow; hi = e.bfHigh; bf = (lo + hi) / 2;
      confidence = Math.max(0.2, 1 - (hi - lo) / 12); // a 5-point range ≈ 0.6, a 10-point range ≈ 0.2
      if (lastBf != null && lastBfDate) {
        const weeks = Math.max(1, (new Date(e.date).getTime() - new Date(lastBfDate).getTime()) / (7 * 86400000));
        const maxDelta = MAX_BF_CHANGE_PER_WEEK * weeks;
        if (Math.abs(bf - lastBf) > maxDelta) { const clamped: number = lastBf + Math.sign(bf - lastBf) * maxDelta; note = `Read moved ${Math.abs(bf - lastBf).toFixed(1)} points in ${weeks.toFixed(0)} wk; smoothed to ${clamped.toFixed(1)}% because bodies don't change that fast. Lighting or pose likely differed.`; bf = clamped; confidence *= 0.7; }
      }
      lastBf = bf; lastBfDate = e.date;
    } else if (lastBf != null) { bf = lastBf; confidence = 0.35; }
    const lean = bf != null && lastWeight != null ? lastWeight * (1 - bf / 100) : null;
    out.push({ date: e.date, bodyFatPct: bf != null ? Math.round(bf * 10) / 10 : null, bodyFatLow: lo, bodyFatHigh: hi, weightKg: lastWeight, leanMassKg: lean != null ? Math.round(lean * 10) / 10 : null, fatMassKg: lean != null && lastWeight != null ? Math.round((lastWeight - lean) * 10) / 10 : null, waistCm: e.waistCm ?? null, confidence: Math.round(confidence * 100) / 100, note });
  }
  return out;
}

export type GrowthInputs = { sessionsCompleted: number; prs: number; weighIns: number; photoSets: number; streakWeeks: number; setsLogged: number; activitiesLogged: number; restLearned?: number };
/** Growth points never decrease: every completed action adds. Weighted so consistency (sessions, streak) dominates. */
export function growthPoints(g: GrowthInputs): { total: number; breakdown: { label: string; points: number }[]; level: number; nextLevelAt: number } {
  const breakdown = [
    { label: "Sessions completed", points: g.sessionsCompleted * 100 },
    { label: "Sets logged", points: g.setsLogged * 2 },
    { label: "Personal records", points: g.prs * 60 },
    { label: "Weigh-ins", points: g.weighIns * 20 },
    { label: "Body checks", points: g.photoSets * 80 },
    { label: "Other activity", points: g.activitiesLogged * 30 },
    { label: "Streak bonus", points: Math.min(10, g.streakWeeks) * 50 },
    { label: "Rest deck", points: (g.restLearned ?? 0) * 10 },
  ];
  const total = breakdown.reduce((a, b) => a + b.points, 0);
  // Levels widen: 500, 1200, 2100, 3200 ... (n^2 * 100 + 400n)
  let level = 0; while (total >= levelAt(level + 1)) level++;
  return { total, breakdown, level, nextLevelAt: levelAt(level + 1) };
}
const levelAt = (n: number) => n * n * 100 + 400 * n;

/** Trend summary for a series: slope per week and a plain sentence. */
export function trend(points: { date: string; value: number | null }[], unit: string, lowerIsBetter = false): { perWeek: number | null; sentence: string } {
  const p = points.filter((x) => x.value != null) as { date: string; value: number }[];
  if (p.length < 2) return { perWeek: null, sentence: "Two or more readings are needed for a trend." };
  const first = p[0]!, last = p[p.length - 1]!;
  const weeks = Math.max(1, (new Date(last.date).getTime() - new Date(first.date).getTime()) / (7 * 86400000));
  const perWeek = (last.value - first.value) / weeks;
  const good = lowerIsBetter ? perWeek < 0 : perWeek > 0;
  const abs = Math.abs(perWeek);
  return { perWeek: Math.round(perWeek * 100) / 100, sentence: abs < 0.05 ? `Holding steady at ${last.value}${unit}.` : `${good ? "Moving the right way" : "Drifting"}: ${abs.toFixed(2)}${unit} per week over ${weeks.toFixed(0)} weeks.` };
}
