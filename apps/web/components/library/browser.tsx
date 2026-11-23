"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { ExerciseSummary } from "@kettleworth/types";
import { Button, Chip, ChipGroup, Input, Sheet, SheetContent, Skeleton, EmptyState, cn } from "@kettleworth/ui";

/**
 * The library, as an index rather than a card wall.
 *
 * What was here: thirty-two filter chips stacked four rows deep before any content, then the
 * results as bordered cards, each carrying its own thumbnail square and three or four badge
 * chips. Forty boxes on a phone. `references/anti-generic.md` names both of those in its slop
 * list, and they were the worst offenders left in the app.
 *
 * What it is now: one scrolling row of muscles, which is the filter people actually use, with
 * everything else behind a sheet; and the results as a numbered editorial index, hairline
 * between rows, the name set at display size, the facts as one small line, and the image as a
 * tall crop bleeding to the right edge. No card, no badge, no frame.
 *
 * The picker variant keeps the same shape at a smaller size: a swap sheet is a list, and it
 * was already the one place this screen was not boxed.
 */
type Result = { items: ExerciseSummary[]; total: number; limit: number; offset: number };
const MUSCLES = ["chest", "lats", "upper_back", "front_delts", "side_delts", "rear_delts", "biceps", "triceps", "forearms", "abs", "quads", "hamstrings", "glutes", "calves", "lower_back"];
const EQUIP = ["bodyweight", "barbell", "dumbbell", "kettlebell", "cable", "machine", "bands"];
const PATTERNS = ["squat", "hinge", "lunge", "horizontal_push", "vertical_push", "horizontal_pull", "vertical_pull", "core", "carry", "isolation", "cardio", "mobility"];
const LEVELS = ["beginner", "intermediate", "advanced"];
const label = (s: string) => s.replace(/_/g, " ");

