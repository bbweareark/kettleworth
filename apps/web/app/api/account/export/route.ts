import { NextResponse } from "next/server";
import { exportAccount } from "@kettleworth/api";
import { route } from "@/lib/api";
export const GET = route(undefined, async ({ userId }) => { const data = await exportAccount(userId); return new NextResponse(JSON.stringify(data, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="kettleworth-export-${new Date().toISOString().slice(0, 10)}.json"` } }); });
