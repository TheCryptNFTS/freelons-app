import { NextResponse } from "next/server";
import { signals } from "@/lib/signals";

// All tracked Freelons + their current status — for the public "TOP SIGNALS" page.
export async function GET() {
  const all = signals.all();
  return NextResponse.json({ tokens: all });
}
