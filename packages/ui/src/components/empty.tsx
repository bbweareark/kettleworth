import * as React from "react";
import { cn } from "../lib/cn";
export function EmptyState({ icon, title, description, action, className }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("surface flex flex-col items-center justify-center gap-3 px-6 py-12 text-center", className)}>
      {icon ? <div className="grid size-12 place-items-center rounded-full border border-rule text-volt [&_svg]:size-6">{icon}</div> : null}
      <h3 className="font-display text-lg">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-fg-muted">{description}</p> : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
