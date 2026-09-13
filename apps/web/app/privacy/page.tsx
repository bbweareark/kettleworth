import Link from "next/link";
import { Logo } from "@kettleworth/ui";
export const metadata = { title: "Privacy" };
export default function Privacy() {
  return (
    <main className="page max-w-3xl py-12 space-y-6">
      <Link href="/" aria-label="Kettleworth"><Logo /></Link>
      <h1 className="font-display text-3xl font-semibold tracking-tighter">Privacy policy</h1>
      <p className="text-xs text-fg-subtle">Last updated 13 September 2026. Early-access version; a lawyer-reviewed policy replaces this before public launch.</p>
      {[
        ["What we collect", "Account details (name, email), the training profile you give us (body metrics, goals, schedule, equipment, preferences, injuries, medical flags, diet), what you log (sets, sessions, food, measurements), and, only when you connect a provider, the health data types you switch on (sleep, HRV, heart rate, activity, workouts, weight)."],
        ["Why", "To build and adapt your programme and nutrition plan, show your progress, and, if you opt in, match you with other members. Nothing else."],
        ["Sensitive data", "Injuries, medical flags, free-text notes, provider credentials and raw provider payloads are encrypted at rest with AES-256-GCM. Health data is never used for advertising and never sold, in line with Apple HealthKit and Google Health Connect policies."],
        ["AI", "When the AI coach is enabled, your profile and plan are sent to Anthropic's Claude API to write coaching text and ask follow-up questions. Prompts and outputs are logged for quality evaluation. The model cannot change your programme directly; a rules engine validates everything."],
        ["Your rights", "Export all your data as JSON from Settings at any time. Delete your account from Settings: this revokes every connected provider, deletes synced data and removes your records. Disconnecting a provider deletes that provider's data immediately. GDPR/UK GDPR requests: hello@kettleworth.app."],
        ["Retention", "Data is kept while your account exists. Server logs are kept for 30 days."],
        ["Not medical advice", "Kettleworth provides general fitness and nutrition guidance. It does not diagnose or treat conditions. Consult a professional before starting a programme, especially with a medical condition, pregnancy, or a history of disordered eating."],
      ].map(([h, b]) => (<section key={h}><h2 className="font-display text-lg font-semibold">{h}</h2><p className="mt-1 text-fg-muted">{b}</p></section>))}
    </main>
  );
}
