import { and, asc, desc, eq, gte, inArray, ne, or, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, communityProfile, group, groupMember, post, comment, reaction, match, message, challenge, challengeEntry, report, block, profile, trainingSession, user, auditLog } from "@kettleworth/db";
import { rankMatches, type MatchProfile } from "@kettleworth/core";
import { getProfile } from "./profile";

// ---------- Profile (private by default) ----------
export async function getCommunityProfile(userId: string) {
  const [row] = await db().select().from(communityProfile).where(eq(communityProfile.userId, userId)).limit(1);
  return row ?? null;
}
export async function upsertCommunityProfile(userId: string, p: { handle: string; displayName: string; bio?: string | null; city?: string | null; country?: string | null; trainTogether: boolean; visibility: "public" | "members" | "private" }) {
  const rec = await getProfile(userId);
  const handle = p.handle.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
  if (handle.length < 3) throw new Error("Handle needs at least 3 letters or numbers");
  const values = { handle, displayName: p.displayName.slice(0, 40), bio: p.bio?.slice(0, 200) ?? null, city: p.city?.slice(0, 60) ?? null, country: p.country?.slice(0, 60) ?? null, trainTogether: p.trainTogether, visibility: p.visibility, goals: rec?.profile.goals ?? [], styles: rec?.profile.styles ?? [], level: rec?.profile.experience ?? null };
  const [row] = await db().insert(communityProfile).values({ userId, ...values }).onConflictDoUpdate({ target: communityProfile.userId, set: values }).returning();
  return row!;
}

// ---------- Matching (only members who opted in) ----------
export async function findMatches(userId: string, limit = 8) {
  const me = await getCommunityProfile(userId);
  const rec = await getProfile(userId);
  if (!me || !rec || me.visibility === "private") return { matches: [], reason: me?.visibility === "private" ? "Your community profile is private. Switch to members-only to be matched." : "Create a community profile to be matched." };
  const blocked = await db().select({ a: block.blockerId, b: block.blockedId }).from(block).where(or(eq(block.blockerId, userId), eq(block.blockedId, userId)));
  const hide = new Set(blocked.flatMap((b) => [b.a, b.b]));
  const others = await db().select({ cp: communityProfile, p: profile.data }).from(communityProfile).innerJoin(profile, eq(profile.userId, communityProfile.userId)).where(and(ne(communityProfile.userId, userId), ne(communityProfile.visibility, "private")));
  const toMP = (cp: typeof communityProfile.$inferSelect, days: number, time?: string | null): MatchProfile => ({ userId: cp.userId, goals: cp.goals, styles: cp.styles, level: cp.level ?? "beginner", daysPerWeek: days, preferredTime: time ?? null, city: cp.city, country: cp.country, lat: cp.lat, lng: cp.lng, trainTogether: cp.trainTogether });
  const ranked = rankMatches(toMP(me, rec.profile.daysPerWeek, rec.profile.preferredTime), others.filter((o) => !hide.has(o.cp.userId)).map((o) => toMP(o.cp, o.p.daysPerWeek, o.p.preferredTime)), limit);
  const existing = await db().select().from(match).where(or(eq(match.userA, userId), eq(match.userB, userId)));
  return { matches: ranked.map((m) => { const cp = others.find((o) => o.cp.userId === m.userId)!.cp; const ex = existing.find((e) => (e.userA === m.userId || e.userB === m.userId)); return { userId: m.userId, handle: cp.handle, displayName: cp.displayName, bio: cp.bio, city: cp.city, level: cp.level, goals: cp.goals, styles: cp.styles, trainTogether: cp.trainTogether, score: m.score, reasons: m.reasons, status: ex?.status ?? null, matchId: ex?.id ?? null, initiatedByMe: ex?.userA === userId }; }), reason: null };
}
export async function requestPartner(userId: string, otherId: string) {
  const [ex] = await db().select().from(match).where(or(and(eq(match.userA, userId), eq(match.userB, otherId)), and(eq(match.userA, otherId), eq(match.userB, userId)))).limit(1);
  if (ex) { if (ex.userB === userId && ex.status === "suggested") { await db().update(match).set({ status: "accepted" }).where(eq(match.id, ex.id)); return { ...ex, status: "accepted" as const }; } return ex; }
  const [row] = await db().insert(match).values({ userA: userId, userB: otherId, score: 0, status: "suggested" }).returning();
  return row!;
}
export async function respondPartner(userId: string, matchId: string, accept: boolean) {
  await db().update(match).set({ status: accept ? "accepted" : "declined" }).where(and(eq(match.id, matchId), eq(match.userB, userId)));
}
export async function partners(userId: string) {
  const rows = await db().select().from(match).where(and(or(eq(match.userA, userId), eq(match.userB, userId)), eq(match.status, "accepted")));
  const ids = rows.map((r) => (r.userA === userId ? r.userB : r.userA));
  const profiles = ids.length ? await db().select().from(communityProfile).where(inArray(communityProfile.userId, ids)) : [];
  const week = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const done = ids.length ? await db().select({ userId: trainingSession.userId, n: sql<number>`count(*)::int` }).from(trainingSession).where(and(inArray(trainingSession.userId, ids), eq(trainingSession.status, "completed"), gte(trainingSession.scheduledOn, week))).groupBy(trainingSession.userId) : [];
  return rows.map((r) => { const id = r.userA === userId ? r.userB : r.userA; const cp = profiles.find((p) => p.userId === id); return { matchId: r.id, userId: id, handle: cp?.handle ?? "member", displayName: cp?.displayName ?? "Member", sessionsThisWeek: done.find((d) => d.userId === id)?.n ?? 0 }; });
}
export async function pendingRequests(userId: string) {
  const rows = await db().select().from(match).where(and(eq(match.userB, userId), eq(match.status, "suggested")));
  const ids = rows.map((r) => r.userA);
  const profiles = ids.length ? await db().select().from(communityProfile).where(inArray(communityProfile.userId, ids)) : [];
  return rows.map((r) => ({ matchId: r.id, from: profiles.find((p) => p.userId === r.userA) ?? null }));
}

