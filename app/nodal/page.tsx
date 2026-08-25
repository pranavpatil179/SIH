import { Building2, ClipboardList, Timer, ShieldAlert, Gauge } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sweepDeemed } from "@/lib/sla";
import { STATUS_META, CATEGORY_META } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { SlaSweepButton } from "@/components/sla-sweep-button";
import { NodalCharts, type NodalData } from "@/components/nodal-charts";
import type { ApprovalStatus, PollutionCategory } from "@/lib/types";

const DECIDED: ApprovalStatus[] = ["approved", "deemed_approved", "rejected"];

const STATUS_HEX: Record<ApprovalStatus, string> = {
  not_started: "#94a3b8",
  submitted: "#2563eb",
  under_scrutiny: "#4f46e5",
  query_raised: "#d97706",
  inspection_scheduled: "#7c3aed",
  approved: "#059669",
  rejected: "#dc2626",
  deemed_approved: "#0d9488",
};

const CAT_HEX: Record<PollutionCategory, string> = {
  red: "#ef4444",
  orange: "#f97316",
  green: "#10b981",
  white: "#94a3b8",
};

function Kpi({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
          {icon}
        </span>
        <div>
          <div className="text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-xs text-slate-500">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function NodalDashboard() {
  await requireProfile(["nodal"]);
  await sweepDeemed();

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("application_approvals")
    .select(
      `application_id, status, department_id, submitted_at, decided_at,
       department:departments( name ),
       application:applications!inner( project:projects!inner( pollution_category ) )`,
    );

  const all = rows ?? [];

  // ---- KPIs ----
  const applications = new Set(all.map((r: any) => r.application_id)).size;
  const approvals = all.length;
  const cleared = all.filter((r: any) => DECIDED.includes(r.status)).length;
  const pending = approvals - cleared;
  const deemed = all.filter((r: any) => r.status === "deemed_approved").length;

  const durations = all
    .filter((r: any) => r.decided_at && r.submitted_at)
    .map(
      (r: any) =>
        (new Date(r.decided_at).getTime() - new Date(r.submitted_at).getTime()) /
        86_400_000,
    )
    .filter((d: number) => d > 0);
  const avgDays = durations.length
    ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length
    : 0;

  // ---- Status breakdown ----
  const statusMap = new Map<ApprovalStatus, number>();
  for (const r of all as any[])
    statusMap.set(r.status, (statusMap.get(r.status) ?? 0) + 1);
  const statusCounts = [...statusMap.entries()].map(([status, value]) => ({
    name: STATUS_META[status as ApprovalStatus]?.label ?? status,
    value,
    color: STATUS_HEX[status as ApprovalStatus] ?? "#94a3b8",
  }));

  // ---- Category breakdown ----
  const catMap = new Map<PollutionCategory, number>();
  for (const r of all as any[]) {
    const c = r.application?.project?.pollution_category as PollutionCategory;
    if (c) catMap.set(c, (catMap.get(c) ?? 0) + 1);
  }
  const categoryCounts = (["red", "orange", "green", "white"] as PollutionCategory[])
    .filter((c) => catMap.has(c))
    .map((c) => ({
      name: CATEGORY_META[c].label,
      value: catMap.get(c) ?? 0,
      color: CAT_HEX[c],
    }));

  // ---- Department load ----
  const deptMap = new Map<string, { full: string; pending: number; cleared: number }>();
  for (const r of all as any[]) {
    const id = r.department_id as string;
    const full = r.department?.name ?? id;
    const entry = deptMap.get(id) ?? { full, pending: 0, cleared: 0 };
    if (DECIDED.includes(r.status)) entry.cleared++;
    else entry.pending++;
    deptMap.set(id, entry);
  }
  const deptLoad = [...deptMap.entries()]
    .map(([id, v]) => ({ dept: id.toUpperCase(), full: v.full, pending: v.pending, cleared: v.cleared }))
    .sort((a, b) => b.pending - a.pending);

  const bottleneck = deptLoad.find((d) => d.pending > 0);

  const data: NodalData = { statusCounts, categoryCounts, deptLoad };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            State single-window analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Live view of approvals, clearance times and the current bottleneck
            department across all filings.
          </p>
        </div>
        <SlaSweepButton />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          icon={<Building2 className="h-5 w-5 text-brand-600" />}
          label="Applications"
          value={applications}
          tone="bg-brand-50"
        />
        <Kpi
          icon={<ClipboardList className="h-5 w-5 text-slate-600" />}
          label={`Approvals (${pending} pending)`}
          value={approvals}
          tone="bg-slate-100"
        />
        <Kpi
          icon={<Timer className="h-5 w-5 text-emerald-600" />}
          label="Avg clearance"
          value={avgDays ? `${avgDays.toFixed(1)}d` : "—"}
          tone="bg-emerald-50"
        />
        <Kpi
          icon={<ShieldAlert className="h-5 w-5 text-teal-600" />}
          label="Deemed approvals"
          value={deemed}
          tone="bg-teal-50"
        />
      </div>

      {bottleneck && (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-brand-100">
          <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <span>
            Current bottleneck: <strong>{bottleneck.full}</strong> with{" "}
            <strong>{bottleneck.pending}</strong> approval
            {bottleneck.pending > 1 ? "s" : ""} awaiting action.
          </span>
        </div>
      )}

      <div className="mt-6">
        {approvals === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-slate-500">
              No filings yet. Once applicants submit, analytics populate here in
              real time.
            </CardContent>
          </Card>
        ) : (
          <NodalCharts data={data} />
        )}
      </div>
    </main>
  );
}
