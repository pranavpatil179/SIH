import { Inbox, AlertTriangle, CheckCircle2 } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sweepDeemed } from "@/lib/sla";
import { Card, CardContent } from "@/components/ui/card";
import { StatusChip } from "@/components/status-chip";
import { ScrutinyBadge } from "@/components/scrutiny-badge";
import { CategoryBadge } from "@/components/category-badge";
import { SLACountdown } from "@/components/sla-countdown";
import { OfficerActions } from "@/components/officer-actions";
import { SlaSweepButton } from "@/components/sla-sweep-button";
import type { ApprovalStatus, PollutionCategory, ScrutinyLevel } from "@/lib/types";

const DECIDED: ApprovalStatus[] = ["approved", "deemed_approved", "rejected"];

interface QueueItem {
  id: string;
  status: ApprovalStatus;
  scrutiny: ScrutinyLevel;
  requiresInspection: boolean;
  slaDue: string | null;
  query: string | null;
  name: string;
  business: string;
  project: string;
  category: PollutionCategory;
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
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

export default async function OfficerConsole() {
  const profile = await requireProfile(["officer"]);
  await sweepDeemed();

  const admin = createAdminClient();
  const { data: dept } = await admin
    .from("departments")
    .select("name")
    .eq("id", profile.department_id!)
    .single();

  const { data: rows } = await admin
    .from("application_approvals")
    .select(
      `id, status, scrutiny_level, requires_inspection, sla_due_at, query_note,
       approval_type:approval_types( name ),
       application:applications!inner(
         project:projects!inner( name, pollution_category, business:businesses!inner( name ) )
       )`,
    )
    .eq("department_id", profile.department_id!)
    .order("sla_due_at", { ascending: true });

  const items: QueueItem[] = (rows ?? []).map((r: any) => ({
    id: r.id,
    status: r.status,
    scrutiny: r.scrutiny_level,
    requiresInspection: r.requires_inspection,
    slaDue: r.sla_due_at,
    query: r.query_note,
    name: r.approval_type?.name ?? "Approval",
    business: r.application?.project?.business?.name ?? "—",
    project: r.application?.project?.name ?? "",
    category: r.application?.project?.pollution_category ?? "white",
  }));

  const pending = items.filter((i) => !DECIDED.includes(i.status));
  const cleared = items.filter((i) => DECIDED.includes(i.status));
  const now = Date.now();
  const overdue = pending.filter(
    (i) => i.slaDue && new Date(i.slaDue).getTime() < now,
  ).length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {dept?.name ?? "Department"} console
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Applications routed to your department. Approve, query or schedule an
            inspection before the SLA lapses.
          </p>
        </div>
        <SlaSweepButton />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat
          icon={<Inbox className="h-5 w-5 text-brand-600" />}
          label="Awaiting action"
          value={pending.length}
          tone="bg-brand-50"
        />
        <Stat
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          label="SLA breached"
          value={overdue}
          tone="bg-red-50"
        />
        <Stat
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          label="Cleared"
          value={cleared.length}
          tone="bg-emerald-50"
        />
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Needs your action
      </h2>
      {pending.length === 0 ? (
        <Card className="mt-3">
          <CardContent className="py-10 text-center text-sm text-slate-500">
            Nothing pending. Applications filed to {dept?.name ?? "your department"}{" "}
            will appear here.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-3 space-y-3">
          {pending.map((i) => (
            <Card key={i.id}>
              <CardContent className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {i.business}
                    </span>
                    <CategoryBadge category={i.category} />
                  </div>
                  <div className="mt-0.5 text-sm text-slate-600">
                    {i.name} · <span className="text-slate-400">{i.project}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ScrutinyBadge level={i.scrutiny} />
                    <StatusChip status={i.status} />
                    <SLACountdown dueAt={i.slaDue} />
                  </div>
                  {i.status === "query_raised" && i.query && (
                    <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-100">
                      <strong>Query sent:</strong> {i.query}
                    </div>
                  )}
                </div>
                <OfficerActions
                  id={i.id}
                  status={i.status}
                  requiresInspection={i.requiresInspection}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {cleared.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Recently cleared
          </h2>
          <div className="mt-3 space-y-2">
            {cleared.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-slate-100"
              >
                <span className="text-slate-700">
                  <span className="font-medium text-slate-900">{i.business}</span>{" "}
                  · {i.name}
                </span>
                <StatusChip status={i.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
