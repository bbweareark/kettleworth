"use client";
import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button, toast } from "@kettleworth/ui";
import { useClientValue } from "@/lib/use-client-value";

/**
 * How you get a training partner now.
 *
 * The app used to propose strangers matched on goals, level and city. This asks you to bring
 * someone you already train with instead, which removes the cold start - a matching screen
 * with nobody in it reads as a dead app - and removes the part that needed identity checks
 * and a moderation queue to be safe.
 */
export function InvitePanel({ token, hasProfile }: { token: string | null; hasProfile: boolean }) {
  const [copied, setCopied] = useState(false);
  /*
   * The absolute link is only knowable in the browser. Branching on `typeof window` during
   * render makes the server and the first client render disagree, which is exactly the
   * hydration mismatch React warns about and was happening here; reading it as a client
   * value hands the change over to React instead.
   */
  const origin = useClientValue(() => window.location.origin, "");
  const url = token && origin ? `${origin}/app/community/invite/${token}` : null;

  async function share() {
    if (!url) return;
    // The native sheet is the right thing on a phone; the clipboard is the fallback everywhere else.
    if (navigator.share) {
      await navigator.share({ title: "Train with me on Kettleworth", url }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Invite link copied");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Couldn't copy. Long-press the link to copy it.");
    }
  }

  return (
    <section className="rounded-lg border border-rule bg-surface p-4" aria-label="Invite a training partner">
      <p className="meta">Train with someone you know</p>
      <h2 className="mt-1 font-display text-xl">Send them your link.</h2>
      <p className="measure mt-2 text-sm text-fg-muted">
        When they accept, you can see each other&apos;s week and send messages. Nothing else about
        you is shared, and either of you can leave at any time.
      </p>

      {hasProfile ? (
        <>
          <p className="mt-4 truncate rounded-md border border-rule bg-bg px-3.5 py-3 font-mono text-xs text-fg-muted" title={url ?? undefined}>{url ?? `/app/community/invite/${token ?? ""}`}</p>
          <Button className="mt-3" onClick={share} disabled={!url}>
            {copied ? <>Copied <Check /></> : <>Share invite <Share2 /></>}
          </Button>
        </>
      ) : (
        <p className="mt-4 text-sm text-fg-subtle">Create a community profile first and your link appears here.</p>
      )}
    </section>
  );
}
