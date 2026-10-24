import { cn } from "@kettleworth/ui";

/**
 * 3dicons.co (V1, CC0) renders, used only on expressive surfaces: empty states and the quest
 * board. Inline UI affordances stay on Lucide.
 *
 * The set ships in mixed stock colours (the chart is purple, the target is pink) which would
 * break the rationed palette and read as clip art. One filter chain maps every render into
 * the warm ember family while keeping its 3D shading and its single upper-left light, so the
 * family looks like one family. Angle is always "dynamic" for the same reason.
 */
const NAMES = ["fire", "target", "chart", "clock", "tools"] as const;
export type Icon3DName = (typeof NAMES)[number];

const SIZES = { sm: 48, md: 72, lg: 112 } as const;

export function Icon3D({ name, size = "md", className, alt = "" }: { name: Icon3DName; size?: keyof typeof SIZES; className?: string; alt?: string }) {
  const px = SIZES[size];
  return (
    <img
      src={`/icons3d/${name}.webp`}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      loading="lazy"
      decoding="async"
      width={px}
      height={px}
      style={{ width: px, height: px, filter: "grayscale(1) sepia(1) saturate(2.6) hue-rotate(-12deg) brightness(1.02) contrast(1.05)" }}
      className={cn("shrink-0 select-none", className)}
    />
  );
}
