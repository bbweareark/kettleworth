import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getProfile, aiAvailable } from "@kettleworth/api";
import { GenerateProgramme } from "@/components/programme/generate";
export const metadata = { title: "Build programme" };
export const dynamic = "force-dynamic";
export default async function NewProgramme({ searchParams }: { searchParams: Promise<{ continue?: string; weeks?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const rec = await getProfile(user.id);
  if (!rec?.onboardingCompletedAt) redirect("/app/onboarding");
  return <GenerateProgramme summary={rec.aiSummary} profile={rec.profile} ai={aiAvailable()} continueFrom={sp.continue === "1"} defaultWeeks={sp.weeks ? Number(sp.weeks) : undefined} />;
}
