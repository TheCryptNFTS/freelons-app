import { NextResponse } from "next/server";
import { oracle } from "@/lib/oracle";
import { isAdmin } from "@/lib/adminAuth";

// POST /api/oracle/void   (x-admin-secret) — void a duel that can't be resolved
// (market never settles) and REFUND every unsettled stake. body/query: { duelId }
export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: any = {};
  try { body = await req.json(); } catch { /* query-only ok */ }
  const duelId = body?.duelId || new URL(req.url).searchParams.get("duelId");
  if (!duelId) return NextResponse.json({ error: "duelId_required" }, { status: 400 });
  const res = await oracle.voidDuel(String(duelId));
  if (!res.ok) return NextResponse.json({ error: (res as { ok: false; error: string }).error }, { status: 400 });
  return NextResponse.json({ ok: true, ...res });
}
