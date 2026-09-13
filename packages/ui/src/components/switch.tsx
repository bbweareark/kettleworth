"use client";
import * as React from "react";
import * as S from "@radix-ui/react-switch";
import { cn } from "../lib/cn";
export function Switch({ className, ...p }: S.SwitchProps) {
  return (
    <S.Root className={cn("relative h-6 w-11 shrink-0 rounded-full bg-surface-3 transition-colors data-[state=checked]:bg-ember focus:outline-none focus-visible:ring-2 focus-visible:ring-ember/40 disabled:opacity-50", className)} {...p}>
      <S.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
    </S.Root>
  );
}
