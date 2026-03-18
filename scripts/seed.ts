import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { users, wallets, gameSessions, transactions } from "../src/lib/db/schema";
import bcrypt from "bcryptjs";

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const sql = neon(url);
  const db = drizzle(sql);

  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  const [testUser] = await db
    .insert(users)
    .values({
      name: "Test Player",
      email: "test@midnight-riches.dev",
      passwordHash,
    })
    .onConflictDoNothing()
    .returning();

  if (!testUser) {
    console.log("Test user already exists, skipping...");
    process.exit(0);
  }

  await db.insert(wallets).values({
    userId: testUser.id,
    balance: "1000.00",
    currency: "USD",
  });

  const outcomes: ("win" | "loss" | "bonus")[] = ["win", "loss", "bonus"];
  const gameSessionValues = Array.from({ length: 50 }, (_, i) => {
    const outcome = outcomes[i % 3];
    const betAmount = [0.5, 1, 2, 5, 10][i % 5];
    const winAmount = outcome === "loss" ? 0 : betAmount * (2 + Math.floor(Math.random() * 20));
    const date = new Date();
    date.setDate(date.getDate() - (50 - i));

    return {
      userId: testUser.id,
      gameId: "fruit-slots",
      betAmount: betAmount.toString(),
      outcome,
      winAmount: winAmount.toString(),
      reelResult: [
        ["cherry", "lemon", "orange"],
        ["grape", "wild", "cherry"],
        ["lemon", "scatter", "watermelon"],
      ],
      createdAt: date,
    };
  });

  await db.insert(gameSessions).values(gameSessionValues);

  type TxInsert = {
    userId: string;
    type: "deposit" | "withdrawal" | "bet" | "win" | "bonus";
    amount: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
  };

  const txValues = gameSessionValues.flatMap((gs) => {
    const txs: TxInsert[] = [
      {
        userId: testUser.id,
        type: "bet",
        amount: (-Number(gs.betAmount)).toString(),
        metadata: { betPerLine: Number(gs.betAmount) / 5, paylines: 5 },
        createdAt: gs.createdAt,
      },
    ];
    if (Number(gs.winAmount) > 0) {
      txs.push({
        userId: testUser.id,
        type: "win",
        amount: gs.winAmount,
        metadata: { outcome: gs.outcome },
        createdAt: gs.createdAt,
      });
    }
    return txs;
  });

  await db.insert(transactions).values(txValues);

  console.log("Seed complete:");
  console.log("  - Test user: test@midnight-riches.dev / password123");
  console.log("  - Wallet: $1,000.00");
  console.log("  - Game sessions: 50");
  console.log("  - Transactions:", txValues.length);
}

seed().catch(console.error);
