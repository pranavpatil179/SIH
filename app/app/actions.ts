"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { loadRuleset } from "@/lib/rules/ruleset";
import {
  computeChecklist,
  inspectionApprovals,
  matchSchemes,
  type ChecklistItem,
} from "@/lib/rules/engine";
import { slaDueFrom } from "@/lib/constants";
import type {
  CompanyProfile,
  PollutionCategory,
  ProjectSize,
  Scheme,
  Sector,
  Stage,
} from "@/lib/types";

export interface ProfileInput {
  businessName: string;
  pan?: string;
  sector: Sector;
  project_size: ProjectSize;
  pollution_category: PollutionCategory;
  stage: Stage;
  location_state: string;
  generates_hazardous_waste?: boolean | null;
  has_regulated_substances?: boolean | null;
  uses_boiler?: boolean | null;
  discharges_wastewater?: boolean | null;
  generates_air_emissions?: boolean | null;
}

function toProfile(i: ProfileInput): CompanyProfile {
  return {
    sector: i.sector,
    pollution_category: i.pollution_category,
    stage: i.stage,
    project_size: i.project_size,
    location_state: i.location_state,
    generates_hazardous_waste: i.generates_hazardous_waste,
    has_regulated_substances: i.has_regulated_substances,
    uses_boiler: i.uses_boiler,
    discharges_wastewater: i.discharges_wastewater,
    generates_air_emissions: i.generates_air_emissions,
  };
}

export interface ChecklistPreview {
  items: ChecklistItem[];
  schemes: Scheme[];
  inspectionCount: number;
}

/** Run the knowledge engine and return the applicable approvals (no writes). */
export async function previewChecklist(
  input: ProfileInput,
): Promise<ChecklistPreview> {
  const { approvals, rules, schemes } = await loadRuleset();
  const profile = toProfile(input);
  const items = computeChecklist(profile, approvals, rules);
  return {
    items,
    schemes: matchSchemes(profile, schemes),
    inspectionCount: inspectionApprovals(items).length,
  };
}

/**
 * Persist the business/project/application and fan out one application_approval
 * per applicable approval — all filed in parallel with an SLA deadline each.
 * Self-certifiable approvals are auto-cleared at filing (risk-based scrutiny).
 */
export async function submitApplication(input: ProfileInput): Promise<void> {
  const user = await getUser();
  if (!user) redirect("/login");
  const supabase = createClient();

  const { data: biz, error: bErr } = await supabase
    .from("businesses")
    .insert({
      owner_id: user.id,
      name: input.businessName,
      pan: input.pan || null,
      sector: input.sector,
      state: input.location_state,
    })
    .select()
    .single();
  if (bErr) throw new Error(bErr.message);

  const { data: proj, error: pErr } = await supabase
    .from("projects")
    .insert({
      business_id: biz.id,
      name: `${input.businessName} — ${input.stage.replace(/_/g, " ")}`,
      location_state: input.location_state,
      project_size: input.project_size,
      pollution_category: input.pollution_category,
      stage: input.stage,
    })
    .select()
    .single();
  if (pErr) throw new Error(pErr.message);

  const { data: app, error: aErr } = await supabase
    .from("applications")
    .insert({ project_id: proj.id, status: "in_progress" })
    .select()
    .single();
  if (aErr) throw new Error(aErr.message);

  const { approvals, rules } = await loadRuleset();
  const items = computeChecklist(toProfile(input), approvals, rules);
  const now = new Date().toISOString();

  const rows = items.map((it) => {
    const selfCertify = it.scrutiny_level === "self_certify";
    return {
      application_id: app.id,
      approval_type_id: it.approval.id,
      department_id: it.approval.department_id,
      status: selfCertify ? "approved" : "submitted",
      scrutiny_level: it.scrutiny_level,
      requires_inspection: it.requires_inspection,
      submitted_at: now,
      sla_due_at: slaDueFrom(now, it.approval.sla_days),
      decided_at: selfCertify ? now : null,
    };
  });

  const { error: iErr } = await supabase
    .from("application_approvals")
    .insert(rows);
  if (iErr) throw new Error(iErr.message);

  revalidatePath("/app");
  redirect("/app");
}
