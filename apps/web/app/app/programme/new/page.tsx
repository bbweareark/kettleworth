import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getProfile, aiAvailable } from "@kettleworth/api";
import { GenerateProgramme } from "@/components/programme/generate";
export const metadata = { title: "Build programme" };
export const dynamic = "force-dynamic";
export default async function NewProgramme() {
  const user = await requireUser();
  const rec = await getProfile(user.id);
  if (!rec?.onboardingCompletedAt) redirect("/app/onboarding");
  return <GenerateProgramme summary={rec.aiSummary} profile={rec.profile} ai={aiAvailable()} />;
}
