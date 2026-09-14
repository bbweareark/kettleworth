import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getProfile, getCommunityProfile, findMatches, partners, pendingRequests, listGroups, listChallenges } from "@kettleworth/api";
import { CommunityView } from "@/components/community/community-view";
export const metadata = { title: "Community" };
export const dynamic = "force-dynamic";
export default async function Community() {
  const user = await requireUser();
  const rec = await getProfile(user.id);
  if (!rec?.onboardingCompletedAt) redirect("/app/onboarding");
  const [cp, m, ps, pend, gs, cs] = await Promise.all([getCommunityProfile(user.id), findMatches(user.id), partners(user.id), pendingRequests(user.id), listGroups(user.id), listChallenges(user.id)]);
  return <CommunityView me={cp ? { handle: cp.handle, displayName: cp.displayName, bio: cp.bio, city: cp.city, country: cp.country, trainTogether: cp.trainTogether, visibility: cp.visibility } : null} defaultName={user.name.split(" ")[0] ?? "Lifter"} matches={m.matches} matchReason={m.reason} partners={ps} pending={pend.map((p) => ({ matchId: p.matchId, handle: p.from?.handle ?? "member", displayName: p.from?.displayName ?? "Member" }))} groups={gs.map((g) => ({ id: g.id, name: g.name, description: g.description, memberCount: g.memberCount, joined: g.joined }))} challenges={cs.map((c) => ({ id: c.id, name: c.name, endsOn: c.endsOn.toISOString(), joined: c.joined, participants: c.participants, board: c.board }))} />;
}
