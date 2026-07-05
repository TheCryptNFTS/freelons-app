import { NextResponse } from "next/server";
import { oracle } from "@/lib/oracle";

export const dynamic = "force-dynamic";

// GET /api/oracle/leaderboard — calibration ranks + the Crowd-vs-Machine tally.
export async function GET() {
  return NextResponse.json({
    leaderboard: oracle.leaderboard(100),
    crowdVsMachine: oracle.crowdVsMachine(),
  });
}
