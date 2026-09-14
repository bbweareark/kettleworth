import { requireUser } from "@/lib/session";
import { listLetters, coachHistory, aiAvailable, getProfile } from "@kettleworth/api";
import { redirect } from "next/navigation";
import { CoachView } from "@/components/coach/coach-view";
export const metadata = { title: "Coach" };
export const dynamic = "force-dynamic";
export default async function Coach() {
  const user = await requireUser();
  const rec = await getProfile(user.id);
  if (!rec?.onboardingCompletedAt) redirect("/app/onboarding");
  const [letters, history] = await Promise.all([listLetters(user.id), coachHistory(user.id)]);
  return <CoachView letters={letters.map((l) => ({ id: l.id, weekStartsOn: l.weekStartsOn, headline: l.headline, body: l.body, adaptations: l.adaptations, readAt: l.readAt?.toISOString() ?? null, generatedBy: l.generatedBy }))} history={history.map((m) => ({ id: m.id, role: m.role, content: m.content, actions: m.actions, at: m.createdAt.toISOString() }))} ai={aiAvailable()} name={user.name.split(" ")[0] ?? ""} />;
}
