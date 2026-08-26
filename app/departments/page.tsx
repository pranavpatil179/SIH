import { createAdminClient } from "@/lib/supabase/admin";
import { DepartmentGrid } from "./department-grid";

export const dynamic = "force-dynamic";

export default async function DepartmentsDirectory() {
  const admin = createAdminClient();
  const { data: depts, error } = await admin
    .from("departments")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return <div>Error loading departments</div>;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Government Departments
        </h1>
        <p className="mt-3 text-slate-500 max-w-2xl mx-auto">
          Select a department to log in as a dedicated officer. You will be routed to a customized officer console where you can strictly only view and process approvals and documents assigned to your specific department.
        </p>
      </div>

      <DepartmentGrid departments={depts || []} />
    </main>
  );
}
