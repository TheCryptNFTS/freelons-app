import { NextResponse } from "next/server";
import { getSession } from "@/lib/siwe";

export async function GET() {
  const s = getSession();
  return NextResponse.json({ session: s });
}
