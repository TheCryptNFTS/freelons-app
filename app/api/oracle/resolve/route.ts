import { NextResponse } from "next/server";
import { oracle } from "@/lib/oracle";
import { resolveOutcome } from "@/lib/edge";
import { isAdmin } from "@/lib/adminAuth";
import { ownerOf } from "@/lib/chain";

// POST /api/oracle/resolve   (x-admin-secret header preferred)
// body: { duelId, outcome?: "YES"|"NO" }
// No outcome → reads the real public result from Polymarket. A manual outcome is
// only accepted AFTER the duel has locked (can't be used to pre-empt live stakes).
// Settles the HEX pot, Brier-scores every stance, updates ratings (bound to the
// tokenId's CURRENT on-chain owner so a transfer resets reputation).
export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: any = {};
  try { body = await req.json(); } catch { /* allow query-only */ }
  const duelId = body?.duelId || new URL(req.url).searchParams.get("duelId");
  if (!duelId) return NextResponse.json({ error: "duelId_required" }, { status: 400 });

  const d = oracle.duelById(String(duelId));
  if (!d) return NextResponse.json({ error: "duel_not_found" }, { status: 404 });
  if (d.status === "resolved") return NextResponse.json({ ok: true, duel: d, note: "already resolved" });

  // Lock first so no late stance slips into settlement.
  oracle.tickLocks();

  let outcome: "YES" | "NO" | null = null;
  let source = "manual";
  if (body?.outcome === "YES" || body?.outcome === "NO") {
    // Manual resolution is admin override — only allowed once the duel has locked.
    if (d.status === "open" && Date.now() < d.lockTs) {
      return NextResponse.json({ error: "not_locked", reason: "manual resolution only allowed after lock" }, { status: 409 });
    }
    outcome = body.outcome;
    source = "manual";
  } else {
    outcome = await resolveOutcome(d.marketId);
    source = "polymarket";
  }
  if (!outcome) {
    return NextResponse.json({ error: "outcome_unavailable", reason: "market not settled yet; pass { outcome } after lock to resolve manually" }, { status: 409 });
  }

  // Bind ratings to each staked token's CURRENT owner (reputation resets on transfer).
  const distinct = [...new Set(oracle.stancesForDuel(String(duelId)).map((s) => s.tokenId))].slice(0, 200);
  const ownerMap = new Map<number, string>();
  await Promise.all(distinct.map(async (t) => {
    try { const o = await ownerOf(t); if (o) ownerMap.set(t, o.toLowerCase()); } catch { /* leave to stance wallet */ }
  }));

  const res = oracle.resolveDuel(String(duelId), outcome, source, ownerMap);
  if (!res.ok) return NextResponse.json({ error: (res as { ok: false; error: string }).error }, { status: 400 });
  return NextResponse.json({ ok: true, duel: res.duel, settled: res.settled, crowdVsMachine: oracle.crowdVsMachine() });
}
