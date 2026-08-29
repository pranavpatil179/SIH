import { supabaseAdmin } from '../lib/supabase';

export interface ProjectAttributes {
  id?: string;
  sector: string; // 'food_processing' | 'textile' | 'manufacturing' | 'pharmaceutical'
  food_sub_category?: 'dairy_milk' | 'bakery_confectionery' | 'beverages_water' | 'grain_milling_oil' | 'ready_to_eat_frozen' | 'meat_poultry_fish';
  textile_sub_category?: 'spinning_ginning' | 'weaving_knitting' | 'wet_processing_dyeing' | 'garment_apparel' | 'technical_textiles';
  pharma_sub_category?: string;
  location_state: string;
  district?: string;
  investment_crore: number; // Total Project DPR Cost
  land_cost_crore?: number;
  building_civil_cost_crore?: number;
  plant_machinery_cost_crore?: number; // Qualifying Udyam Plant & Machinery
  equipment_utilities_cost_crore?: number;
  annual_turnover_crore?: number; // Projected / Annual Turnover
  employee_count: number;
  project_size?: string;
  pollution_category?: string; // 'white' | 'green' | 'orange' | 'red'
  stage?: string; // 'greenfield' | 'expansion' | 'operational'
  land_ownership_type?: 'seeking_midc_plot' | 'privately_owned' | 'private_leased';
  connected_load_kw?: number;
  requires_boiler?: boolean;
  hazardous_materials?: boolean;
  water_requirement_kld?: number;
}

export type VerificationTier = 'verified_statutory' | 'conditional_rule' | 'advisory_estimate';

export interface ApprovalRecommendation {
  approval_type_id: string;
  approval_name: string;
  department_id: string;
  department_name: string;
  status: 'applicable' | 'conditional' | 'not_applicable';
  confidence: 'high' | 'conditional';
  verification_tier: VerificationTier; // Explicit statutory grounding
  regulatory_source: string; // Gazette/Circular/Act Section
  legal_basis: string;
  statutory_authority: string;
  sla_days: number;
  sla_note: string;
  fee_calculation: string;
  reason: string;
  applicable_if?: string;
  not_applicable_if?: string;
  stage: 'pre_establishment' | 'construction' | 'pre_commissioning' | 'operational';
  track: 'land_siting' | 'environmental' | 'sector_licensing' | 'utilities' | 'commissioning';
  prerequisites: string[];
  required_documents_pre_establishment: string[];
  required_documents_post_construction: string[];
  required_documents: string[]; // Flattened for backward compatibility
  requires_inspection?: boolean;
  can_parallel: boolean;
  user_action_required?: string;
}

export interface RiskFactor {
  name: string;
  weight: string;
  points: number;
  max_points: number;
  reason: string;
}

export interface RiskAssessment {
  score: number; // 0 - 100
  level: 'low' | 'medium' | 'high' | 'critical';
  tier: 'green_channel' | 'standard' | 'enhanced_joint_inspection';
  tier_label: string;
  scrutiny_depth: string;
  inspection_policy: string;
  deemed_approval_eligible: boolean;
  factors: RiskFactor[];
  recommendation: string;
}

export interface MSMEClassification {
  category: 'Micro' | 'Small' | 'Medium' | 'Large / Non-MSME';
  qualifying_plant_machinery_crore: number;
  annual_turnover_crore: number;
  total_project_cost_crore: number;
  cost_breakdown: {
    land_crore: number;
    building_civil_crore: number;
    plant_machinery_crore: number;
    equipment_utilities_crore: number;
  };
  statutory_basis: string;
  regulatory_note: string;
}

export interface RegulatoryAnalysis {
  summary: {
    total_identified: number;
    high_confidence_count: number;
    conditional_count: number;
    excluded_count: number;
    sector: string;
    sub_category_label?: string;
    estimated_statutory_turnaround_days: number;
    risk_tier?: string;
    risk_score?: number;
  };
  msme_classification: MSMEClassification;
  risk_assessment: RiskAssessment;
  warnings: string[];
  tracks: {
    id: string;
    name: string;
    description: string;
    approvals: ApprovalRecommendation[];
  }[];
  approvals: ApprovalRecommendation[];
  dag_edges: { from: string; to: string; label?: string }[];
}

