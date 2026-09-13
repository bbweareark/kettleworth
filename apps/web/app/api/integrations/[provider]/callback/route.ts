import { NextResponse } from "next/server";
import { completeConnect } from "@kettleworth/api";
export async function GET(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const u = new URL(req.url);
  const origin = process.env.BETTER_AUTH_URL ?? u.origin;
  const code = u.searchParams.get("code"), state = u.searchParams.get("state"), error = u.searchParams.get("error");
  if (error || !code || !state) return NextResponse.redirect(`${origin}/app/connected?error=${encodeURIComponent(error ?? "missing_code")}`);
  try {
    await completeConnect(provider, code, state, `${origin}/api/integrations/${provider}/callback`);
    return NextResponse.redirect(`${origin}/app/connected?connected=${provider}`);
  } catch (e) {
    return NextResponse.redirect(`${origin}/app/connected?error=${encodeURIComponent(e instanceof Error ? e.message : "failed")}`);
  }
}
