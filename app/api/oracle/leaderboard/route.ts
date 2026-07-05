import { NextResponse } from "next/server";
import { oracle } from "@/lib/oracle";

export const dynamic = "force-dynamic";

// GET /api/oracle/leaderboard — calibration ranks + the Crowd-vs-Machine tally.
export async function GET() {
  const [leaderboard, crowdVsMachine] = await Promise.all([oracle.leaderboard(100), oracle.crowdVsMachine()]);
  return NextResponse.json({ leaderboard, crowdVsMachine });
}
