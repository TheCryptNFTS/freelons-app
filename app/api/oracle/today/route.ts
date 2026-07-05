import { NextResponse } from "next/server";
import { oracle, type Duel } from "@/lib/oracle";
import { getSession } from "@/lib/siwe";

export const dynamic = "force-dynamic";

function publicDuel(d: Duel) {
  return {
    id: d.id,
    marketTitle: d.marketTitle,
    domain: d.domain,
    edgeProbYes: d.edgeProbYes,       // Edge's SEALED public call
    edgeSide: d.edgeSide,
    edgeConfidence: d.edgeConfidence,
    sealHash: d.sealHash,             // committed before resolution — the trust anchor
    status: d.status,
    publishedAt: d.publishedAt,
    lockTs: d.lockTs,
    lockInMs: Math.max(0, d.lockTs - Date.now()),
    outcome: d.outcome,
    edgeBrier: d.edgeBrier ?? null,
    resolvedAt: d.resolvedAt ?? null,
  };
}

// GET /api/oracle/today — current duel, pot split, your stance, HEX balance.
export async function GET() {
  oracle.tickLocks();
  const d = oracle.currentDuel();
  const session = getSession();
  const wallet = session?.wallet?.toLowerCase() || null;

  const stances = d ? oracle.stancesForDuel(d.id) : [];
  const yourStance = wallet && d ? oracle.stanceFor(d.id, wallet) : null;

  return NextResponse.json({
    duel: d ? publicDuel(d) : null,
    pot: d?.pot ?? null,
    participants: stances.length,
    wallet,
    hexBalance: wallet ? oracle.hexBalance(wallet) : null,
    yourStance,
  });
}
