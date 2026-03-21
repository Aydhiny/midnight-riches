/**
 * Seed the `collectibles` table with the default shop items.
 * Safe to run multiple times — uses onConflictDoNothing by name.
 *
 * Usage:
 *   npm run db:seed-collectibles
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { collectibles } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const COLLECTIBLES = [
  {
    name: "Golden Champion Frame",
    description: "Gilded gold border for true high rollers",
    type: "avatar_frame" as const,
    rarity: "legendary" as const,
    priceCredits: "500.00",
    priceUsd: null,
    isActive: true,
  },
  {
    name: "Neon Pulse Frame",
    description: "Pulsing neon border that reacts to wins",
    type: "avatar_frame" as const,
    rarity: "rare" as const,
    priceCredits: "150.00",
    priceUsd: null,
    isActive: true,
  },
  {
    name: "Diamond VIP Frame",
    description: "Exclusive diamond-studded avatar frame for VIP players only",
    type: "avatar_frame" as const,
    rarity: "legendary" as const,
    priceCredits: null,
    priceUsd: "9.99",
    isActive: true,
  },
  {
    name: "Midnight Chrome Reels",
    description: "Chrome metallic reels with deep space background",
    type: "reel_theme" as const,
    rarity: "epic" as const,
    priceCredits: null,
    priceUsd: "4.99",
    isActive: true,
  },
  {
    name: "Volcano Inferno Reels",
    description: "Fire and lava themed reels with particle effects",
    type: "reel_theme" as const,
    rarity: "legendary" as const,
    priceCredits: null,
    priceUsd: "7.99",
    isActive: true,
  },
  {
    name: "Pixel Fruit Skins",
    description: "8-bit pixel art versions of all fruit symbols",
    type: "symbol_skin" as const,
    rarity: "rare" as const,
    priceCredits: "200.00",
    priceUsd: null,
    isActive: true,
  },
  {
    name: "Crypto Symbol Pack",
    description: "BTC, ETH and crypto icons replace classic symbols",
    type: "symbol_skin" as const,
    rarity: "epic" as const,
    priceCredits: "350.00",
    priceUsd: null,
    isActive: true,
  },
  {
    name: "Casino Lounge Music",
    description: "The iconic Midnight Riches casino soundtrack",
    type: "sound_pack" as const,
    rarity: "common" as const,
    priceCredits: "75.00",
    priceUsd: null,
    isActive: true,
  },
  {
    name: "Midnight Beats Pack",
    description: "Enhanced beats and spin sounds for the ultimate vibe",
    type: "sound_pack" as const,
    rarity: "rare" as const,
    priceCredits: "125.00",
    priceUsd: null,
    isActive: true,
  },
  {
    name: "Funky Groove Music",
    description: "Unlock the Funky Groove music track for the game player",
    type: "sound_pack" as const,
    rarity: "rare" as const,
    priceCredits: "200.00",
    priceUsd: null,
    isActive: true,
  },
  {
    name: "Smooth Sax Music",
    description: "Unlock the Smooth Sax premium music track for the game",
    type: "sound_pack" as const,
    rarity: "epic" as const,
    priceCredits: "350.00",
    priceUsd: null,
    isActive: true,
  },
];

async function seedCollectibles() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const sql = neon(url);
  const db = drizzle(sql, { schema: { collectibles } });

  console.log("Seeding collectibles...");
  let inserted = 0;
  let skipped = 0;

  for (const item of COLLECTIBLES) {
    const [existing] = await db
      .select({ id: collectibles.id })
      .from(collectibles)
      .where(eq(collectibles.name, item.name));

    if (existing) {
      console.log(`  - skipped (exists): ${item.name}`);
      skipped++;
    } else {
      await db.insert(collectibles).values(item);
      console.log(`  ✓ inserted: ${item.name}`);
      inserted++;
    }
  }

  console.log(`\nDone! ${inserted} inserted, ${skipped} skipped.`);
}

seedCollectibles().catch((err) => {
  console.error(err);
  process.exit(1);
});
