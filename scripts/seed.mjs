// ---------------------------------------------------------------------------
// Seed demo logins + one fully worked-through demo application.
//
// Run AFTER applying supabase/schema.sql and supabase/seed.sql, with your
// service-role key available in .env.local:
//
//   npm run seed
//   (which is: node --env-file=.env.local scripts/seed.mjs)
//
// Idempotent: re-running skips users/data that already exist.
// ---------------------------------------------------------------------------
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE) {
  console.error(
    "\n✗ Missing env. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and " +
      "SUPABASE_SERVICE_ROLE_KEY, then run:\n    npm run seed\n",
  );
  process.exit(1);
}

const admin = createClient(URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "Passw0rd!";

const USERS = [
  { email: "applicant@demo.in", role: "applicant", full_name: "Aarti Rao" },
  { email: "officer.spcb@demo.in", role: "officer", full_name: "S. Kumar (SPCB)", department_id: "spcb" },
  { email: "officer.factories@demo.in", role: "officer", full_name: "R. Mehta (Factories)", department_id: "factories" },
  { email: "nodal@demo.in", role: "nodal", full_name: "Nodal Administrator" },
  { email: "sunrise@demo.in", role: "applicant", full_name: "Sunrise Foods Pvt Ltd" },
];

const days = (n) => new Date(Date.now() + n * 86_400_000).toISOString();

async function findUserByEmail(email) {
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email === email);
    if (found) return found;
    if (data.users.length < 200) return null;
  }
}

async function ensureUser({ email, role, full_name, department_id }) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role, full_name, ...(department_id ? { department_id } : {}) },
  });

  let user = data?.user ?? null;
  if (error) {
    if (/registered|already|exists/i.test(error.message)) {
      user = await findUserByEmail(email);
      console.log(`• exists   ${email}`);
    } else {
      throw error;
    }
  } else {
    console.log(`✓ created  ${email}  (${role}${department_id ? "/" + department_id : ""})`);
  }

  // Guarantee the profile row + role even if the trigger didn't run.
  const { error: pErr } = await admin
    .from("profiles")
    .upsert({ id: user.id, role, full_name, department_id: department_id ?? null });
  if (pErr) throw pErr;

  return user;
}

async function seedDemoApplication(ownerId) {
  const { data: existing } = await admin
    .from("businesses")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("name", "Sunrise Foods Pvt Ltd")
    .maybeSingle();
  if (existing) {
    console.log("• exists   demo application (Sunrise Foods)");
    return;
  }

  const { data: biz, error: bErr } = await admin
    .from("businesses")
    .insert({
      owner_id: ownerId,
      name: "Sunrise Foods Pvt Ltd",
      pan: "AAACS1234F",
      sector: "food_processing",
      address: "Plot 42, Food Park, Medak",
      state: "Telangana",
    })
    .select()
    .single();
  if (bErr) throw bErr;

  const { data: proj, error: prErr } = await admin
    .from("projects")
    .insert({
      business_id: biz.id,
      name: "Ready-to-eat snacks unit",
      location_state: "Telangana",
      project_size: "medium",
      pollution_category: "orange",
      stage: "new_setup",
    })
    .select()
    .single();
  if (prErr) throw prErr;

  const { data: app, error: aErr } = await admin
    .from("applications")
    .insert({ project_id: proj.id, status: "in_progress" })
    .select()
    .single();
  if (aErr) throw aErr;

  // A realistic spread of statuses so the officer queue + analytics look alive.
  const rows = [
    { approval_type_id: "udyam", department_id: "msme", status: "approved", scrutiny_level: "self_certify", requires_inspection: false, due: 12, decided: -8 },
    { approval_type_id: "building_plan", department_id: "municipal", status: "approved", scrutiny_level: "self_certify", requires_inspection: false, due: 20, decided: -6 },
    { approval_type_id: "power_connection", department_id: "power", status: "approved", scrutiny_level: "self_certify", requires_inspection: false, due: 5, decided: -2 },
    { approval_type_id: "water_connection", department_id: "water", status: "submitted", scrutiny_level: "self_certify", requires_inspection: false, due: 8 },
    { approval_type_id: "fssai_license", department_id: "fssai", status: "under_scrutiny", scrutiny_level: "inspection", requires_inspection: true, due: 6 },
    { approval_type_id: "fire_noc", department_id: "fire", status: "inspection_scheduled", scrutiny_level: "inspection", requires_inspection: true, due: 4 },
    { approval_type_id: "pollution_cte", department_id: "spcb", status: "query_raised", scrutiny_level: "inspection", requires_inspection: true, due: 3, query: "Please upload the revised effluent treatment plan — page 4 is missing." },
    { approval_type_id: "factory_license", department_id: "factories", status: "under_scrutiny", scrutiny_level: "inspection", requires_inspection: true, due: -1 },
  ];

  const { error: iErr } = await admin.from("application_approvals").insert(
    rows.map((r) => ({
      application_id: app.id,
      approval_type_id: r.approval_type_id,
      department_id: r.department_id,
      status: r.status,
      scrutiny_level: r.scrutiny_level,
      requires_inspection: r.requires_inspection,
      submitted_at: days(-10),
      sla_due_at: days(r.due),
      decided_at: r.decided != null ? days(r.decided) : null,
      query_note: r.query ?? null,
    })),
  );
  if (iErr) throw iErr;

  // One coordinated inspection bundling the units that need a field visit.
  await admin.from("inspections").insert({
    application_id: app.id,
    scheduled_at: days(4),
    inspector_name: "Joint Inspection Team",
    approvals_covered: ["pollution_cte", "factory_license", "fire_noc", "fssai_license"],
  });

  console.log(`✓ created  demo application (Sunrise Foods, ${rows.length} approvals)`);
}

async function main() {
  console.log("\nSeeding Udyami Setu demo data…\n");
  let sunriseId = null;
  for (const u of USERS) {
    const user = await ensureUser(u);
    if (u.email === "sunrise@demo.in") sunriseId = user.id;
  }
  if (sunriseId) await seedDemoApplication(sunriseId);

  console.log(
    "\nDone. Demo logins (password for all: " +
      PASSWORD +
      "):\n" +
      "  applicant@demo.in         — applicant (empty, for a live walkthrough)\n" +
      "  sunrise@demo.in           — applicant (pre-filled Sunrise Foods application)\n" +
      "  officer.spcb@demo.in      — SPCB officer console\n" +
      "  officer.factories@demo.in — Factories officer console\n" +
      "  nodal@demo.in             — nodal analytics dashboard\n",
  );
}

main().catch((e) => {
  console.error("\n✗ Seed failed:", e.message ?? e);
  process.exit(1);
});
