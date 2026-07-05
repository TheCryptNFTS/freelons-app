import { NextResponse } from "next/server";
import { oracle } from "@/lib/oracle";
import { fetchDailyCandidate } from "@/lib/edge";
import { isAdmin } from "@/lib/adminAuth";

// POST /api/oracle/publish?secret=…  — admin/cron: seal today's duel from Edge.
// Optional body { lockInMinutes } overrides the default 24h window.
export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Don't stack duels: block while the current one is UNRESOLVED (open OR locked-
  // but-not-settled). Otherwise a market that never settles would let duels pile up.
  const cur = await oracle.currentDuel();
  if (cur && cur.status !== "resolved" && cur.status !== "void") {
    return NextResponse.json({ ok: true, duel: cur, note: `an unresolved duel already exists (${cur.status}) — resolve or void it first` });
  }

  let lockInMinutes: number | undefined;
  try { lockInMinutes = (await req.json())?.lockInMinutes; } catch { /* no body */ }

  const c = await fetchDailyCandidate();
  const duel = await oracle.publishDuel({
    marketId: c.marketId,
    marketTitle: c.marketTitle,
    domain: c.domain,
    edgeProbYes: c.edgeProbYes,
    edgeConfidence: c.edgeConfidence,
    lockInMinutes,
  });
  return NextResponse.json({ ok: true, duel, edgeSource: c.source });
}
