"use client";
import * as React from "react";
import * as S from "@radix-ui/react-switch";
import { cn } from "../lib/cn";
export function Switch({ className, ...p }: S.SwitchProps) {
  return (
    <S.Root className={cn("relative h-6 w-11 shrink-0 border border-rule-strong bg-bg transition-colors data-[state=checked]:bg-ember focus:outline-none focus-visible:ring-2 focus-visible:border-ember disabled:opacity-50", className)} {...p}>
      <S.Thumb className="block size-4 translate-x-1 bg-fg transition-transform data-[state=checked]:translate-x-[26px] data-[state=checked]:bg-ember-fg" />
    </S.Root>
  );
}
