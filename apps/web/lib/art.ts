/**
 * Generated brand art (Higgsfield, gpt_image_2_5), one ground per surface, all 16:9, dark, bronze rim light.
 * Athlete images exist in male and female variants; neutral scenes (equipment) are shared. Chosen from the profile's sex.
 */
export type Sex = "male" | "female" | "other" | undefined;
const A = (name: string) => `/art/${name}.jpg`;
export const ART = {
  full_body: A("full-body"), lower: A("lower"), push: A("push"), pull: A("pull"), mobility: A("mobility"),
  landing: A("landing"), nutrition: A("nutrition"), programme: A("programme"), coach: A("coach"), library: A("library"), connected: A("connected"), grip: A("grip"),
} as const;
const GENDERED = { upper: { male: A("upper-m"), female: A("upper-f") }, legs: { male: A("legs"), female: A("legs-f") }, progress: { male: A("progress"), female: A("progress-f") } } as const;

/** Gendered pick: women see women, men see men, "other" alternates by key so neither dominates. */
export function genderedArt(key: keyof typeof GENDERED, sex: Sex): string {
  const g = GENDERED[key];
  if (sex === "female") return g.female;
  if (sex === "male") return g.male;
  return key === "upper" ? g.female : g.male;
}
export function sessionArt(name: string, sex?: Sex): string {
  const n = name.toLowerCase();
  if (n.startsWith("push")) return ART.push;
  if (n.startsWith("pull")) return ART.pull;
  if (n.startsWith("legs")) return genderedArt("legs", sex);
  if (n.startsWith("upper")) return genderedArt("upper", sex);
  if (n.startsWith("lower")) return ART.lower;
  if (n.includes("mobility")) return ART.mobility;
  // Full body alternates between the rack and an athlete so the week doesn't look the same every day
  return /\bb\b|\bc\b/i.test(n.replace("full body", "").trim()) ? genderedArt("upper", sex) : ART.full_body;
}
