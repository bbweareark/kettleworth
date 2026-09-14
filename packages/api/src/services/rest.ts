import { and, eq, notInArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db, restItem, restActivity } from "@kettleworth/db";
import { QUIZ_BANK, FACT_BANK, type Quiz, type Fact } from "@kettleworth/core";
import { structured, aiAvailable } from "../ai/client";
import { cleanText } from "../ai/tasks";

const LOW_WATER = 8;
const BATCH = 14;

const REST_SYSTEM = `You write short rest-break content for people between sets in a gym. Each item takes under 20 seconds to read.
Mix of themes, roughly even: exercise science and physiology; nutrition myths and truths; sports history, records and famous moments (name the year and the person); the human body; the psychology of habits and motivation; science and nature; something good that is true and uplifting.
Rules: never mention any app, product or brand of software. Only well established, verifiable facts; if you are not certain of a number or a date, choose a different fact. No medical advice. British English. Plain, warm, specific, no hype, no emojis. Never use em dashes or en dashes; use commas or the word "to" (write 6 to 12 reps).
Quizzes: one clear question, exactly three options, one correct, the others plausible, and a one-sentence "why" that teaches the point. Facts: one or two sentences, surprising and concrete.`;

const Item = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("quiz"), tag: z.string().max(24), q: z.string().max(180), options: z.array(z.string().max(80)).length(3), answer: z.number().int().min(0).max(2), why: z.string().max(240) }),
  z.object({ kind: z.literal("fact"), tag: z.string().max(24), text: z.string().max(260) }),
]);
const Batch = z.object({ items: z.array(Item).min(6).max(20) });

const inflight = new Map<string, Promise<number>>();
/** Generate a batch into the shared pool. Coalesces concurrent calls so one session's rests never fan out into many model calls. */
export function generateRestItems(userId: string | null, n = BATCH): Promise<number> {
  const key = "pool";
  const existing = inflight.get(key);
  if (existing) return existing;
  const p = (async () => {
    if (!aiAvailable()) return 0;
    const recent = await db().select({ payload: restItem.payload, kind: restItem.kind }).from(restItem).orderBy(sql`${restItem.createdAt} desc`).limit(80);
    const used = recent.map((r) => (r.kind === "quiz" ? String(r.payload.q ?? "") : String(r.payload.text ?? ""))).filter(Boolean);
    const out = await structured({
      task: "rest_content", userId, system: REST_SYSTEM, schema: Batch, effort: "low", maxTokens: 3500,
      user: `Write ${n} new items: about ${Math.round(n * 0.6)} quizzes and the rest facts. Vary the themes; no two items on the same narrow topic.\nDo not repeat or closely paraphrase any of these already used items:\n${used.map((u) => `- ${u}`).join("\n") || "(none yet)"}`,
      validate: (o) => o.items.flatMap((it, i) => (it.kind === "quiz" && new Set(it.options).size !== 3 ? [`item ${i}: duplicate options`] : [])),
    });
    if (!out) return 0;
    const rows = out.items.map((it) => {
      const id = `ai-${randomUUID().slice(0, 12)}`;
      return it.kind === "quiz"
        ? { id, kind: "quiz" as const, tag: cleanText(it.tag).toLowerCase(), payload: { id, q: cleanText(it.q), options: it.options.map(cleanText), answer: it.answer, why: cleanText(it.why) } }
        : { id, kind: "fact" as const, tag: cleanText(it.tag).toLowerCase(), payload: { id, text: cleanText(it.text) } };
    });
    await db().insert(restItem).values(rows).onConflictDoNothing();
    return rows.length;
  })().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

async function unseenFor(userId: string, kind: "quiz" | "fact", exclude: string[]) {
  const seen = (await db().select({ itemId: restActivity.itemId }).from(restActivity).where(eq(restActivity.userId, userId))).map((r) => r.itemId).filter((x): x is string => !!x);
  const skip = [...new Set([...seen, ...exclude])];
  const where = skip.length ? and(eq(restItem.kind, kind), notInArray(restItem.id, skip)) : eq(restItem.kind, kind);
  const rows = await db().select().from(restItem).where(where).orderBy(sql`random()`).limit(1);
  const [cnt] = await db().select({ n: sql<number>`count(*)::int` }).from(restItem).where(where);
  return { row: rows[0] ?? null, remaining: cnt?.n ?? 0, seen };
}

/**
 * Next unseen quiz and fact for this user. Refills the shared pool in the background when it runs low, waits for a
 * refill only when the pool is empty, and falls back to the built-in evidence bank when the model is unavailable.
 */
export async function nextRestContent(userId: string, exclude: string[] = []): Promise<{ quiz: Quiz | null; fact: Fact | null; source: "ai" | "bank" }> {
  let q = await unseenFor(userId, "quiz", exclude);
  let f = await unseenFor(userId, "fact", exclude);
  if (aiAvailable()) {
    if (!q.row || !f.row) { await generateRestItems(userId).catch(() => 0); q = await unseenFor(userId, "quiz", exclude); f = await unseenFor(userId, "fact", exclude); }
    else if (q.remaining < LOW_WATER || f.remaining < LOW_WATER) void generateRestItems(userId).catch(() => 0);
  }
  if (q.row || f.row) return { quiz: q.row ? { ...(q.row.payload as unknown as Quiz), tag: q.row.tag } : null, fact: f.row ? { ...(f.row.payload as unknown as Fact), tag: f.row.tag } : null, source: "ai" };
  // Bank fallback: unseen first, then least recently used so it never runs dry.
  const skip = new Set([...q.seen, ...exclude]);
  const pick = <T extends { id: string }>(bank: T[]) => { const un = bank.filter((b) => !skip.has(b.id)); const pool = un.length ? un : bank; return pool[Math.floor(Math.random() * pool.length)] ?? null; };
  return { quiz: pick(QUIZ_BANK), fact: pick(FACT_BANK), source: "bank" };
}
