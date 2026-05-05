import { NextResponse } from "next/server";
import { generateNonce } from "siwe";

export async function GET() {
  const nonce = generateNonce();
  return new NextResponse(nonce, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Set-Cookie": `freelons_nonce=${nonce}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
    },
  });
}
