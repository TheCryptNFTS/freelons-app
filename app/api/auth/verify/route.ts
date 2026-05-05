import { NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import { cookies } from "next/headers";
import { makeToken, COOKIE_NAME } from "@/lib/siwe";

export async function POST(req: Request) {
  try {
    const { message, signature } = await req.json();
    const nonce = cookies().get("freelons_nonce")?.value;
    if (!nonce) return NextResponse.json({ error: "no_nonce" }, { status: 400 });

    const siwe = new SiweMessage(message);
    const result = await siwe.verify({ signature, nonce });
    if (!result.success) {
      return NextResponse.json({ error: "verify_failed" }, { status: 401 });
    }

    const wallet = result.data.address.toLowerCase();
    const token = makeToken(wallet);

    const res = NextResponse.json({ ok: true, wallet });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 3600,
    });
    res.cookies.delete("freelons_nonce");
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "verify_error" }, { status: 400 });
  }
}
