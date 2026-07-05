import crypto from "crypto";

// Constant-time admin check. Prefers the x-admin-secret HEADER (query strings get
// logged by proxies); the ?secret= query param is accepted as a fallback for cron.
export function isAdmin(req: Request): boolean {
  const provided =
    req.headers.get("x-admin-secret") ||
    new URL(req.url).searchParams.get("secret") ||
    "";
  const expected = process.env.FREELONS_ADMIN_SECRET || "";
  if (!expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // compare against a same-length buffer so failure timing doesn't leak length
    crypto.timingSafeEqual(a, Buffer.alloc(a.length));
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}
