/**
 * Supabase server-side client — DATABASE ONLY.
 * Auth is handled entirely by NextAuth; this client is used only for DB queries.
 *
 * Uses the service-role key so it bypasses RLS for server-side code.
 * For user-scoped queries in API routes, use createClient() from client.ts
 * and rely on NextAuth session for the user id.
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
