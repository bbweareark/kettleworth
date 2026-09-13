import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { db, aiLog } from "@kettleworth/db";

export const AI_MODEL = process.env.AI_MODEL ?? "claude-opus-5";
let client: Anthropic | null = null;

/** True when a credential is available. Without one every AI task returns null and callers fall back to deterministic copy. */
export function aiAvailable(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}
function getClient(): Anthropic {
  client ??= new Anthropic({ timeout: 120_000, maxRetries: 2 });
  return client;
}

export type StructuredTask<T> = {
  task: string;
  userId?: string | null;
  system: string;
  user: string;
  schema: z.ZodType<T>;
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
  /** Post-parse validator: return a list of problems; non-empty => output rejected and logged as invalid. */
  validate?: (out: T) => string[];
  /** Optional images (base64) sent ahead of the user text. */
  images?: { data: string; mediaType: "image/jpeg" | "image/png" | "image/webp" }[];
};

/**
 * One structured call: system + user -> schema-validated JSON. Logs prompt, output, tokens and validity to ai_log.
 * Returns null on any failure so product paths always have a deterministic fallback.
 */
export async function structured<T>(t: StructuredTask<T>): Promise<T | null> {
  if (!aiAvailable()) return null;
  const started = Date.now();
  let output: T | null = null;
  let errors: string[] = [];
  let usage: { input_tokens?: number; output_tokens?: number } = {};
  try {
    const res = await getClient().messages.parse({
      model: AI_MODEL,
      max_tokens: t.maxTokens ?? 4096,
      system: [{ type: "text", text: t.system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: t.images?.length ? [...t.images.map((im) => ({ type: "image" as const, source: { type: "base64" as const, media_type: im.mediaType, data: im.data } })), { type: "text" as const, text: t.user }] : t.user }],
      output_config: { format: zodOutputFormat(t.schema), effort: t.effort ?? "medium" },
    });
    usage = res.usage;
    if (res.stop_reason === "refusal") errors.push(`refusal: ${res.stop_details?.category ?? "unknown"}`);
    else if (!res.parsed_output) errors.push("parse failed");
    else {
      output = res.parsed_output as T;
      if (t.validate) errors = t.validate(output);
      if (errors.length) output = null;
    }
  } catch (e) {
    errors.push(e instanceof Anthropic.APIError ? `api ${e.status}: ${e.message}` : String(e));
  }
  try {
    await db().insert(aiLog).values({ userId: t.userId ?? null, task: t.task, model: AI_MODEL, system: t.system.slice(0, 20000), input: { user: t.user.slice(0, 50000), images: t.images?.length ?? 0 }, output: output as unknown as Record<string, unknown> | null, valid: errors.length ? 0 : 1, validationErrors: errors.length ? errors : null, inputTokens: usage.input_tokens ?? null, outputTokens: usage.output_tokens ?? null, latencyMs: Date.now() - started });
  } catch (e) {
    console.warn("ai_log write failed", e);
  }
  if (errors.length) console.warn(`[ai:${t.task}] rejected:`, errors);
  return output;
}
