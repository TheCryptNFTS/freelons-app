import { NextResponse } from "next/server";
import { oracle } from "@/lib/oracle";

export const dynamic = "force-dynamic";

// GET /api/oracle/rating/:tokenId — a citizen's Analyst Rating (calibration record).
export async function GET(_req: Request, { params }: { params: { tokenId: string } }) {
  const tokenId = Number(params.tokenId);
  if (!Number.isFinite(tokenId)) return NextResponse.json({ error: "bad_token" }, { status: 400 });
  const rating = await oracle.ratingFor(tokenId);
  return NextResponse.json({ tokenId, rating });
}
