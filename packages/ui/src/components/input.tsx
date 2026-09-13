import * as React from "react";
import { cn } from "../lib/cn";

export const inputClass = "flex h-11 w-full rounded-md border border-border bg-surface-2 px-3.5 text-base text-fg placeholder:text-fg-subtle transition-colors focus:border-ember focus:bg-surface focus:outline-none focus:ring-2 focus:ring-ember/30 disabled:opacity-50 tabular";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(inputClass, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(inputClass, "h-auto min-h-24 py-3 resize-y", className)} {...props} />
));
Textarea.displayName = "Textarea";

export function Label({ className, ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-fg-muted", className)} {...p} />;
}
/**
 * Label + control + hint. A single text-like control (Input, Textarea, native input/select, or a *Input component) is nested in a <label>
 * so it's associated without ids. Anything else (chip groups, segmented controls, sliders) is exposed as a labelled group.
 */
export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: React.ReactNode; className?: string }) {
  const id = React.useId();
  const only = React.Children.count(children) === 1 ? (React.Children.toArray(children)[0] as React.ReactElement | undefined) : undefined;
  const t = only && React.isValidElement(only) ? (only.type as unknown) : null;
  const isControl = t === Input || t === Textarea || (typeof t === "string" && /^(input|textarea|select)$/.test(t)) || (typeof t === "function" && /Input$/.test((t as { name?: string }).name ?? ""));
  const text = <span id={id} className="mb-1.5 block text-sm font-medium text-fg-muted">{label}</span>;
  return (
    <div className={cn("space-y-1", className)}>
      {isControl ? <label className="block">{text}{children}</label> : <div role="group" aria-labelledby={id}>{text}{children}</div>}
      {error ? <p className="text-xs text-rose">{error}</p> : hint ? <p className="text-xs text-fg-subtle">{hint}</p> : null}
    </div>
  );
}
