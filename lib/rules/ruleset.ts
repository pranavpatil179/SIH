import type { ApprovalType, ApplicabilityRule, Scheme } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import {
  approvalTypes,
  applicabilityRules,
  schemes as schemeFixtures,
} from "@/lib/rules/data";

// ---------------------------------------------------------------------------
// Loads the "rules-as-data" catalog from Supabase so the engine reasons over
// the same rows the officers see. Falls back to the TS fixtures (lib/rules/
// data.ts) if the DB hasn't been seeded yet — so the app always runs in dev.
// ---------------------------------------------------------------------------

export interface Ruleset {
  approvals: ApprovalType[];
  rules: ApplicabilityRule[];
  schemes: Scheme[];
}

export async function loadRuleset(): Promise<Ruleset> {
  try {
    const supabase = createClient();
    const [a, r, s] = await Promise.all([
      supabase.from("approval_types").select("*"),
      supabase.from("applicability_rules").select("*"),
      supabase.from("schemes").select("*"),
    ]);

    if (a.data?.length && r.data?.length) {
      return {
        approvals: a.data as ApprovalType[],
        rules: r.data.map((row: any) => ({
          approval_id: row.approval_id,
          applies_if: row.applies_if ?? {},
          scrutiny_level: row.scrutiny_level ?? {},
        })),
        schemes: (s.data?.length ? s.data : schemeFixtures) as Scheme[],
      };
    }
  } catch {
    // Ignore and use fixtures.
  }
  return { approvals: approvalTypes, rules: applicabilityRules, schemes: schemeFixtures };
}
