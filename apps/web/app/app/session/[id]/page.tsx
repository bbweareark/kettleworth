import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getSessionDetail, getProfile } from "@kettleworth/api";
import { SessionPlayer } from "@/components/session/player";
export const metadata = { title: "Session" };
export const dynamic = "force-dynamic";
export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [d, rec] = await Promise.all([getSessionDetail(user.id, id), getProfile(user.id)]);
  if (!d) notFound();
  return <SessionPlayer detail={JSON.parse(JSON.stringify(d))} units={rec?.profile.units ?? "metric"} sex={rec?.profile.sex ?? null} barWeights={rec?.profile.barWeights ?? {}} />;
}
