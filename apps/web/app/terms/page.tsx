import Link from "next/link";
import { Logo } from "@kettleworth/ui";
export const metadata = { title: "Terms" };
export default function Terms() {
  return (
    <main className="page max-w-3xl py-12 space-y-6">
      <Link href="/" aria-label="Kettleworth"><Logo /></Link>
      <h1 className="font-display text-3xl font-semibold tracking-tighter">Terms of use</h1>
      <p className="text-xs text-fg-subtle">Early-access terms, 13 September 2026.</p>
      {[["Use at your own risk", "Exercise carries risk. You are responsible for training within your abilities and stopping if something hurts. Kettleworth is not a substitute for a doctor, physiotherapist or dietitian."], ["Your account", "Keep your credentials private. You must be 16 or over."], ["Content", "Exercise stills are public-domain (free-exercise-db, The Unlicense). Kettleworth coaching content and recipes are ours. Don't scrape or resell them."], ["Service", "Free during early access. We may change or withdraw features. We will give notice before introducing paid tiers."], ["Liability", "To the extent permitted by law, Kettleworth is provided as-is without warranties, and our liability is limited to the amount you paid us in the last 12 months."]].map(([h, b]) => (<section key={h}><h2 className="font-display text-lg font-semibold">{h}</h2><p className="mt-1 text-fg-muted">{b}</p></section>))}
    </main>
  );
}
