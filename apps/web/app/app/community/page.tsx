import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getProfile, getCommunityProfile, findMatches, partners, pendingRequests, listGroups, listChallenges, growthBoard } from "@kettleworth/api";
import { CommunityView } from "@/components/community/community-view";
import { Screen } from "@/components/app/screen";
import { ScreenHero } from "@/components/app/hero";

export const metadata = { title: "Community" };
export const dynamic = "force-dynamic";

export default async function Community() {
  const user = await requireUser();
  const rec = await getProfile(user.id);
  if (!rec?.onboardingCompletedAt) redirect("/app/onboarding");
  const [cp, m, ps, pend, gs, cs, board] = await Promise.all([getCommunityProfile(user.id), findMatches(user.id), partners(user.id), pendingRequests(user.id), listGroups(user.id), listChallenges(user.id), growthBoard(user.id)]);

  /*
   * The one number here, from design/SECTION-MAP.md: your Growth. It is the only figure on
   * this screen that is yours rather than someone else's, and it is what every row on the
   * board is ranked by, so putting it at the top names the unit the screen is counted in.
   */
  const mine = board.find((b) => b.me) ?? null;
  const rank = mine ? board.findIndex((b) => b.me) + 1 : 0;
  const second = mine
    ? rank === 1
      ? "Top of the board."
      : `Level ${mine.level}${rank ? `, ${rank} on the board` : ""}.`
    : "Set your profile to members-only to appear on the board.";

  return (
    <Screen flush>
      <ScreenHero
        art="/art/community.jpg"
        priority
        eyebrow="Community"
        label="Your Growth"
        value={mine?.growth ?? 0}
        second={second}
      >
        <p className="measure mt-3 text-sm text-fg-muted">Matched on goals, level and schedule. Nothing about you is visible until you say so.</p>
      </ScreenHero>
      <CommunityView me={cp ? { handle: cp.handle, displayName: cp.displayName, bio: cp.bio, city: cp.city, country: cp.country, trainTogether: cp.trainTogether, visibility: cp.visibility } : null} defaultName={user.name.split(" ")[0] ?? "Lifter"} matches={m.matches} matchReason={m.reason} partners={ps} pending={pend.map((p) => ({ matchId: p.matchId, handle: p.from?.handle ?? "member", displayName: p.from?.displayName ?? "Member" }))} groups={gs.map((g) => ({ id: g.id, name: g.name, description: g.description, memberCount: g.memberCount, joined: g.joined }))} challenges={cs.map((c) => ({ id: c.id, name: c.name, endsOn: c.endsOn.toISOString(), joined: c.joined, participants: c.participants, board: c.board }))} growthBoard={board} />
    </Screen>
  );
}
