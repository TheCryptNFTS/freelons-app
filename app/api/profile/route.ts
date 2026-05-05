import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = (searchParams.get("wallet") || "").toLowerCase();
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });

  const stats = store.holderStats(wallet);
  if (!stats) return NextResponse.json({ stats: null });

  const lb = store.leaderboard(99999);
  const rank = lb.findIndex(h => h.wallet === wallet) + 1;
  const closest = store.closestUp(wallet);

  return NextResponse.json({
    stats: { ...stats, rank, closest },
  });
}
