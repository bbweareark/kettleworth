"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Field, Input, toast } from "@kettleworth/ui";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ mode, providers }: { mode: "sign-in" | "sign-up"; providers: string[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);
  // Until the page has loaded, a tap on the button would do nothing; keep it disabled so a quick tap on a slow phone is never lost.
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy("password");
    const res = mode === "sign-up" ? await authClient.signUp.email({ email, password, name: name || email.split("@")[0]!, callbackURL: "/app" }) : await authClient.signIn.email({ email, password, callbackURL: "/app" });
    setBusy(null);
    if (res.error) return toast.error(res.error.message ?? "Couldn't sign in");
    router.push("/app");
    router.refresh();
  }
  async function magic() {
    if (!email) return toast.error("Enter your email first");
    setBusy("magic");
    const res = await authClient.signIn.magicLink({ email, callbackURL: "/app", newUserCallbackURL: "/app" });
    setBusy(null);
    if (res.error) return toast.error(res.error.message ?? "Couldn't send link");
    setMagicSent(true);
  }
  async function social(provider: "google" | "apple") {
    setBusy(provider);
    await authClient.signIn.social({ provider, callbackURL: "/app" });
    setBusy(null);
  }

  if (magicSent) return (
    <div className="surface rounded-2xl p-6 text-center">
      <h1 className="font-display text-xl font-semibold">Check your email</h1>
      <p className="mt-2 text-sm text-fg-muted">We sent a sign-in link to <span className="text-fg">{email}</span>. It expires in 15 minutes.</p>
      <p className="mt-4 text-xs text-fg-subtle">Running locally without an email provider? The link is printed in the server console.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-semibold tracking-tighter">{mode === "sign-up" ? "Create your account" : "Welcome back"}</h1><p className="mt-1 text-sm text-fg-muted">{mode === "sign-up" ? "Free while we're in early access." : "Sign in to pick up your programme."}</p></div>
      {providers.length ? (
        <div className="grid gap-2">
          {providers.includes("google") && <Button type="button" variant="secondary" size="lg" loading={busy === "google"} onClick={() => social("google")}>Continue with Google</Button>}
          {providers.includes("apple") && <Button type="button" variant="secondary" size="lg" loading={busy === "apple"} onClick={() => social("apple")}>Continue with Apple</Button>}
          <div className="relative py-2 text-center text-xs text-fg-subtle"><span className="bg-bg px-2">or</span><div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-border" /></div>
        </div>
      ) : null}
      <form onSubmit={submit} className="space-y-4">
        {mode === "sign-up" && <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="What should we call you?" /></Field>}
        <Field label="Email"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" /></Field>
        <Field label="Password" hint={mode === "sign-up" ? "At least 10 characters." : undefined}><Input type="password" required minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "sign-up" ? "new-password" : "current-password"} /></Field>
        <Button type="submit" size="lg" className="w-full" disabled={!ready} loading={busy === "password"}>{mode === "sign-up" ? "Create account" : "Sign in"}</Button>
        <Button type="button" variant="ghost" size="lg" className="w-full" loading={busy === "magic"} onClick={magic}>Email me a sign-in link instead</Button>
      </form>
      <p className="text-center text-sm text-fg-muted">
        {mode === "sign-up" ? <>Already have an account? <Link className="text-ember hover:underline" href="/sign-in">Sign in</Link></> : <>New here? <Link className="text-ember hover:underline" href="/sign-up">Create an account</Link></>}
      </p>
    </div>
  );
}
