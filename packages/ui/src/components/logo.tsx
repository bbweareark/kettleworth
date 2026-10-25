import * as React from "react";
import { cn } from "../lib/cn";

/**
 * The Kettleworth mark: one plate, split by a line of light, the right half lifted by exactly
 * one increment.
 *
 * That is the whole product in a single move. The load goes up in the smallest honest step,
 * and the gap is where the engine decides. It reads left to right as progress, it survives
 * 16px, it cuts in one colour, and it is not a kettlebell, a barbell, a flame or a letter.
 *
 * Geometry lives in /brand. Two half-discs of radius 96 on a 256 grid: the left seated 16
 * below centre, the right 16 above, with a 14 unit gap on the centre line.
 */
export function BrandMark({ size = 28, className, tone = "current", title }: { size?: number; className?: string; tone?: "current" | "ember"; title?: string }) {
  const fill = tone === "ember" ? "var(--color-ember)" : "currentColor";
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" className={cn("shrink-0", className)} aria-hidden={title ? undefined : true} role={title ? "img" : undefined}>
      {title ? <title>{title}</title> : null}
      <g fill={fill}>
        <path d="M121 48 A96 96 0 0 0 121 240 Z" />
        <path d="M135 16 A96 96 0 0 1 135 208 Z" />
      </g>
    </svg>
  );
}

/** The mark seated in a dark disc: used where the coach speaks. */
export function BrandSeal({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" className={cn("shrink-0", className)} aria-hidden>
      <circle cx="128" cy="128" r="126" fill="var(--color-surface-2)" stroke="var(--color-border-strong)" strokeWidth="2" />
      <g transform="translate(128 128) scale(0.58) translate(-128 -128)" fill="var(--color-ember)">
        <path d="M121 48 A96 96 0 0 0 121 240 Z" />
        <path d="M135 16 A96 96 0 0 1 135 208 Z" />
      </g>
    </svg>
  );
}

/** The Kettleworth wordmark: Clash Display 600, outlined. */
const WORD_VB = { w: 5985, h: 680, cap: 670, dx: -40, dy: 670 };
const WORD_D =
  "M190 0H40V-670H190V-404H357L535 -670H715L482 -340L712 0H532L359 -258H190Z M1019 10Q889 10 813.5 -55.5Q738 -121 738 -250Q738 -369 814.5 -440Q891 -511 1016 -511Q1141 -511 1215 -447.5Q1289 -384 1289 -268Q1289 -254 1285 -220H877Q880 -161 911 -135.5Q942 -110 1014 -110Q1079 -110 1106.5 -126.5Q1134 -143 1134 -176V-186H1284V-175Q1284 -93 1211 -41.5Q1138 10 1019 10ZM879 -299H1145Q1142 -349 1110.5 -371.5Q1079 -394 1013 -394Q947 -394 915.5 -371Q884 -348 879 -299Z M1706 0H1582Q1394 0 1394 -181V-377H1315V-501H1394V-598H1544V-501H1706V-377H1544V-198Q1544 -161 1559.5 -148Q1575 -135 1616 -135H1706Z M2115 0H1991Q1803 0 1803 -181V-377H1724V-501H1803V-598H1953V-501H2115V-377H1953V-198Q1953 -161 1968.5 -148Q1984 -135 2025 -135H2115Z M2321 0H2171V-670H2321Z M2666 10Q2536 10 2460.5 -55.5Q2385 -121 2385 -250Q2385 -369 2461.5 -440Q2538 -511 2663 -511Q2788 -511 2862 -447.5Q2936 -384 2936 -268Q2936 -254 2932 -220H2524Q2527 -161 2558 -135.5Q2589 -110 2661 -110Q2726 -110 2753.5 -126.5Q2781 -143 2781 -176V-186H2931V-175Q2931 -93 2858 -41.5Q2785 10 2666 10ZM2526 -299H2792Q2789 -349 2757.5 -371.5Q2726 -394 2660 -394Q2594 -394 2562.5 -371Q2531 -348 2526 -299Z M3284 0H3097L2960 -501H3115L3174 -272L3195 -116H3205L3245 -287L3321 -501H3514L3589 -287L3629 -116H3639L3661 -272L3719 -501H3872L3730 0H3543L3457 -241L3420 -379H3409L3371 -241Z M3893 -250Q3893 -369 3971.5 -440Q4050 -511 4179 -511Q4308 -511 4386.5 -440Q4465 -369 4465 -250Q4465 -132 4386.5 -61Q4308 10 4179 10Q4050 10 3971.5 -61Q3893 -132 3893 -250ZM4179 -379Q4104 -379 4073 -348.5Q4042 -318 4042 -250Q4042 -183 4073 -153Q4104 -123 4179 -123Q4254 -123 4285 -153Q4316 -183 4316 -250Q4316 -317 4284.5 -348Q4253 -379 4179 -379Z M4676 0H4526V-501H4665V-368H4674Q4685 -433 4727.5 -472Q4770 -511 4842 -511Q4922 -511 4961 -463Q5000 -415 5000 -336V-253H4850V-305Q4850 -347 4831 -365.5Q4812 -384 4767 -384Q4718 -384 4697 -361Q4676 -338 4676 -290Z M5407 0H5283Q5095 0 5095 -181V-377H5016V-501H5095V-598H5245V-501H5407V-377H5245V-198Q5245 -161 5260.5 -148Q5276 -135 5317 -135H5407Z M5613 0H5463V-670H5613V-348H5621Q5634 -419 5684 -465Q5734 -511 5824 -511Q5922 -511 5973.5 -454.5Q6025 -398 6025 -307V0H5875V-262Q5875 -325 5845.5 -350.5Q5816 -376 5745 -376Q5672 -376 5642.5 -346Q5613 -316 5613 -251Z";

/**
 * The wordmark as artwork, not as text.
 *
 * Live text renders in the fallback face for the instant before Clash Display loads, and in
 * the wrong face entirely if it never does. A logo should not depend on a network request,
 * so these are the real outlines, shaped with the font's own kerning. The size is driven by
 * cap height, because that is what the eye measures a wordmark against, not its bounding box.
 */
export function Wordmark({ capHeight = 12, className, title }: { capHeight?: number; className?: string; title?: string }) {
  const h = (WORD_VB.h / WORD_VB.cap) * capHeight;
  const w = (WORD_VB.w / WORD_VB.cap) * capHeight;
  return (
    <svg
      width={w}
      height={h}
      viewBox={"0 0 " + WORD_VB.w + "" + WORD_VB.h}
      className={cn("shrink-0", className)}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path transform={"translate(" + WORD_VB.dx + "" + WORD_VB.dy + ")"} fill="currentColor" d={WORD_D} />
    </svg>
  );
}

/**
 * The horizontal lockup. Proportions come from brand/kw-lockup-horizontal.svg: the wordmark's
 * cap height is half the mark's height and the gap is 22% of it.
 *
 * Decorative by default, because almost every placement wraps it in a link that already
 * carries the name; announcing it again would read the brand twice. Pass `label` where the
 * lockup stands alone.
 */
export function Logo({ className, withWordmark = true, size = 24, label }: { className?: string; withWordmark?: boolean; size?: number; label?: string }) {
  return (
    <span
      className={cn("inline-flex items-center", className)}
      style={{ gap: withWordmark ? size * 0.22 : 0 }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <BrandMark size={size} />
      {withWordmark ? <Wordmark capHeight={size / 2} /> : null}
    </span>
  );
}
