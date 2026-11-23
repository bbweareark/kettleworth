"use client";
import { useStyle } from "@/lib/style";
import { Progress } from "@kettleworth/ui";

/**
 * Sanctuary's signature: the arch fills.
 *
 * Progress through a session is not a bar here, it is a semicircular arch of wedge stones, and
 * each completed set sets one of them. Progress reads as something being built rather than a
 * line creeping to the right, which is the whole idea of this world: a body you are keeping.
 *
 * Carbon and Arc keep the bar, so this component is also the switch: it renders the arch in
 * Sanctuary and the ordinary progress bar everywhere else, and the session screen does not
 * have to know which world it is in.
 */
export function SessionProgress({ done, total, label }: { done: number; total: number; label: string }) {
  const style = useStyle();
  if (style !== "sanctuary") return <Progress value={(done / Math.max(1, total)) * 100} className="mt-2" label={label} />;
  return <Arch done={done} total={total} label={label} />;
}

/** Outer and inner radius of the ring the stones are cut from, and the gap between them. */
const R = 62;
const r = 40;
const GAP = 1.6;

export function Arch({ done, total, label }: { done: number; total: number; label: string }) {
  const n = Math.max(1, Math.min(24, total));
  const cx = R;
  const cy = R;
  const pt = (deg: number, rad: number) => {
    const a = (deg * Math.PI) / 180;
    return [cx + rad * Math.cos(a), cy - rad * Math.sin(a)] as const;
  };
  const stone = (i: number) => {
    const span = 180 / n;
    const a0 = 180 - i * span - GAP / 2;
    const a1 = 180 - (i + 1) * span + GAP / 2;
    const [ox0, oy0] = pt(a0, R);
    const [ox1, oy1] = pt(a1, R);
    const [ix1, iy1] = pt(a1, r);
    const [ix0, iy0] = pt(a0, r);
    return `M${ox0} ${oy0} A${R} ${R} 0 0 1 ${ox1} ${oy1} L${ix1} ${iy1} A${r} ${r} 0 0 0 ${ix0} ${iy0} Z`;
  };
  return (
    <div className="mt-2 flex items-end justify-center">
      <svg
        viewBox={`0 0 ${R * 2} ${R + 1}`}
        className="h-16 w-32"
        role="img"
        aria-label={`${label}: ${done} of ${total} set${total === 1 ? "" : "s"}`}
      >
        {Array.from({ length: n }, (_, i) => {
          const set = i < done;
          return (
            <path
              key={i}
              d={stone(i)}
              className={set ? "animate-arch-fill fill-gold" : "fill-transparent"}
              stroke="currentColor"
              strokeWidth={0.75}
              style={{ color: "var(--color-rule-strong)", animationDelay: `${Math.min(i, 8) * 40}ms` }}
            />
          );
        })}
        {/* The ground the arch stands on, so it reads as built rather than floating. */}
        <line x1={cx - R} y1={R + 0.4} x2={cx + R} y2={R + 0.4} stroke="currentColor" strokeWidth={0.75} style={{ color: "var(--color-rule-strong)" }} />
      </svg>
    </div>
  );
}
