-- ============================================================================
-- Udyami Setu — seed data (catalog / rules-as-data)
-- Run this AFTER schema.sql. Mirrors lib/rules/data.ts exactly.
-- Safe to re-run: uses ON CONFLICT DO NOTHING.
-- ============================================================================

insert into departments (id, name, sla_default_days) values
  ('spcb',      'State Pollution Control Board',          30),
  ('factories', 'Directorate of Factories & Labour',      30),
  ('fire',      'Fire & Emergency Services',              21),
  ('municipal', 'Municipal / Town Planning',              30),
  ('power',     'Electricity Distribution (DISCOM)',      15),
  ('water',     'Water Board',                            15),
  ('fssai',     'Food Safety (FSSAI)',                    30),
  ('msme',      'Industries / MSME',                       2),
  ('peso',      'Petroleum & Explosives Safety (PESO)',   45)
on conflict (id) do nothing;

insert into approval_types
  (id, name, authority, department_id, legal_basis, sla_days, required_documents, requires_inspection, fee_note) values
  ('udyam', 'Udyam (MSME) Registration', 'Ministry of MSME', 'msme', 'MSMED Act 2006', 2,
    '{pan,aadhaar}', false, 'No fee'),
  ('pollution_cte', 'Consent to Establish (CTE)', 'State Pollution Control Board', 'spcb', 'Water Act 1974 & Air Act 1981', 30,
    '{site_plan,project_report,land_document}', true, 'Based on project cost'),
  ('factory_license', 'Factory Licence', 'Directorate of Factories', 'factories', 'Factories Act 1948', 30,
    '{building_plan,machinery_list,workforce_details}', true, 'Based on workers & HP'),
  ('fire_noc', 'Fire NOC', 'Fire & Emergency Services', 'fire', 'National Building Code 2016', 21,
    '{building_plan,fire_safety_plan}', true, 'Based on built-up area'),
  ('building_plan', 'Building Plan Approval', 'Municipal / Town Planning', 'municipal', 'State Municipal / Town & Country Planning Act', 30,
    '{site_plan,ownership_document,architect_drawing}', false, 'Based on built-up area'),
  ('power_connection', 'Power Connection (HT/LT)', 'Electricity Distribution Company', 'power', 'Electricity Act 2003', 15,
    '{load_details,premises_proof}', false, 'Security deposit by load'),
  ('water_connection', 'Water Connection', 'Water Board', 'water', 'State Water Supply regulations', 15,
    '{premises_proof}', false, 'Connection charges by size'),
  ('fssai_license', 'FSSAI Licence', 'Food Safety & Standards Authority of India', 'fssai', 'FSS Act 2006', 30,
    '{food_safety_plan,product_list,kyc}', true, 'By licence tier'),
  ('consent_to_operate', 'Consent to Operate (CTO)', 'State Pollution Control Board', 'spcb', 'Water Act 1974 & Air Act 1981', 30,
    '{cte_copy,machinery_installed_proof}', true, 'Based on project cost'),
  ('hazardous_waste_auth', 'Hazardous Waste Authorisation', 'State Pollution Control Board', 'spcb', 'Hazardous & Other Wastes Rules 2016', 45,
    '{waste_inventory,storage_plan}', true, 'By waste quantity'),
  ('explosives_license', 'Petroleum / Explosives Licence', 'Petroleum & Explosives Safety Organisation (PESO)', 'peso', 'Petroleum Act 1934 / Explosives Act 1884', 45,
    '{storage_plan,safety_report}', true, 'By storage capacity')
on conflict (id) do nothing;

insert into applicability_rules (approval_id, applies_if, scrutiny_level) values
  ('udyam', '{}',
    '{"red":"self_certify","orange":"self_certify","green":"self_certify","white":"self_certify"}'),
  ('pollution_cte', '{"pollution_category":["red","orange","green","white"],"stage":["new_setup"]}',
    '{"red":"full_inspection","orange":"inspection","green":"self_certify","white":"not_required"}'),
  ('consent_to_operate', '{"pollution_category":["red","orange","green","white"],"stage":["operating","expansion"]}',
    '{"red":"full_inspection","orange":"inspection","green":"self_certify","white":"not_required"}'),
  ('factory_license', '{"sector":["food_processing","chemical","textile","engineering"],"project_size":["small","medium","large"],"stage":["new_setup","expansion"]}',
    '{"red":"inspection","orange":"inspection","green":"self_certify","white":"self_certify"}'),
  ('fire_noc', '{"sector":["food_processing","chemical","textile","engineering"],"stage":["new_setup"]}',
    '{"red":"inspection","orange":"inspection","green":"inspection","white":"self_certify"}'),
  ('building_plan', '{"stage":["new_setup"]}',
    '{"red":"self_certify","orange":"self_certify","green":"self_certify","white":"self_certify"}'),
  ('power_connection', '{"stage":["new_setup"]}',
    '{"red":"self_certify","orange":"self_certify","green":"self_certify","white":"self_certify"}'),
  ('water_connection', '{"stage":["new_setup"]}',
    '{"red":"self_certify","orange":"self_certify","green":"self_certify","white":"self_certify"}'),
  ('fssai_license', '{"sector":["food_processing"]}',
    '{"red":"inspection","orange":"inspection","green":"self_certify","white":"self_certify"}'),
  ('hazardous_waste_auth', '{"sector":["chemical"],"pollution_category":["red","orange"]}',
    '{"red":"full_inspection","orange":"inspection"}'),
  ('explosives_license', '{"sector":["chemical"],"stage":["new_setup","expansion"]}',
    '{"red":"full_inspection","orange":"full_inspection","green":"inspection","white":"inspection"}')
on conflict (approval_id) do nothing;

insert into schemes (id, name, authority, benefit, eligibility) values
  ('food_capital_subsidy', 'Capital Investment Subsidy — State Food Processing Policy', 'State Industries Department',
    '25% of plant & machinery cost (up to ₹5 crore)',
    '{"sector":["food_processing"],"stage":["new_setup","expansion"]}'),
  ('pmegp', 'PMEGP Margin Money Subsidy', 'KVIC / Ministry of MSME',
    '15–35% margin money subsidy on project cost',
    '{"project_size":["micro","small"],"stage":["new_setup"]}'),
  ('clcss', 'Credit Linked Capital Subsidy (CLCSS)', 'Ministry of MSME',
    '15% capital subsidy on technology upgradation',
    '{"project_size":["micro","small","medium"]}'),
  ('power_tariff_subsidy', 'Industrial Power Tariff Subsidy', 'State Industries Department',
    '₹1/unit power tariff rebate for 5 years',
    '{"sector":["chemical","engineering","textile"],"stage":["new_setup"]}')
on conflict (id) do nothing;
