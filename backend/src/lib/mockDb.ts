import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'bizclear_jwt_secret_2024';
const DB_FILE = path.join(__dirname, '../../data/local_db.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export interface LocalDbSchema {
  profiles: any[];
  departments: any[];
  approval_types: any[];
  applicability_rules: any[];
  approval_dependencies: any[];
  businesses: any[];
  projects: any[];
  applications: any[];
  application_approvals: any[];
  documents: any[];
  document_verifications: any[];
  queries: any[];
  query_responses: any[];
  inspections: any[];
  schemes: any[];
  notifications: any[];
  compliance_obligations: any[];
  audit_log: any[];
}

function getInitialData(): LocalDbSchema {
  return {
    profiles: [
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'entrepreneur@demo.com',
        full_name: 'Rajesh Sharma',
        role: 'entrepreneur',
        department_id: null,
        created_at: new Date().toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'officer@demo.com',
        full_name: 'S. K. Deshmukh (General Manager)',
        role: 'officer',
        department_id: 'dept_dic',
        created_at: new Date().toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        email: 'admin@demo.com',
        full_name: 'Director of Industries (Admin)',
        role: 'admin',
        department_id: null,
        created_at: new Date().toISOString(),
      },
    ],
    departments: [
      { id: 'dept_dic', name: 'District Industries Centre (DIC)', sla_default_days: 15 },
      { id: 'dept_midc', name: 'Maharashtra Industrial Development Corp (MIDC)', sla_default_days: 21 },
      { id: 'dept_mpcb', name: 'Maharashtra Pollution Control Board (MPCB)', sla_default_days: 30 },
      { id: 'dept_fire', name: 'Maharashtra Fire & Emergency Services (MFES)', sla_default_days: 14 },
      { id: 'dept_dish', name: 'Directorate of Industrial Safety & Health (DISH)', sla_default_days: 20 },
      { id: 'dept_mseb', name: 'MSEDCL / Electricity Distribution', sla_default_days: 10 },
      { id: 'dept_fssai', name: 'Food Safety and Standards Authority (FSSAI)', sla_default_days: 15 },
    ],
    approval_types: [
      {
        id: 'app_consent_est',
        name: 'Consent to Establish (CTE)',
        authority: 'MPCB Regional Officer',
        department_id: 'dept_mpcb',
        legal_basis: 'Water (Prevention & Control of Pollution) Act 1974 & Air Act 1981',
        sla_days: 30,
        required_documents: [
          'Detailed Project Report (DPR) with Capital Investment Breakup',
          'Process Flowchart & Material Mass Balance',
          'Effluent Treatment Plant (ETP/STP) Engineering Scheme',
          'Air Pollution Control (APC) Stack & Scrubber Specifications',
          'Hazardous Waste CHWTSDF Membership Authorization (Form 1)',
        ],
        requires_inspection: true,
        fee_note: 'Tiered statutory fee under MPCB notification based on gross capital outlay',
      },
      {
        id: 'app_midc_allot',
        name: 'MIDC Industrial Plot Allotment & Lease',
        authority: 'MIDC Regional Office',
        department_id: 'dept_midc',
        legal_basis: 'Maharashtra Industrial Development Act 1961 (Form A)',
        sla_days: 21,
        required_documents: [
          'Detailed Project Report (DPR) certified by Chartered Engineer',
          'Audited Balance Sheets / Net Worth CA Certificate (Last 3 Years)',
          'Udyam Registration Certificate / Certificate of Incorporation',
          'Board Resolution / Partnership Deed',
          'Industrial Land Utilization Block Plan',
        ],
        requires_inspection: false,
        fee_note: 'Standard MIDC premium rates applicable per sq. metre',
      },
      {
        id: 'app_building_plan',
        name: 'Factory Building Plan Sanction',
        authority: 'MIDC / DISH Engineering Section',
        department_id: 'dept_midc',
        legal_basis: 'Maharashtra Regional & Town Planning Act (MRTP 1966)',
        sla_days: 15,
        required_documents: [
          'Architectural & Structural Blueprints in Triplicate (1:100 scale)',
          'Soil Investigation & Bearing Capacity Report',
          'Structural Stability Certificate (Form 1A)',
          'Topographical Site Contour Map',
        ],
        requires_inspection: true,
        fee_note: 'Scrutiny fee ₹5 per sqm of built-up area',
      },
      {
        id: 'app_fire_noc',
        name: 'Fire Department Provisional NOC',
        authority: 'Chief Fire Officer (MFES)',
        department_id: 'dept_fire',
        legal_basis: 'Maharashtra Fire Prevention & Life Safety Measures Act 2006',
        sla_days: 14,
        required_documents: [
          'Fire Hydrant & Ring Main Layout Scheme (NBC 2016 Part IV)',
          'Underground Static Fire Water Storage Tank Blueprint (min 100kL)',
          'Automatic Sprinkler & Heat/Smoke Detection System Layout',
          'Emergency Evacuation Escape Plan & Exit Width Calculations',
        ],
        requires_inspection: true,
        fee_note: '₹10,000 inspection & statutory scrutiny fee',
      },
      {
        id: 'app_power_sanction',
        name: 'High Tension (HT) Power Load Sanction',
        authority: 'MSEDCL Superintending Engineer',
        department_id: 'dept_mseb',
        legal_basis: 'Electricity Act 2003 & Maharashtra Electricity Regulatory Commission (MERC)',
        sla_days: 10,
        required_documents: [
          'Connected Electrical Load Estimation Report (kW/kVA)',
          'Single Line Diagram (SLD) signed by Certified Electrical Engineer',
          'Substation / Transformer Yard Civil Layout',
          'MIDC Land Possession Letter / Sanctioned Building Plan',
        ],
        requires_inspection: false,
        fee_note: 'Processing fee ₹2,500 + security deposit upon sanction',
      },
      {
        id: 'app_factory_license',
        name: 'Factory License & Registration (Form 2)',
        authority: 'Joint Director, DISH',
        department_id: 'dept_dish',
        legal_basis: 'The Factories Act 1948 & Maharashtra Factories Rules 1963',
        sla_days: 20,
        required_documents: [
          'DISH Approved Factory Building Architectural Blueprints',
          'Machinery Layout & Occupational Spacing Plan (Rule 3-A)',
          'Structural Stability Certificate from Competent Person',
          'Factory Safety Policy & On-Site Emergency Action Plan',
        ],
        requires_inspection: true,
        fee_note: 'Tiered license fee based on installed Horsepower (HP) and Worker strength',
      },
      {
        id: 'app_consent_op',
        name: 'Consent to Operate (CTO)',
        authority: 'MPCB Member Secretary',
        department_id: 'dept_mpcb',
        legal_basis: 'Water Act 1974 & Air Act 1981',
        sla_days: 25,
        required_documents: ['CTE Compliance Certificate', 'ETP Commissioning Report', 'Stack Monitoring Baseline Report'],
        requires_inspection: true,
        fee_note: 'Annual recurring consent fee',
      },
      {
        id: 'app_fssai_license',
        name: 'FSSAI Food Manufacturing License',
        authority: 'State Food Safety Commissioner',
        department_id: 'dept_fssai',
        legal_basis: 'Food Safety and Standards Act 2006',
        sla_days: 15,
        required_documents: ['Food Safety Management Plan', 'Potable Water Test Report', 'Equipment Calibration List'],
        requires_inspection: true,
        fee_note: '₹7,500 per annum',
      },
    ],
    applicability_rules: [
      { id: 'rule_1', approval_type_id: 'app_consent_est', applies_if: {} },
      { id: 'rule_2', approval_type_id: 'app_midc_allot', applies_if: {} },
      { id: 'rule_3', approval_type_id: 'app_building_plan', applies_if: { stage: 'new_setup' } },
      { id: 'rule_4', approval_type_id: 'app_fire_noc', applies_if: {} },
      { id: 'rule_5', approval_type_id: 'app_power_sanction', applies_if: {} },
      { id: 'rule_6', approval_type_id: 'app_factory_license', applies_if: { min_employees: 10 } },
      { id: 'rule_7', approval_type_id: 'app_fssai_license', applies_if: { sector: 'food_processing' } },
    ],
    approval_dependencies: [
      { id: 'dep_1', approval_type_id: 'app_building_plan', prerequisite_approval_type_id: 'app_midc_allot' },
      { id: 'dep_2', approval_type_id: 'app_fire_noc', prerequisite_approval_type_id: 'app_building_plan' },
      { id: 'dep_3', approval_type_id: 'app_factory_license', prerequisite_approval_type_id: 'app_fire_noc' },
      { id: 'dep_4', approval_type_id: 'app_consent_op', prerequisite_approval_type_id: 'app_consent_est' },
    ],
    businesses: [
      {
        id: 'biz_001',
        owner_id: '00000000-0000-0000-0000-000000000001',
        name: 'Apex Precision Engineering Pvt Ltd',
        sector: 'manufacturing',
        company_type: 'pvt_ltd',
        state: 'Maharashtra',
        address: 'Plot A-42, MIDC Chakan Phase II, Pune - 410501',
        pan: 'ABCDE1234F',
        gstin: '27ABCDE1234F1Z5',
        udyam_number: 'UDYAM-MH-26-0012345',
        contact_email: 'rajesh@apexengg.com',
        contact_phone: '+91 98230 11223',
        establishment_year: 2021,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
    ],
    projects: [
      {
        id: 'proj_001',
        business_id: 'biz_001',
        name: 'High-Precision Automotive Components Facility',
        location_state: 'Maharashtra',
        district: 'Pune',
        industrial_area: 'MIDC Chakan',
        project_size: 'medium',
        pollution_category: 'orange',
        stage: 'new_setup',
        investment_crore: 12.5,
        land_area_sqm: 4500,
        employee_count: 85,
        production_capacity: '1,500 units/day',
        manufacturing_process: 'CNC Milling, High Precision Turning, Ultrasonic Cleaning, Automated CMM Inspection',
        hazardous_materials: false,
        water_requirement_kld: 35,
        electricity_requirement_kw: 650,
        sub_sector: 'precision_engineering',
        description: 'Greenfield setup of state-of-the-art precision components manufacturing plant supplying EV transmission gears and aerospace bushings.',
        data_source: 'live_entry',
        created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      },
    ],
    applications: [
      {
        id: 'app_inst_001',
        project_id: 'proj_001',
        status: 'under_scrutiny',
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    application_approvals: [
      {
        id: 'aprv_001',
        application_id: 'app_inst_001',
        approval_type_id: 'app_consent_est',
        department_id: 'dept_mpcb',
        status: 'under_scrutiny',
        requires_inspection: true,
        sla_due_at: new Date(Date.now() + 15 * 86400000).toISOString(),
        submitted_at: new Date(Date.now() - 15 * 86400000).toISOString(),
        officer_notes: 'Initial documents verified. Site inspection assigned to MPCB Pune Regional Field Officer.',
        risk_score: 22,
        risk_level: 'Low',
      },
      {
        id: 'aprv_002',
        application_id: 'app_inst_001',
        approval_type_id: 'app_midc_allot',
        department_id: 'dept_midc',
        status: 'approved',
        requires_inspection: false,
        sla_due_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        submitted_at: new Date(Date.now() - 15 * 86400000).toISOString(),
        decided_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        decided_by: '00000000-0000-0000-0000-000000000002',
        approval_number: 'MIDC/PN/2026/IND-4421',
        officer_notes: 'Allotment order issued for Plot A-42 Chakan Phase II.',
        risk_score: 10,
        risk_level: 'Low',
      },
      {
        id: 'aprv_003',
        application_id: 'app_inst_001',
        approval_type_id: 'app_building_plan',
        department_id: 'dept_midc',
        status: 'submitted',
        requires_inspection: true,
        sla_due_at: new Date(Date.now() + 5 * 86400000).toISOString(),
        submitted_at: new Date(Date.now() - 10 * 86400000).toISOString(),
        risk_score: 18,
        risk_level: 'Low',
      },
      {
        id: 'aprv_004',
        application_id: 'app_inst_001',
        approval_type_id: 'app_fire_noc',
        department_id: 'dept_fire',
        status: 'submitted',
        requires_inspection: true,
        sla_due_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        submitted_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        risk_score: 15,
        risk_level: 'Low',
      },
      {
        id: 'aprv_005',
        application_id: 'app_inst_001',
        approval_type_id: 'app_power_sanction',
        department_id: 'dept_mseb',
        status: 'approved',
        requires_inspection: false,
        sla_due_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        submitted_at: new Date(Date.now() - 12 * 86400000).toISOString(),
        decided_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        approval_number: 'MSEDCL/HT/650KW/2026-981',
        risk_score: 5,
        risk_level: 'Low',
      },
    ],
    documents: [
      {
        id: 'doc_001',
        business_id: 'biz_001',
        doc_type: 'pan',
        file_name: 'Apex_Company_PAN.pdf',
        validation_status: 'valid',
        is_verified: true,
        verified_at: new Date(Date.now() - 20 * 86400000).toISOString(),
        created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      },
      {
        id: 'doc_002',
        business_id: 'biz_001',
        doc_type: 'gstin',
        file_name: 'GST_Registration_Certificate.pdf',
        validation_status: 'valid',
        is_verified: true,
        verified_at: new Date(Date.now() - 20 * 86400000).toISOString(),
        created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      },
      {
        id: 'doc_003',
        business_id: 'biz_001',
        doc_type: 'dpr',
        file_name: 'Detailed_Project_Report_Apex_Unit.pdf',
        validation_status: 'valid',
        is_verified: true,
        verified_at: new Date(Date.now() - 14 * 86400000).toISOString(),
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
    ],
    document_verifications: [],
    queries: [
      {
        id: 'query_001',
        application_approval_id: 'aprv_001',
        raised_by: '00000000-0000-0000-0000-000000000002',
        question: 'Please submit the revised acoustic enclosure diagram for high-noise CNC machinery as per MPCB noise pollution norm Annexure 4.',
        status: 'open',
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
    ],
    query_responses: [],
    inspections: [
      {
        id: 'insp_001',
        application_id: 'app_inst_001',
        scheduled_at: new Date(Date.now() + 3 * 86400000).toISOString(),
        inspector_name: 'Vikram Shinde (Sub-Regional Officer)',
        approvals_covered: ['Consent to Establish (CTE)', 'Factory Building Plan Sanction'],
        departments: ['MPCB', 'MIDC'],
        status: 'scheduled',
        inspection_type: 'Joint Single-Window On-Site Inspection',
        location: 'Plot A-42, MIDC Chakan Phase II, Pune',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ],
    schemes: [
      {
        id: 'scheme_psi_2019',
        name: 'Maharashtra Package Scheme of Incentives (PSI 2019)',
        description: 'Comprehensive fiscal incentives including Industrial Promotion Subsidy (IPS), electricity duty exemption, and interest subsidy for manufacturing units setup in Vidarbha, Marathwada, and developing industrial zones.',
        department_id: 'dept_dic',
        benefit: 'Up to 80% Gross Fixed Capital Subsidy + 100% Electricity Duty Exemption for 7 years',
        sector_eligibility: ['manufacturing', 'chemical', 'textile', 'agro', 'pharmaceutical'],
        location_eligibility: ['Maharashtra', 'All India'],
        min_investment_crore: 5,
        max_investment_crore: 500,
        status: 'active',
      },
      {
        id: 'scheme_msme_interest',
        name: 'Maharashtra MSME 5% Interest Subvention Scheme',
        description: 'Direct interest subvention of 5% on term loans disbursed by Scheduled Commercial Banks to newly registered Micro & Small enterprises.',
        department_id: 'dept_dic',
        benefit: '5% annual interest reimbursement on term loan up to ₹25 Lakhs per year for 5 years',
        sector_eligibility: ['manufacturing', 'food_processing', 'textile', 'agro', 'it_services'],
        location_eligibility: ['Maharashtra'],
        min_investment_crore: 0.25,
        max_investment_crore: 10,
        status: 'active',
      },
      {
        id: 'scheme_green_energy',
        name: 'Green Energy & Zero Liquid Discharge (ZLD) Capital Grant',
        description: 'Financial assistance for industrial units installing effluent zero-discharge treatment facilities, rooftop solar power systems, and rainwater harvesting infrastructure.',
        department_id: 'dept_mpcb',
        benefit: '25% capital subsidy on pollution abatement & solar equipment up to ₹50 Lakhs',
        sector_eligibility: ['manufacturing', 'chemical', 'pharmaceutical', 'food_processing'],
        location_eligibility: ['Maharashtra'],
        min_investment_crore: 1,
        max_investment_crore: 100,
        status: 'active',
      },
      {
        id: 'scheme_export_msme',
        name: 'Export Promotion & Quality Certification Support',
        description: '100% reimbursement of fee incurred on ISO, CE, BIS, and international quality testing certifications for export-oriented manufacturers.',
        department_id: 'dept_dic',
        benefit: 'Up to ₹15 Lakhs reimbursement for certification + ₹5 Lakhs stall subsidy in global expos',
        sector_eligibility: ['manufacturing', 'pharmaceutical', 'textile', 'food_processing'],
        location_eligibility: ['Maharashtra'],
        min_investment_crore: 0.5,
        status: 'active',
      },
    ],
    notifications: [
      {
        id: 'notif_001',
        user_id: '00000000-0000-0000-0000-000000000001',
        type: 'approval_approved',
        title: 'MIDC Allotment Order Approved',
        message: 'Your application for MIDC Industrial Land Allotment (MIDC/PN/2026/IND-4421) has been approved.',
        entity_type: 'approval',
        entity_id: 'aprv_002',
        is_read: false,
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'notif_002',
        user_id: '00000000-0000-0000-0000-000000000001',
        type: 'query_raised',
        title: 'MPCB Query Raised on CTE',
        message: 'An officer raised a query regarding acoustic enclosure drawings for your Consent to Establish.',
        entity_type: 'query',
        entity_id: 'query_001',
        is_read: false,
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
    ],
    compliance_obligations: [
      {
        id: 'comp_001',
        application_approval_id: 'aprv_001',
        name: 'Quarterly Environmental Monitoring Report',
        description: 'Submit ambient air quality and noise monitoring report to MPCB Sub-Regional Office Pune.',
        department_id: 'dept_mpcb',
        frequency: 'Quarterly',
        due_date: new Date(Date.now() + 45 * 86400000).toISOString(),
        status: 'pending',
        source: 'Consent to Establish (CTE) condition #12',
        created_at: new Date().toISOString(),
      },
      {
        id: 'comp_002',
        application_approval_id: 'aprv_005',
        name: 'Annual Electrical Safety & Earthing Audit',
        description: 'Conduct and file yearly electrical inspection report certified by Licensed Electrical Contractor.',
        department_id: 'dept_mseb',
        frequency: 'Annual',
        due_date: new Date(Date.now() + 180 * 86400000).toISOString(),
        status: 'pending',
        source: 'MSEDCL High Tension Supply Norms',
        created_at: new Date().toISOString(),
      },
    ],
    audit_log: [
      {
        id: 1,
        actor: '00000000-0000-0000-0000-000000000001',
        action: 'BUSINESS_SAVED',
        detail: { name: 'Apex Precision Engineering Pvt Ltd' },
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
    ],
  };
}

class LocalDatabase {
  private data: LocalDbSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): LocalDbSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        const initial = getInitialData();
        return { ...initial, ...parsed };
      }
    } catch (e) {
      console.warn('[LocalDb] Failed to read local_db.json, re-initializing with seed data:', e);
    }
    const initial = getInitialData();
    this.saveData(initial);
    return initial;
  }

  public saveData(data?: LocalDbSchema): void {
    try {
      if (data) this.data = data;
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[LocalDb] Failed to write local_db.json:', e);
    }
  }

  public getTable(tableName: keyof LocalDbSchema): any[] {
    if (!this.data[tableName]) {
      this.data[tableName] = [];
    }
    return this.data[tableName];
  }

  public setTable(tableName: keyof LocalDbSchema, rows: any[]): void {
    this.data[tableName] = rows;
    this.saveData();
  }

  public createQueryBuilder(table: string) {
    return new MockQueryBuilder(this, table as keyof LocalDbSchema);
  }
}

export const localDb = new LocalDatabase();

function getNestedValue(obj: any, pathStr: string): any {
  if (!obj || !pathStr) return undefined;
  const parts = pathStr.split('.');
  let curr = obj;
  for (const p of parts) {
    if (curr == null) return undefined;
    curr = curr[p];
  }
  return curr;
}

class MockQueryBuilder {
  private db: LocalDatabase;
  private tableName: keyof LocalDbSchema;
  private op: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: any = null;
  private filters: Array<(item: any) => boolean> = [];
  private orderSpec?: { column: string; ascending: boolean };
  private limitCount?: number;
  private rangeFrom?: number;
  private rangeTo?: number;
  private selectCols?: string;
  private isSingle = false;
  private isMaybeSingle = false;
  private isHeadOnly = false;
  private isCountExact = false;

  constructor(db: LocalDatabase, tableName: keyof LocalDbSchema) {
    this.db = db;
    this.tableName = tableName;
  }

  select(columns: string = '*', options?: { count?: 'exact'; head?: boolean }) {
    this.selectCols = columns;
    if (options?.head) this.isHeadOnly = true;
    if (options?.count === 'exact') this.isCountExact = true;
    return this;
  }

  insert(data: any | any[]) {
    this.op = 'insert';
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.op = 'update';
    this.payload = data;
    return this;
  }

  delete() {
    this.op = 'delete';
    return this;
  }

  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item) => {
      const populated = this.resolveJoins(item);
      const val = column.includes('.') ? getNestedValue(populated, column) : item[column];
      return String(val) === String(value);
    });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((item) => {
      const populated = this.resolveJoins(item);
      const val = column.includes('.') ? getNestedValue(populated, column) : item[column];
      return String(val) !== String(value);
    });
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push((item) => {
      const val = column.includes('.') ? getNestedValue(item, column) : item[column];
      return val < value;
    });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push((item) => {
      const val = column.includes('.') ? getNestedValue(item, column) : item[column];
      return val <= value;
    });
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push((item) => {
      const val = column.includes('.') ? getNestedValue(item, column) : item[column];
      return val > value;
    });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push((item) => {
      const val = column.includes('.') ? getNestedValue(item, column) : item[column];
      return val >= value;
    });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push((item) => {
      const val = column.includes('.') ? getNestedValue(item, column) : item[column];
      return values.map(String).includes(String(val));
    });
    return this;
  }

  not(column: string, operator: string, value: any) {
    if (operator === 'in') {
      const vals = typeof value === 'string'
        ? value.replace(/[()"]/g, '').split(',').map((s) => s.trim())
        : Array.isArray(value) ? value : [value];
      this.filters.push((item) => {
        const val = column.includes('.') ? getNestedValue(item, column) : item[column];
        return !vals.includes(item[column]);
      });
    }
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderSpec = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  public resolveJoins(item: any): any {
    const copy = { ...item };

    // Projects -> Business
    if (this.tableName === 'projects') {
      const biz = this.db.getTable('businesses').find((b) => b.id === item.business_id);
      copy.businesses = biz || null;
      copy.business = biz || null;
    }

    // Approval Types -> Departments & Applicability Rules
    if (this.tableName === 'approval_types') {
      const dept = this.db.getTable('departments').find((d) => d.id === item.department_id);
      copy.departments = dept || null;
      copy.department = dept || null;
      copy.applicability_rules = this.db.getTable('applicability_rules').filter((r) => r.approval_type_id === item.id);
    }

    // Applications -> Projects (with Business), Approvals, Inspections
    if (this.tableName === 'applications') {
      const proj = this.db.getTable('projects').find((p) => p.id === item.project_id);
      if (proj) {
        const pCopy = { ...proj };
        const biz = this.db.getTable('businesses').find((b) => b.id === proj.business_id);
        pCopy.businesses = biz || null;
        pCopy.business = biz || null;
        copy.projects = pCopy;
        copy.project = pCopy;
      }
      copy.application_approvals = this.db.getTable('application_approvals')
        .filter((aa) => aa.application_id === item.id)
        .map((aa) => {
          const at = this.db.getTable('approval_types').find((a) => a.id === aa.approval_type_id);
          const dt = this.db.getTable('departments').find((d) => d.id === aa.department_id);
          const qList = this.db.getTable('queries').filter((q) => q.application_approval_id === aa.id);
          return { ...aa, approval_type: at || null, approval_types: at || null, department: dt || null, departments: dt || null, queries: qList };
        });
      copy.inspections = this.db.getTable('inspections').filter((i) => i.application_id === item.id);
    }

    // Application Approvals -> Approval Type, Department, Application (with Project & Business)
    if (this.tableName === 'application_approvals') {
      const at = this.db.getTable('approval_types').find((a) => a.id === item.approval_type_id);
      const dt = this.db.getTable('departments').find((d) => d.id === item.department_id);
      copy.approval_type = at || null;
      copy.approval_types = at || null;
      copy.department = dt || null;
      copy.departments = dt || null;

      const app = this.db.getTable('applications').find((a) => a.id === item.application_id);
      if (app) {
        const aCopy = { ...app };
        const proj = this.db.getTable('projects').find((p) => p.id === app.project_id);
        if (proj) {
          const pCopy = { ...proj };
          const biz = this.db.getTable('businesses').find((b) => b.id === proj.business_id);
          pCopy.businesses = biz || null;
          pCopy.business = biz || null;
          aCopy.projects = pCopy;
          aCopy.project = pCopy;
        }
        copy.applications = aCopy;
        copy.application = aCopy;
      }
    }

    // Inspections -> Application (with Project & Business)
    if (this.tableName === 'inspections') {
      const app = this.db.getTable('applications').find((a) => a.id === item.application_id);
      if (app) {
        const aCopy = { ...app };
        const proj = this.db.getTable('projects').find((p) => p.id === app.project_id);
        if (proj) {
          const pCopy = { ...proj };
          const biz = this.db.getTable('businesses').find((b) => b.id === proj.business_id);
          pCopy.businesses = biz || null;
          pCopy.business = biz || null;
          aCopy.projects = pCopy;
          aCopy.project = pCopy;
        }
        copy.applications = aCopy;
        copy.application = aCopy;
      }
    }

    // Queries -> Application Approval (with App, Project, Business) & Responses
    if (this.tableName === 'queries') {
      copy.query_responses = this.db.getTable('query_responses').filter((r) => r.query_id === item.id);
      copy.responses = copy.query_responses;

      const aa = this.db.getTable('application_approvals').find((a) => a.id === item.application_approval_id);
      if (aa) {
        const aaCopy = { ...aa };
        const at = this.db.getTable('approval_types').find((a) => a.id === aa.approval_type_id);
        const dt = this.db.getTable('departments').find((d) => d.id === aa.department_id);
        aaCopy.approval_types = at || null;
        aaCopy.approval_type = at || null;
        aaCopy.departments = dt || null;
        aaCopy.department = dt || null;

        const app = this.db.getTable('applications').find((a) => a.id === aa.application_id);
        if (app) {
          const aCopy = { ...app };
          const proj = this.db.getTable('projects').find((p) => p.id === app.project_id);
          if (proj) {
            const pCopy = { ...proj };
            const biz = this.db.getTable('businesses').find((b) => b.id === proj.business_id);
            pCopy.businesses = biz || null;
            pCopy.business = biz || null;
            aCopy.projects = pCopy;
            aCopy.project = pCopy;
          }
          aaCopy.applications = aCopy;
          aaCopy.application = aCopy;
        }
        copy.application_approvals = aaCopy;
        copy.application_approval = aaCopy;
      }
    }

    return copy;
  }

  then(resolve: (value: any) => any, reject?: (reason: any) => any) {
    return this.execute().then(resolve, reject);
  }

  async execute(): Promise<{ data: any; count: number | null; error: any }> {
    const table = this.db.getTable(this.tableName);

    // 1. Handle INSERT
    if (this.op === 'insert') {
      const records = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted = records.map((r) => ({
        id: r.id || `${this.tableName.slice(0, 4)}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        created_at: r.created_at || new Date().toISOString(),
        ...r,
      }));

      table.push(...inserted);
      this.db.saveData();

      const populated = inserted.map((r) => this.resolveJoins(r));
      const resData = this.isSingle || this.isMaybeSingle || !Array.isArray(this.payload) ? populated[0] : populated;
      return { data: resData, count: populated.length, error: null };
    }

    // 2. Handle UPDATE
    if (this.op === 'update') {
      let updatedRows: any[] = [];
      const newRows = table.map((item) => {
        const match = this.filters.every((fn) => fn(item));
        if (match) {
          const updated = { ...item, ...this.payload, updated_at: new Date().toISOString() };
          updatedRows.push(updated);
          return updated;
        }
        return item;
      });

      this.db.setTable(this.tableName, newRows);
      const populated = updatedRows.map((r) => this.resolveJoins(r));
      const resData = this.isSingle || this.isMaybeSingle ? (populated[0] || null) : populated;
      return { data: resData, count: populated.length, error: null };
    }

    // 3. Handle DELETE
    if (this.op === 'delete') {
      const newRows = table.filter((item) => !this.filters.every((fn) => fn(item)));
      this.db.setTable(this.tableName, newRows);
      return { data: null, count: null, error: null };
    }

    // 4. Handle SELECT
    let rows = table.filter((item) => this.filters.every((fn) => fn(item)));
    const count = rows.length;

    if (this.isHeadOnly) {
      return { data: null, count, error: null };
    }

    if (this.orderSpec) {
      const { column, ascending } = this.orderSpec;
      rows = [...rows].sort((a, b) => {
        const valA = a[column];
        const valB = b[column];
        if (valA === valB) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;
        const res = valA > valB ? 1 : -1;
        return ascending ? res : -res;
      });
    }

    if (this.rangeFrom != null && this.rangeTo != null) {
      rows = rows.slice(this.rangeFrom, this.rangeTo + 1);
    } else if (this.limitCount != null) {
      rows = rows.slice(0, this.limitCount);
    }

    const populated = rows.map((r) => this.resolveJoins(r));

    if (this.isSingle) {
      if (populated.length === 0) {
        return { data: null, count: 0, error: { message: `Row not found in ${this.tableName}` } };
      }
      return { data: populated[0], count: 1, error: null };
    }

    if (this.isMaybeSingle) {
      return { data: populated[0] || null, count: populated.length, error: null };
    }

    return {
      data: populated,
      count: this.isCountExact ? count : null,
      error: null,
    };
  }
}

export const mockAuth = {
  async getUser(token: string) {
    if (!token) return { data: { user: null }, error: { message: 'No token' } };
    try {
      const decoded: any = jwt.decode(token);
      if (decoded?.sub || decoded?.id) {
        const id = decoded.sub || decoded.id;
        const profile = localDb.getTable('profiles').find((p) => p.id === id);
        const email = decoded.email || profile?.email || 'user@bizclear.gov.in';
        return {
          data: {
            user: {
              id,
              email,
              user_metadata: { full_name: profile?.full_name || email },
            },
          },
          error: null,
        };
      }
    } catch {
      // Fallback
    }

    const demoProfile = localDb.getTable('profiles')[0];
    return {
      data: {
        user: {
          id: demoProfile.id,
          email: demoProfile.email,
          user_metadata: { full_name: demoProfile.full_name },
        },
      },
      error: null,
    };
  },

  async signInWithPassword({ email, password }: { email: string; password?: string }) {
    let profile = localDb.getTable('profiles').find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (!profile) {
      profile = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        email,
        full_name: email.split('@')[0],
        role: email.includes('admin') ? 'admin' : email.includes('officer') ? 'officer' : 'entrepreneur',
        department_id: email.includes('officer') ? 'dept_dic' : null,
        created_at: new Date().toISOString(),
      };
      const profiles = localDb.getTable('profiles');
      profiles.push(profile);
      localDb.saveData();
    }

    const token = jwt.sign(
      {
        sub: profile.id,
        email: profile.email,
        role: profile.role,
        department_id: profile.department_id,
        iss: 'bizclear_local',
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return {
      data: {
        session: {
          access_token: token,
          token_type: 'bearer',
          user: {
            id: profile.id,
            email: profile.email,
            user_metadata: { full_name: profile.full_name },
          },
        },
        user: {
          id: profile.id,
          email: profile.email,
          user_metadata: { full_name: profile.full_name },
        },
      },
      error: null,
    };
  },
};
