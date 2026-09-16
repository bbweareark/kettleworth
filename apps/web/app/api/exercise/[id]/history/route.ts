import { NextResponse } from "next/server";
import { exerciseHistory } from "@kettleworth/api";
import { route } from "@/lib/api";
export const GET = route(undefined, async ({ userId, params }) => (await exerciseHistory(userId, params.id!)) ?? NextResponse.json({ error: "Not found" }, { status: 404 }));
