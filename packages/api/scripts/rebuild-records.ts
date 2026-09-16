// Run with DATABASE_URL (and HEALTH_DATA_ENCRYPTION_KEY) in the environment, e.g. from the repo .env.
import { rebuildPersonalRecords } from "../src/services/session";
import { db, personalRecord } from "@kettleworth/db";
import { sql } from "drizzle-orm";

/** One-off: rebuild every saved personal record with the current rules. Safe to re-run. */
const count = async () => (await db().select({ n: sql<number>`count(*)::int` }).from(personalRecord))[0]?.n ?? 0;
const before = await count();
const r = await rebuildPersonalRecords();
console.log(`Rebuilt records for ${r.users} users: ${before} before, ${await count()} after.`);
process.exit(0);
