import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = (searchParams.get("wallet") || "").toLowerCase();
  const targets = store.replyTargets(wallet, 2);
  return NextResponse.json({ targets });
}
