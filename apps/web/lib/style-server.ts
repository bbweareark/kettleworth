import { cookies } from "next/headers";
import { STYLES, type Style } from "@kettleworth/types";

/**
 * Which world to render, on the server.
 *
 * The client hook in `lib/style.ts` reads the attribute after mount, which is right for a
 * reaction to something the member did. A screen head is not that: it is the first thing
 * painted, it is the LCP element, and in Arc it is a different composition with a different
 * image, so deciding it on the client would mean either a flash or shipping both heads and
 * hiding one. The layout already writes this cookie, so reading it here costs nothing.
 */
export async function currentStyle(): Promise<Style> {
  const v = (await cookies()).get("kw-style")?.value as Style | undefined;
  return v && STYLES.includes(v) ? v : "carbon";
}
