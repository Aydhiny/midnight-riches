"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { checkRateLimit } from "@/lib/server/rate-limiter";

const FAKE_NAMES = [
  "Alex K.",
  "Sarah M.",
  "Player123",
  "Jordan R.",
  "Chris W.",
  "Taylor B.",
  "Morgan L.",
  "Casey D.",
  "Riley P.",
  "Quinn S.",
  "Jamie T.",
  "Avery N.",
  "Dakota F.",
  "Cameron H.",
  "Blake J.",
];

const GAME_NAMES = [
  "Five Reel Deluxe",
  "Mega Ways",
  "Classic Fruits",
  "Golden Dragon",
  "Midnight Fortune",
  "Diamond Rush",
  "Lucky Sevens",
  "Pharaoh's Gold",
  "Wild Safari",
  "Cosmic Spins",
];

const EMOJIS_BY_SIZE = [
  { emoji: "🔥", threshold: 0 },
  { emoji: "🎰", threshold: 200 },
  { emoji: "💰", threshold: 1000 },
  { emoji: "💎", threshold: 3000 },
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount(): number {
  // Weighted distribution: mostly small wins, occasionally big ones
  const roll = Math.random();
  if (roll < 0.5) return +(Math.random() * 200 + 10).toFixed(2); // $10-$210
  if (roll < 0.8) return +(Math.random() * 800 + 200).toFixed(2); // $200-$1000
  if (roll < 0.95) return +(Math.random() * 4000 + 1000).toFixed(2); // $1000-$5000
  return +(Math.random() * 15000 + 5000).toFixed(2); // $5000-$20000 (rare)
}

function getEmoji(amount: number): string {
  let result = "🔥";
  for (const { emoji, threshold } of EMOJIS_BY_SIZE) {
    if (amount >= threshold) result = emoji;
  }
  return result;
}

export async function seedCommunityWinsAction(): Promise<{ success: boolean }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false };
    }

    const rateLimitResult = checkRateLimit(`seed-notif:${session.user.id}`, {
      maxRequests: 2,
      windowMs: 60_000,
    });
    if (!rateLimitResult.success) {
      return { success: true }; // silently succeed to avoid UI errors
    }

    const numNotifications = Math.floor(Math.random() * 6) + 5; // 5-10
    const now = Date.now();

    const entries = Array.from({ length: numNotifications }, (_, i) => {
      const playerName = randomItem(FAKE_NAMES);
      const gameName = randomItem(GAME_NAMES);
      const amount = randomAmount();
      const emoji = getEmoji(amount);
      const isJackpot = amount >= 3000;

      const title = isJackpot
        ? `${emoji} JACKPOT — ${playerName}`
        : `${emoji} ${playerName} won big!`;

      const message = isJackpot
        ? `${playerName} hit the JACKPOT — $${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} on ${gameName}!`
        : `${playerName} won $${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} on ${gameName}!`;

      return {
        userId: session.user!.id!,
        type: "community_win" as const,
        title,
        message,
        metadata: { playerName, gameName, winAmount: amount },
        read: false,
        // Stagger creation times so they appear at different "time ago" values
        createdAt: new Date(now - i * (Math.random() * 300_000 + 60_000)), // 1-6 min apart
      };
    });

    await db.insert(notifications).values(entries);

    return { success: true };
  } catch {
    return { success: false };
  }
}
