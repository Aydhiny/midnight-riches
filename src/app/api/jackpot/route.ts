import { NextResponse } from "next/server";
import { getJackpotState } from "@/lib/game/jackpot";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const state = await getJackpotState();

  if (!state) {
    return NextResponse.json(
      { error: "Jackpot not available" },
      { status: 404 }
    );
  }

  return NextResponse.json(state, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
