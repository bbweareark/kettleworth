"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Users, Shield, Flame, Trophy, MessageSquare, Send, Check, X, Plus, Flag, Ban, Lock, Eye } from "lucide-react";
import { Button, Field, Input, Textarea, Switch, Segmented, Tabs, TabsList, TabsTrigger, TabsContent, Dialog, DialogContent, toast, cn } from "@kettleworth/ui";

type Me = { handle: string; displayName: string; bio: string | null; city: string | null; country: string | null; trainTogether: boolean; visibility: "public" | "members" | "private" };
type Match = { userId: string; handle: string; displayName: string; bio: string | null; city: string | null; level: string | null; goals: string[]; styles: string[]; trainTogether: boolean; score: number; reasons: string[]; status: string | null; matchId: string | null; initiatedByMe: boolean };
type Partner = { matchId: string; userId: string; handle: string; displayName: string; sessionsThisWeek: number };
type Group = { id: string; name: string; description: string | null; memberCount: number; joined: boolean };
type Challenge = { id: string; name: string; endsOn: string; joined: boolean; participants: number; board: { userId: string; handle: string; displayName: string; score: number; me: boolean }[] };
type Post = { id: string; body: string; kind: string; createdAt: string; author: { handle: string; displayName: string }; authorId: string; reactions: number; reacted: boolean; comments: { id: string; body: string; author: { handle: string; displayName: string } }[] };

