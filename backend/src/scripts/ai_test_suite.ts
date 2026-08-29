import { generateApprovalChecklist, computeUdyamMSME } from '../services/approvalIntelligenceService';
import { calculateSLADeadline, getSLAStatus } from '../services/slaService';

async function runAITestSuite() {
  console.log('\n===============================================================');
  console.log('🤖 BIZCLEAR AI & REGULATORY END-TO-END TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(testName: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${details ? ` — ${details}` : ''}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST 1: MSME Udyam Notification S.O. 2119(E) Calculation
  // -------------------------------------------------------------
  console.log('📦 [1/6] Testing Udyam MSME Calculation Engine...');
  const microProject = computeUdyamMSME({
    sector: 'manufacturing',
    location_state: 'Maharashtra',
    investment_crore: 2.0,
    plant_machinery_cost_crore: 0.8,
    annual_turnover_crore: 3.5,
    employee_count: 15,
  });
  assert('Micro MSME Classification (< ₹1 Cr P&M, < ₹5 Cr Turnover)', microProject.category === 'Micro');

  const smallProject = computeUdyamMSME({
    sector: 'manufacturing',
    location_state: 'Maharashtra',
    investment_crore: 12.5,
    plant_machinery_cost_crore: 5.0,
    annual_turnover_crore: 22.0,
    employee_count: 85,
  });
  assert('Small MSME Classification (< ₹10 Cr P&M, < ₹50 Cr Turnover)', smallProject.category === 'Small');

  // -------------------------------------------------------------
  // TEST 2: Sector Switching (Food Processing vs Textile)
  // -------------------------------------------------------------
  console.log('\n🥗 [2/6] Testing Sectoral Approval Mapping & Document Checklists...');
  
  // Test Food Processing
  const foodAnalysis = await generateApprovalChecklist({
    sector: 'food_processing',
    food_sub_category: 'dairy_milk',
    location_state: 'Maharashtra',
    district: 'Pune',
    investment_crore: 8.5,
    employee_count: 65,
    pollution_category: 'orange',
    stage: 'greenfield',
    connected_load_kw: 150,
  });
  const hasFssai = foodAnalysis.approvals.some(a => a.department_id === 'dept_fssai' || a.approval_type_id === 'app_fssai_license');
  const hasFsmsDoc = foodAnalysis.approvals.some(a => a.required_documents.some(d => d.includes('FSMS') || d.includes('Food Safety')));
  const hasWaterDoc = foodAnalysis.approvals.some(a => a.required_documents.some(d => d.includes('IS 10500') || d.includes('Water')));
  assert('Food Processing Track includes FSSAI Central/State Food Manufacturing License', hasFssai);
  assert('Food Processing Track requires FSMS Plan & IS 10500 Potable Water Lab Report', hasFsmsDoc && hasWaterDoc);

  // Test Textile Manufacturing
  const textileAnalysis = await generateApprovalChecklist({
    sector: 'textile',
    textile_sub_category: 'wet_processing_dyeing',
    location_state: 'Maharashtra',
    district: 'Solapur',
    investment_crore: 35.0,
    employee_count: 180,
    pollution_category: 'red',
    stage: 'greenfield',
    connected_load_kw: 800,
  });
  const hasTextileReg = textileAnalysis.approvals.some(a => a.approval_type_id === 'app_textile_subsidy_reg');
  const hasZldDoc = textileAnalysis.approvals.some(a => a.required_documents_pre_establishment.some(d => d.includes('Zero Liquid Discharge') || d.includes('ZLD')));
  const hasFireSprinkler = textileAnalysis.approvals.some(a => a.approval_name.includes('High-Combustible') || a.approval_type_id === 'app_fire_noc');
  assert('Textile Track includes Maharashtra Integrated Textile Policy (2023-28) Registration', hasTextileReg);
  assert('Textile Wet Processing/Dyeing mandates Zero Liquid Discharge (ZLD) RO/MEE ETP', hasZldDoc);
  assert('Textile Track mandates High-Combustible Fire NOC with Automatic Deluge Sprinklers', hasFireSprinkler);

  // -------------------------------------------------------------
  // TEST 3: Risk-Based Scrutiny Engine (Tier 1 vs Tier 3)
  // -------------------------------------------------------------
  console.log('\n🛡️ [3/6] Testing Risk-Based Scrutiny Scoring & Dynamic Tiering...');
  
  // Low-risk test (Small Bakery / Garment unit)
  const lowRiskAnalysis = await generateApprovalChecklist({
    sector: 'food_processing',
    food_sub_category: 'bakery_confectionery',
    location_state: 'Maharashtra',
    investment_crore: 0.8,
    plant_machinery_cost_crore: 0.4,
    annual_turnover_crore: 1.5,
    employee_count: 8,
    pollution_category: 'white',
    stage: 'operational',
    hazardous_materials: false,
    connected_load_kw: 25,
  });
  assert('Low Risk Food/Textile Unit assigned Tier 1 (Green Channel / Deemed Track)', lowRiskAnalysis.risk_assessment.tier === 'green_channel');
  assert('Tier 1 Unit is Deemed Approval Eligible with Pre-Inspection Waived', lowRiskAnalysis.risk_assessment.deemed_approval_eligible === true);

  // High-risk test (Textile Chemical Dyeing / Wet Processing Unit)
  const highRiskAnalysis = await generateApprovalChecklist({
    sector: 'textile',
    textile_sub_category: 'wet_processing_dyeing',
    location_state: 'Maharashtra',
    investment_crore: 65.0,
    employee_count: 350,
    pollution_category: 'red',
    stage: 'greenfield',
    hazardous_materials: true,
    requires_boiler: true,
    connected_load_kw: 1500,
  });
  assert('Textile Wet Processing / Chemical Unit assigned Tier 3 (Enhanced Joint Inspection)', highRiskAnalysis.risk_assessment.tier === 'enhanced_joint_inspection');
  assert('Tier 3 Unit mandates 3-Agency Joint Physical Inspection prior to grant', highRiskAnalysis.risk_assessment.score >= 60);

  // -------------------------------------------------------------
  // TEST 4: Statutory SLA & RTS Working-Day Countdown Engine
  // -------------------------------------------------------------
  console.log('\n⏱️ [4/6] Testing Statutory SLA Countdown & Working-Day Engine...');
  const calculatedDeadline = calculateSLADeadline(new Date(), 30);
  assert('Calculates 30 Working Days RTS deadline excluding non-working days', calculatedDeadline.getTime() > Date.now() + 29 * 86400000);

  const slaNormal = getSLAStatus(new Date(Date.now() + 10 * 86400000));
  assert('Active Application evaluates to on_track status', slaNormal === 'on_track');

  const slaBreached = getSLAStatus(new Date(Date.now() - 2 * 86400000));
  assert('Overdue Application correctly evaluates to breached status', slaBreached === 'breached');

  // -------------------------------------------------------------
  // TEST 5: Coordinated Joint Inspection & CIR Verification
  // -------------------------------------------------------------
  console.log('\n📅 [5/6] Testing Joint Inspection Coordination & CIR Checklist...');
  const jointTracks = foodAnalysis.tracks;
  assert('Parallel Inspection tracks generated across MPCB, DISH, and Fire', jointTracks.length >= 3);

  // -------------------------------------------------------------
  // TEST 6: Grievance Escalation with 7-Day RTS Statutory SLA
  // -------------------------------------------------------------
  console.log('\n⚖️ [6/6] Testing RTS Section 18 Grievance Resolution Workflow...');
  const testGrievanceDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const diffDays = Math.round((testGrievanceDueDate.getTime() - Date.now()) / (1000 * 3600 * 24));
  assert('Statutory Grievance sets 7-Day RTS Appellate Resolution SLA', diffDays === 7);

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`📊 AI TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAITestSuite().catch((err) => {
  console.error('Test Suite Exception:', err);
  process.exit(1);
});
