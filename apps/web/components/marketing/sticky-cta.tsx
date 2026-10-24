"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button, cn } from "@kettleworth/ui";

/**
 * Sticky bar (cta.gallery pattern), phones only. Signing up is the whole point of this page,
 * so once the reader is past the hero the primary action stays within thumb reach. It hides
 * again over the closing CTA so two primaries are never on screen at once.
 */
export function StickyCta({ signedIn }: { signedIn: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (signedIn) return;
    const closer = document.getElementById("closer");
    const onScroll = () => {
      const pastHero = window.scrollY > window.innerHeight * 0.9;
      const closerUp = closer ? closer.getBoundingClientRect().top < window.innerHeight : false;
      setShow(pastHero && !closerUp);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [signedIn]);

  if (signedIn) return null;
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-[color-mix(in_oklch,var(--color-bg)_88%,transparent)] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl transition-transform duration-(--dur-base) ease-out md:hidden",
        show ? "translate-y-0" : "translate-y-full",
      )}
      inert={!show}
    >
      <Button asChild size="lg" className="w-full">
        <Link href="/sign-up">Start free <ArrowRight /></Link>
      </Button>
    </div>
  );
}