async function api(path: string, body?: unknown, method = "POST") {
  const r = await fetch(`/api/community/${path}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? "Failed");
  return j;
}
function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return <span aria-hidden className="grid shrink-0 place-items-center rounded-full font-display font-semibold text-white/90" style={{ width: size, height: size, fontSize: size * 0.4, background: `linear-gradient(135deg, oklch(0.55 0.12 ${hue}), oklch(0.35 0.08 ${(hue + 40) % 360}))` }}>{name.slice(0, 1).toUpperCase()}</span>;
}
const daysLeft = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));

export function CommunityView(p: { me: Me | null; defaultName: string; matches: Match[]; matchReason: string | null; partners: Partner[]; pending: { matchId: string; handle: string; displayName: string }[]; groups: Group[]; challenges: Challenge[] }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [editing, setEditing] = useState(!p.me);
  const [busy, setBusy] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState(false);
  const [chat, setChat] = useState<Partner | null>(null);
  const run = async (key: string, fn: () => Promise<unknown>, ok?: string) => { setBusy(key); try { await fn(); if (ok) toast.success(ok); router.refresh(); } catch (e) { toast.error((e as Error).message); } finally { setBusy(null); } };

  const stagger = (i: number) => (reduce ? {} : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.05 * i, duration: 0.4 } });

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl p-8 ring-1 ring-white/[0.06] md:p-10">
        <img src="/art/community.jpg" alt="" aria-hidden className="absolute inset-0 -z-20 size-full object-cover opacity-85" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--color-bg)_0%,color-mix(in_oklch,var(--color-bg)_78%,transparent)_50%,color-mix(in_oklch,var(--color-bg)_25%,transparent)_100%)]" />
        <p className="eyebrow">Community</p>
        <h1 className="font-display text-4xl font-semibold tracking-tightest md:text-5xl">People who train like you.</h1>
        <p className="mt-2 max-w-lg text-fg-muted">Matched on goals, level and schedule. Nothing about you is visible until you say so.</p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {p.me ? <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs backdrop-blur">{p.me.visibility === "private" ? <Lock className="size-3" /> : <Eye className="size-3" />}{p.me.visibility === "private" ? "Private" : p.me.visibility === "members" ? "Visible to members" : "Public"} · @{p.me.handle}</span> : null}
          <Button size="sm" variant={p.me ? "ghost" : "primary"} onClick={() => setEditing(true)}>{p.me ? "Edit profile" : "Create your profile"}</Button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[{ I: Users, n: p.partners.length, l: "Partners" }, { I: Flame, n: p.groups.filter((g) => g.joined).length, l: "Groups" }, { I: Trophy, n: p.challenges.filter((c) => c.joined).length, l: "Challenges" }].map((s, i) => (
          <motion.div key={s.l} {...stagger(i)} className="rounded-2xl bg-surface/50 p-4 ring-1 ring-white/[0.05]"><s.I className="size-4 text-ember" /><div className="mt-2 font-display text-3xl font-semibold tabular">{s.n}</div><div className="text-xs text-fg-subtle">{s.l}</div></motion.div>
        ))}
      </div>

      {p.pending.length ? (
        <section className="space-y-2">
          <p className="eyebrow">Wants to train with you</p>
          {p.pending.map((r) => (
            <div key={r.matchId} className="flex items-center gap-3 rounded-2xl bg-ember-soft p-3 ring-1 ring-ember/20"><Avatar name={r.displayName} /><div className="flex-1"><div className="text-sm font-medium">{r.displayName}</div><div className="text-xs text-fg-muted">@{r.handle}</div></div>
              <Button size="sm" loading={busy === r.matchId + "y"} onClick={() => run(r.matchId + "y", () => api("partner/respond", { matchId: r.matchId, accept: true }), "You're partners")}><Check className="size-4" />Accept</Button>
              <Button size="sm" variant="ghost" onClick={() => run(r.matchId + "n", () => api("partner/respond", { matchId: r.matchId, accept: false }))}><X className="size-4" /></Button></div>
          ))}
        </section>
      ) : null}

      <Tabs defaultValue="people">
        <TabsList><TabsTrigger value="people">People</TabsTrigger><TabsTrigger value="groups">Groups</TabsTrigger><TabsTrigger value="challenges">Challenges</TabsTrigger></TabsList>

        <TabsContent value="people" className="mt-4 space-y-6">
          {p.partners.length ? (
            <div className="space-y-2"><p className="eyebrow">Your partners</p>
              <div className="grid gap-2 sm:grid-cols-2">{p.partners.map((pt) => (
                <div key={pt.matchId} className="flex items-center gap-3 rounded-2xl bg-surface/50 p-3 ring-1 ring-white/[0.05]"><Avatar name={pt.displayName} /><div className="flex-1"><div className="text-sm font-medium">{pt.displayName}</div><div className="text-xs text-fg-muted">{pt.sessionsThisWeek} session{pt.sessionsThisWeek === 1 ? "" : "s"} this week</div></div><Button size="sm" variant="ghost" onClick={() => setChat(pt)}><MessageSquare className="size-4" />Message</Button></div>))}</div>
            </div>
          ) : null}
          <div className="space-y-2"><p className="eyebrow">Suggested for you</p>
            {p.matchReason ? <div className="rounded-2xl bg-surface/50 p-5 ring-1 ring-white/[0.05]"><Shield className="size-5 text-ember" /><p className="mt-2 text-sm text-fg-muted">{p.matchReason}</p><Button size="sm" className="mt-3" onClick={() => setEditing(true)}>{p.me ? "Change visibility" : "Create profile"}</Button></div>
            : p.matches.length === 0 ? <div className="rounded-2xl bg-surface/50 p-5 ring-1 ring-white/[0.05]"><p className="text-sm text-fg-muted">No one close enough yet. Matches appear as members with your goals and schedule opt in.</p></div>
            : <div className="grid gap-3 sm:grid-cols-2">{p.matches.map((m, i) => (
              <motion.div key={m.userId} {...stagger(i)} className="relative overflow-hidden rounded-2xl bg-surface/50 p-4 ring-1 ring-white/[0.05]">
                <div className="flex items-start gap-3"><Avatar name={m.displayName} size={44} /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="truncate font-medium">{m.displayName}</span><span className="ml-auto rounded-full bg-ember-soft px-2 py-0.5 font-display text-xs font-semibold tabular text-ember">{m.score}%</span></div><div className="truncate text-xs text-fg-muted">@{m.handle}{m.city ? ` · ${m.city}` : ""}{m.level ? ` · ${m.level}` : ""}</div></div></div>
                <div className="mt-3 flex flex-wrap gap-1.5">{m.reasons.slice(0, 3).map((r) => <span key={r} className="rounded-full bg-surface-2 px-2 py-0.5 text-2xs text-fg-muted">{r}</span>)}</div>
                <div className="mt-3 flex items-center gap-2">
                  {m.status === "accepted" ? <span className="text-xs text-signal">Partners</span> : m.status === "suggested" && m.initiatedByMe ? <span className="text-xs text-fg-subtle">Request sent</span> : m.status === "suggested" ? <Button size="sm" loading={busy === m.userId} onClick={() => run(m.userId, () => api("partner", { userId: m.userId }), "You're partners")}>Accept</Button> : <Button size="sm" loading={busy === m.userId} onClick={() => run(m.userId, () => api("partner", { userId: m.userId }), "Request sent")}>Train together</Button>}
                  <button type="button" className="ml-auto text-fg-subtle hover:text-fg" aria-label="Block" onClick={() => run("b" + m.userId, () => api("block", { userId: m.userId }), "Blocked")}><Ban className="size-4" /></button>
                  <button type="button" className="text-fg-subtle hover:text-fg" aria-label="Report" onClick={() => { const why = prompt("What's wrong?"); if (why) run("r" + m.userId, () => api("report", { targetType: "user", targetId: m.userId, reason: why }), "Reported"); }}><Flag className="size-4" /></button>
                </div>
              </motion.div>))}</div>}
          </div>
        </TabsContent>

        <TabsContent value="groups" className="mt-4 space-y-3">
          <div className="flex items-center justify-between"><p className="eyebrow">Groups</p><Button size="sm" variant="ghost" onClick={() => setNewGroup(true)}><Plus className="size-4" />New group</Button></div>
          {p.groups.length === 0 ? <div className="rounded-2xl bg-surface/50 p-5 ring-1 ring-white/[0.05]"><p className="text-sm text-fg-muted">No groups yet. Start one for your gym, your city or your split.</p></div> : null}
          <div className="grid gap-3 sm:grid-cols-2">{p.groups.map((g, i) => (
            <motion.div key={g.id} {...stagger(i)} className="flex flex-col rounded-2xl bg-surface/50 p-4 ring-1 ring-white/[0.05]">
              <div className="font-display text-lg font-semibold tracking-tight">{g.name}</div>
              {g.description ? <p className="mt-1 line-clamp-2 text-sm text-fg-muted">{g.description}</p> : null}
              <div className="mt-3 flex items-center gap-2 text-xs text-fg-subtle"><Users className="size-3.5" />{g.memberCount} member{g.memberCount === 1 ? "" : "s"}
                <div className="ml-auto flex gap-2">{g.joined ? <Button size="sm" variant="ghost" onClick={() => setOpenGroup(g.id)}>Open</Button> : null}<Button size="sm" variant={g.joined ? "ghost" : "primary"} loading={busy === g.id} onClick={() => run(g.id, () => api("groups/join", { groupId: g.id, join: !g.joined }), g.joined ? "Left group" : "Joined")}>{g.joined ? "Leave" : "Join"}</Button></div></div>
            </motion.div>))}</div>
        </TabsContent>

        <TabsContent value="challenges" className="mt-4 space-y-3">
          <p className="eyebrow">Challenges</p>
          <div className="grid gap-3 md:grid-cols-2">{p.challenges.map((c, i) => (
            <motion.div key={c.id} {...stagger(i)} className="rounded-2xl bg-surface/50 p-4 ring-1 ring-white/[0.05]">
              <div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-ember-soft"><Trophy className="size-5 text-ember" /></div><div className="flex-1"><div className="font-display text-lg font-semibold tracking-tight">{c.name}</div><div className="text-xs text-fg-muted">Completed sessions · {daysLeft(c.endsOn)} day{daysLeft(c.endsOn) === 1 ? "" : "s"} left · {c.participants} in</div></div>
                <Button size="sm" variant={c.joined ? "ghost" : "primary"} loading={busy === c.id} onClick={() => run(c.id, () => api("challenges/join", { challengeId: c.id, join: !c.joined }), c.joined ? "Left challenge" : "You're in")}>{c.joined ? "Leave" : "Join"}</Button></div>
              {c.board.length ? <ol className="mt-4 space-y-1.5">{c.board.slice(0, 5).map((b, j) => (
                <li key={b.userId} className={cn("flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm", b.me && "bg-ember-soft")}><span className="w-4 text-right font-display text-xs text-fg-subtle tabular">{j + 1}</span><Avatar name={b.displayName} size={24} /><span className="flex-1 truncate">{b.displayName}{b.me ? " (you)" : ""}</span><span className="font-display font-semibold tabular">{b.score}</span></li>))}</ol> : <p className="mt-3 text-xs text-fg-subtle">Be the first in. Every completed session counts automatically.</p>}
            </motion.div>))}</div>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-fg-subtle">Private by default. Your name, city and goals are shared only when you choose members-only or public. Block or report anyone from their card.</p>

      <ProfileDialog open={editing} onClose={() => setEditing(false)} me={p.me} defaultName={p.defaultName} onSaved={() => { setEditing(false); router.refresh(); }} />
      <GroupDialog id={openGroup} onClose={() => setOpenGroup(null)} />
      <NewGroupDialog open={newGroup} onClose={() => setNewGroup(false)} onCreated={() => { setNewGroup(false); router.refresh(); }} />
      <ChatDialog partner={chat} onClose={() => setChat(null)} />
    </div>
  );
}

function ProfileDialog({ open, onClose, me, defaultName, onSaved }: { open: boolean; onClose: () => void; me: Me | null; defaultName: string; onSaved: () => void }) {
  const [f, setF] = useState<Me>(me ?? { handle: "", displayName: defaultName, bio: "", city: "", country: "", trainTogether: false, visibility: "private" });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (me) setF(me); }, [me]);
  async function save() { setBusy(true); try { await api("profile", f); onSaved(); toast.success("Profile saved"); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); } }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}><DialogContent title="Community profile" description="Choose what others can see.">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Handle"><Input value={f.handle} onChange={(e) => setF({ ...f, handle: e.target.value })} placeholder="e.g. sam_lifts" /></Field>
          <Field label="Display name"><Input value={f.displayName} onChange={(e) => setF({ ...f, displayName: e.target.value })} /></Field>
          <Field label="City"><Input value={f.city ?? ""} onChange={(e) => setF({ ...f, city: e.target.value })} placeholder="Optional" /></Field>
          <Field label="Country"><Input value={f.country ?? ""} onChange={(e) => setF({ ...f, country: e.target.value })} placeholder="Optional" /></Field>
        </div>
        <Field label="A line about you"><Textarea value={f.bio ?? ""} onChange={(e) => setF({ ...f, bio: e.target.value })} className="min-h-16" /></Field>
        <Field label="Who can see you" hint="Private hides you from matching entirely."><Segmented value={f.visibility} onChange={(v) => setF({ ...f, visibility: v })} options={[{ value: "private", label: "Private" }, { value: "members", label: "Members" }, { value: "public", label: "Public" }]} /></Field>
        <label className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2.5 text-sm"><span>Open to training together in person</span><Switch checked={f.trainTogether} onCheckedChange={(v) => setF({ ...f, trainTogether: v })} /></label>
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={save}>Save</Button></div>
      </div>
    </DialogContent></Dialog>
  );
}

function NewGroupDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState(""); const [desc, setDesc] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}><DialogContent title="New group" description="Your gym, your city, your split.">
      <div className="space-y-4"><Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field><Field label="What it's for"><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="min-h-16" /></Field>
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={name.trim().length < 2} onClick={async () => { setBusy(true); try { await api("groups", { name, description: desc || null }); setName(""); setDesc(""); onCreated(); toast.success("Group created"); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); } }}>Create</Button></div></div>
    </DialogContent></Dialog>
  );
}

function GroupDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [feed, setFeed] = useState<{ group: { name: string; description: string | null }; posts: Post[] } | null>(null);
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false); const [reply, setReply] = useState<Record<string, string>>({});
  const load = async () => { if (!id) return; try { setFeed(await api(`groups?id=${id}`, undefined, "GET")); } catch (e) { toast.error((e as Error).message); } };
  useEffect(() => { setFeed(null); void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);
  async function post() { if (!id || !text.trim()) return; setBusy(true); try { await api("posts", { groupId: id, body: text }); setText(""); await load(); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); } }
  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}><DialogContent title={feed?.group.name ?? "Group"} description={feed?.group.description ?? undefined}>
      <div className="space-y-4">
        <div className="flex gap-2"><Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Share a session, a PR, a question" onKeyDown={(e) => e.key === "Enter" && post()} /><Button loading={busy} onClick={post} aria-label="Post"><Send className="size-4" /></Button></div>
        <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
          {feed?.posts.length === 0 ? <p className="text-sm text-fg-muted">Quiet so far. Say hello.</p> : null}
          {feed?.posts.map((po) => (
            <div key={po.id} className="rounded-xl bg-surface-2 p-3">
              <div className="flex items-center gap-2"><Avatar name={po.author.displayName} size={28} /><span className="text-sm font-medium">{po.author.displayName}</span><span className="text-2xs text-fg-subtle">{new Date(po.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
                <button type="button" className="ml-auto text-fg-subtle hover:text-fg" aria-label="Report post" onClick={async () => { const why = prompt("What's wrong?"); if (why) { await api("report", { targetType: "post", targetId: po.id, reason: why }); toast.success("Reported"); } }}><Flag className="size-3.5" /></button></div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{po.body}</p>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <button type="button" className={cn("inline-flex items-center gap-1", po.reacted ? "text-ember" : "text-fg-subtle hover:text-fg")} onClick={async () => { await api("reactions", { postId: po.id }); await load(); }}><Flame className="size-3.5" />{po.reactions}</button>
                <span className="text-fg-subtle">{po.comments.length} repl{po.comments.length === 1 ? "y" : "ies"}</span>
              </div>
              {po.comments.map((c) => <div key={c.id} className="mt-2 border-l-2 border-border pl-3 text-sm"><span className="font-medium">{c.author.displayName}</span> <span className="text-fg-muted">{c.body}</span></div>)}
              <div className="mt-2 flex gap-2"><Input value={reply[po.id] ?? ""} onChange={(e) => setReply({ ...reply, [po.id]: e.target.value })} placeholder="Reply" className="h-9 text-sm" onKeyDown={async (e) => { if (e.key === "Enter" && (reply[po.id] ?? "").trim()) { await api("comments", { postId: po.id, body: reply[po.id] }); setReply({ ...reply, [po.id]: "" }); await load(); } }} /></div>
            </div>))}
        </div>
      </div>
    </DialogContent></Dialog>
  );
}

function ChatDialog({ partner, onClose }: { partner: Partner | null; onClose: () => void }) {
  const [msgs, setMsgs] = useState<{ id: string; senderId: string; body: string; createdAt: string }[]>([]);
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false);
  const load = async () => { if (!partner) return; const j = await api(`messages?matchId=${partner.matchId}`, undefined, "GET"); setMsgs(j.messages); };
  useEffect(() => { setMsgs([]); void load(); const t = setInterval(load, 8000); return () => clearInterval(t); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [partner?.matchId]);
  async function send() { if (!partner || !text.trim()) return; setBusy(true); try { await api("messages", { matchId: partner.matchId, body: text }); setText(""); await load(); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); } }
  return (
    <Dialog open={!!partner} onOpenChange={(o) => !o && onClose()}><DialogContent title={partner?.displayName ?? ""} description="Only the two of you can read this.">
      <div className="space-y-3">
        <div className="flex max-h-[50vh] min-h-40 flex-col gap-2 overflow-y-auto rounded-xl bg-surface-2 p-3">
          {msgs.length === 0 ? <p className="m-auto text-sm text-fg-subtle">Say hi. Plan a session.</p> : null}
          {msgs.map((m) => <div key={m.id} className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm", m.senderId === partner?.userId ? "self-start bg-surface" : "self-end bg-ember text-white")}>{m.body}</div>)}
        </div>
        <div className="flex gap-2"><Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message" onKeyDown={(e) => e.key === "Enter" && send()} /><Button loading={busy} onClick={send} aria-label="Send"><Send className="size-4" /></Button></div>
      </div>
    </DialogContent></Dialog>
  );
}
