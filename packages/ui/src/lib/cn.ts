import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Class merging, taught this project's type scale.
 *
 * tailwind-merge only knows the font sizes Tailwind ships with. Anything else that starts with
 * `text-` it treats as a colour, so `cn("text-figure", "text-volt")` resolved to `text-volt`
 * alone and the size was silently dropped. That is how the weight on the session console - the
 * one number the whole design is built around - ended up rendering at body size next to reps
 * at 36px, and it would have hit every accented figure and every badge.
 *
 * The scale lives in packages/ui/src/styles/tokens.css; these are the names from it that
 * Tailwind does not define itself.
 */
const merge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["2xs", "meta", "figure", "figure-xl"] }],
    },
  },
});

export const cn = (...inputs: ClassValue[]) => merge(clsx(inputs));
