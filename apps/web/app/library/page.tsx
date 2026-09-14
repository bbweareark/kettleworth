import { searchExercises } from "@kettleworth/api";
import { LibraryBrowser } from "@/components/library/browser";
export const metadata = { title: "Exercise library" };
export const revalidate = 300;
export default async function Library({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const initial = await searchExercises({ q: sp.q, muscle: sp.muscle, equipment: sp.equipment, pattern: sp.pattern, difficulty: sp.difficulty, limit: 40 });
  return (
    <div className="space-y-6">
      <div className="relative -mt-8 overflow-hidden rounded-3xl p-8 ring-1 ring-white/[0.06]"><img src="/art/library.jpg" alt="" aria-hidden className="absolute inset-0 -z-20 size-full object-cover opacity-80" /><div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--color-bg)_0%,color-mix(in_oklch,var(--color-bg)_75%,transparent)_55%,color-mix(in_oklch,var(--color-bg)_30%,transparent)_100%)]" /><p className="eyebrow">Library</p><h1 className="font-display text-4xl font-semibold tracking-tightest md:text-5xl">{initial.total} movements.</h1><p className="mt-2 max-w-xl text-fg-muted">Search by name, muscle, equipment or pattern. Cues, mistakes and a demo on every one.</p></div>
      <LibraryBrowser initial={initial} initialQuery={sp} />
    </div>
  );
}