export function computeUdyamMSME(project: ProjectAttributes): MSMEClassification {
  const totalCost = project.investment_crore || 12.5;
  
  // Calculate specific components if provided, else use standard MSME engineering ratios
  const plantMachinery = project.plant_machinery_cost_crore ?? Math.round(totalCost * 0.45 * 10) / 10;
  const landCost = project.land_cost_crore ?? Math.round(totalCost * 0.20 * 10) / 10;
  const buildingCost = project.building_civil_cost_crore ?? Math.round(totalCost * 0.25 * 10) / 10;
  const utilitiesCost = project.equipment_utilities_cost_crore ?? Math.round((totalCost - plantMachinery - landCost - buildingCost) * 10) / 10;
  
  const turnover = project.annual_turnover_crore ?? Math.round(totalCost * 1.8 * 10) / 10;

  let category: 'Micro' | 'Small' | 'Medium' | 'Large / Non-MSME' = 'Small';
  let statutoryBasis = '';

  if (plantMachinery <= 1 && turnover <= 5) {
    category = 'Micro';
    statutoryBasis = `Investment in Plant & Machinery (₹${plantMachinery} Cr ≤ ₹1.0 Cr) & Annual Turnover (₹${turnover} Cr ≤ ₹5.0 Cr)`;
  } else if (plantMachinery <= 10 && turnover <= 50) {
    category = 'Small';
    statutoryBasis = `Investment in Plant & Machinery (₹${plantMachinery} Cr ≤ ₹10.0 Cr) & Annual Turnover (₹${turnover} Cr ≤ ₹50.0 Cr)`;
  } else if (plantMachinery <= 50 && turnover <= 250) {
    category = 'Medium';
    statutoryBasis = `Investment in Plant & Machinery (₹${plantMachinery} Cr ≤ ₹50.0 Cr) & Annual Turnover (₹${turnover} Cr ≤ ₹250.0 Cr)`;
  } else {
    category = 'Large / Non-MSME';
    statutoryBasis = `Investment in Plant & Machinery (₹${plantMachinery} Cr > ₹50.0 Cr) or Turnover (₹${turnover} Cr > ₹250.0 Cr)`;
  }

  return {
    category,
    qualifying_plant_machinery_crore: plantMachinery,
    annual_turnover_crore: turnover,
    total_project_cost_crore: totalCost,
    cost_breakdown: {
      land_crore: Math.max(landCost, 0),
      building_civil_crore: Math.max(buildingCost, 0),
      plant_machinery_crore: plantMachinery,
      equipment_utilities_crore: Math.max(utilitiesCost, 0),
    },
    statutory_basis: statutoryBasis,
    regulatory_note: 'Classified under Ministry of MSME Notification S.O. 2119(E) dated 26th June 2020 (effective 1st July 2020). Land and Building costs are strictly excluded from Udyam capital calculations.',
  };
}

