"use client";
import * as T from "@radix-ui/react-tabs";
import { cn } from "../lib/cn";

/*
 * The pill group, ported from the DNA reference's own navigation: a 12px-radius container on
 * the raised surface holding full-radius items, the active one filled.
 */
export const Tabs = T.Root;
export const TabsContent = T.Content;
export function TabsList({ className, ...p }: T.TabsListProps) {
  return <T.List className={cn("inline-flex h-12 items-center gap-1 rounded-md border border-rule bg-surface p-1", className)} {...p} />;
}
export function TabsTrigger({ className, ...p }: T.TabsTriggerProps) {
  return <T.Trigger className={cn("inline-flex h-full items-center rounded-full px-4 text-sm text-fg-muted transition-colors hover:text-fg data-[state=active]:bg-fg data-[state=active]:text-bg", className)} {...p} />;
}
