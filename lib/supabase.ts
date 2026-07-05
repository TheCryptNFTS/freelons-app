import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the SERVICE ROLE key (bypasses RLS). The
 * oracle tables have RLS on with no policies, so they are reachable ONLY through
 * this server client — every write still passes the SIWE / ownerOf / admin gates
 * in the route handlers first. NEVER import this from a client component.
 */
export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
