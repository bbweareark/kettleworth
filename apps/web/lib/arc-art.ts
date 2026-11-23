/**
 * Arc's cast.
 *
 * Four original characters, drawn for this app and generated through Higgsfield, cut out
 * against nothing so they can sit on ink or on paper. They are not treated photography and
 * they are not anybody else's characters: no existing property is referenced, named or
 * resembled, and nothing here is licensed anime art.
 *
 * design/CONCEPT.md holds the art direction. The short version: this is the training arc, so
 * the figure on the screen head is a person mid-effort, inked hard, not a mascot. Each screen
 * keeps the same one every time it is opened, because a head that changes face on every visit
 * is decoration rather than identity.
 */
export type ArcCast = "press" | "pull" | "squat" | "face";

const BY_SCREEN: Record<string, ArcCast> = {
  "load lifted this week": "press",
  "weeks in this block": "squat",
  "load lifted, all time": "pull",
  "calories today": "face",
  "your coach": "face",
  "training partners": "pull",
  "connected devices": "press",
};

/** The same character for the same screen, every time. */
export function arcCast(label: string): ArcCast {
  const k = label.trim().toLowerCase();
  if (BY_SCREEN[k]) return BY_SCREEN[k];
  // Anything not named above still has to be stable, so it is chosen by the label itself.
  const order: ArcCast[] = ["press", "pull", "squat", "face"];
  let n = 0;
  for (let i = 0; i < k.length; i++) n = (n * 31 + k.charCodeAt(i)) % 997;
  return order[n % order.length]!;
}

export const arcSrc = (cast: ArcCast) => `/art/arc/${cast}-960.webp`;
export const arcSrcSet = (cast: ArcCast) => `/art/arc/${cast}-640.webp 640w, /art/arc/${cast}-960.webp 960w`;
