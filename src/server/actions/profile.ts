"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(data: {
  name?: string;
  image?: string; // base64 data URL or public URL
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const updateData: Partial<{ name: string; image: string }> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.image !== undefined) updateData.image = data.image;

    if (Object.keys(updateData).length === 0) {
      return { success: false, error: "No data to update" };
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id));

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
