"use client";
import * as React from "react";
import * as T from "@radix-ui/react-tooltip";
import { cn } from "../lib/cn";
export const TooltipProvider = T.Provider;
export function Tooltip({ content, children, side = "top" }: { content: React.ReactNode; children: React.ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <T.Root delayDuration={200}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content side={side} sideOffset={6} className={cn("z-50 max-w-xs rounded-md border border-border bg-bg-elevated px-3 py-1.5 text-xs text-fg shadow-pop animate-fade-up")}>{content}</T.Content>
      </T.Portal>
    </T.Root>
  );
}
