import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// SERVER-ONLY admin client. Uses the service role key, which bypasses Row-Level
// Security. Only import this inside Server Actions / Route Handlers / scripts —
// NEVER in a Client Component. Used for cross-role reads (officer queues, nodal
// analytics) where app-level role checks guard access.
// ---------------------------------------------------------------------------
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
