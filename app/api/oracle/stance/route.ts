import { NextResponse } from "next/server";
import { oracle } from "@/lib/oracle";
import { getSession } from "@/lib/siwe";
import { ownerOf } from "@/lib/chain";

// POST /api/oracle/stance
// body: { duelId, tokenId, stake: "FOLLOW"|"FADE", ownProbYes: 0..1, hex, wallet }
// Real 0x wallets: SIWE session + on-chain ownerOf check (matches /api/signals).
// ENS/demo handles: allowed for testing, no on-chain check.
export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_json" }, { status: 400 }); }
  const { duelId, tokenId, stake, ownProbYes, hex, wallet: bodyWallet } = body || {};

  if (!duelId || tokenId === undefined || hex === undefined) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (stake !== "FOLLOW" && stake !== "FADE") return NextResponse.json({ error: "bad_stake_side" }, { status: 400 });

  const isEth = typeof bodyWallet === "string" && bodyWallet.startsWith("0x");
  let wallet: string;
  if (isEth) {
    const session = getSession();
    if (!session) return NextResponse.json({ error: "auth_required", reason: "Sign in with your wallet first" }, { status: 401 });
    if (session.wallet.toLowerCase() !== bodyWallet.toLowerCase()) return NextResponse.json({ error: "wallet_mismatch" }, { status: 403 });
    wallet = session.wallet.toLowerCase();
    const owner = await ownerOf(Number(tokenId));
    if (!owner || owner.toLowerCase() !== wallet) return NextResponse.json({ error: "not_owner", owner }, { status: 403 });
  } else {
    // Non-0x "demo" handles are UNAUTHENTICATED and unowned — they can only be
    // used when ORACLE_ALLOW_DEMO=1 (local/testing). In production this path is
    // closed, so every HEX/rating write is gated by SIWE + on-chain ownerOf.
    if (process.env.ORACLE_ALLOW_DEMO !== "1") {
      return NextResponse.json({ error: "auth_required", reason: "Connect and sign in with a wallet that owns the citizen" }, { status: 401 });
    }
    if (!bodyWallet) return NextResponse.json({ error: "wallet_required" }, { status: 400 });
    wallet = String(bodyWallet).toLowerCase().trim();
  }

  const rl = oracle.rateLimit(wallet);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited", retryIn: rl.retryIn }, { status: 429 });

  const res = oracle.placeStance({
    duelId: String(duelId),
    wallet,
    tokenId: Number(tokenId),
    stake,
    ownProbYes: Number(ownProbYes),
    hex: Number(hex),
  });
  if (!res.ok) {
    const f = res as { ok: false; error: string; detail?: any };
    return NextResponse.json({ error: f.error, detail: f.detail }, { status: 400 });
  }

  return NextResponse.json({ ok: true, stance: res.stance, hexBalance: oracle.hexBalance(wallet) });
}
