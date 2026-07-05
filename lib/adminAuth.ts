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

// Cron authorization. Vercel Cron invokes the endpoint with the header
// `Authorization: Bearer $CRON_SECRET` (when CRON_SECRET is set in the project),
// so accept a constant-time match on that; otherwise fall back to the admin secret
// so the daily driver can also be triggered by hand. If neither CRON_SECRET nor a
// valid admin secret is present the call is rejected — a missing secret fails safe.
export function isCronAuthorized(req: Request): boolean {
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const cronSecret = process.env.CRON_SECRET || "";
  if (cronSecret && bearer) {
    const a = Buffer.from(bearer);
    const b = Buffer.from(cronSecret);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
  }
  return isAdmin(req);
}
