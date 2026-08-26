import type {
  ApprovalType,
  ApplicabilityRule,
  CompanyProfile,
  Scheme,
  ScrutinyLevel,
  PollutionCategory,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// The Regulatory Knowledge Engine.
//
// This is the intellectual core of Udyami Setu. Regulations are modelled as
// DATA (see lib/rules/data.ts and the DB tables approval_types /
// applicability_rules). This module is pure, deterministic logic over that
// data — no AI, no hard-coded sector branches. Adding a sector or state means
// adding rows, not editing code.
// ---------------------------------------------------------------------------

export interface ChecklistItem {
  approval: ApprovalType;
  scrutiny_level: ScrutinyLevel;
  requires_inspection: boolean;
  status: "required" | "conditional" | "not_applicable";
  missing_question?: string;
  reason: string;
}

/** An undefined/empty constraint means "no constraint on this dimension". */
function arrayMatches<T>(allowed: T[] | undefined, value: T): boolean {
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(value);
}

export function ruleApplies(
  profile: CompanyProfile,
  rule: ApplicabilityRule,
): boolean {
  const c = rule.applies_if;
  return (
    arrayMatches(c.sector, profile.sector) &&
    arrayMatches(c.pollution_category, profile.pollution_category) &&
    arrayMatches(c.stage, profile.stage) &&
    arrayMatches(c.project_size, profile.project_size)
  );
}

export function scrutinyFor(
  rule: ApplicabilityRule,
  category: PollutionCategory,
): ScrutinyLevel {
  return rule.scrutiny_level[category] ?? "self_certify";
}

function scrutinyRank(s: ScrutinyLevel): number {
  switch (s) {
    case "full_inspection":
      return 0;
    case "inspection":
      return 1;
    case "self_certify":
      return 2;
    case "not_required":
      return 3;
  }
}

/**
 * Deterministically compute which approvals apply to a business profile.
 * Classifies them into Required, Conditional, or Not Applicable.
 */
export function computeChecklist(
  profile: CompanyProfile,
  approvals: ApprovalType[],
  rules: ApplicabilityRule[],
): ChecklistItem[] {
  const byId = new Map(approvals.map((a) => [a.id, a]));
  const items: ChecklistItem[] = [];

  for (const rule of rules) {
    // 1. Broad buckets check
    if (!ruleApplies(profile, rule)) {
      // If it doesn't even apply to this sector/stage, we usually just drop it,
      // but to be exhaustive, we could return it as not_applicable. 
      // For cleaner UI, we only track things that *could* apply.
      continue;
    }
    
    const approval = byId.get(rule.approval_id);
    if (!approval) continue;

    const scrutiny = scrutinyFor(rule, profile.pollution_category);
    if (scrutiny === "not_required") continue;

    const requiresInspection =
      approval.requires_inspection &&
      (scrutiny === "inspection" || scrutiny === "full_inspection");

    let status: "required" | "conditional" | "not_applicable" = "required";
    let reason = `Required for a ${profile.pollution_category}-category ${profile.sector.replace(/_/g, " ")} unit. ${approval.legal_basis}`;
    let missing_question = undefined;

    // 2. Exact conditions check
    if (rule.condition) {
      const pValue = profile[rule.condition.field];
      if (pValue === undefined || pValue === null) {
        status = "conditional";
        reason = rule.condition.explanation;
        missing_question = rule.condition.question;
      } else if (pValue === rule.condition.expected_value) {
        status = "required";
        // Keep standard reason, or append condition info
      } else {
        status = "not_applicable";
        reason = "The applicant's information indicates this approval doesn't apply.";
      }
    }

    items.push({
      approval,
      scrutiny_level: scrutiny,
      requires_inspection: requiresInspection,
      status,
      missing_question,
      reason,
    });
  }

  // Sort: Required first, then Conditional, then Not Applicable.
  // Within same status, sort by scrutiny intensity, then by SLA.
  return items.sort((a, b) => {
    const statusRank = { required: 0, conditional: 1, not_applicable: 2 };
    if (statusRank[a.status] !== statusRank[b.status]) {
      return statusRank[a.status] - statusRank[b.status];
    }
    const d = scrutinyRank(a.scrutiny_level) - scrutinyRank(b.scrutiny_level);
    return d !== 0 ? d : a.approval.sla_days - b.approval.sla_days;
  });
}

/** Which approvals in a checklist need a field inspection (for common planning). */
export function inspectionApprovals(items: ChecklistItem[]): ChecklistItem[] {
  return items.filter((i) => i.requires_inspection);
}

/** Match a profile to government incentive/support schemes (M11). */
export function matchSchemes(
  profile: CompanyProfile,
  schemes: Scheme[],
): Scheme[] {
  return schemes.filter((s) => {
    const e = s.eligibility;
    return (
      arrayMatches(e.sector, profile.sector) &&
      arrayMatches(e.project_size, profile.project_size) &&
      arrayMatches(e.stage, profile.stage)
    );
  });
}
