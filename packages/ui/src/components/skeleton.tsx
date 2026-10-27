import { cn } from "../lib/cn";
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse-soft rounded-sm bg-rule", className)} />;
}
