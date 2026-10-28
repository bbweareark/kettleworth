/**
 * Responsive sources for the app's own photography.
 *
 * The originals are 2688x1520 and were going to a 390px phone untouched - the Today hero was
 * 605KB and it is the LCP element on that screen. `scripts/art-webp.sh` writes an 800px and a
 * 1600px WebP beside each one (the 605KB hero becomes 21KB at 800px), and this turns a source
 * path into the srcset that lets the browser pick.
 *
 * Nothing about the rendered image changes: same file, same crop, same classes. Only the
 * bytes do.
 */
export function artSrcSet(src: string): string | undefined {
  if (!src.endsWith(".jpg") || !src.startsWith("/art/")) return undefined;
  const base = src.slice(0, -4);
  return `${base}-800.webp 800w, ${base}-1600.webp 1600w`;
}

/** Full-bleed by default; pass a narrower description for images in a column. */
export const FULL_BLEED = "100vw";
