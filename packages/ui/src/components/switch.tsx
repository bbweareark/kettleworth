"use client";
import * as React from "react";
import * as S from "@radix-ui/react-switch";
import { cn } from "../lib/cn";
export function Switch({ className, ...p }: S.SwitchProps) {
  return (
    <S.Root className={cn("relative h-7 w-12 shrink-0 rounded-full border border-rule-strong bg-surface transition-colors data-[state=checked]:border-volt data-[state=checked]:bg-volt focus:outline-none focus-visible:ring-2 disabled:opacity-50", className)} {...p}>
      <S.Thumb className="block size-5 translate-x-0.5 rounded-full bg-fg transition-transform data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-volt-fg" />
    </S.Root>
  );
}
