import { NextResponse } from "next/server";
import { oracle } from "@/lib/oracle";
import { resolveOutcome } from "@/lib/edge";
import { isAdmin } from "@/lib/adminAuth";

// POST /api/oracle/resolve   (x-admin-secret header preferred)
// body: { duelId, outcome?: "YES"|"NO" }
// No outcome → reads the real public result from Polymarket. A manual outcome is
// only accepted AFTER the duel has locked. Settlement (pot + Brier + ratings) is
// one atomic Postgres function; ratings bind to each stance's wallet, which was
// ownerOf-verified when the stance was placed (so a transfer resets reputation).
export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: any = {};
  try { body = await req.json(); } catch { /* allow query-only */ }
  const duelId = body?.duelId || new URL(req.url).searchParams.get("duelId");
  if (!duelId) return NextResponse.json({ error: "duelId_required" }, { status: 400 });

  const d = await oracle.duelById(String(duelId));
  if (!d) return NextResponse.json({ error: "duel_not_found" }, { status: 404 });
  if (d.status === "resolved") return NextResponse.json({ ok: true, duel: d, note: "already resolved" });

  await oracle.tickLocks();

  let outcome: "YES" | "NO" | null = null;
  let source = "manual";
  if (body?.outcome === "YES" || body?.outcome === "NO") {
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

  const res = await oracle.resolveDuel(String(duelId), outcome, source);
  if (!res.ok) return NextResponse.json({ error: (res as { ok: false; error: string }).error }, { status: 400 });
  return NextResponse.json({ ok: true, duel: res.duel, settled: res.settled, crowdVsMachine: await oracle.crowdVsMachine() });
}
