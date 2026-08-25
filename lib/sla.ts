import { createAdminClient } from "@/lib/supabase/admin";

// Statuses that are still "the government's move" and therefore eligible to be
// auto-cleared as a deemed approval once the SLA lapses. A raised query pauses
// the clock (ball is in the applicant's court), so it is intentionally excluded.
const PENDING_FOR_DEEMED = [
  "submitted",
  "under_scrutiny",
  "inspection_scheduled",
];

/**
 * Auto-issue deemed approvals for every approval whose statutory SLA has
 * elapsed while still pending. This is what makes the deadline enforceable:
 * miss the timer, and accountability flips to the department automatically.
 * Called on dashboard/console load and by the officer "run SLA sweep" action.
 */
export async function sweepDeemed(): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("application_approvals")
    .update({ status: "deemed_approved", decided_at: new Date().toISOString() })
    .lt("sla_due_at", new Date().toISOString())
    .in("status", PENDING_FOR_DEEMED)
    .select("id");
  return data?.length ?? 0;
}