// ---------- Direct messages (partners only) ----------
export async function sendMessage(userId: string, matchId: string, body: string) {
  const [m] = await db().select().from(match).where(and(eq(match.id, matchId), eq(match.status, "accepted"), or(eq(match.userA, userId), eq(match.userB, userId)))).limit(1);
  if (!m) throw new Error("Not partners");
  const [row] = await db().insert(message).values({ threadId: matchId, senderId: userId, body: body.slice(0, 2000) }).returning();
  return row!;
}
export async function thread(userId: string, matchId: string) {
  const [m] = await db().select().from(match).where(and(eq(match.id, matchId), or(eq(match.userA, userId), eq(match.userB, userId)))).limit(1);
  if (!m) return [];
  return db().select().from(message).where(eq(message.threadId, matchId)).orderBy(asc(message.createdAt)).limit(200);
}

// ---------- Groups ----------
export async function listGroups(userId: string) {
  const gs = await db().select().from(group).where(eq(group.visibility, "public")).orderBy(desc(group.memberCount));
  const mine = await db().select({ groupId: groupMember.groupId }).from(groupMember).where(eq(groupMember.userId, userId));
  const set = new Set(mine.map((m) => m.groupId));
  return gs.map((g) => ({ ...g, joined: set.has(g.id) }));
}
export async function createGroup(userId: string, name: string, description: string | null) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) + "-" + randomUUID().slice(0, 4);
  const [g] = await db().insert(group).values({ slug, name: name.slice(0, 60), description: description?.slice(0, 300) ?? null, createdBy: userId, memberCount: 1 }).returning();
  await db().insert(groupMember).values({ groupId: g!.id, userId, role: "admin" });
  return g!;
}
export async function joinGroup(userId: string, groupId: string, join: boolean) {
  if (join) { await db().insert(groupMember).values({ groupId, userId }).onConflictDoNothing(); }
  else await db().delete(groupMember).where(and(eq(groupMember.groupId, groupId), eq(groupMember.userId, userId)));
  const [cnt] = await db().select({ n: sql<number>`count(*)::int` }).from(groupMember).where(eq(groupMember.groupId, groupId));
  await db().update(group).set({ memberCount: cnt?.n ?? 0 }).where(eq(group.id, groupId));
}
export async function groupFeed(userId: string, groupId: string) {
  const [g] = await db().select().from(group).where(eq(group.id, groupId)).limit(1);
  if (!g) return null;
  const blocked = new Set((await db().select({ b: block.blockedId }).from(block).where(eq(block.blockerId, userId))).map((x) => x.b));
  const posts = await db().select({ p: post, author: communityProfile }).from(post).leftJoin(communityProfile, eq(communityProfile.userId, post.authorId)).where(eq(post.groupId, groupId)).orderBy(desc(post.createdAt)).limit(50);
  const ids = posts.map((x) => x.p.id);
  const reacts = ids.length ? await db().select({ postId: reaction.postId, n: sql<number>`count(*)::int`, mine: sql<number>`sum(case when ${reaction.userId} = ${userId} then 1 else 0 end)::int` }).from(reaction).where(inArray(reaction.postId, ids)).groupBy(reaction.postId) : [];
  const comments = ids.length ? await db().select({ c: comment, author: communityProfile }).from(comment).leftJoin(communityProfile, eq(communityProfile.userId, comment.authorId)).where(inArray(comment.postId, ids)).orderBy(asc(comment.createdAt)) : [];
  const [member] = await db().select().from(groupMember).where(and(eq(groupMember.groupId, groupId), eq(groupMember.userId, userId))).limit(1);
  return { group: g, joined: !!member, posts: posts.filter((x) => !blocked.has(x.p.authorId)).map((x) => ({ ...x.p, author: x.author ? { handle: x.author.handle, displayName: x.author.displayName } : { handle: "member", displayName: "Member" }, reactions: reacts.find((r) => r.postId === x.p.id)?.n ?? 0, reacted: (reacts.find((r) => r.postId === x.p.id)?.mine ?? 0) > 0, comments: comments.filter((c) => c.c.postId === x.p.id && !blocked.has(c.c.authorId)).map((c) => ({ ...c.c, author: c.author ? { handle: c.author.handle, displayName: c.author.displayName } : { handle: "member", displayName: "Member" } })) })) };
}
export async function createPost(userId: string, groupId: string, body: string, kind: "text" | "workout" | "progress" | "pr" = "text", attachment: Record<string, unknown> | null = null) {
  const [member] = await db().select().from(groupMember).where(and(eq(groupMember.groupId, groupId), eq(groupMember.userId, userId))).limit(1);
  if (!member) throw new Error("Join the group to post");
  const [row] = await db().insert(post).values({ authorId: userId, groupId, kind, body: body.slice(0, 2000), attachment }).returning();
  return row!;
}
export async function addComment(userId: string, postId: string, body: string) { const [row] = await db().insert(comment).values({ postId, authorId: userId, body: body.slice(0, 1000) }).returning(); return row!; }
export async function toggleReaction(userId: string, postId: string) {
  const [ex] = await db().select().from(reaction).where(and(eq(reaction.postId, postId), eq(reaction.userId, userId))).limit(1);
  if (ex) await db().delete(reaction).where(and(eq(reaction.postId, postId), eq(reaction.userId, userId))); else await db().insert(reaction).values({ postId, userId, kind: "fire" });
  return { reacted: !ex };
}

