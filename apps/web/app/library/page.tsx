import { searchExercises } from "@kettleworth/api";
import { LibraryBrowser } from "@/components/library/browser";
export const metadata = { title: "Exercise library" };
export const revalidate = 300;
export default async function Library({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const initial = await searchExercises({ q: sp.q, muscle: sp.muscle, equipment: sp.equipment, pattern: sp.pattern, difficulty: sp.difficulty, limit: 40 });
  return (
    <div className="space-y-6">
      <div><p className="eyebrow">Library</p><h1 className="font-display text-3xl font-semibold tracking-tighter md:text-4xl">{initial.total} exercises, every one with cues and a demo.</h1><p className="mt-2 max-w-2xl text-fg-muted">Search by name, muscle, equipment or movement pattern. Demo footage is being produced; until then each exercise shows public-domain stills, clearly labelled.</p></div>
      <LibraryBrowser initial={initial} initialQuery={sp} />
    </div>
  );
}
