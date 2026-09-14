/** Generated brand art (Higgsfield, gpt_image_2_5), one ground per surface. Files live in public/art; all 16:9, dark, bronze rim light. */
export const ART = {
  full_body: "/art/full-body.jpg",
  upper: "/art/upper.jpg",
  lower: "/art/lower.jpg",
  push: "/art/push.jpg",
  pull: "/art/pull.jpg",
  legs: "/art/legs.jpg",
  mobility: "/art/mobility.jpg",
  landing: "/art/landing.jpg",
  nutrition: "/art/nutrition.jpg",
  progress: "/art/progress.jpg",
} as const;

/** Pick the ground for a session by its name. Falls back to the full-body ground. */
export function sessionArt(name: string): string {
  const n = name.toLowerCase();
  if (n.startsWith("push")) return ART.push;
  if (n.startsWith("pull")) return ART.pull;
  if (n.startsWith("legs")) return ART.legs;
  if (n.startsWith("upper")) return ART.upper;
  if (n.startsWith("lower")) return ART.lower;
  if (n.includes("mobility")) return ART.mobility;
  return ART.full_body;
}
