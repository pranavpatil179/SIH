import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// SERVER-ONLY admin client. Uses the service role key, which bypasses Row-Level
// Security. Only import this inside Server Actions / Route Handlers / scripts —
// NEVER in a Client Component. Used for cross-role reads (officer queues, nodal
// analytics) where app-level role checks guard access.
// ---------------------------------------------------------------------------
export function createAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://ngbavxuirjhzaatdniyp.supabase.co";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nYmF2eHVpcmpoemFhdGRuaXlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzUzMTA0NCwiZXhwIjoyMTAzMTA3MDQ0fQ.iv66YC8UODcC6tTBukc_9It1gpIVadwns9xn_slSAIs";

  return createSupabaseClient(
    url,
    serviceKey,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
