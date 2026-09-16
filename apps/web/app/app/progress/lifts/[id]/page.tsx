import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { exerciseHistory, getProfile } from "@kettleworth/api";
import { LiftHistory } from "@/components/lifts/lift-history";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: "Lift history" }; }

export default async function LiftPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [data, rec] = await Promise.all([exerciseHistory(user.id, id), getProfile(user.id)]);
  if (!data) notFound();
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/app/progress" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg"><ArrowLeft className="size-4" /> Progress</Link>
      <div><p className="eyebrow">Lift history</p><h1 className="font-display text-3xl font-semibold tracking-tighter">{data.exercise.name}</h1></div>
      <LiftHistory data={JSON.parse(JSON.stringify(data))} units={rec?.profile.units ?? "metric"} />
    </div>
  );
}
