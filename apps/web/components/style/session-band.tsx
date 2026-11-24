"use client";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@kettleworth/ui";
import { useStyle } from "@/lib/style";
import { ArcCharacter } from "@/components/style/arc-character";

/**
 * The session band, one per world.
 *
 * Arc had this slot to itself and the owner asked for the other two to have it as well, which
 * is the right call: the band is where a session says where you are, and a member who picked
 * Carbon or Sanctuary should not get less of a session for it.
 *
 * The rule followed here is the one that matters: **not Arc's composition recoloured.** A band
 * with a slanted cel panel and a screen tone, painted graphite, would be Arc wearing a suit.
 * Each of these is built from its own world's reference, measured on the live site this
 * session, and they share nothing but the slot and the facts they carry.
 *
 *   Arc         a page: ink, one cel panel cut in on a slant, the round count on the ink.
 *               See arc-character.tsx.
 *
 *   Carbon      Apple's "Get the highlights." rail (apple.com/iphone-18-pro, measured: header
 *               32px/36px at 600, plates clipped at a 28px radius, caption 17px/600 centred in
 *               white at 92%). A dark plinth, one precisely lit object on it, the next plate
 *               peeking in at the right edge, and a pager underneath. The object is the
 *               session's own photograph; the pager is this exercise's sets.
 *
 *   Sanctuary   Brex's standing band (brex.com, measured: a full bleed band in #f3f3f7 - the
 *               value this world's surface token already came from - 40px above and 16px
 *               below, a centred statement, and a row of evenly spaced marks under it). The
 *               statement is what you have kept today and the marks are three measured facts.
 *               One ember: the figure that matters is bronze and nothing else is.
 *
 * None of the three is a card grid, none of them centres everything, and each one answers the
 * same question in a different grammar.
 */
export function SessionBand(props: {
  done: number;
  total: number;
  exerciseDone: boolean;
  resting: boolean;
  sex?: "male" | "female" | "other" | null;
  /** The movement on screen, and where this set sits inside it. */
  name: string;
  setsDone: number;
  setsInExercise: number;
  /** This session's load so far, already in the member's own units, and what to call it. */
  lifted: number;
  unit: string;
  /** The session's own photograph, for the world that puts an object on a plinth. */
  plate: string;
  /** The next movement's own still, which is what the plate after this one holds. */
  nextPlate?: string | null;
}) {
  const style = useStyle();
  if (style === "arc") return <ArcCharacter done={props.done} total={props.total} exerciseDone={props.exerciseDone} resting={props.resting} sex={props.sex} />;
  if (style === "sanctuary") return <SanctuaryStanding {...props} />;
  return <CarbonPlate {...props} />;
}

type Props = Parameters<typeof SessionBand>[0];

/**
 * Carbon. A plinth with one lit object on it.
 *
 * The rail is the piece worth porting: one plate at full size with the next one cut off by the
 * right edge, which tells you there is more without drawing a second card. The reference's
 * plates are portrait at 400x480; a band inside a session screen cannot be 480 tall, so the
 * proportion is landscape here and everything else - the 28px clip, the centred caption at the
 * top in white at 92%, the pager below - is the reference's.
 */
