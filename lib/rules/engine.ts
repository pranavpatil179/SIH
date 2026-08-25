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

function buildReason(
  profile: CompanyProfile,
  approval: ApprovalType,
  scrutiny: ScrutinyLevel,
): string {
  const sector = profile.sector.replace(/_/g, " ");
  const stage = profile.stage.replace(/_/g, " ");
  if (scrutiny === "not_required") {
    return `Not required for a ${profile.pollution_category}-category unit.`;
  }
  if (scrutiny === "self_certify") {
    return `Applies to your ${sector} unit — eligible for self-certification (${profile.pollution_category} category).`;
  }
  return `Required for a ${profile.pollution_category}-category ${sector} unit at the ${stage} stage. ${approval.legal_basis}.`;
}

/**
 * Deterministically compute which approvals apply to a business profile.
 * Returns items ordered by scrutiny intensity, then by statutory SLA.
 */
export function computeChecklist(
  profile: CompanyProfile,
  approvals: ApprovalType[],
  rules: ApplicabilityRule[],
): ChecklistItem[] {
  const byId = new Map(approvals.map((a) => [a.id, a]));
  const items: ChecklistItem[] = [];

  for (const rule of rules) {
    if (!ruleApplies(profile, rule)) continue;
    const approval = byId.get(rule.approval_id);
    if (!approval) continue;

    const scrutiny = scrutinyFor(rule, profile.pollution_category);

    // "not_required" means the approval drops off the checklist entirely.
    if (scrutiny === "not_required") continue;

    const requiresInspection =
      approval.requires_inspection &&
      (scrutiny === "inspection" || scrutiny === "full_inspection");

    items.push({
      approval,
      scrutiny_level: scrutiny,
      requires_inspection: requiresInspection,
      reason: buildReason(profile, approval, scrutiny),
    });
  }

  return items.sort((a, b) => {
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
