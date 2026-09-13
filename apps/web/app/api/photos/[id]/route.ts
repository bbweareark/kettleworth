import { NextResponse } from "next/server";
import { readPhoto, deletePhoto } from "@kettleworth/api";
import { getSession } from "@/lib/session";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return new NextResponse("Unauthorised", { status: 401 });
  const p = await readPhoto(s.user.id, (await ctx.params).id);
  if (!p) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(p.bytes), { headers: { "Content-Type": p.row.contentType, "Cache-Control": "private, max-age=3600", "Content-Disposition": "inline" } });
}
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  await deletePhoto(s.user.id, (await ctx.params).id);
  return NextResponse.json({ ok: true });
}