export async function generateApprovalChecklist(
  project: ProjectAttributes
): Promise<RegulatoryAnalysis> {
  const warnings: string[] = [];

  // 1. Extreme Input Validation Guards
  if (project.employee_count > 25000) {
    warnings.push(`Workforce input of ${project.employee_count.toLocaleString('en-IN')} workers is unusually high for a single facility. Statutory factory spacing, health amenities (canteen, creche, ambulance room), and DISH scrutiny thresholds will apply at maximum tier.`);
  }
  if (project.investment_crore > 1000) {
    warnings.push(`Project capital outlay of ₹${project.investment_crore} Crore qualifies under the Maharashtra Mega/Ultra-Mega Project Policy, entitling the unit to customized High-Power Committee (HPC) fast-track clearances.`);
  }

  const msme = computeUdyamMSME(project);

  const isFood = project.sector === 'food_processing';
  const isTextile = project.sector === 'textile';
  const isPharma = project.sector === 'pharmaceutical';

  const foodSub = project.food_sub_category || 'bakery_confectionery';
  const textileSub = project.textile_sub_category || 'spinning_ginning';
  const pharmaSub = project.pharma_sub_category || 'formulations';

  // Determine effective pollution category
  let pollutionCat = project.pollution_category || 'orange';
  if (isTextile && textileSub === 'wet_processing_dyeing') {
    pollutionCat = 'red';
  } else if (isTextile && textileSub === 'garment_apparel') {
    pollutionCat = 'green';
  } else if (isFood && (foodSub === 'dairy_milk' || foodSub === 'meat_poultry_fish' || foodSub === 'beverages_water')) {
    pollutionCat = 'orange';
  } else if (isFood && (foodSub === 'bakery_confectionery' || foodSub === 'grain_milling_oil')) {
    pollutionCat = 'green';
  } else if (isPharma && pharmaSub === 'api_bulk_drugs') {
    pollutionCat = 'red';
  }

  const approvals: ApprovalRecommendation[] = [];

  // ==========================================
  // Track 1: Land & Siting
  // ==========================================

  // MIDC Plot Allotment (Conditional)
  const isSeekingMidc = project.land_ownership_type === 'seeking_midc_plot' || !project.land_ownership_type;
  approvals.push({
    approval_type_id: 'app_midc_allot',
    approval_name: isFood
      ? 'MIDC Mega Food Park / Industrial Plot Allotment'
      : isTextile
      ? 'MIDC Textile Park / Industrial Plot Allotment'
      : 'MIDC Industrial Plot Allotment & Lease',
    department_id: 'dept_midc',
    department_name: 'Maharashtra Industrial Development Corp (MIDC)',
    status: isSeekingMidc ? 'conditional' : 'not_applicable',
    confidence: 'conditional',
    verification_tier: 'conditional_rule',
    regulatory_source: 'MIDC Act 1961, Section 14 & Land Allotment Policy Circular No. MIDC/CP/2019/A921',
    legal_basis: 'Section 14, Maharashtra Industrial Development Act 1961 (Form A)',
    statutory_authority: 'MIDC Regional Officer / Land Allotment Committee',
    sla_days: 21,
    sla_note: '21 Working Days statutory SLA under Maharashtra Right to Public Services Act (RTS Act)',
    fee_calculation: 'Calculated as per prevailing MIDC regional premium rate card per sq. metre based on industrial zone tier',
    reason: isSeekingMidc
      ? `Required to acquire industrial plot in designated ${isFood ? 'Food Processing' : isTextile ? 'Textile Park' : 'Industrial'} zone.`
      : 'Excluded — Applicant has confirmed possession of private non-agricultural (NA) industrial land',
    applicable_if: 'Applicant is seeking a new industrial plot through MIDC Industrial Area',
    not_applicable_if: 'Applicant already owns or has executed a registered private lease for suitable industrial land',
    stage: 'pre_establishment',
    track: 'land_siting',
    prerequisites: [],
    required_documents_pre_establishment: [
      'Detailed Project Report (DPR) certified by Chartered Engineer',
      'Audited Balance Sheets / Net Worth CA Certificate (Last 3 Years)',
      'Udyam MSME Registration Certificate / Certificate of Incorporation',
      'Industrial Land Utilization Block Plan (Built-up area ≤ 50%)',
    ],
    required_documents_post_construction: [
      'MIDC Possession Handover Receipt',
      'Executed 95-Year Industrial Lease Deed',
    ],
    required_documents: [
      'Detailed Project Report (DPR) certified by Chartered Engineer',
      'Audited Balance Sheets / Net Worth CA Certificate (Last 3 Years)',
      'Udyam MSME Registration Certificate / Certificate of Incorporation',
      'Industrial Land Utilization Block Plan',
    ],
    can_parallel: true,
  });

  // Factory Building Plan Sanction (Verified Statutory Rule)
  approvals.push({
    approval_type_id: 'app_building_plan',
    approval_name: 'Factory Building Plan Sanction',
    department_id: 'dept_midc',
    department_name: 'MIDC / Municipal Town Planning Section',
    status: 'applicable',
    confidence: 'high',
    verification_tier: 'verified_statutory',
    regulatory_source: 'Maharashtra Regional and Town Planning Act, 1966 (MRTP Act), Section 44 & Standard Building Bye-Laws',
    legal_basis: 'Section 44, Maharashtra Regional and Town Planning Act (MRTP 1966)',
    statutory_authority: 'Executive Engineer / Planning Authority',
    sla_days: 15,
    sla_note: '15 Days standard statutory scrutiny SLA under Maharashtra RTS Act',
    fee_calculation: 'Statutory scrutiny fee of ₹5 per sq. metre of gross proposed built-up area under municipal/MIDC building rules',
    reason: `Mandatory structural sanction required prior to commencing civil work for ${project.sector.replace('_', ' ')} facility at ${project.district || 'Maharashtra'}.`,
    stage: 'pre_establishment',
    track: 'land_siting',
    prerequisites: ['app_midc_allot'],
    required_documents_pre_establishment: [
      'Architectural & Structural Blueprints in Triplicate (Scale 1:100)',
      'Soil Investigation & Geotechnical Bearing Capacity Report',
      'Structural Stability Undertaking (Form 1A)',
      'Site Contour & Stormwater Drainage Map',
    ],
    required_documents_post_construction: [
      'Building Completion Certificate (BCC)',
      'As-Built Civil Architectural Blueprint',
    ],
    required_documents: [
      'Architectural & Structural Blueprints in Triplicate (Scale 1:100)',
      'Soil Investigation & Geotechnical Bearing Capacity Report',
      'Structural Stability Undertaking (Form 1A)',
    ],
    can_parallel: false,
  });

  // Provisional Fire Safety NOC (Verified Statutory Rule)
  const isHighFireRisk = isTextile || (project.employee_count > 100);
  approvals.push({
    approval_type_id: 'app_fire_noc',
    approval_name: isTextile
      ? 'Provisional Fire NOC (High-Combustible Textile Rating NBC Part IV)'
      : 'Provisional Fire Safety NOC / Plan Scrutiny',
    department_id: 'dept_fire',
    department_name: 'Maharashtra Fire & Emergency Services (MFES)',
    status: 'applicable',
    confidence: 'high',
    verification_tier: 'verified_statutory',
    regulatory_source: 'Maharashtra Fire Prevention and Life Safety Measures Act, 2006, Section 3 & National Building Code (NBC 2016 Part IV)',
    legal_basis: 'Section 3, Maharashtra Fire Prevention and Life Safety Measures Act 2006',
    statutory_authority: 'Chief Fire Officer (MFES) / Designated Fire Officer',
    sla_days: 14,
    sla_note: '14 Working Days for Provisional Fire Scrutiny',
    fee_calculation: 'Calculated as per Maharashtra Fire Act Schedule (₹10,000 base scrutiny fee + statutory fire infrastructure cess per sqm)',
    reason: isTextile
      ? 'Mandatory high-combustible fire rating for textile/cotton processing requiring automatic deluge sprinklers and ring hydrants.'
      : 'Statutory fire prevention layout clearance required before erecting industrial structural sheds.',
    stage: 'pre_establishment',
    track: 'land_siting',
    prerequisites: ['app_building_plan'],
    required_documents_pre_establishment: [
      'Fire Hydrant & Ring Main Layout Scheme (NBC 2016 Part IV)',
      'Underground Static Fire Water Storage Tank Blueprint (min 100 kL)',
      'Automatic Sprinkler & Heat/Smoke Detection System Schematic',
      'Emergency Evacuation Escape Plan & Minimum 1.5m Exit Door Calculations',
    ],
    required_documents_post_construction: [
      'Fire System Hydrostatic Pressure Test Certificate',
      'Hydrant & Sprinkler Pump Installation Logbook',
    ],
    required_documents: [
      'Fire Hydrant & Ring Main Layout Scheme (NBC 2016 Part IV)',
      'Underground Static Fire Water Storage Tank Blueprint (min 100 kL)',
      'Emergency Evacuation Escape Plan',
    ],
    can_parallel: false,
  });

  // Factory Plan Sanction (DISH) (Verified Statutory Rule)
  approvals.push({
    approval_type_id: 'app_factory_license',
    approval_name: isTextile
      ? 'Factory Building Plan Approval & Dust Extraction (DISH Rule 3-A)'
      : isFood
      ? 'Factory Building Plan Approval & Hygienic Spacing (DISH Rule 3-A)'
      : 'Factory Building Plan Approval (DISH Rule 3-A)',
    department_id: 'dept_dish',
    department_name: 'Directorate of Industrial Safety & Health (DISH)',
    status: 'applicable',
    confidence: 'high',
    verification_tier: 'verified_statutory',
    regulatory_source: 'The Factories Act 1948, Section 6 & Maharashtra Factories Rules 1963, Rule 3-A (Form 1 Approval)',
    legal_basis: 'Section 6, The Factories Act 1948 & Rule 3-A, Maharashtra Factories Rules 1963',
    statutory_authority: 'Joint Director / Deputy Director (DISH)',
    sla_days: 20,
    sla_note: '20 Working Days under Maharashtra RTS Act',
    fee_calculation: 'Schedule fee based on installed Horsepower (HP) and Worker strength brackets under Maharashtra Factories Rules Schedule',
    reason: `Applicable: Unit utilizes power with workforce of ${project.employee_count} employees (statutory threshold is ≥10 workers with power).`,
    stage: 'pre_establishment',
    track: 'land_siting',
    prerequisites: ['app_building_plan', 'app_fire_noc'],
    required_documents_pre_establishment: [
      'DISH Approved Factory Building Architectural Blueprints (Rule 3-A)',
      'Machinery Layout & Occupational Spacing Plan (>1.2m aisle space, 14.2 m³ air space per worker)',
      ...(isTextile ? ['Cotton Dust & Byssinosis Ventilation Extraction Plan (Sec 15/16)'] : []),
      'Factory Safety Policy & On-Site Emergency Action Plan',
      'Ventilation & Natural Lighting Calculation Sheet',
    ],
    required_documents_post_construction: [
      'Factory License Form 2 Application',
      'Competent Person Stability Certificate for Cranes/Pressure Vessels',
    ],
    required_documents: [
      'Machinery Layout & Occupational Spacing Plan (Rule 3-A)',
      'Structural Stability Certificate from Competent Person',
      'Factory Safety Policy & On-Site Emergency Action Plan',
    ],
    can_parallel: false,
  });

  // ==========================================
  // Track 2: Environmental Protection Track
  // ==========================================

  // MPCB Consent to Establish (CTE)
  const cteSlaDays = pollutionCat === 'red' ? 45 : pollutionCat === 'orange' ? 30 : 15;

  approvals.push({
    approval_type_id: 'app_consent_est',
    approval_name: `Consent to Establish (CTE - ${pollutionCat.toUpperCase()} Category)`,
    department_id: 'dept_mpcb',
    department_name: 'Maharashtra Pollution Control Board (MPCB)',
    status: 'applicable',
    confidence: 'high',
    verification_tier: 'verified_statutory',
    regulatory_source: 'Water (Prevention & Control of Pollution) Act 1974, Section 25 & Air (Prevention & Control of Pollution) Act 1981, Section 21',
    legal_basis: 'Section 25, Water Act 1974 & Section 21, Air Act 1981',
    statutory_authority: 'Regional Officer / Member Secretary (MPCB)',
    sla_days: cteSlaDays,
    sla_note: `${cteSlaDays} Days indicative timeline (MPCB statutory committee schedule for ${pollutionCat.toUpperCase()} category)`,
    fee_calculation: 'Indicative statutory fee slab under MPCB Gazetted Schedule based on Gross Capital Investment (Land, Building, Machinery)',
    reason: isTextile && textileSub === 'wet_processing_dyeing'
      ? `Textile wet processing/dyeing requires RED category CTE with mandatory Zero Liquid Discharge (ZLD), Reverse Osmosis (RO), and Multi-Effect Evaporators (MEE).`
      : isFood
      ? `Food processing unit (${foodSub.replace('_', ' ')}) produces high organic BOD/COD trade effluent requiring dedicated biological ETP/STP design.`
      : `Proposed facility (${pollutionCat.toUpperCase()} category, ₹${project.investment_crore} Cr capital investment) discharges trade effluent/emissions requiring prior pollution consent.`,
    stage: 'pre_establishment',
    track: 'environmental',
    prerequisites: [],
    required_documents_pre_establishment: [
      'Detailed Project Report (DPR) with Gross Capital Investment Breakup',
      'Manufacturing Process Flowchart & Material Mass Balance',
      'Effluent Treatment Plant (ETP/STP) Engineering Proposal',
      'Air Pollution Control (APC) Stack & Scrubber Specifications',
      ...(isTextile && textileSub === 'wet_processing_dyeing' ? ['Zero Liquid Discharge (ZLD) RO & MEE Evaporator Proposal', 'Azo Dyes Compliance Undertaking'] : []),
      ...(isFood ? ['Organic BOD/COD Waste Treatment & Bio-Methanation Proposal'] : []),
    ],
    required_documents_post_construction: [
      'ETP/STP Commissioning & Performance Verification Report',
      'Stack Emission & Ambient Noise Baseline Audit Report',
    ],
    required_documents: [
      'Detailed Project Report (DPR) with Gross Capital Investment Breakup',
      'Manufacturing Process Flowchart & Material Mass Balance',
      'Effluent Treatment Plant (ETP/STP) Engineering Proposal',
      'Air Pollution Control (APC) Stack & Scrubber Specifications',
    ],
    can_parallel: true,
  });

  // MPCB Consent to Operate (CTO)
  approvals.push({
    approval_type_id: 'app_consent_op',
    approval_name: `Consent to Operate (CTO - ${pollutionCat.toUpperCase()} Category)`,
    department_id: 'dept_mpcb',
    department_name: 'Maharashtra Pollution Control Board (MPCB)',
    status: 'applicable',
    confidence: 'high',
    verification_tier: 'verified_statutory',
    regulatory_source: 'Water Act 1974, Section 26 & Air Act 1981, Section 21 (Form-I CTO Procedure)',
    legal_basis: 'Section 26, Water Act 1974 & Section 21, Air Act 1981',
    statutory_authority: 'Regional Officer / Member Secretary (MPCB)',
    sla_days: 25,
    sla_note: '25 Days statutory post-inspection trial sanction',
    fee_calculation: 'Annual recurring consent fee based on gross capital asset valuation',
    reason: 'Mandatory operational license issued after physical verification of ETP, air scrubbers, and CTE condition compliance.',
    stage: 'pre_commissioning',
    track: 'environmental',
    prerequisites: ['app_consent_est'],
    required_documents_pre_establishment: [],
    required_documents_post_construction: [
      'CTE Compliance Verification Report with photographs',
      'ETP/STP Treated Effluent Lab Analysis Report from MOEF approved lab',
      'Hazardous Waste Storage Area Dyke Verification Certificate',
    ],
    required_documents: [
      'CTE Compliance Verification Report',
      'ETP/STP Treated Effluent Lab Analysis Report',
      'Hazardous Waste Storage Area Dyke Verification Certificate',
    ],
    can_parallel: false,
  });

  // ==========================================
  // Track 3: Sectoral Licensing (Food vs Textile vs Pharma)
  // ==========================================

  if (isFood) {
    approvals.push({
      approval_type_id: 'app_fssai_license',
      approval_name: 'FSSAI Food Manufacturing License (Central / State)',
      department_id: 'dept_fssai',
      department_name: 'Food Safety and Standards Authority of India (FSSAI / FDA)',
      status: 'applicable',
      confidence: 'high',
      verification_tier: 'verified_statutory',
      regulatory_source: 'Food Safety and Standards Act 2006, Section 31 & Food Safety and Standards (Licensing and Registration of Food Businesses) Regulations, 2011',
      legal_basis: 'Section 31, Food Safety and Standards Act 2006',
      statutory_authority: 'Designated Officer / Commissioner of Food Safety',
      sla_days: 20,
      sla_note: '20 Working Days under Maharashtra RTS Act & FSSAI Timelines',
      fee_calculation: '₹7,500/year (State License) or ₹7,500 + capacity slab (Central License for >2 MT/day or Dairy >10,000 LPD)',
      reason: `Mandatory statutory food license for ${foodSub.replace('_', ' ').toUpperCase()} manufacturing facility.`,
      stage: 'pre_commissioning',
      track: 'sector_licensing',
      prerequisites: ['app_consent_est', 'app_building_plan'],
      required_documents_pre_establishment: [
        'Food Safety Management System (FSMS) Plan & Flowchart',
        'Potable Water Test Report as per IS 10500 from NABL Accredited Lab',
        'Food Recall Plan & HACCP / ISO 22000 Quality Manual',
        'Approved Technical Personnel / Food Safety Supervisor Bio-data & Qualifications',
      ],
      required_documents_post_construction: [
        'Production Facility Layout with Food Grade Equipment List',
        'Finished Product Lab Test Report from NABL Accredited Lab',
      ],
      required_documents: [
        'Food Safety Management System (FSMS) Plan & Flowchart',
        'Potable Water Test Report (IS 10500 from NABL Lab)',
        'Food Recall Plan & HACCP / ISO 22000 Quality Manual',
        'Approved Food Safety Supervisor Bio-data & Qualifications',
      ],
      can_parallel: false,
    });
  } else if (isTextile) {
    approvals.push({
      approval_type_id: 'app_textile_subsidy_reg',
      approval_name: 'Maharashtra Integrated Textile Policy (2023-28) Registration & Capital Subsidy',
      department_id: 'dept_dic',
      department_name: 'Directorate of Textiles / DIC Maharashtra',
      status: 'applicable',
      confidence: 'high',
      verification_tier: 'verified_statutory',
      regulatory_source: 'Maharashtra Integrated Textile Policy 2023-2028 (GR No. TEX-2023/CR-42/TEX-1) & ATUFS Guidelines',
      legal_basis: 'Government Resolution No. TEX-2023/CR-42/TEX-1, Dept of Textiles',
      statutory_authority: 'Textile Commissioner / General Manager DIC',
      sla_days: 20,
      sla_note: '20 Working Days under Maharashtra RTS Act',
      fee_calculation: 'Zero government application fee (Fiscal incentive registration)',
      reason: `Enrolment for up to 45% Capital Investment Subsidy and ₹3.00/unit power tariff rebate for ${textileSub.replace('_', ' ').toUpperCase()} manufacturing unit.`,
      stage: 'pre_establishment',
      track: 'sector_licensing',
      prerequisites: ['app_midc_allot'],
      required_documents_pre_establishment: [
        'Detailed Project Report (DPR) with Textile Machinery Invoice Quotations',
        'Textile Machinery Layout & Spindle/Loom Capacity Declaration',
        'Yarn/Fabric Material Mass Balance & Process Flowchart',
        'Bank Term Loan Appraisal & Sanction Letter',
      ],
      required_documents_post_construction: [
        'Commercial Production Commencement Certificate',
        'Chartered Accountant Verified Fixed Capital Investment Certificate',
      ],
      required_documents: [
        'Detailed Project Report (DPR) with Textile Machinery Quotations',
        'Textile Machinery Layout & Spindle/Loom Capacity Declaration',
        'Yarn/Fabric Material Mass Balance Flowchart',
      ],
      can_parallel: true,
    });
  } else if (isPharma) {
    const isSterile = pharmaSub === 'injectables_sterile';
    const isApi = pharmaSub === 'api_bulk_drugs';
    const formName = isSterile ? 'Form 28 / 28-D (Sterile/Biologicals)' : isApi ? 'Form 25 (Bulk Drugs / APIs)' : 'Form 25 / Form 28 (Formulations)';

    approvals.push({
      approval_type_id: 'app_fda_license',
      approval_name: `FDA Drug Manufacturing License (${formName})`,
      department_id: 'dept_fssai',
      department_name: 'Food & Drugs Administration (FDA Maharashtra)',
      status: 'applicable',
      confidence: 'high',
      verification_tier: 'verified_statutory',
      regulatory_source: 'Drugs and Cosmetics Act 1940, Section 18(c) & Drugs and Cosmetics Rules 1945, Part VII (Schedule M Revised)',
      legal_basis: 'Section 18(c), Drugs and Cosmetics Act 1940 & Part VII, Drugs and Cosmetics Rules 1945',
      statutory_authority: 'Joint Commissioner / Licensing Authority (FDA Maharashtra)',
      sla_days: 30,
      sla_note: '30 Days post joint FDA-CDSCO technical scrutiny & cleanroom audit',
      fee_calculation: '₹15,000 base statutory license fee + ₹300 inspection fee per product item',
      reason: `Mandatory statutory manufacturing license for pharmaceutical ${pharmaSub.replace('_', ' ').toUpperCase()} facility.`,
      stage: 'pre_commissioning',
      track: 'sector_licensing',
      prerequisites: ['app_consent_est', 'app_building_plan'],
      required_documents_pre_establishment: [
        'Site Master File (SMF) prepared as per WHO-GMP / Revised Schedule M',
        'Cleanroom HVAC AHU Layout & ISO 14644-1 Air Classification (Grade A/B/C/D)',
        'Approved Technical Staff (B.Pharm/M.Pharm) Appointment Letters & Experience Bio-data',
        'Process Validation Protocol & Water System Schematic (Purified Water / WFI)',
      ],
      required_documents_post_construction: [
        'HVAC Validation & HEPA Filter Integrity (DOP/PAO) Test Certificates',
        'Microbiological & Analytical Equipment Calibration Certificates',
        'Three Consecutive Exhibit Validation Batches Documentation',
      ],
      required_documents: [
        'Site Master File (SMF - WHO-GMP Schedule M)',
        'Cleanroom HVAC AHU Layout & ISO 14644-1 Air Classification',
        'Approved Technical Staff Appointment Letters & Experience Bio-data',
        'Process Validation Protocol & Water System Schematic',
      ],
      can_parallel: false,
    });
  }

  // ==========================================
  // Track 4: Utilities (Power Sanction)
  // ==========================================

  const loadKw = project.connected_load_kw || 200;
  const isHtLoad = loadKw >= 65;

  approvals.push({
    approval_type_id: 'app_power_sanction',
    approval_name: isHtLoad
      ? `High-Tension (HT 11/22 kV) Power Sanction (${loadKw} kW / ${Math.round(loadKw * 1.25)} kVA)`
      : `Low-Tension (LT) Industrial Power Sanction (${loadKw} kW)`,
    department_id: 'dept_mseb',
    department_name: 'MSEDCL / Electricity Distribution',
    status: 'conditional',
    confidence: 'conditional',
    verification_tier: 'conditional_rule',
    regulatory_source: 'Electricity Act 2003, Section 43 & MERC (Electricity Supply Code and Standards of Performance) Regulations, Regulation 4.1',
    legal_basis: 'Section 43, Electricity Act 2003 & MERC Supply Code Regulations',
    statutory_authority: 'Superintending Engineer (HT) / Executive Engineer (MSEDCL)',
    sla_days: isHtLoad ? 15 : 7,
    sla_note: `${isHtLoad ? 15 : 7} Days procedural timeline for supply feasibility and technical sanction under MERC guidelines`,
    fee_calculation: 'Service line charges, dedicated distribution transformer cost, and statutory security deposit as assessed by MSEDCL field office',
    reason: isHtLoad
      ? `Connected load of ${loadKw} kW exceeds the standard 65 kW threshold under MERC Supply Code, requiring dedicated High-Tension (HT 11kV/22kV) transformer yard sanction.`
      : `Connected load of ${loadKw} kW qualifies under standard Low-Tension (LT) industrial tariff.`,
    applicable_if: 'Facility requires continuous grid electrical connectivity from state distribution utility',
    not_applicable_if: 'Facility operates exclusively on captive off-grid power / DG sets',
    user_action_required: `Verify proposed contract demand: Currently configured at ${loadKw} kW (${Math.round(loadKw * 1.25)} kVA).`,
    stage: 'pre_establishment',
    track: 'utilities',
    prerequisites: ['app_midc_allot'],
    required_documents_pre_establishment: [
      'Connected Electrical Load Estimation Report (kW/kVA breakdown)',
      'Single Line Diagram (SLD) certified by Chartered Electrical Engineer',
      'Substation / Transformer Yard Civil Layout & Earthing Pit Plan',
      'Land Title / MIDC Possession Letter / Sanctioned Building Plan',
    ],
    required_documents_post_construction: [
      'Electrical Inspectorate Safety Sanction Certificate (Regulation 43/30)',
      'Transformer & HT Switchgear Test Reports from NABL accredited lab',
    ],
    required_documents: [
      'Connected Electrical Load Estimation Report',
      'Single Line Diagram (SLD) certified by Chartered Electrical Engineer',
      'Substation / Transformer Yard Civil Layout',
    ],
    can_parallel: true,
  });

  // Assemble Tracks for UI
  const tracks = [
    {
      id: 'land_siting',
      name: 'Track 1: Land, Civil & Structural Clearances',
      description: 'Sequential architectural and fire safety sanctions required prior to factory building construction.',
      approvals: approvals.filter(a => a.track === 'land_siting'),
    },
    {
      id: 'environmental',
      name: 'Track 2: Pollution Control & Environmental Consent',
      description: 'Independent pollution control track from establishment to operational verification.',
      approvals: approvals.filter(a => a.track === 'environmental'),
    },
    {
      id: 'sector_licensing',
      name: isFood
        ? 'Track 3: FSSAI Food Processing Licensing'
        : isTextile
        ? 'Track 3: Textile Policy & Subsidy Registration'
        : isPharma
        ? 'Track 3: FDA Pharmaceutical Licensing'
        : 'Track 3: Industrial Safety Licensing',
      description: isFood
        ? 'Statutory food manufacturing license under Food Safety & Standards Act 2006.'
        : isTextile
        ? 'Fiscal incentive registration under Maharashtra Integrated Textile Policy 2023-28.'
        : isPharma
        ? 'Statutory drug manufacturing license under Drugs & Cosmetics Act.'
        : 'Factory operating permits.',
      approvals: approvals.filter(a => a.track === 'sector_licensing'),
    },
    {
      id: 'utilities',
      name: 'Track 4: Electrical Power & Utility Infrastructure',
      description: 'MSEDCL high-tension or low-tension power connection sanction.',
      approvals: approvals.filter(a => a.track === 'utilities'),
    },
  ].filter(t => t.approvals.length > 0);

  // DAG Edges for visual graph
  const dag_edges = [
    { from: 'app_midc_allot', to: 'app_building_plan', label: 'Land Possession' },
    { from: 'app_building_plan', to: 'app_fire_noc', label: 'Building Blueprints' },
    { from: 'app_fire_noc', to: 'app_factory_license', label: 'Provisional Fire Clearance' },
    { from: 'app_consent_est', to: 'app_consent_op', label: 'Plant & ETP Construction' },
    ...(isFood ? [
      { from: 'app_building_plan', to: 'app_fssai_license', label: 'Plant Blueprints' },
      { from: 'app_consent_est', to: 'app_fssai_license', label: 'MPCB CTE Clearance' },
    ] : []),
    ...(isTextile ? [
      { from: 'app_midc_allot', to: 'app_textile_subsidy_reg', label: 'Land Possession' },
    ] : []),
    ...(isPharma ? [
      { from: 'app_building_plan', to: 'app_fda_license', label: 'Cleanroom Blueprints' },
      { from: 'app_consent_est', to: 'app_fda_license', label: 'MPCB CTE Clearance' },
    ] : []),
  ];

  // Calculate Risk-Based Scrutiny Assessment
  const calculateRiskAssessment = (): RiskAssessment => {
    let score = 0;
    const factors: RiskFactor[] = [];

    // 1. Pollution Category Factor (Max 40 pts)
    const pol = (project.pollution_category || 'orange').toLowerCase();
    let polPts = 10;
    let polReason = 'Green pollution category (Low discharge)';
    if (pol === 'red') {
      polPts = 40;
      polReason = 'Red Category: High industrial pollution & hazardous effluent potential';
    } else if (pol === 'orange') {
      polPts = 25;
      polReason = 'Orange Category: Moderate industrial discharge requiring treatment & scrubbers';
    } else if (pol === 'white') {
      polPts = 0;
      polReason = 'White Category: Non-polluting / zero industrial discharge';
    }
    score += polPts;
    factors.push({
      name: 'Environmental & Pollution Index',
      weight: '40%',
      points: polPts,
      max_points: 40,
      reason: polReason,
    });

    // 2. Hazardous Materials & Industrial Boilers (Max 25 pts)
    let hazardPts = 0;
    const hazardDetails: string[] = [];
    if (project.hazardous_materials || isPharma) {
      hazardPts += 15;
      hazardDetails.push('Solvents / Chemical Reagents Storage');
    }
    if (project.requires_boiler) {
      hazardPts += 10;
      hazardDetails.push('High-Pressure Steam Boiler Installation');
    }
    score += hazardPts;
    factors.push({
      name: 'Hazardous Chemical & Pressure Hazards',
      weight: '25%',
      points: hazardPts,
      max_points: 25,
      reason: hazardDetails.length > 0 ? hazardDetails.join(', ') : 'Standard non-hazardous machinery footprint',
    });

    // 3. Scale, Workforce & Electrical Load (Max 20 pts)
    let scalePts = 5;
    if (msme.category === 'Micro') scalePts = 2;
    else if (msme.category === 'Small') scalePts = 7;
    else if (msme.category === 'Medium') scalePts = 12;
    else scalePts = 18;

    if ((project.connected_load_kw || 0) > 500) scalePts = Math.min(20, scalePts + 4);
    score += scalePts;
    factors.push({
      name: 'Capital Scale & Energy Footprint',
      weight: '20%',
      points: scalePts,
      max_points: 20,
      reason: `${msme.category} Enterprise (${project.employee_count} workers, ${project.connected_load_kw || 200} kW Load)`,
    });

    // 4. Project Stage & Compliance Track (Max 15 pts)
    let stagePts = 15;
    let stageReason = 'Greenfield: New industrial establishment requiring full statutory baseline validation';
    if (project.stage === 'expansion') {
      stagePts = 10;
      stageReason = 'Expansion of existing operational premises';
    } else if (project.stage === 'operational') {
      stagePts = 2;
      stageReason = 'Routine statutory renewal / regularized operational unit with past compliance';
    }
    score += stagePts;
    factors.push({
      name: 'Establishment Stage & Compliance History',
      weight: '15%',
      points: stagePts,
      max_points: 15,
      reason: stageReason,
    });

    // Risk Tier Assignment
    let level: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    let tier: 'green_channel' | 'standard' | 'enhanced_joint_inspection' = 'standard';
    let tier_label = 'Tier 2: Standard Scrutiny Track';
    let scrutiny_depth = 'Standard multi-department desk verification with automated AI document scrutiny.';
    let inspection_policy = 'Joint inspection coordinated between MPCB and DISH within 15 days.';
    let deemed_approval_eligible = false;
    let recommendation = 'Standard scrutiny pipeline with parallel department processing.';

    if (score < 30) {
      level = 'low';
      tier = 'green_channel';
      tier_label = 'Tier 1: Green Channel / Deemed Track';
      scrutiny_depth = 'Accelerated scrutiny based on self-certification with AI vault verification. Zero bureaucratic delay.';
      inspection_policy = 'Pre-grant physical inspection waived. Post-commissioning random audit only (1 in 10 sample).';
      deemed_approval_eligible = true;
      recommendation = 'Eligible for instant deemed provisional clearance under Maharashtra RTS Act.';
    } else if (score >= 60) {
      level = score > 80 ? 'critical' : 'high';
      tier = 'enhanced_joint_inspection';
      tier_label = 'Tier 3: Enhanced Scrutiny & Joint Inspection Track';
      scrutiny_depth = 'Comprehensive multi-agency scrutiny by senior nodal scrutiny officers before sanction.';
      inspection_policy = 'Mandatory joint on-site inspection by MPCB, DISH Safety Inspector, and Chief Fire Officer prior to granting CTO / Licence.';
      deemed_approval_eligible = false;
      recommendation = 'Requires mandatory cross-department joint site inspection and effluent treatment plan verification.';
    }

    return {
      score,
      level,
      tier,
      tier_label,
      scrutiny_depth,
      inspection_policy,
      deemed_approval_eligible,
      factors,
      recommendation,
    };
  };

  const risk_assessment = calculateRiskAssessment();

  const highConfidenceCount = approvals.filter(a => a.confidence === 'high' && a.status === 'applicable').length;
  const conditionalCount = approvals.filter(a => a.status === 'conditional').length;
  const excludedCount = approvals.filter(a => a.status === 'not_applicable').length;

  return {
    summary: {
      total_identified: approvals.filter(a => a.status !== 'not_applicable').length,
      high_confidence_count: highConfidenceCount,
      conditional_count: conditionalCount,
      excluded_count: excludedCount,
      sector: project.sector,
      sub_category_label: isFood
        ? foodSub.replace(/_/g, ' ').toUpperCase()
        : isTextile
        ? textileSub.replace(/_/g, ' ').toUpperCase()
        : isPharma
        ? pharmaSub.replace(/_/g, ' ').toUpperCase()
        : undefined,
      estimated_statutory_turnaround_days: Math.max(...approvals.map(a => a.sla_days)),
      risk_tier: risk_assessment.tier,
      risk_score: risk_assessment.score,
    },
    msme_classification: msme,
    risk_assessment,
    warnings,
    tracks,
    approvals,
    dag_edges,
  };
}
