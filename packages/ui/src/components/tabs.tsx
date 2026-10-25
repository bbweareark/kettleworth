"use client";
import * as React from "react";
import * as T from "@radix-ui/react-tabs";
import { cn } from "../lib/cn";
export const Tabs = T.Root;
export const TabsContent = T.Content;
export function TabsList({ className, ...p }: T.TabsListProps) {
  return <T.List className={cn("inline-flex h-11 items-center gap-px border border-rule bg-rule p-px", className)} {...p} />;
}
export function TabsTrigger({ className, ...p }: T.TabsTriggerProps) {
  return <T.Trigger className={cn("inline-flex h-full items-center bg-bg px-3.5 text-sm font-medium text-fg-muted transition-colors hover:text-fg data-[state=active]:bg-fg data-[state=active]:text-bg", className)} {...p} />;
}
