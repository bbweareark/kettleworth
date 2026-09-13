"use client";
import * as React from "react";
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../lib/cn";

export const Sheet = D.Root;
export const SheetTrigger = D.Trigger;
export const SheetClose = D.Close;
/** Bottom sheet on mobile, right drawer on desktop. */
export function SheetContent({ className, children, title, description, side = "bottom", ...p }: D.DialogContentProps & { title: string; description?: string; side?: "bottom" | "right" }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
      <D.Content
        className={cn(
          "fixed z-50 flex flex-col bg-bg-elevated border-border shadow-pop focus:outline-none",
          side === "bottom" ? "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl border-t sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[440px] sm:rounded-none sm:border-l" : "inset-y-0 right-0 w-full max-w-[480px] border-l",
          className,
        )}
        {...p}
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-surface-3 sm:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
          <div>
            <D.Title className="font-display text-xl font-semibold tracking-tighter">{title}</D.Title>
            {description ? <D.Description className="mt-1 text-sm text-fg-muted">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
          </div>
          <D.Close className="rounded-md p-1 text-fg-muted hover:bg-surface-2 hover:text-fg" aria-label="Close"><X className="size-5" /></D.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </D.Content>
    </D.Portal>
  );
}
