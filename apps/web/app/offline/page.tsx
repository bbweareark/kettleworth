import { Logo } from "@kettleworth/ui";
export default function Offline() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="space-y-4"><Logo className="justify-center" /><h1 className="font-display text-2xl font-semibold">You're offline</h1><p className="text-fg-muted">Logged sets are saved on this device and will sync when you're back online.</p></div>
    </main>
  );
}
