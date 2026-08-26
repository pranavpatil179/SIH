"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function loginAsDepartmentOfficer(departmentId: string) {
  const email = `officer.${departmentId}@demo.in`;
  const password = "Passw0rd!";
  
  const admin = createAdminClient();
  
  // Attempt to create the user. If they already exist, it will safely fail.
  // Using admin client so we can auto-confirm the email.
  await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { 
      role: "officer", 
      department_id: departmentId, 
      full_name: `${departmentId.toUpperCase()} Officer` 
    }
  });

  // Now actually log in the client session
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    throw new Error(error.message);
  }
  
  // Redirect to the officer portal where they will strictly only see their department's docs
  redirect("/officer");
}
