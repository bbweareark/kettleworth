/** Matching: like-minded people by goals, style, level, schedule and place. Pure scoring, explainable, private by default (callers only pass opted-in profiles). */
export type MatchProfile = { userId: string; goals: string[]; styles: string[]; level: string; daysPerWeek: number; preferredTime?: string | null; city?: string | null; country?: string | null; lat?: number | null; lng?: number | null; trainTogether: boolean };
export type MatchResult = { userId: string; score: number; reasons: string[] };

const LEVELS = ["beginner", "novice", "intermediate", "advanced"];
const km = (a: MatchProfile, b: MatchProfile) => { if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null; const R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180; const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };

export function scoreMatch(me: MatchProfile, other: MatchProfile): MatchResult {
  let score = 0; const reasons: string[] = [];
  const goals = me.goals.filter((g) => other.goals.includes(g));
  if (goals.length) { score += 30 + 10 * (goals.length - 1); reasons.push(`Same goal: ${goals.map((g) => g.replace("_", " ")).join(", ")}`); }
  const styles = me.styles.filter((s) => other.styles.includes(s));
  if (styles.length) { score += 15 + 5 * (styles.length - 1); reasons.push(`Trains ${styles.map((s) => s.replace("_", " ")).join(" and ")} too`); }
  const lvl = Math.abs(LEVELS.indexOf(me.level) - LEVELS.indexOf(other.level));
  if (lvl === 0) { score += 15; reasons.push("Same level"); } else if (lvl === 1) score += 7;
  const days = Math.abs(me.daysPerWeek - other.daysPerWeek);
  if (days === 0) { score += 10; reasons.push(`${me.daysPerWeek} days a week, like you`); } else if (days === 1) score += 5;
  if (me.preferredTime && me.preferredTime === other.preferredTime) { score += 10; reasons.push(`Trains in the ${me.preferredTime.replace("_", " ")} too`); }
  const d = km(me, other);
  if (d != null) { if (d < 5) { score += 20; reasons.push("Within 5 km"); } else if (d < 25) { score += 10; reasons.push("Within 25 km"); } }
  else if (me.city && other.city && me.city.toLowerCase() === other.city.toLowerCase()) { score += 15; reasons.push(`Also in ${other.city}`); }
  if (me.trainTogether && other.trainTogether) { score += 10; reasons.push("Open to training together"); }
  return { userId: other.userId, score: Math.min(100, score), reasons };
}
export function rankMatches(me: MatchProfile, others: MatchProfile[], limit = 10): MatchResult[] {
  return others.filter((o) => o.userId !== me.userId).map((o) => scoreMatch(me, o)).filter((m) => m.score >= 25).sort((a, b) => b.score - a.score).slice(0, limit);
}
