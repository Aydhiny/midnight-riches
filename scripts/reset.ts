import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { bonusRounds, gameSessions, transactions, wallets, sessions, accounts, verificationTokens, users } from "../src/lib/db/schema";

async function reset() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const sql = neon(url);
  const db = drizzle(sql);

  console.log("Resetting database...");

  await db.delete(bonusRounds);
  await db.delete(gameSessions);
  await db.delete(transactions);
  await db.delete(wallets);
  await db.delete(sessions);
  await db.delete(accounts);
  await db.delete(verificationTokens);
  await db.delete(users);

  console.log("Database reset complete.");
}

reset().catch(console.error);
