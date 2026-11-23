import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getSessionDetail, getProfile, getProgress } from "@kettleworth/api";
import { SessionPlayer } from "@/components/session/player";
import { localTodayIso } from "@/lib/local-date";
import { currentStyle } from "@/lib/style-server";
export const metadata = { title: "Session" };
export const dynamic = "force-dynamic";
export default async function SessionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ start?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [sp, todayIso, style] = await Promise.all([searchParams, localTodayIso(), currentStyle()]);
  const [d, rec, progress] = await Promise.all([getSessionDetail(user.id, id), getProfile(user.id), getProgress(user.id)]);
  if (!d) notFound();
  return <SessionPlayer detail={JSON.parse(JSON.stringify(d))} units={rec?.profile.units ?? "metric"} sex={rec?.profile.sex ?? null} barWeights={rec?.profile.barWeights ?? {}} todayIso={todayIso} autoStart={sp.start === "1"} name={user.name} episode={progress.completedSessions + 1} serverStyle={style} />;
}
