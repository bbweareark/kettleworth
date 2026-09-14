/**
 * Relevance gate shared by the YouTube scripts. A video is attached only if the channel is a reputable coaching source
 * AND the title names the movement AND enough of the exercise's qualifiers appear. Precision over recall: a wrong demo is
 * worse than a search link.
 */
export const ALLOW = ["jeff nippard", "alan thrall", "squat university", "calisthenicmovement", "scotthermanfitness", "athlean-x", "renaissance periodization", "jeremy ethier", "juggernaut", "barbell medicine", "fitnessfaqs", "stronger by science", "buff dudes", "mind pump", "catalyst athletics", "starting strength", "musclewiki", "meg squats", "girls gone strong", "bodybuilding.com", "testosterone nation", "t nation", "omar isuf"];
const STOP = new Set(["with", "a", "the", "to", "on", "of", "and", "style", "version", "grip", "two", "one", "over", "in", "out", "palms", "facing", "medium", "close", "wide", "arm", "arms", "leg", "legs", "bench", "floor", "standing", "seated", "lying", "kneeling", "alternating", "single", "double", "reverse", "flat", "full"]);
const SYN: Record<string, string[]> = { military: ["overhead", "military", "shoulder press"], overhead: ["overhead", "military"], flyes: ["fly", "flye"], fly: ["fly", "flye"], pullups: ["pull up", "pull-up", "pullup", "chin"], "pull-up": ["pull up", "pull-up", "pullup"], "push-up": ["push up", "push-up", "pushup"], pushups: ["push up", "push-up", "pushup"], romanian: ["romanian", "rdl"], rdl: ["romanian", "rdl"], dips: ["dip"], dip: ["dip"], raise: ["raise"], flyes_: [], thrust: ["thrust"], deadlift: ["deadlift", "rdl"], pulldown: ["pulldown", "pull down", "pull-down"], "t-bar": ["t-bar", "t bar", "tbar"], skullcrusher: ["skull", "skullcrusher"], "skull crushers": ["skull"], smith: ["smith"], ez: ["ez"], kettlebell: ["kettlebell", "kb"], dumbbell: ["dumbbell", "db"], barbell: ["barbell", "bb"], cable: ["cable", "face pull", "pulldown", "pushdown", "wood chop", "woodchop", "pull-through", "pull through", "crossover"], machine: ["machine"], band: ["band"], bands: ["band"] };
const MOVEMENTS = ["squat", "press", "row", "deadlift", "curl", "raise", "extension", "fly", "flye", "pull up", "pull-up", "pullup", "chin", "push up", "push-up", "pushup", "lunge", "dip", "swing", "crunch", "twist", "chop", "stretch", "bridge", "thrust", "carry", "walk", "pulldown", "pull down", "shrug", "plank", "kickback", "pullover", "step up", "step-up", "good morning", "clean", "snatch", "jerk", "get-up", "get up", "sit up", "sit-up", "leg raise", "knee raise", "hyperextension", "calf", "rdl", "skull", "face pull", "pull-through", "pull through", "windmill", "halo", "snap", "hold", "rotation", "roll", "hip", "crawl", "jump", "burpee", "sprint", "run", "rowing", "bike", "cycling", "treadmill", "elliptical"];
const norm = (s: string) => s.toLowerCase().replace(/&amp;|&#39;|&quot;/g, " ").replace(/[^a-z0-9\- ]/g, " ").replace(/\s+/g, " ");

export function relevant(exerciseName: string, title: string): { ok: boolean; reason: string } {
  const t = norm(title); const n = norm(exerciseName);
  const words = n.split(" ").filter((w) => w && !STOP.has(w));
  const movement = MOVEMENTS.find((m) => n.includes(m));
  if (!movement) return { ok: false, reason: "no recognised movement in exercise name" };
  const movAliases = SYN[movement] ?? [movement];
  if (!movAliases.some((m) => t.includes(m))) return { ok: false, reason: `title lacks "${movement}"` };
  const qualifiers = words.filter((w) => !movAliases.includes(w) && !movement.split(" ").includes(w));
  if (!qualifiers.length) return { ok: true, reason: "movement only" };
  const hit = qualifiers.filter((q) => (SYN[q] ?? [q]).some((a) => t.includes(a)));
  const need = Math.ceil(qualifiers.length / 2);
  return hit.length >= need ? { ok: true, reason: `${hit.length}/${qualifiers.length} qualifiers` } : { ok: false, reason: `only ${hit.length}/${qualifiers.length} qualifiers (${qualifiers.join(", ")}) in title` };
}
export const allowed = (channel: string) => ALLOW.some((a) => channel.toLowerCase().includes(a));
