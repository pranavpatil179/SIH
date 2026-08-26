import type {
  ApprovalType,
  ApplicabilityRule,
  Scheme,
  Department,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Seed dataset for the "rules-as-data" knowledge engine.
//
// This is the single source of truth used by the engine at runtime (loaded
// from Supabase in production) and by lib/rules/engine.test.mts. The SQL in
// /supabase/seed.sql mirrors this exactly so the database and the app agree.
//
// Modelled sectors: food_processing (the golden-path demo) + chemical (the
// "switch profile, watch a different checklist" moment). Legal bases are real.
// ---------------------------------------------------------------------------

export const departments: Department[] = [
  { id: "spcb", name: "State Pollution Control Board", sla_default_days: 30 },
  { id: "factories", name: "Directorate of Factories & Labour", sla_default_days: 30 },
  { id: "fire", name: "Fire & Emergency Services", sla_default_days: 21 },
  { id: "municipal", name: "Municipal / Town Planning", sla_default_days: 30 },
  { id: "power", name: "Electricity Distribution (DISCOM)", sla_default_days: 15 },
  { id: "water", name: "Water Board", sla_default_days: 15 },
  { id: "fssai", name: "Food Safety (FSSAI)", sla_default_days: 30 },
  { id: "msme", name: "Industries / MSME", sla_default_days: 2 },
  { id: "peso", name: "Petroleum & Explosives Safety (PESO)", sla_default_days: 45 },
];

export const approvalTypes: ApprovalType[] = [
  {
    id: "udyam",
    name: "Udyam (MSME) Registration",
    authority: "Ministry of MSME",
    department_id: "msme",
    legal_basis: "MSMED Act 2006",
    sla_days: 2,
    required_documents: ["pan", "aadhaar"],
    requires_inspection: false,
    fee_note: "No fee",
  },
  {
    id: "pollution_cte",
    name: "Consent to Establish (CTE)",
    authority: "State Pollution Control Board",
    department_id: "spcb",
    legal_basis: "Water Act 1974 & Air Act 1981",
    sla_days: 30,
    required_documents: ["site_plan", "project_report", "land_document"],
    requires_inspection: true,
    fee_note: "Based on project cost",
  },
  {
    id: "factory_license",
    name: "Factory Licence",
    authority: "Directorate of Factories",
    department_id: "factories",
    legal_basis: "Factories Act 1948",
    sla_days: 30,
    required_documents: ["building_plan", "machinery_list", "workforce_details"],
    requires_inspection: true,
    fee_note: "Based on workers & HP",
  },
  {
    id: "fire_noc",
    name: "Fire NOC",
    authority: "Fire & Emergency Services",
    department_id: "fire",
    legal_basis: "National Building Code 2016",
    sla_days: 21,
    required_documents: ["building_plan", "fire_safety_plan"],
    requires_inspection: true,
    fee_note: "Based on built-up area",
  },
  {
    id: "building_plan",
    name: "Building Plan Approval",
    authority: "Municipal / Town Planning",
    department_id: "municipal",
    legal_basis: "State Municipal / Town & Country Planning Act",
    sla_days: 30,
    required_documents: ["site_plan", "ownership_document", "architect_drawing"],
    requires_inspection: false,
    fee_note: "Based on built-up area",
  },
  {
    id: "power_connection",
    name: "Power Connection (HT/LT)",
    authority: "Electricity Distribution Company",
    department_id: "power",
    legal_basis: "Electricity Act 2003",
    sla_days: 15,
    required_documents: ["load_details", "premises_proof"],
    requires_inspection: false,
    fee_note: "Security deposit by load",
  },
  {
    id: "water_connection",
    name: "Water Connection",
    authority: "Water Board",
    department_id: "water",
    legal_basis: "State Water Supply regulations",
    sla_days: 15,
    required_documents: ["premises_proof"],
    requires_inspection: false,
    fee_note: "Connection charges by size",
  },
  {
    id: "fssai_license",
    name: "FSSAI Licence",
    authority: "Food Safety & Standards Authority of India",
    department_id: "fssai",
    legal_basis: "FSS Act 2006",
    sla_days: 30,
    required_documents: ["food_safety_plan", "product_list", "kyc"],
    requires_inspection: true,
    fee_note: "By licence tier",
  },
  {
    id: "consent_to_operate",
    name: "Consent to Operate (CTO)",
    authority: "State Pollution Control Board",
    department_id: "spcb",
    legal_basis: "Water Act 1974 & Air Act 1981",
    sla_days: 30,
    required_documents: ["cte_copy", "machinery_installed_proof"],
    requires_inspection: true,
    fee_note: "Based on project cost",
  },
  {
    id: "hazardous_waste_auth",
    name: "Hazardous Waste Authorisation",
    authority: "State Pollution Control Board",
    department_id: "spcb",
    legal_basis: "Hazardous & Other Wastes Rules 2016",
    sla_days: 45,
    required_documents: ["waste_inventory", "storage_plan"],
    requires_inspection: true,
    fee_note: "By waste quantity",
  },
  {
    id: "explosives_license",
    name: "Petroleum / Explosives Licence",
    authority: "Petroleum & Explosives Safety Organisation (PESO)",
    department_id: "peso",
    legal_basis: "Petroleum Act 1934 / Explosives Act 1884",
    sla_days: 45,
    required_documents: ["storage_plan", "safety_report"],
    requires_inspection: true,
    fee_note: "By storage capacity",
  },
];

const MANUFACTURING = ["food_processing", "chemical", "textile", "engineering"] as const;

export const applicabilityRules: ApplicabilityRule[] = [
  {
    approval_id: "udyam",
    applies_if: {}, // every business, every stage
    scrutiny_level: {
      red: "self_certify",
      orange: "self_certify",
      green: "self_certify",
      white: "self_certify",
    },
  },
  {
    approval_id: "pollution_cte",
    applies_if: {
      pollution_category: ["red", "orange", "green", "white"],
      stage: ["new_setup"],
    },
    scrutiny_level: {
      red: "full_inspection",
      orange: "inspection",
      green: "self_certify",
      white: "not_required",
    },
  },
  {
    approval_id: "consent_to_operate",
    applies_if: {
      pollution_category: ["red", "orange", "green", "white"],
      stage: ["operating", "expansion"],
    },
    scrutiny_level: {
      red: "full_inspection",
      orange: "inspection",
      green: "self_certify",
      white: "not_required",
    },
  },
  {
    approval_id: "factory_license",
    applies_if: {
      sector: [...MANUFACTURING],
      project_size: ["small", "medium", "large"],
      stage: ["new_setup", "expansion"],
    },
    scrutiny_level: {
      red: "inspection",
      orange: "inspection",
      green: "self_certify",
      white: "self_certify",
    },
  },
  {
    approval_id: "fire_noc",
    applies_if: {
      sector: [...MANUFACTURING],
      stage: ["new_setup"],
    },
    scrutiny_level: {
      red: "inspection",
      orange: "inspection",
      green: "inspection",
      white: "self_certify",
    },
  },
  {
    approval_id: "building_plan",
    applies_if: { stage: ["new_setup"] },
    scrutiny_level: {
      red: "self_certify",
      orange: "self_certify",
      green: "self_certify",
      white: "self_certify",
    },
  },
  {
    approval_id: "power_connection",
    applies_if: { stage: ["new_setup"] },
    scrutiny_level: {
      red: "self_certify",
      orange: "self_certify",
      green: "self_certify",
      white: "self_certify",
    },
  },
  {
    approval_id: "water_connection",
    applies_if: { stage: ["new_setup"] },
    scrutiny_level: {
      red: "self_certify",
      orange: "self_certify",
      green: "self_certify",
      white: "self_certify",
    },
  },
  {
    approval_id: "fssai_license",
    applies_if: { sector: ["food_processing"] },
    scrutiny_level: {
      red: "inspection",
      orange: "inspection",
      green: "self_certify",
      white: "self_certify",
    },
  },
  {
    approval_id: "hazardous_waste_auth",
    applies_if: {
      pollution_category: ["red", "orange"],
    },
    condition: {
      field: "generates_hazardous_waste",
      expected_value: true,
      explanation: "Applies only if your manufacturing process generates regulated hazardous waste.",
      question: "Does your process generate any hazardous waste (e.g., chemical sludge, spent solvents)?"
    },
    scrutiny_level: {
      red: "full_inspection",
      orange: "inspection",
      green: "not_required",
      white: "not_required",
    },
  },
  {
    approval_id: "explosives_license",
    applies_if: {
      stage: ["new_setup", "expansion"],
    },
    condition: {
      field: "has_regulated_substances",
      expected_value: true,
      explanation: "Applies only if your proposed activity involves storage or handling of substances regulated under petroleum and explosives rules.",
      question: "Do you store or use regulated petroleum or explosive substances on site?"
    },
    scrutiny_level: {
      red: "full_inspection",
      orange: "full_inspection",
      green: "inspection",
      white: "not_required",
    },
  },
];

export const schemes: Scheme[] = [
  {
    id: "food_capital_subsidy",
    name: "Capital Investment Subsidy — State Food Processing Policy",
    authority: "State Industries Department",
    benefit: "25% of plant & machinery cost (up to ₹5 crore)",
    eligibility: {
      sector: ["food_processing"],
      stage: ["new_setup", "expansion"],
    },
  },
  {
    id: "pmegp",
    name: "PMEGP Margin Money Subsidy",
    authority: "KVIC / Ministry of MSME",
    benefit: "15–35% margin money subsidy on project cost",
    eligibility: {
      project_size: ["micro", "small"],
      stage: ["new_setup"],
    },
  },
  {
    id: "clcss",
    name: "Credit Linked Capital Subsidy (CLCSS)",
    authority: "Ministry of MSME",
    benefit: "15% capital subsidy on technology upgradation",
    eligibility: {
      project_size: ["micro", "small", "medium"],
    },
  },
  {
    id: "power_tariff_subsidy",
    name: "Industrial Power Tariff Subsidy",
    authority: "State Industries Department",
    benefit: "₹1/unit power tariff rebate for 5 years",
    eligibility: {
      sector: ["chemical", "engineering", "textile"],
      stage: ["new_setup"],
    },
  },
];
