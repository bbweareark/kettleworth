"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import type { ExerciseSummary } from "@kettleworth/types";
import { Badge, Button, Chip, ChipGroup, Input, Skeleton, EmptyState, cn } from "@kettleworth/ui";

type Result = { items: ExerciseSummary[]; total: number; limit: number; offset: number };
const MUSCLES = ["chest", "lats", "upper_back", "front_delts", "side_delts", "rear_delts", "biceps", "triceps", "forearms", "abs", "quads", "hamstrings", "glutes", "calves", "lower_back"];
const EQUIP = ["bodyweight", "barbell", "dumbbell", "kettlebell", "cable", "machine", "bands"];
const PATTERNS = ["squat", "hinge", "lunge", "horizontal_push", "vertical_push", "horizontal_pull", "vertical_pull", "core", "carry", "isolation", "cardio", "mobility"];
const label = (s: string) => s.replace(/_/g, " ");

export function LibraryBrowser({ initial, initialQuery, onPick, compact }: { initial: Result; initialQuery?: Record<string, string | undefined>; onPick?: (e: ExerciseSummary) => void; compact?: boolean }) {
  const [q, setQ] = useState(initialQuery?.q ?? "");
  const [muscle, setMuscle] = useState(initialQuery?.muscle ?? "");
  const [equipment, setEquipment] = useState(initialQuery?.equipment ?? "");
  const [pattern, setPattern] = useState(initialQuery?.pattern ?? "");
  const [difficulty, setDifficulty] = useState(initialQuery?.difficulty ?? "");
  const [showFilters, setShowFilters] = useState(!compact);
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

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" /><Input className="pl-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 850+ exercises…" aria-label="Search exercises" autoFocus={!!onPick} /></div>
        {compact && <Button variant="secondary" size="icon" aria-label="Filters" aria-expanded={showFilters} onClick={() => setShowFilters((s) => !s)}><SlidersHorizontal /></Button>}
      </div>
      {showFilters && (
        <div className="space-y-3">
          <ChipGroup aria-label="Muscle"><Chip selected={!muscle} onClick={() => setMuscle("")} className="h-8 px-3 text-xs">All muscles</Chip>{MUSCLES.map((m) => <Chip key={m} className="h-8 px-3 text-xs capitalize" selected={muscle === m} onClick={() => setMuscle(muscle === m ? "" : m)}>{label(m)}</Chip>)}</ChipGroup>
          <ChipGroup aria-label="Equipment">{EQUIP.map((e) => <Chip key={e} className="h-8 px-3 text-xs capitalize" selected={equipment === e} onClick={() => setEquipment(equipment === e ? "" : e)}>{label(e)}</Chip>)}</ChipGroup>
          <ChipGroup aria-label="Pattern">{PATTERNS.map((e) => <Chip key={e} className="h-8 px-3 text-xs capitalize" selected={pattern === e} onClick={() => setPattern(pattern === e ? "" : e)}>{label(e)}</Chip>)}{["beginner", "intermediate", "advanced"].map((d) => <Chip key={d} className="h-8 px-3 text-xs capitalize" selected={difficulty === d} onClick={() => setDifficulty(difficulty === d ? "" : d)}>{d}</Chip>)}</ChipGroup>
        </div>
      )}
      <p className="text-xs text-fg-subtle" aria-live="polite">{pending ? "Searching…" : `${res.total} results`}</p>
      {res.items.length === 0 && !pending ? <EmptyState title="No exercises match" description="Try fewer filters or a different name." /> : (
        <ul className={cn("grid gap-3", compact ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3")}>
          {res.items.map((e) => (
            <li key={e.id}>
              {onPick ? (
                <button type="button" onClick={() => onPick(e)} className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:border-border-strong">
                  <Thumb e={e} size={56} /><div className="min-w-0"><div className="truncate font-medium">{e.name}</div><div className="truncate text-xs text-fg-subtle capitalize">{e.primaryMuscles.map(label).join(", ")} · {e.equipment.map(label).join(", ")}</div></div>
                </button>
              ) : (
                <Link href={`/library/${e.slug}`} className="group flex gap-3 rounded-xl border border-border bg-surface p-3 transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card">
                  <Thumb e={e} size={72} />
                  <div className="min-w-0 flex-1"><div className="truncate font-medium group-hover:text-ember">{e.name}</div><div className="mt-0.5 truncate text-xs text-fg-subtle capitalize">{e.primaryMuscles.map(label).join(", ")}</div><div className="mt-2 flex flex-wrap gap-1"><Badge tone="outline" className="capitalize">{label(e.pattern)}</Badge><Badge tone="outline" className="capitalize">{e.difficulty}</Badge>{e.equipment.slice(0, 2).map((q) => <Badge key={q} tone="outline" className="capitalize">{label(q)}</Badge>)}</div></div>
                </Link>
              )}
            </li>
          ))}
          {pending && res.items.length === 0 ? Array.from({ length: 6 }).map((_, i) => <li key={i}><Skeleton className="h-24" /></li>) : null}
        </ul>
      )}
      {res.items.length < res.total && <div className="flex justify-center"><Button variant="secondary" onClick={more}>Show more</Button></div>}
    </div>
  );
}
export function Thumb({ e, size }: { e: ExerciseSummary; size: number }) {
  const src = e.imageUrls[0];
  return (
    <div className="relative shrink-0 overflow-hidden rounded-lg bg-surface-3" style={{ width: size, height: size }}>
      {src ? <img src={src} alt="" width={size} height={size} loading="lazy" className="size-full object-cover" /> : <div className="grid size-full place-items-center text-2xs text-fg-subtle">No image</div>}
    </div>
  );
}
