"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/auth";
import { sweepDeemed } from "@/lib/sla";

// Officers act through the service-role admin client (cross-role read/write),
// so every action re-checks the caller is an officer OF THE OWNING DEPARTMENT.
async function officerGuard(approvalId: string) {
  const profile = await getProfile();
  if (!profile || profile.role !== "officer" || !profile.department_id) {
    throw new Error("Not authorised");
  }
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("application_approvals")
    .select("id, department_id")
    .eq("id", approvalId)
    .single();
  if (!row || row.department_id !== profile.department_id) {
    throw new Error("This approval is not handled by your department.");
  }
  return { admin, profile };
}

export async function approveApproval(approvalId: string) {
  const { admin, profile } = await officerGuard(approvalId);
  await admin
    .from("application_approvals")
    .update({
      status: "approved",
      decided_at: new Date().toISOString(),
      decided_by: profile.id,
      query_note: null,
    })
    .eq("id", approvalId);
  revalidatePath("/officer");
}

export async function rejectApproval(approvalId: string) {
  const { admin, profile } = await officerGuard(approvalId);
  await admin
    .from("application_approvals")
    .update({
      status: "rejected",
      decided_at: new Date().toISOString(),
      decided_by: profile.id,
    })
    .eq("id", approvalId);
  revalidatePath("/officer");
}

export async function raiseQuery(approvalId: string, note: string) {
  const { admin, profile } = await officerGuard(approvalId);
  await admin
    .from("application_approvals")
    .update({
      status: "query_raised",
      query_note: note,
      decided_by: profile.id,
    })
    .eq("id", approvalId);
  revalidatePath("/officer");
}

export async function scheduleInspection(approvalId: string) {
  const { admin, profile } = await officerGuard(approvalId);
  await admin
    .from("application_approvals")
    .update({ status: "inspection_scheduled", decided_by: profile.id })
    .eq("id", approvalId);
  revalidatePath("/officer");
}

/** Demo control: force the deemed-approval sweep and report how many flipped. */
export async function runSlaSweep(): Promise<number> {
  const profile = await getProfile();
  if (!profile || (profile.role !== "officer" && profile.role !== "nodal")) {
    throw new Error("Not authorised");
  }
  const n = await sweepDeemed();
  revalidatePath("/officer");
  revalidatePath("/nodal");
  return n;
}
