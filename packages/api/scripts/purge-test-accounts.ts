/**
 * Remove throwaway verification accounts from a database.
 *
 * Live verification is done on accounts created and deleted for the purpose, never on a real
 * one, because logging fake sets writes into real training history, drives autoregulation on
 * future loads and can record a false personal record. When a verification script fails
 * partway it can leave an account behind, and this removes the strays.
 *
 * It only ever touches addresses at `.test`, which is a reserved TLD (RFC 2606) that can never
 * receive mail and that no real member can own. It is a dry run unless you pass --yes, it
 * prints exactly what it would remove first, and it refuses a pattern outside that TLD.
 *
 *   pnpm --filter @kettleworth/api exec tsx scripts/purge-test-accounts.ts
 *   pnpm --filter @kettleworth/api exec tsx scripts/purge-test-accounts.ts --yes
 *   pnpm --filter @kettleworth/api exec tsx scripts/purge-test-accounts.ts --pattern 'comm2-%@kettleworth.test' --yes
 *
 * DATABASE_URL selects the database, so point it at production deliberately, never by default.
 */
import { like } from "drizzle-orm";
import { db, user } from "@kettleworth/db";
import { deleteAccount } from "../src/services/account";

const args = process.argv.slice(2);
const apply = args.includes("--yes");
const pattern = args[args.indexOf("--pattern") + 1]?.startsWith("--") || !args.includes("--pattern")
  ? "%@kettleworth.test"
  : args[args.indexOf("--pattern") + 1]!;

if (!/\.test$/.test(pattern.replace(/%$/, ""))) {
  console.error(`Refusing pattern ${pattern}: this script only removes addresses at the reserved .test TLD.`);
  process.exit(1);
}

const rows = await db().select({ id: user.id, email: user.email, createdAt: user.createdAt }).from(user).where(like(user.email, pattern));

if (!rows.length) {
  console.log(`No accounts match ${pattern}. Nothing to do.`);
  process.exit(0);
}

console.log(`${rows.length} account(s) match ${pattern}:`);
for (const r of rows) console.log(`  ${r.email}  created ${String(r.createdAt).slice(0, 19)}`);

if (!apply) {
  console.log("\nDry run. Re-run with --yes to remove them.");
  process.exit(0);
}

for (const r of rows) {
  await deleteAccount(r.id);
  console.log(`removed ${r.email}`);
}
console.log(`\nDone: ${rows.length} account(s) removed.`);
process.exit(0);