// ---------- Challenges (opt-in; scored from real completed sessions) ----------
export async function ensureDefaultChallenges() {
  const [any] = await db().select({ id: challenge.id }).from(challenge).limit(1);
  if (any) return;
  const now = new Date(); const start = new Date(now); start.setDate(now.getDate() - ((now.getDay() + 6) % 7)); start.setHours(0, 0, 0, 0);
  const end28 = new Date(start); end28.setDate(start.getDate() + 28);
  const end7 = new Date(start); end7.setDate(start.getDate() + 7);
  await db().insert(challenge).values([{ name: "Twelve in four", metric: "sessions", startsOn: start, endsOn: end28, groupId: null }, { name: "Show up this week", metric: "sessions", startsOn: start, endsOn: end7, groupId: null }]);
}
export async function listChallenges(userId: string) {
  await ensureDefaultChallenges();
  const cs = await db().select().from(challenge).where(gte(challenge.endsOn, new Date())).orderBy(asc(challenge.endsOn));
  const mine = await db().select({ challengeId: challengeEntry.challengeId }).from(challengeEntry).where(eq(challengeEntry.userId, userId));
  const set = new Set(mine.map((m) => m.challengeId));
  const out = [];
  for (const c of cs) {
    const entries = await db().select({ userId: challengeEntry.userId }).from(challengeEntry).where(eq(challengeEntry.challengeId, c.id));
    const ids = entries.map((e) => e.userId);
    const scores = ids.length ? await db().select({ userId: trainingSession.userId, n: sql<number>`count(*)::int` }).from(trainingSession).where(and(inArray(trainingSession.userId, ids), eq(trainingSession.status, "completed"), gte(trainingSession.scheduledOn, c.startsOn.toISOString().slice(0, 10)))).groupBy(trainingSession.userId) : [];
    const profiles = ids.length ? await db().select().from(communityProfile).where(inArray(communityProfile.userId, ids)) : [];
    const board = ids.map((id) => ({ userId: id, handle: profiles.find((p) => p.userId === id)?.handle ?? "member", displayName: profiles.find((p) => p.userId === id)?.displayName ?? "Member", score: scores.find((s) => s.userId === id)?.n ?? 0, me: id === userId })).sort((a, b) => b.score - a.score).slice(0, 20);
    out.push({ ...c, joined: set.has(c.id), participants: ids.length, board });
  }
  return out;
}
export async function joinChallenge(userId: string, challengeId: string, join: boolean) {
  if (join) await db().insert(challengeEntry).values({ challengeId, userId }).onConflictDoNothing(); else await db().delete(challengeEntry).where(and(eq(challengeEntry.challengeId, challengeId), eq(challengeEntry.userId, userId)));
}

// ---------- Safety ----------
export async function reportContent(userId: string, targetType: "post" | "comment" | "user", targetId: string, reason: string) { await db().insert(report).values({ reporterId: userId, targetType, targetId, reason: reason.slice(0, 500) }); await db().insert(auditLog).values({ userId, action: "community.report", target: `${targetType}:${targetId}` }); }
export async function blockUser(userId: string, otherId: string, on: boolean) { if (on) await db().insert(block).values({ blockerId: userId, blockedId: otherId }).onConflictDoNothing(); else await db().delete(block).where(and(eq(block.blockerId, userId), eq(block.blockedId, otherId))); await db().update(match).set({ status: "declined" }).where(or(and(eq(match.userA, userId), eq(match.userB, otherId)), and(eq(match.userA, otherId), eq(match.userB, userId)))); }
export async function memberName(userId: string) { const [u] = await db().select({ name: user.name }).from(user).where(eq(user.id, userId)); return u?.name ?? "Member"; }
