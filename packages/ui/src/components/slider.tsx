"use client";
import * as React from "react";
import * as S from "@radix-ui/react-slider";
import { cn } from "../lib/cn";
export function Slider({ className, ...p }: S.SliderProps) {
  return (
    <S.Root className={cn("relative flex h-6 w-full touch-none select-none items-center", className)} {...p}>
      <S.Track className="relative h-1.5 grow rounded-full bg-surface-3"><S.Range className="absolute h-full rounded-full bg-ember" /></S.Track>
      {(p.value ?? p.defaultValue ?? [0]).map((_, i) => (
        <S.Thumb key={i} className="block size-5 rounded-full border-2 border-ember bg-bg shadow-card transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ember/40" aria-label={p["aria-label"]} />
      ))}
    </S.Root>
  );
}
