import { NextResponse } from "next/server";
import { oracle } from "@/lib/oracle";
import { fetchDailyCandidate, resolveOutcome } from "@/lib/edge";
import { isCronAuthorized } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// GET|POST /api/oracle/cron — the daily lifecycle driver (one scheduled call/day).
// Vercel Cron sends a GET with `Authorization: Bearer $CRON_SECRET`; a human can
// also drive it with the admin secret. One idempotent pass:
//   1) RESOLVE — flip any past-lock duel to "locked", then settle the current duel
//      if its public market has actually resolved (fixtures never auto-resolve —
//      those are admin-resolved or voided).
//   2) PUBLISH — seal the next duel from Edge, but ONLY when nothing is still
//      unresolved (mirrors the /publish guard, so duels never stack).
// Safe to run more than once per day: both steps are guarded and no-op when there
// is nothing to do.
async function run(req: Request): Promise<Response> {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const out: { ok: true; resolved: unknown; published: unknown; notes: string[] } = {
    ok: true, resolved: null, published: null, notes: [],
  };

  // 1) RESOLVE ------------------------------------------------------------------
  // Flip past-lock duels to "locked", then settle EVERY locked duel whose public
  // market has actually resolved. Iterating all locked duels (not just the current
  // one) means a settled market is never stranded. Fixtures/unsettled markets
  // return null and are left for admin /resolve or /void.
  await oracle.tickLocks();
  const resolved: Array<{ id: string; outcome?: "YES" | "NO"; settled?: number; error?: string }> = [];
  for (const d of await oracle.lockedDuels()) {
    const outcome = await resolveOutcome(d.marketId);
    if (!outcome) {
      out.notes.push(`duel ${d.id} is locked but its market has not settled yet — leaving it (admin can /void if it never will)`);
      continue;
    }
    const res = await oracle.resolveDuel(d.id, outcome, "polymarket-cron");
    resolved.push(res.ok
      ? { id: d.id, outcome, settled: res.settled }
      : { id: d.id, error: (res as { ok: false; error: string }).error });
  }
  out.resolved = resolved;

  // 2) PUBLISH ------------------------------------------------------------------
  const now = await oracle.currentDuel();
  if (!now || now.status === "resolved" || now.status === "void") {
    const c = await fetchDailyCandidate();
    const duel = await oracle.publishDuel({
      marketId: c.marketId,
      marketTitle: c.marketTitle,
      domain: c.domain,
      edgeProbYes: c.edgeProbYes,
      edgeConfidence: c.edgeConfidence,
    });
    out.published = { id: duel.id, market: duel.marketTitle, edgeSource: c.source };
  } else {
    out.notes.push(`not publishing — ${now.status} duel ${now.id} is still active`);
  }

  return NextResponse.json(out);
}

export const GET = run;
export const POST = run;