export function LibraryBrowser({ initial, initialQuery, onPick, compact }: { initial: Result; initialQuery?: Record<string, string | undefined>; onPick?: (e: ExerciseSummary) => void; compact?: boolean }) {
  const [q, setQ] = useState(initialQuery?.q ?? "");
  const [muscle, setMuscle] = useState(initialQuery?.muscle ?? "");
  const [equipment, setEquipment] = useState(initialQuery?.equipment ?? "");
  const [pattern, setPattern] = useState(initialQuery?.pattern ?? "");
  const [difficulty, setDifficulty] = useState(initialQuery?.difficulty ?? "");
  const [sheet, setSheet] = useState(false);
  const [res, setRes] = useState<Result>(initial);
  const [pending, start] = useTransition();

  useEffect(() => {
    const c = new AbortController();
    const t = setTimeout(() => {
      const params = new URLSearchParams(); if (q) params.set("q", q); if (muscle) params.set("muscle", muscle); if (equipment) params.set("equipment", equipment); if (pattern) params.set("pattern", pattern); if (difficulty) params.set("difficulty", difficulty);
      start(async () => { const r = await fetch(`/api/library?${params}`, { signal: c.signal }).then((x) => x.json()).catch(() => null); if (r) setRes(r); });
      if (!onPick) window.history.replaceState(null, "", `/library${params.size ? `?${params}` : ""}`);
    }, 200);
    return () => { clearTimeout(t); c.abort(); };
  }, [q, muscle, equipment, pattern, difficulty, onPick]);

  const more = async () => { const params = new URLSearchParams({ offset: String(res.items.length) }); if (q) params.set("q", q); if (muscle) params.set("muscle", muscle); if (equipment) params.set("equipment", equipment); if (pattern) params.set("pattern", pattern); if (difficulty) params.set("difficulty", difficulty); const r: Result = await fetch(`/api/library?${params}`).then((x) => x.json()); setRes((prev) => ({ ...r, items: [...prev.items, ...r.items] })); };

  /** Everything chosen outside the muscle row, as one line of plain words. */
  const extras = [equipment, pattern, difficulty].filter(Boolean);
  const clearExtras = () => { setEquipment(""); setPattern(""); setDifficulty(""); };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
          <Input className="pl-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 850+ exercises…" aria-label="Search exercises" autoFocus={!!onPick} />
        </div>
        <Button variant="secondary" size="icon" aria-label="More filters" aria-expanded={sheet} onClick={() => setSheet(true)}><SlidersHorizontal /></Button>
      </div>

      {/* One row, scrolling. The wall of thirty-two is behind the button. */}
      <div className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ChipGroup aria-label="Muscle" className="w-max flex-nowrap">
          <Chip selected={!muscle} onClick={() => setMuscle("")} className="h-8 shrink-0 px-3 text-xs">All</Chip>
          {MUSCLES.map((m) => (
            <Chip key={m} className="h-8 shrink-0 px-3 text-xs capitalize" selected={muscle === m} onClick={() => setMuscle(muscle === m ? "" : m)}>{label(m)}</Chip>
          ))}
        </ChipGroup>
      </div>

      <div className="flex items-baseline justify-between gap-4">
        <p className="meta" aria-live="polite">{pending ? "Searching" : `${res.total} results`}</p>
        {extras.length ? (
          <button type="button" onClick={clearExtras} className="meta inline-flex items-center gap-1.5 text-fg transition-colors hover:text-volt">
            <span className="capitalize">{extras.map(label).join(" · ")}</span>
            <X className="size-3" aria-hidden />
            <span className="sr-only">Clear these filters</span>
          </button>
        ) : null}
      </div>

      {res.items.length === 0 && !pending ? (
        <EmptyState title="No exercises match" description="Try fewer filters or a different name." />
      ) : (
        <ol className={cn("border-t border-rule", !compact && "sm:grid sm:grid-cols-2 sm:gap-x-8")}>
          {res.items.map((e, i) => {
            const facts = [...e.primaryMuscles.map(label), label(e.pattern), e.difficulty];
            const body = (
              <>
                <span className="meta w-8 shrink-0 pt-1.5 tabular">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1 py-3">
                  <span className="block font-display text-2xl leading-none tracking-tightest transition-colors group-hover:text-volt">{e.name}</span>
                  <span className="meta mt-1.5 block truncate">{facts.join(" · ")}</span>
                </span>
                <Thumb e={e} />
              </>
            );
            return (
              <li key={e.id} className="border-b border-rule">
                {onPick ? (
                  <button type="button" onClick={() => onPick(e)} className="group flex w-full items-start gap-3 text-left">{body}</button>
                ) : (
                  <Link href={`/library/${e.slug}`} className="group flex items-start gap-3">{body}</Link>
                )}
              </li>
            );
          })}
          {pending && res.items.length === 0 ? Array.from({ length: 6 }).map((_, i) => <li key={i} className="border-b border-rule py-3"><Skeleton className="h-12" /></li>) : null}
        </ol>
      )}

      {res.items.length < res.total && <div className="flex justify-center"><Button variant="secondary" onClick={more}>Show more</Button></div>}

      <Sheet open={sheet} onOpenChange={setSheet}>
        <SheetContent title="Filters" description="Equipment, movement pattern and level. Muscles are in the row on the screen.">
          <div className="space-y-5">
            <Group label="Equipment" values={EQUIP} active={equipment} onPick={setEquipment} />
            <Group label="Pattern" values={PATTERNS} active={pattern} onPick={setPattern} />
            <Group label="Level" values={LEVELS} active={difficulty} onPick={setDifficulty} />
            <div className="flex gap-2 border-t border-rule pt-4">
              <Button variant="ghost" onClick={clearExtras}>Clear</Button>
              <Button className="flex-1" onClick={() => setSheet(false)}>Show {res.total} results</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Group({ label: name, values, active, onPick }: { label: string; values: string[]; active: string; onPick: (v: string) => void }) {
  return (
    <div>
      <p className="meta mb-2">{name}</p>
      <ChipGroup aria-label={name}>
        {values.map((v) => (
          <Chip key={v} className="h-9 px-3.5 text-xs capitalize" selected={active === v} onClick={() => onPick(active === v ? "" : v)}>{label(v)}</Chip>
        ))}
      </ChipGroup>
    </div>
  );
}

/**
 * The image as a treatment rather than a square: a tall crop running the height of the row and
 * bleeding to its right edge, which is what gives the index a rhythm down the page.
 */
export function Thumb({ e, size }: { e: ExerciseSummary; size?: number }) {
  const src = e.imageUrls[0];
  return (
    <span className="relative block shrink-0 self-stretch overflow-hidden bg-surface" style={{ width: size ?? 64 }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      ) : (
        <span className="grid size-full place-items-center text-2xs text-fg-subtle">—</span>
      )}
    </span>
  );
}
