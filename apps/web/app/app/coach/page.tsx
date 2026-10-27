import { requireUser } from "@/lib/session";
import { listLetters, coachHistory, aiAvailable, getProfile } from "@kettleworth/api";
import { redirect } from "next/navigation";
import { CoachView } from "@/components/coach/coach-view";
import { Screen } from "@/components/app/screen";
import { ScreenHero } from "@/components/app/hero";
import { ART } from "@/lib/art";

export const metadata = { title: "Coach" };
export const dynamic = "force-dynamic";

export default async function Coach() {
  const user = await requireUser();
  const rec = await getProfile(user.id);
  if (!rec?.onboardingCompletedAt) redirect("/app/onboarding");
  const [letters, history] = await Promise.all([listLetters(user.id), coachHistory(user.id)]);
  const unread = letters.filter((l) => !l.readAt).length;

  /*
   * One of the two screens that answers with words rather than a figure. Forcing a number on
   * to a conversation would be the kind of dashboard-by-default decision the revamp is there
   * to undo, so the hero carries the latest letter's own headline instead.
   */
  return (
    <Screen flush>
      <ScreenHero
        art={ART.coach}
        priority
        eyebrow={unread ? `Your coach · ${unread} unread` : "Your coach"}
        label="This week, read back"
        title={letters[0]?.headline ?? "Your week, read back."}
      />
      <CoachView
        letters={letters.map((l) => ({ id: l.id, weekStartsOn: l.weekStartsOn, headline: l.headline, body: l.body, adaptations: l.adaptations, readAt: l.readAt?.toISOString() ?? null, generatedBy: l.generatedBy }))}
        history={history.map((m) => ({ id: m.id, role: m.role, content: m.content, actions: m.actions, at: m.createdAt.toISOString() }))}
        ai={aiAvailable()}
        name={user.name.split(" ")[0] ?? ""}
      />
    </Screen>
  );
}
