import { NextResponse } from "next/server";
import { store } from "@/lib/store";

const ADMIN_SECRET = process.env.FREELONS_ADMIN_SECRET || "dev-secret-change-me";

export async function GET() {
  return NextResponse.json(store.isOverrideActive());
}

// Trigger an override window. Requires admin secret in header or query.
// curl -X POST 'http://localhost:3000/api/override?start=60&secret=dev-secret-change-me'
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const provided = req.headers.get("x-admin-secret") || searchParams.get("secret");
  if (provided !== ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const minutes = Number(searchParams.get("start") || "60");
  store.startOverride(minutes);
  return NextResponse.json({ ok: true, ...store.isOverrideActive() });
}
