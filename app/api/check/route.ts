import { NextResponse } from "next/server";
import { signals } from "@/lib/signals";
import { tokensOwnedBy, balanceOf } from "@/lib/chain";

// GET /api/check?wallet=0x...|vitalik.eth
// Returns the wallet's Freelons + signal status for each that's tracked.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = (searchParams.get("wallet") || "").trim().toLowerCase();
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });

  // ENS demo path — return seed signals as if they hold them
  const isEth = wallet.startsWith("0x");
  if (!isEth) {
    // Mock for demo/ENS handles: pretend they hold the seeded ones
    const all = signals.all();
    return NextResponse.json({
      wallet,
      mock: true,
      balance: all.length,
      tokens: all.map(t => ({
        tokenId: t.tokenId,
        tracked: true,
        signal: t,
      })),
    });
  }

  const ids = await tokensOwnedBy(wallet);
  const bal = ids.length ? ids.length : await balanceOf(wallet);
  const out = ids.map(tokenId => ({
    tokenId,
    tracked: !!signals.forToken(tokenId),
    signal: signals.forToken(tokenId),
  }));
  return NextResponse.json({
    wallet,
    balance: bal,
    enumerable: ids.length > 0,
    tokens: out,
    note: ids.length === 0 && bal > 0
      ? "We see your balance but can't enumerate tokens without an Alchemy key. Token ownership confirmed."
      : undefined,
  });
}