function CarbonPlate({ done, total, exerciseDone, resting, name, setsDone, setsInExercise, plate, nextPlate }: Props) {
  const reduce = useReducedMotion();
  return (
    <section className="-mx-4 border-y border-rule bg-surface px-4 py-3.5 sm:-mx-6 sm:px-6">
      {/* The reference's section head: the line on the left, one quiet state on the right. */}
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl tracking-tightest">Where you are.</h2>
        <p className="meta shrink-0">{exerciseDone ? "Movement done" : resting ? "Resting" : `Set ${Math.min(setsDone + 1, setsInExercise)} of ${setsInExercise}`}</p>
      </div>

      <div className="mt-3 flex gap-2.5">
        <div className={cn("relative h-28 overflow-clip rounded-xl bg-bg sm:h-32", nextPlate ? "flex-[0_0_80%]" : "flex-1")}>
          {/*
            The object, lit. A very slow scale is the whole motion budget here: the reference
            turns its product on a plinth, and a gallery does not jump.
          */}
          <motion.img
            src={plate}
            alt=""
            aria-hidden
            animate={reduce ? undefined : { scale: [1, 1.05, 1] }}
            transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 size-full object-cover"
          />
          <div aria-hidden className="scrim-top absolute inset-0" />
          {/*
            The reference's caption: centred at the top of the plate, 17px at 600, two lines at
            most. The movement's name was set at 36px here first and "Barbell Back Squat" came
            out as "Barbell Back S...", which is the giveaway that the type was competing with
            the object instead of labelling it.
          */}
          <div className="absolute inset-x-3 top-2.5 text-center">
            <p className="meta">Round {done} of {total}</p>
            <p className="mt-1 line-clamp-2 text-base font-semibold leading-tight text-fg">{name}</p>
          </div>
        </div>
        {/*
          The next plate, cut off by the right edge: the whole reason the rail reads as a rail
          rather than as one picture. It holds the movement that is actually next, dimmed, so
          the edge says what is coming. On the last movement there is nothing next, and the
          plate in hand takes the full width instead of fronting an empty one.
        */}
        {nextPlate ? (
          <div aria-hidden className="relative h-28 flex-1 overflow-clip rounded-xl bg-bg sm:h-32">
            <img src={nextPlate} alt="" className="absolute inset-0 size-full object-cover opacity-45" />
          </div>
        ) : null}
      </div>

      {/* The pager: this movement's sets, the one in hand drawn as a capsule. */}
      <div aria-hidden className="mt-3 flex items-center justify-center gap-1.5">
        {Array.from({ length: Math.min(12, setsInExercise) }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === setsDone && !exerciseDone ? "w-8 bg-volt" : i < setsDone ? "w-1.5 bg-fg" : "w-1.5 bg-rule",
            )}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Sanctuary. What you have kept today, said once, with the evidence under it.
 *
 * The reference's band is a statement of standing with a row of marks beneath it proving the
 * statement. The marks here are measured facts about this session rather than logos, and there
 * are three, evenly spaced on the band's own axis. Exactly one of them is bronze, because this
 * world's rule is that one spark does all the talking.
 */
function SanctuaryStanding({ done, total, exerciseDone, name, setsDone, setsInExercise, lifted, unit }: Props) {
  const reduce = useReducedMotion();
  const left = total - done;
  const statement = done === 0 ? "Nothing kept yet today." : left === 0 ? "The day is whole." : exerciseDone ? "One more stone set." : `${done} kept, ${left} to keep.`;
  return (
    <section className="-mx-4 border-y border-rule bg-surface-2 px-4 py-5 text-center sm:-mx-6 sm:px-6">
      <h2 className="font-display text-2xl tracking-tightest">{statement}</h2>

      <div className="mt-4 flex items-start justify-center gap-7 sm:gap-12">
        <Fact
          figure={`${done}`}
          sub={`/${total}`}
          label="Kept"
          ember
          /* The one moving thing: the figure that just changed arrives, then stays still. */
          beat={reduce ? undefined : done}
        />
        <Fact figure={lifted > 0 ? Math.round(lifted).toLocaleString() : "0"} sub={` ${unit}`} label="Lifted" />
        <Fact figure={`${setsDone}`} sub={`/${setsInExercise}`} label={name.split(" ").slice(-1)[0] ?? "Movement"} />
      </div>
    </section>
  );
}

function Fact({ figure, sub, label, ember, beat }: { figure: string; sub?: string; label: string; ember?: boolean; beat?: number }) {
  return (
    <div className="min-w-0">
      <motion.p
        key={beat}
        initial={beat === undefined ? undefined : { opacity: 0, y: 6 }}
        animate={beat === undefined ? undefined : { opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
        className={cn("font-display text-3xl leading-none tracking-tightest tabular", ember ? "text-gold" : "text-fg")}
      >
        {figure}
        {sub ? <span className="text-base text-fg-subtle">{sub}</span> : null}
      </motion.p>
      <p className="meta mt-1.5 truncate">{label}</p>
    </div>
  );
}
