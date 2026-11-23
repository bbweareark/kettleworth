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


/**
 * The cast, in states.
 *
 * There are two protagonists now, drawn as the same two people across every frame, so the
 * figure on screen can be the member's own rather than one man for everybody. The app already
 * knows which photography to use from `profile.sex` (lib/art.ts does the same thing), and this
 * follows it: anyone who has not said, or who said other, gets the first.
 *
 * `rest` is its own frame rather than a dimmed `ready`, because sitting on a bench with a
 * towel round your neck is what the member is actually doing while the clock runs, and the
 * difference between a pose and a dimmed pose is the difference between a character and a
 * sticker.
 */
export type ArcState = "ready" | "strain" | "win" | "rest";

const CAST = {
  a: { ready: "ready", strain: "strain", win: "win", rest: "rest" },
  b: { ready: "f-ready", strain: "f-strain", win: "f-win", rest: "rest" },
} as const;

export function castFor(sex?: "male" | "female" | "other" | null) {
  return sex === "female" ? CAST.b : CAST.a;
}

/** The one figure who is not the member: the coach, who is older than everybody and says so. */
export const MENTOR = "/art/arc/mentor-560.webp";

export const stateSrc = (cast: ReturnType<typeof castFor>, state: ArcState) => `/art/arc/${cast[state]}-560.webp`;


/**
 * The clips.
 *
 * Only the first protagonist has them so far, and only three states: a looping charge while he
 * waits, the strain at the hardest point of a rep, and the fist going up when the set lands.
 * Anyone the clips do not cover falls through to that state's still, which is why `clipFor`
 * returns null rather than a placeholder.
 *
 * 480p, four seconds, no audio track, and fetched only on the session screen in Arc.
 */
const CLIPS: Partial<Record<ArcState, string>> = {
  ready: "/art/arc/clip-charge.mp4",
  strain: "/art/arc/clip-strain.mp4",
  win: "/art/arc/clip-win.mp4",
};

export function clipFor(cast: ReturnType<typeof castFor>, state: ArcState): string | null {
  // The clips are drawn from the first cast's own frames, so they are only right for that one.
  if (cast !== CAST.a) return null;
  return CLIPS[state] ?? null;
}
