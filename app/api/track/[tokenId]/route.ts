import { NextResponse } from "next/server";
import { signals } from "@/lib/signals";

export async function GET(_req: Request, { params }: { params: { tokenId: string } }) {
  const tokenId = Number(params.tokenId);
  if (!tokenId) return NextResponse.json({ error: "bad tokenId" }, { status: 400 });
  const t = signals.forToken(tokenId);
  return NextResponse.json({ tokenId, tracked: !!t, signal: t });
}
