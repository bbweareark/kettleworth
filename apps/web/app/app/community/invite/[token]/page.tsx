import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { inviteOwner } from "@kettleworth/api";
import { Screen } from "@/components/app/screen";
import { AcceptInvite } from "@/components/community/accept-invite";

export const metadata = { title: "Training invite" };
export const dynamic = "force-dynamic";

/**
 * The other end of an invite link.
 *
 * This is how partners are made now: someone you already train with sends you a link, rather
 * than the app proposing strangers near you. Both sides consent in the open - one made the
 * link, the other presses accept here - so there is nothing to approve afterwards.
 */
export default async function Invite({ params }: { params: Promise<{ token: string }> }) {
  const user = await requireUser();
  const { token } = await params;
  const owner = await inviteOwner(token);
  if (!owner) notFound();

  const mine = owner.userId === user.id;
  return (
    <Screen className="mx-auto max-w-lg">
      <div>
        <p className="meta">Training invite</p>
        <h1 className="mt-1 font-display text-3xl">
          {mine ? "This is your own link." : `${owner.displayName} wants to train with you.`}
        </h1>
        <p className="measure mt-3 text-sm text-fg-muted">
          {mine
            ? "Send it to someone you train with. When they accept, the two of you can see each other's week and send messages."
            : "Accepting lets the two of you see each other's sessions this week and send each other messages. Nothing else about you is shared, and you can block or leave at any time."}
        </p>
      </div>

      {mine ? null : <AcceptInvite token={token} name={owner.displayName} handle={owner.handle} />}
    </Screen>
  );
}
