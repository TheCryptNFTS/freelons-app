import { NextResponse } from "next/server";
import { signals } from "@/lib/signals";

// GET /api/signals-feed - returns all currently tracked signals
export async function GET() {
  return NextResponse.json({ signals: signals.all() });
}
