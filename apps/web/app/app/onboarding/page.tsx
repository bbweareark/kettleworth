import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getProfile, aiAvailable } from "@kettleworth/api";
import { Intake } from "@/components/onboarding/intake";

export const metadata = { title: "Let's get to know you" };
export const dynamic = "force-dynamic";

export default async function Onboarding() {
  const user = await requireUser();
  const rec = await getProfile(user.id);
  if (rec?.onboardingCompletedAt) redirect("/app");
  return <Intake initial={rec?.profile ?? null} step={rec?.onboardingStep ?? 0} name={user.name.split(" ")[0] ?? "there"} ai={aiAvailable()} />;
}
