"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { collectibles, userCollectibles, wallets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/** Returns the names of owned sound_pack collectibles and which one is equipped. */
export async function getOwnedSoundPacks(): Promise<{
  success: true; ownedNames: string[]; equippedName: string | null;
} | { success: false; error: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    const rows = await db
      .select({ name: collectibles.name, equippedSlot: userCollectibles.equippedSlot })
      .from(userCollectibles)
      .innerJoin(collectibles, eq(userCollectibles.collectibleId, collectibles.id))
      .where(
        and(
          eq(userCollectibles.userId, session.user.id),
          eq(collectibles.type, "sound_pack"),
        ),
      );

    const ownedNames   = rows.map((r) => r.name);
    const equippedName = rows.find((r) => r.equippedSlot === "sound_pack")?.name ?? null;
    return { success: true, ownedNames, equippedName };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getCollectibles() {
  try {
    const items = await db.select().from(collectibles).where(eq(collectibles.isActive, true));
    return { success: true as const, data: items };
  } catch (err) {
    return { success: false as const, error: String(err) };
  }
}

export async function getUserCollectibles() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false as const, error: "Not authenticated" };
    const owned = await db.select().from(userCollectibles).where(eq(userCollectibles.userId, session.user.id));
    return { success: true as const, data: owned };
  } catch (err) {
    return { success: false as const, error: String(err) };
  }
}

export async function purchaseCollectible(collectibleId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    const [item] = await db.select().from(collectibles).where(eq(collectibles.id, collectibleId));
    if (!item) return { success: false, error: "Item not found" };

    // Check already owned
    const [existing] = await db.select().from(userCollectibles).where(
      and(eq(userCollectibles.userId, session.user.id), eq(userCollectibles.collectibleId, collectibleId))
    );
    if (existing) return { success: false, error: "Already owned" };

    // Deduct credits if priceCredits is set
    if (item.priceCredits) {
      const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, session.user.id));
      if (!wallet) return { success: false, error: "Wallet not found" };
      const balance = parseFloat(wallet.balance);
      const price = parseFloat(item.priceCredits);
      if (balance < price) return { success: false, error: "Insufficient credits" };
      await db.update(wallets)
        .set({ balance: String(balance - price) })
        .where(eq(wallets.userId, session.user.id));
    }

    await db.insert(userCollectibles).values({
      userId: session.user.id,
      collectibleId,
    });

    revalidatePath("/shop");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function equipCollectible(collectibleId: string, slot: "avatar_frame" | "reel_theme" | "symbol_skin" | "sound_pack"): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    // Unequip any existing item in the same slot
    await db.update(userCollectibles)
      .set({ equippedSlot: null })
      .where(and(
        eq(userCollectibles.userId, session.user.id),
        eq(userCollectibles.equippedSlot, slot)
      ));

    // Equip the new item
    await db.update(userCollectibles)
      .set({ equippedSlot: slot })
      .where(and(
        eq(userCollectibles.userId, session.user.id),
        eq(userCollectibles.collectibleId, collectibleId)
      ));

    revalidatePath("/shop");
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function unequipCollectible(slot: "avatar_frame" | "reel_theme" | "symbol_skin" | "sound_pack"): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    await db.update(userCollectibles)
      .set({ equippedSlot: null })
      .where(and(
        eq(userCollectibles.userId, session.user.id),
        eq(userCollectibles.equippedSlot, slot),
      ));

    revalidatePath("/shop");
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
