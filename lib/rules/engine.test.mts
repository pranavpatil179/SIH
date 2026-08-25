// Plain-Node test for the rules engine. Run with: npm run test:engine
// (Node v22+ strips the TypeScript types natively.)
import { computeChecklist, matchSchemes, inspectionApprovals } from "./engine.ts";
import { approvalTypes, applicabilityRules, schemes } from "./data.ts";

let failures = 0;
function check(name, cond) {
  if (cond) {
    console.log("  ✓ " + name);
  } else {
    failures++;
    console.error("  ✗ FAIL: " + name);
  }
}

const ids = (items) => items.map((i) => i.approval.id);

// --- Golden path: food processing, Orange category, new setup ---
const food = {
  sector: "food_processing",
  pollution_category: "orange",
  stage: "new_setup",
  project_size: "medium",
  location_state: "Telangana",
};
const foodList = computeChecklist(food, approvalTypes, applicabilityRules);
const foodIds = ids(foodList);

console.log("\nFood / Orange / new_setup ->", foodIds.join(", "));
check("food unit gets exactly 8 approvals", foodList.length === 8);
check(
  "food checklist includes FSSAI + CTE + Factory + Fire",
  ["fssai_license", "pollution_cte", "factory_license", "fire_noc"].every((x) =>
    foodIds.includes(x),
  ),
);
check("food checklist excludes chemical-only approvals", !foodIds.includes("hazardous_waste_auth") && !foodIds.includes("explosives_license"));
check("food excludes Consent to Operate (new setup, not operating)", !foodIds.includes("consent_to_operate"));

const cte = foodList.find((i) => i.approval.id === "pollution_cte");
check("Orange CTE => scrutiny 'inspection' + requires inspection", cte.scrutiny_level === "inspection" && cte.requires_inspection === true);

const udyam = foodList.find((i) => i.approval.id === "udyam");
check("Udyam => self-certify, no inspection", udyam.scrutiny_level === "self_certify" && udyam.requires_inspection === false);

check("food unit needs 4 inspections to bundle", inspectionApprovals(foodList).length === 4);

// --- Contrast: chemical, Red category, new setup ---
const chem = {
  sector: "chemical",
  pollution_category: "red",
  stage: "new_setup",
  project_size: "large",
  location_state: "Gujarat",
};
const chemList = computeChecklist(chem, approvalTypes, applicabilityRules);
const chemIds = ids(chemList);

console.log("Chemical / Red / new_setup ->", chemIds.join(", "));
check("chemical checklist includes hazardous waste + explosives", chemIds.includes("hazardous_waste_auth") && chemIds.includes("explosives_license"));
check("chemical checklist excludes FSSAI", !chemIds.includes("fssai_license"));
const chemCte = chemList.find((i) => i.approval.id === "pollution_cte");
check("Red CTE => scrutiny 'full_inspection'", chemCte.scrutiny_level === "full_inspection");
check("chemical checklist differs from food", chemList.length !== foodList.length);

// --- White category: pollution consent drops off ---
const white = {
  sector: "it_services",
  pollution_category: "white",
  stage: "new_setup",
  project_size: "small",
  location_state: "Karnataka",
};
const whiteList = computeChecklist(white, approvalTypes, applicabilityRules);
const whiteIds = ids(whiteList);
console.log("IT services / White / new_setup ->", whiteIds.join(", "));
check("White unit => no Consent to Establish (not required)", !whiteIds.includes("pollution_cte"));
check("IT services => no Factory Licence", !whiteIds.includes("factory_license"));

// --- Scheme matching ---
const foodSchemes = matchSchemes(food, schemes).map((s) => s.id);
console.log("Food schemes ->", foodSchemes.join(", "));
check("food unit qualifies for the food capital subsidy", foodSchemes.includes("food_capital_subsidy"));
check("medium food unit qualifies for CLCSS but not PMEGP", foodSchemes.includes("clcss") && !foodSchemes.includes("pmegp"));

if (failures) {
  console.error("\n" + failures + " check(s) failed ❌");
  process.exit(1);
} else {
  console.log("\nAll checks passed ✅");
}
