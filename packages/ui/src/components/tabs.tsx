"use client";
import * as React from "react";
import * as T from "@radix-ui/react-tabs";
import { cn } from "../lib/cn";
export const Tabs = T.Root;
export const TabsContent = T.Content;
export function TabsList({ className, ...p }: T.TabsListProps) {
  return <T.List className={cn("inline-flex h-10 items-center gap-1 rounded-lg bg-surface-2 p-1", className)} {...p} />;
}
export function TabsTrigger({ className, ...p }: T.TabsTriggerProps) {
  return <T.Trigger className={cn("inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-fg-muted transition-colors data-[state=active]:bg-surface data-[state=active]:text-fg data-[state=active]:shadow-card", className)} {...p} />;
}
