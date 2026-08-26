// ---------------------------------------------------------------------------
// Domain types for Udyami Setu.
// These mirror the Postgres schema in /supabase/schema.sql. Kept as string
// unions (not TS enums) so the file is fully type-erasable and testable in
// plain Node.
// ---------------------------------------------------------------------------

export type Role = "applicant" | "officer" | "nodal" | "inspector";

export type Sector =
  | "food_processing"
  | "chemical"
  | "textile"
  | "engineering"
  | "it_services";

export type PollutionCategory = "red" | "orange" | "green" | "white";
export type Stage = "new_setup" | "operating" | "expansion";
export type ProjectSize = "micro" | "small" | "medium" | "large";

export type ApprovalStatus =
  | "not_started"
  | "submitted"
  | "under_scrutiny"
  | "query_raised"
  | "inspection_scheduled"
  | "approved"
  | "rejected"
  | "deemed_approved";

export type ScrutinyLevel =
  | "full_inspection"
  | "inspection"
  | "self_certify"
  | "not_required";

// ---- Knowledge-engine data (rules-as-data) -------------------------------

export interface ApprovalType {
  id: string;
  name: string;
  authority: string;
  department_id: string;
  legal_basis: string;
  sla_days: number;
  required_documents: string[];
  requires_inspection: boolean;
  fee_note: string | null;
}

export interface ApplicabilityRule {
  approval_id: string;
  applies_if: {
    sector?: Sector[];
    pollution_category?: PollutionCategory[];
    stage?: Stage[];
    project_size?: ProjectSize[];
  };
  /** How much scrutiny per pollution category. */
  scrutiny_level: Partial<Record<PollutionCategory, ScrutinyLevel>>;
}

export interface Scheme {
  id: string;
  name: string;
  authority: string;
  benefit: string;
  eligibility: {
    sector?: Sector[];
    project_size?: ProjectSize[];
    stage?: Stage[];
  };
}

/** The profile the engine reasons over. */
export interface CompanyProfile {
  sector: Sector;
  pollution_category: PollutionCategory;
  stage: Stage;
  project_size: ProjectSize;
  location_state: string;
}

// ---- Database rows -------------------------------------------------------

export interface Profile {
  id: string;
  role: Role;
  full_name: string | null;
  department_id: string | null;
}

export interface Department {
  id: string;
  name: string;
  sla_default_days: number;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  pan: string | null;
  sector: Sector;
  address: string | null;
  state: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  business_id: string;
  name: string;
  location_state: string;
  project_size: ProjectSize;
  pollution_category: PollutionCategory;
  stage: Stage;
  created_at: string;
}

export interface Application {
  id: string;
  project_id: string;
  status: "draft" | "submitted" | "in_progress" | "completed";
  created_at: string;
}

export interface ApplicationApproval {
  id: string;
  application_id: string;
  approval_type_id: string;
  department_id: string;
  status: ApprovalStatus;
  scrutiny_level: ScrutinyLevel;
  requires_inspection: boolean;
  sla_due_at: string | null;
  submitted_at: string | null;
  decided_at: string | null;
  decided_by: string | null;
  query_note: string | null;
}

export interface DocumentRow {
  id: string;
  business_id: string;
  application_approval_id: string | null;
  doc_type: string;
  file_name: string;
  file_url: string | null;
  validation_status: "pending" | "valid" | "invalid" | "expired";
  expiry_date: string | null;
}

export interface DocumentExtraction {
  id: string;
  document_id: string;
  licence_number: string | null;
  company_name: string | null;
  valid_from: string | null;
  valid_until: string | null;
  raw_text: string | null;
  created_at: string;
}

export type QrStatus = "match" | "mismatch" | "no_qr";
export type RiskLevel = "low" | "medium" | "high";
export type VerifyStatus = "verified" | "needs_review" | "flagged" | "pending";

export interface DocumentVerification {
  id: string;
  document_id: string;
  qr_status: QrStatus | null;
  qr_extracted: Record<string, string> | null;
  ai_risk: RiskLevel | null;
  ai_reasoning: string | null;
  official_status: "verified" | "unverified" | "na" | null;
  overall_status: VerifyStatus;
  created_at: string;
}

/** Full document with its verification chain — used in the UI. */
export interface DocumentWithVerification extends DocumentRow {
  extraction: DocumentExtraction | null;
  verification: DocumentVerification | null;
}

export interface Inspection {
  id: string;
  application_id: string;
  scheduled_at: string;
  inspector_name: string | null;
  approvals_covered: string[];
}

// Convenience shape for the officer queue / dashboard (joined rows).
export interface ApprovalRow extends ApplicationApproval {
  approval_name: string;
  authority: string;
  department_name: string;
  business_name: string;
  project_name: string;
}
