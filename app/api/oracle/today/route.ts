import { NextResponse } from "next/server";
import { oracle, type Duel } from "@/lib/oracle";
import { getSession } from "@/lib/siwe";

export const dynamic = "force-dynamic";

function publicDuel(d: Duel) {
  return {
    id: d.id, marketTitle: d.marketTitle, domain: d.domain,
    edgeProbYes: d.edgeProbYes, edgeSide: d.edgeSide, edgeConfidence: d.edgeConfidence,
    sealHash: d.sealHash, status: d.status, publishedAt: d.publishedAt,
    lockTs: d.lockTs, lockInMs: Math.max(0, d.lockTs - Date.now()),
    outcome: d.outcome, edgeBrier: d.edgeBrier ?? null, resolvedAt: d.resolvedAt ?? null,
  };
}

// GET /api/oracle/today — current duel, pot split, your stance, HEX balance.
export async function GET() {
  const d = await oracle.currentDuel();
  const session = getSession();
  const wallet = session?.wallet?.toLowerCase() || null;

  const [stances, yourStance, hexBalance] = await Promise.all([
    d ? oracle.stancesForDuel(d.id) : Promise.resolve([]),
    wallet && d ? oracle.stanceFor(d.id, wallet) : Promise.resolve(null),
    wallet ? oracle.hexBalance(wallet) : Promise.resolve(null),
  ]);

  return NextResponse.json({
    duel: d ? publicDuel(d) : null,
    pot: d?.pot ?? null,
    participants: stances.length,
    wallet,
    hexBalance,
    yourStance,
  });
}
