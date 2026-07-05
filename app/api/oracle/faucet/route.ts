import { NextResponse } from "next/server";
import { oracle } from "@/lib/oracle";
import { getSession } from "@/lib/siwe";

// POST /api/oracle/faucet — claim the daily HEX allowance (non-cashable points).
// body: { wallet } — 0x wallets require a SIWE session; ENS/demo handles allowed.
export async function POST(req: Request) {
  let body: any = {};
  try { body = await req.json(); } catch { /* optional */ }
  const bodyWallet = body?.wallet;
  const isEth = typeof bodyWallet === "string" && bodyWallet.startsWith("0x");

  let wallet: string;
  if (isEth || !bodyWallet) {
    const session = getSession();
    if (!session) return NextResponse.json({ error: "auth_required" }, { status: 401 });
    if (isEth && session.wallet.toLowerCase() !== String(bodyWallet).toLowerCase()) {
      return NextResponse.json({ error: "wallet_mismatch" }, { status: 403 });
    }
    wallet = session.wallet.toLowerCase();
  } else {
    // Demo handles only when explicitly enabled (see stance route).
    if (process.env.ORACLE_ALLOW_DEMO !== "1") {
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }
    wallet = String(bodyWallet).toLowerCase().trim();
  }

  // The daily allowance is atomic + idempotent-per-day in the DB (once-per-24h).
  const res = await oracle.claimDaily(wallet);
  return NextResponse.json({ ok: true, ...res });
}
