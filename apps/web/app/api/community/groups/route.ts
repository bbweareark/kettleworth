import { z } from "zod";
import { createGroup, groupFeed, listGroups } from "@kettleworth/api";
import { route } from "@/lib/api";
export const GET = route(z.object({ id: z.string().uuid().optional() }), async ({ userId, body }) => (body.id ? groupFeed(userId, body.id) : { groups: await listGroups(userId) }));
export const POST = route(z.object({ name: z.string().min(2).max(60), description: z.string().max(300).nullable().optional() }), async ({ userId, body }) => createGroup(userId, body.name, body.description ?? null));
