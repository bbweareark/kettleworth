import { Logo } from "@kettleworth/ui";
export default function Offline() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <Logo className="justify-center" label="Kettleworth" />
        <h1 className="mt-6 font-display text-3xl">You&apos;re offline</h1>
        <p className="measure mx-auto mt-3 text-sm text-fg-muted">Logged sets are saved on this device and will sync when you&apos;re back online.</p>
      </div>
    </main>
  );
}
