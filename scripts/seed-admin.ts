/**
 * Seed or promote a user to admin.
 *
 * Usage (from repo root):
 *   npx tsx scripts/seed-admin.ts
 *   npx tsx scripts/seed-admin.ts --email admin@yourdomain.com --password YourSecurePass1
 *
 * Both --email and --password are required (no defaults).
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users, wallets } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const args = process.argv.slice(2);
const getArg = (flag: string, fallback: string) => {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};

const ADMIN_EMAIL    = getArg("--email",    "");
const ADMIN_PASSWORD = getArg("--password", "");
const ADMIN_NAME     = getArg("--name",     "Admin");

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("❌  Usage: npx tsx scripts/seed-admin.ts --email <email> --password <password>");
  process.exit(1);
}

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("❌  DATABASE_URL is not set in .env");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db  = drizzle(sql, { schema: { users, wallets } });

  // Check if user already exists
  const existing = await db.query.users.findFirst({
    where: eq(users.email, ADMIN_EMAIL),
  });

  if (existing) {
    // Promote existing user to admin
    await db.update(users)
      .set({ role: "admin" })
      .where(eq(users.id, existing.id));

    console.log(`✅  Promoted existing user to admin:`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   ID:    ${existing.id}`);
    return;
  }

  // Create new admin user
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const [newUser] = await db.insert(users).values({
    name:          ADMIN_NAME,
    email:         ADMIN_EMAIL,
    passwordHash,
    role:          "admin",
    emailVerified: new Date(),
  }).returning();

  if (!newUser) {
    console.error("❌  Failed to create admin user");
    process.exit(1);
  }

  // Create wallet with starting balance
  await db.insert(wallets).values({
    userId:  newUser.id,
    balance: "99999.00",
    currency: "USD",
  });

  console.log("✅  Admin user created:");
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   ID:    ${newUser.id}`);
  console.log("\n⚠️   Change the password immediately after first login!");
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
