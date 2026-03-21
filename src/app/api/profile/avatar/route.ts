import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/profile/avatar
 * Serves the authenticated user's profile picture from the database.
 * Storing base64 in the JWT cookie would exceed the 4 KB limit, so we
 * store only this URL in the token and serve the image here on demand.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse(null, { status: 401 });
  }

  const [user] = await db
    .select({ image: users.image })
    .from(users)
    .where(eq(users.id, session.user.id));

  const image = user?.image;
  if (!image) {
    return new NextResponse(null, { status: 404 });
  }

  // If the stored value is a base64 data URL, extract and return raw bytes
  const match = image.match(/^data:(.+?);base64,(.+)$/);
  if (match) {
    const mimeType = match[1];
    const buffer = Buffer.from(match[2], "base64");
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  }

  // Plain URL — redirect
  return NextResponse.redirect(image);
}
