import Link from "next/link";
import { ArrowRight, CalendarCheck2, FileText, Gift, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { sweepDeemed } from "@/lib/sla";
import { loadRuleset } from "@/lib/rules/ruleset";
import { matchSchemes } from "@/lib/rules/engine";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryBadge } from "@/components/category-badge";
import { StatusChip } from "@/components/status-chip";
import { ScrutinyBadge } from "@/components/scrutiny-badge";
import { SLACountdown } from "@/components/sla-countdown";
import type {
  ApprovalStatus,
  CompanyProfile,
  PollutionCategory,
  ProjectSize,
  ScrutinyLevel,
  Sector,
  Stage,
} from "@/lib/types";

const DECIDED: ApprovalStatus[] = ["approved", "deemed_approved", "rejected"];

interface ApprovalVM {
  id: string;
  status: ApprovalStatus;
  scrutiny_level: ScrutinyLevel;
  requires_inspection: boolean;
  sla_due_at: string | null;
  decided_at: string | null;
  query_note: string | null;
  name: string;
  authority: string;
  legal_basis: string;
  department: string;
}

export default async function Dashboard() {
  await sweepDeemed();

  const supabase = createClient();
  const { data: app } = await supabase
    .from("applications")
    .select(
      `id, status, created_at,
       project:projects!inner(
         id, name, project_size, pollution_category, stage, location_state,
         business:businesses!inner( id, name, sector, state )
       ),
       approvals:application_approvals(
         id, status, scrutiny_level, requires_inspection, sla_due_at, decided_at, query_note,
         approval_type:approval_types( name, authority, legal_basis ),
         department:departments( name )
       )`,
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!app) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <FileText className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
            Let&apos;s find out what approvals you need
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Answer a few questions about your business and we&apos;ll generate
            your exact approval checklist, file every application in parallel,
            and track each statutory deadline for you.
          </p>
          <Link href="/app/new" className="mt-6 inline-block">
            <Button size="lg">
              Start my application <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  const project: any = app.project;
  const business: any = project.business;

  const profile: CompanyProfile = {
    sector: business.sector as Sector,
    pollution_category: project.pollution_category as PollutionCategory,
    stage: project.stage as Stage,
    project_size: project.project_size as ProjectSize,
    location_state: project.location_state,
  };

  const approvals: ApprovalVM[] = (app.approvals ?? [])
    .map((a: any) => ({
      id: a.id,
      status: a.status,
      scrutiny_level: a.scrutiny_level,
      requires_inspection: a.requires_inspection,
      sla_due_at: a.sla_due_at,
      decided_at: a.decided_at,
      query_note: a.query_note,
      name: a.approval_type?.name ?? a.approval_type_id,
      authority: a.approval_type?.authority ?? "",
      legal_basis: a.approval_type?.legal_basis ?? "",
      department: a.department?.name ?? "",
    }))
    .sort((x: ApprovalVM, y: ApprovalVM) => {
      const xd = DECIDED.includes(x.status) ? 1 : 0;
      const yd = DECIDED.includes(y.status) ? 1 : 0;
      if (xd !== yd) return xd - yd;
      return (x.sla_due_at ?? "").localeCompare(y.sla_due_at ?? "");
    });

  const cleared = approvals.filter((a) =>
    ["approved", "deemed_approved"].includes(a.status),
  ).length;
  const total = approvals.length;
  const pct = total ? Math.round((cleared / total) * 100) : 0;

  const pendingInspections = approvals.filter(
    (a) => a.requires_inspection && !DECIDED.includes(a.status),
  ).length;

  const { schemes: allSchemes } = await loadRuleset();
  const schemes = matchSchemes(profile, allSchemes);

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {business.name}
            </h1>
            <CategoryBadge category={profile.pollution_category} />
          </div>
          <p className="mt-1 text-sm capitalize text-slate-500">
            {profile.sector.replace(/_/g, " ")} · {profile.project_size} ·{" "}
            {profile.stage.replace(/_/g, " ")} · {profile.location_state}
          </p>
        </div>
        <Link href="/app/new">
          <Button variant="secondary">
            <Plus className="h-4 w-4" /> New application
          </Button>
        </Link>
      </div>

      {/* Progress */}
      <Card className="mt-6">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm text-slate-500">Approvals cleared</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {cleared}
              <span className="text-lg font-medium text-slate-400">
                {" "}
                / {total}
              </span>
            </div>
          </div>
          <div className="w-full sm:max-w-xs">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-600 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-1 text-right text-xs text-slate-500">
              {pct}% complete
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coordinated inspection callout */}
      {pendingInspections > 1 && (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-accent-100/60 px-4 py-3 text-sm text-amber-900 ring-1 ring-accent-400/40">
          <CalendarCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
          <span>
            <strong>{pendingInspections} approvals</strong> need a site
            inspection — these are bundled into{" "}
            <strong>one coordinated visit</strong> instead of{" "}
            {pendingInspections} separate ones.
          </span>
        </div>
      )}

      {/* Suggested schemes */}
      {schemes.length > 0 && (
        <Card className="mt-4 border-none bg-gradient-to-br from-brand-50 to-white ring-brand-100">
          <CardContent>
            <div className="flex items-center gap-2 text-brand-700">
              <Gift className="h-4 w-4" />
              <span className="text-sm font-semibold">
                You may be eligible for {schemes.length} support scheme
                {schemes.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {schemes.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl bg-white p-4 ring-1 ring-slate-100"
                >
                  <div className="text-sm font-medium text-slate-900">
                    {s.name}
                  </div>
                  <div className="mt-1 text-sm text-brand-700">{s.benefit}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {s.authority}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval tracker */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Your approvals
      </h2>
      <div className="mt-3 space-y-3">
        {approvals.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{a.name}</span>
                  <ScrutinyBadge level={a.scrutiny_level} />
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {a.department} · {a.legal_basis}
                </div>
                {a.status === "query_raised" && a.query_note && (
                  <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-100">
                    <strong>Query:</strong> {a.query_note}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
                <StatusChip status={a.status} />
                <SLACountdown
                  dueAt={a.sla_due_at}
                  decided={DECIDED.includes(a.status)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
