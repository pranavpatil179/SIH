export type Role = 'entrepreneur' | 'officer' | 'admin';
export type AppStatus =
  | 'draft'
  | 'submitted'
  | 'under_scrutiny'
  | 'query_raised'
  | 'inspection_required'
  | 'inspection_scheduled'
  | 'inspection_completed'
  | 'approved'
  | 'rejected'
  | 'withdrawn';
export type DocumentValidationStatus = 'pending' | 'valid' | 'invalid' | 'expired' | 'warning';
export type InspectionStatus = 'requested' | 'scheduled' | 'completed' | 'cancelled';
export type QueryStatus = 'open' | 'responded' | 'closed';

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  department_id?: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  pan?: string;
  gstin?: string;
  cin?: string;
  udyam_number?: string;
  company_type?: string;
  sector: string;
  address?: string;
  state?: string;
  contact_email?: string;
  contact_phone?: string;
  establishment_year?: number;
  created_at: string;
}

export interface Project {
  id: string;
  business_id: string;
  name: string;
  location_state: string;
  district?: string;
  industrial_area?: string;
  project_size: string;
  pollution_category: string;
  stage: string;
  investment_crore: number;
  land_cost_crore?: number;
  building_civil_cost_crore?: number;
  plant_machinery_cost_crore?: number;
  equipment_utilities_cost_crore?: number;
  annual_turnover_crore?: number;
  sector?: string;
  land_ownership_type?: string;
  connected_load_kw?: number;
  power_requirement_kva?: number;
  builtup_area_sqm?: number;
  food_sub_category?: string;
  textile_sub_category?: string;
  pharma_sub_category?: string;
  land_area_sqm?: number;
  employee_count: number;
  production_capacity?: string;
  manufacturing_process?: string;
  hazardous_materials: boolean;
  water_requirement_kld?: number;
  electricity_requirement_kw?: number;
  sub_sector?: string;
  description?: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  sla_default_days: number;
}

export interface ApprovalType {
  id: string;
  name: string;
  authority: string;
  department_id: string;
  legal_basis?: string;
  sla_days: number;
  required_documents: string[];
  requires_inspection: boolean;
  fee_note?: string;
  department?: Department;
}

export interface Application {
  id: string;
  project_id: string;
  status: AppStatus;
  created_at: string;
  project?: Project;
}

export interface ApplicationApproval {
  id: string;
  application_id: string;
  approval_type_id: string;
  department_id: string;
  status: AppStatus;
  requires_inspection: boolean;
  sla_due_at?: string;
  submitted_at?: string;
  decided_at?: string;
  decided_by?: string;
  officer_notes?: string;
  approval_number?: string;
  rejection_reason?: string;
  guidance?: string;
  risk_score?: number;
  risk_level?: string;
  approval_type?: ApprovalType;
  department?: Department;
}

export interface Document {
  id: string;
  business_id: string;
  doc_type: string;
  file_name: string;
  validation_status: DocumentValidationStatus;
  expiry_date?: string;
  created_at: string;
  file_url?: string;
  storage_path?: string;
  is_verified: boolean;
  verified_at?: string;
  application_approval_id?: string;
}

export interface Query {
  id: string;
  application_approval_id: string;
  raised_by: string;
  question: string;
  status: QueryStatus;
  created_at: string;
  resolved_at?: string;
  responses?: QueryResponse[];
  raised_by_profile?: Profile;
}

export interface QueryResponse {
  id: string;
  query_id: string;
  responded_by: string;
  response: string;
  documents?: string[];
  created_at: string;
}

export interface Inspection {
  id: string;
  application_id: string;
  scheduled_at?: string;
  inspector_name?: string;
  approvals_covered?: string[];
  departments?: string[];
  status: InspectionStatus;
  inspection_type?: string;
  location?: string;
  findings?: string;
  result?: string;
  completed_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface Scheme {
  id: string;
  name: string;
  description?: string;
  department_id?: string;
  benefit?: string;
  sector_eligibility?: string[];
  location_eligibility?: string[];
  min_investment_crore?: number;
  max_investment_crore?: number;
  status: string;
}

export interface ComplianceObligation {
  id: string;
  application_approval_id: string;
  name: string;
  description?: string;
  department_id: string;
  frequency: string;
  due_date: string;
  status: string;
  source?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor: string;
  action: string;
  detail: Record<string, unknown>;
  created_at: string;
}

export interface ChecklistItem {
  approval_type: ApprovalType;
  can_start: boolean;
  blocked_by: string[];
  is_parallel: boolean;
  estimated_days: number;
}

export interface SchemeEligibility {
  scheme: Scheme;
  reasons: string[];
  match_score: number;
}
