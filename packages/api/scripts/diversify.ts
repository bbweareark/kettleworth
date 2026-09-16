// Run with DATABASE_URL in the environment. Brings existing programmes up to the weekly variety rules; safe to re-run.
import { db, programme } from "@kettleworth/db";
import { eq } from "drizzle-orm";
import { diversifyProgramme } from "../src/services/programme";
const users = [...new Set((await db().select({ u: programme.userId }).from(programme).where(eq(programme.status, "active"))).map((r) => r.u))];
for (const u of users) console.log(u.slice(0, 8), JSON.stringify(await diversifyProgramme(u)));
process.exit(0);
