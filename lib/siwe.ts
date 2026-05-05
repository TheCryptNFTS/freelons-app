import { cookies } from "next/headers";
import crypto from "crypto";

const SECRET = process.env.FREELONS_AUTH_SECRET || "dev-auth-secret-change-me";
const COOKIE = "freelons_session";

export type Session = { wallet: string; iat: number };

function sign(payload: string) {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function makeToken(wallet: string) {
  const body = JSON.stringify({ wallet: wallet.toLowerCase(), iat: Date.now() });
  const b = Buffer.from(body).toString("base64url");
  return `${b}.${sign(b)}`;
}

export function verifyToken(token: string | undefined): Session | null {
  if (!token) return null;
  const [b, sig] = token.split(".");
  if (!b || !sig) return null;
  if (sign(b) !== sig) return null;
  try {
    const session = JSON.parse(Buffer.from(b, "base64url").toString()) as Session;
    // 7 day expiry
    if (Date.now() - session.iat > 7 * 24 * 3600 * 1000) return null;
    return session;
  } catch {
    return null;
  }
}

export function getSession(): Session | null {
  const t = cookies().get(COOKIE)?.value;
  return verifyToken(t);
}

export const COOKIE_NAME = COOKIE;
