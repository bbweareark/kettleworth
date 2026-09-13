import { z } from "zod";
import { getProfile, intakeFollowUp, extractFromAnswer, upsertProfile, aiAvailable } from "@kettleworth/api";
import { route } from "@/lib/api";

/** After a stage: ask the AI whether one follow-up question is worth asking. Returns null when AI is off or nothing to ask. */
export const POST = route(z.object({ stage: z.string(), answer: z.string().optional(), question: z.string().optional() }), async ({ userId, body }) => {
  const rec = await getProfile(userId);
  if (!rec) return { question: null };
  if (body.answer && body.question) {
    const ex = await extractFromAnswer(userId, body.question, body.answer);
    if (ex) {
      const patch: Record<string, unknown> = {};
      if (ex.injuries.length) {
        const rank = { mild: 0, moderate: 1, severe: 2 } as const;
        const byRegion = new Map(rec.profile.injuries.map((i) => [i.region, i]));
        for (const inj of ex.injuries) { const prev = byRegion.get(inj.region); byRegion.set(inj.region, prev && rank[prev.severity] >= rank[inj.severity] ? { ...prev, note: prev.note ?? inj.note } : { ...inj, note: inj.note ?? prev?.note }); }
        patch.injuries = [...byRegion.values()];
      }
      if (ex.medicalFlags.length) patch.medicalFlags = [...new Set([...rec.profile.medicalFlags, ...ex.medicalFlags])];
      if (ex.dislikedFoods.length) patch.dislikedFoods = [...new Set([...rec.profile.dislikedFoods, ...ex.dislikedFoods])];
      if (ex.timelineWeeks) patch.timelineWeeks = ex.timelineWeeks;
      if (ex.sleepHours) patch.sleepHours = ex.sleepHours;
      if (ex.stressLevel) patch.stressLevel = ex.stressLevel;
      if (ex.notes) patch.notes = [rec.profile.notes, ex.notes].filter(Boolean).join(" ");
      if (Object.keys(patch).length) await upsertProfile(userId, patch);
    }
    return { question: null, extracted: !!ex };
  }
  if (!aiAvailable()) return { question: null };
  const q = await intakeFollowUp(userId, rec.profile, rec.intakeTranscript, body.stage);
  return { question: q?.question ?? null, reason: q?.reason ?? null };
});
