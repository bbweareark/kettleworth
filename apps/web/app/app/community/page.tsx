import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getProfile, getCommunityProfile, findMatches, partners, pendingRequests, listGroups, listChallenges, growthBoard, discoveryEnabled, inviteToken } from "@kettleworth/api";
import { CommunityView } from "@/components/community/community-view";
import { Screen } from "@/components/app/screen";
import { ScreenHero } from "@/components/app/hero";
import { levelAt } from "@kettleworth/core";

export const metadata = { title: "Community" };
export const dynamic = "force-dynamic";

export default async function Community() {
  const user = await requireUser();
  const rec = await getProfile(user.id);
  if (!rec?.onboardingCompletedAt) redirect("/app/onboarding");
  const [cp, m, ps, pend, gs, cs, board, invite] = await Promise.all([getCommunityProfile(user.id), findMatches(user.id), partners(user.id), pendingRequests(user.id), listGroups(user.id), listChallenges(user.id), growthBoard(user.id), inviteToken(user.id)]);

  /*
   * The one number here, from design/SECTION-MAP.md: your Growth. It is the only figure on
   * this screen that is yours rather than someone else's, and it is what every row on the
   * board is ranked by.
   *
   * The supporting line used to read "Level 0, 3 on the board", which was wrong twice over: a
   * private profile is not on the board at all, and it was being given a rank among the only
   * other rows the query could see, while levels started at zero so every new member read as
   * having none. What is left is true whoever is looking - how far the next level is.
   */
  const mine = board.find((b) => b.me) ?? null;
  const onBoard = cp != null && cp.visibility !== "private";
  const rank = onBoard && mine ? board.findIndex((b) => b.me) + 1 : 0;
  const toNext = mine ? Math.max(0, levelAt(mine.level + 1) - mine.growth) : 0;
  const second = !cp
    ? "Create a profile and your Growth starts counting."
    : rank === 1
      ? `Level ${mine!.level}, top of the board.`
      : rank > 1
        ? `Level ${mine!.level}, ${rank} on the board.`
        : mine
          ? `Level ${mine.level}. ${toNext} to the next.`
          : "Log a session and your Growth starts counting.";

  return (
    <>
      <ScreenHero
        art="/art/community.jpg"
        priority
        eyebrow="Community"
        label="Your Growth"
        value={mine?.growth ?? 0}
        second={second}
      >
        <p className="measure mt-3 text-sm text-fg-muted">
          {discoveryEnabled()
            ? "Matched on goals, level and schedule. Nothing about you is visible until you say so."
            : "Growth counts every session, set, weigh-in and check-in you log. Partners are people you invite, so nothing about you is shared until you send someone your link."}
        </p>
      </ScreenHero>

      <Screen flush className="pt-10">
        <CommunityView me={cp ? { handle: cp.handle, displayName: cp.displayName, bio: cp.bio, city: cp.city, country: cp.country, trainTogether: cp.trainTogether, visibility: cp.visibility } : null} defaultName={user.name.split(" ")[0] ?? "Lifter"} matches={m.matches} matchReason={m.reason} partners={ps} pending={pend.map((p) => ({ matchId: p.matchId, handle: p.from?.handle ?? "member", displayName: p.from?.displayName ?? "Member" }))} groups={gs.map((g) => ({ id: g.id, name: g.name, description: g.description, memberCount: g.memberCount, joined: g.joined }))} challenges={cs.map((c) => ({ id: c.id, name: c.name, endsOn: c.endsOn.toISOString(), joined: c.joined, participants: c.participants, board: c.board }))} growthBoard={board} discovery={discoveryEnabled()} inviteToken={invite} />
        </Screen>
    </>
  );
}
