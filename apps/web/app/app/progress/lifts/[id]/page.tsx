import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { exerciseHistory, getProfile } from "@kettleworth/api";
import { LiftHistory } from "@/components/lifts/lift-history";
import { Figure } from "@kettleworth/ui";
import { kgToLb, round } from "@kettleworth/core";
import { Screen } from "@/components/app/screen";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: "Lift history" }; }

export default async function LiftPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [data, rec] = await Promise.all([exerciseHistory(user.id, id), getProfile(user.id)]);
  if (!data) notFound();
  const units = rec?.profile.units ?? "metric";
  const u = units === "metric" ? "kg" : "lb";
  const w = (kg: number) => round(units === "metric" ? kg : kgToLb(kg), 1);

  /*
   * This is the screen design/SECTION-MAP.md means by "the lift in view": one lift, and its
   * estimated max as the figure. Everything under it is the evidence for that number.
   */
  const best = data.bestE1rm?.e1rm ?? null;
  return (
    <Screen className="mx-auto max-w-3xl">
      <Link href="/app/progress" className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden /> Progress
      </Link>
      <Figure
        label={`Estimated max · ${data.exercise.name}`}
        value={best != null ? w(best) : "–"}
        unit={best != null ? u : undefined}
        decimals={1}
        note={data.bestE1rm ? `From ${data.bestE1rm.reps} reps at ${w(data.bestE1rm.weightKg)} ${u}. ${data.sessions} session${data.sessions === 1 ? "" : "s"} on record.` : "Log a working set and the curve starts."}
      />
      <LiftHistory data={JSON.parse(JSON.stringify(data))} units={units} />
    </Screen>
  );
}
