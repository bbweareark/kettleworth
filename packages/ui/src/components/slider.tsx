"use client";
import * as S from "@radix-ui/react-slider";
import { cn } from "../lib/cn";
export function Slider({ className, ...p }: S.SliderProps) {
  return (
    <S.Root className={cn("relative flex h-6 w-full touch-none select-none items-center", className)} {...p}>
      <S.Track className="relative h-1.5 grow rounded-full bg-rule"><S.Range className="absolute h-full rounded-full bg-volt" /></S.Track>
      {(p.value ?? p.defaultValue ?? [0]).map((_, i) => (
        <S.Thumb key={i} className="block size-6 rounded-full border-2 border-volt bg-bg transition-transform hover:scale-110 focus:outline-none focus:ring-2" aria-label={p["aria-label"]} />
      ))}
    </S.Root>
  );
}
