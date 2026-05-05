import { NextResponse } from "next/server";
import { ownerOf } from "@/lib/chain";

// Confirm wallet owns the given Freelon token.
// GET /api/verify?wallet=0x...&tokenId=123
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = (searchParams.get("wallet") || "").toLowerCase();
  const tokenId = Number(searchParams.get("tokenId"));
  if (!wallet || !tokenId) {
    return NextResponse.json({ error: "wallet and tokenId required" }, { status: 400 });
  }
  // Only validates real 0x addresses on-chain. Mock ENS handles bypass for demo.
  if (!wallet.startsWith("0x")) {
    return NextResponse.json({ ok: true, mock: true, owner: wallet, tokenId });
  }
  const owner = await ownerOf(tokenId);
  if (!owner) return NextResponse.json({ ok: false, error: "token not found" }, { status: 404 });
  return NextResponse.json({
    ok: owner.toLowerCase() === wallet.toLowerCase(),
    owner,
    tokenId,
  });
}
