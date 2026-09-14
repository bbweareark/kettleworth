import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "./session";

/** Route-handler helper: auth + zod body + uniform errors. */
export function route<T extends z.ZodTypeAny | undefined>(schema: T, fn: (ctx: { userId: string; body: T extends z.ZodTypeAny ? z.infer<T> : undefined; req: Request; params: Record<string, string> }) => Promise<unknown>) {
  return async (req: Request, ctx?: { params: Promise<Record<string, string>> }) => {
    const s = await getSession();
    if (!s) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    let body: unknown = undefined;
    if (schema) {
      const raw = req.method === "GET" ? Object.fromEntries(new URL(req.url).searchParams) : await req.json().catch(() => ({}));
      const parsed = schema.safeParse(raw);
      if (!parsed.success) return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
      body = parsed.data;
    }
    try {
      const params = ctx ? await ctx.params : {};
      const out = await fn({ userId: s.user.id, body: body as never, req, params });
      return out instanceof Response ? out : NextResponse.json(out ?? { ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      const code = (e as { code?: string })?.code;
      if (code === "needs_confirmation") return NextResponse.json({ error: msg, code }, { status: 409 });
      console.error(`[api] ${req.method} ${new URL(req.url).pathname}:`, e);
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  };
}
