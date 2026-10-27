import { searchExercises } from "@kettleworth/api";
import { LibraryBrowser } from "@/components/library/browser";
import { Figure } from "@kettleworth/ui";
// Rendered per request: these pages read the exercise library, and the production build must not need a database.
export const dynamic = "force-dynamic";
export const metadata = { title: "Exercise library" };

export default async function Library({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const initial = await searchExercises({ q: sp.q, muscle: sp.muscle, equipment: sp.equipment, pattern: sp.pattern, difficulty: sp.difficulty, limit: 40 });
  /*
   * The library's one number is the count, which is also the only claim this page needs to
   * make. It used to sit as a 48px headline over a photograph behind a left-to-right gradient;
   * the figure treatment says the same thing larger and on the ground, where it is readable.
   */
  return (
    <div className="space-y-app-section">
      <div>
        <Figure label="Movements in the library" value={initial.total} />
        <p className="measure mt-3 text-sm text-fg-muted">Search by name, muscle, equipment or pattern. Cues, mistakes and a demo on every one.</p>
      </div>
      <LibraryBrowser initial={initial} initialQuery={sp} />
    </div>
  );
}
