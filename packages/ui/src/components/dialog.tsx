"use client";
import * as React from "react";
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../lib/cn";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;
export function DialogContent({ className, children, title, description, ...p }: D.DialogContentProps & { title: string; description?: string }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
      <D.Content className={cn("fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-bg-elevated p-6 shadow-pop border border-border animate-fade-up focus:outline-none", className)} {...p}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <D.Title className="font-display text-xl font-semibold tracking-tighter">{title}</D.Title>
            {description ? <D.Description className="mt-1 text-sm text-fg-muted">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
          </div>
          <D.Close className="rounded-md p-1 text-fg-muted hover:bg-surface-2 hover:text-fg" aria-label="Close"><X className="size-5" /></D.Close>
        </div>
        {children}
      </D.Content>
    </D.Portal>
  );
}
