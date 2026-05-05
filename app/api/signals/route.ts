import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getSession } from "@/lib/siwe";
import { ownerOf } from "@/lib/chain";

// Create PENDING signal — caller must post the returned hash on X then call /api/signals/verify
export async function POST(req: Request) {
  const session = getSession();
  // Allow ENS/handle for demo, require session for real wallets
  const { wallet: bodyWallet, tokenId, tier } = await req.json();
  const isEth = typeof bodyWallet === "string" && bodyWallet.startsWith("0x");

  let wallet: string;
  if (isEth) {
    if (!session) return NextResponse.json({ error: "auth_required", reason: "Sign in with wallet first" }, { status: 401 });
    if (session.wallet.toLowerCase() !== bodyWallet.toLowerCase()) {
      return NextResponse.json({ error: "wallet_mismatch" }, { status: 403 });
    }
    wallet = session.wallet.toLowerCase();
    // also verify ownerOf
    const owner = await ownerOf(Number(tokenId));
    if (!owner || owner.toLowerCase() !== wallet) {
      return NextResponse.json({ error: "not_owner", owner }, { status: 403 });
    }
  } else {
    // ENS / demo handle path
    if (!bodyWallet) return NextResponse.json({ error: "wallet_required" }, { status: 400 });
    wallet = String(bodyWallet).toLowerCase().trim();
  }

  if (tokenId === undefined) return NextResponse.json({ error: "tokenId_required" }, { status: 400 });

  const rl = store.rateLimit(wallet);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited", retryIn: rl.retryIn }, { status: 429 });

  const sig = store.createPendingSignal(wallet, Number(tokenId), tier || "Common");

  return NextResponse.json({
    ok: true,
    signal: sig,
    hash: sig.hash,
    pendingExpiresAt: sig.pendingExpiresAt,
    instructions: `Post on X with the hash ${sig.hash} included in your tweet. Then click VERIFY POST to confirm.`,
  });
}
