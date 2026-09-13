import { NextResponse } from "next/server";
import { listPhotos, savePhoto } from "@kettleworth/api";
import { getSession } from "@/lib/session";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const rows = await listPhotos(s.user.id);
  return NextResponse.json(rows.map((r) => ({ id: r.id, takenOn: r.takenOn, pose: r.pose, analysis: r.analysis })));
}
/** multipart/form-data: files[] (1 to 3), poses[] matching, takenOn */
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  try {
    const fd = await req.formData();
    const files = fd.getAll("files").filter((f): f is File => f instanceof File);
    const poses = fd.getAll("poses").map(String);
    const takenOn = String(fd.get("takenOn") ?? new Date().toISOString().slice(0, 10));
    if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });
    const saved = [];
    for (let i = 0; i < Math.min(files.length, 3); i++) {
      const f = files[i]!;
      saved.push(await savePhoto(s.user.id, { bytes: Buffer.from(await f.arrayBuffer()), contentType: f.type, pose: poses[i] ?? "front", takenOn }));
    }
    return NextResponse.json({ ids: saved.map((r) => r.id) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 400 });
  }
}
