"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  Gift,
  Loader2,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import {
  previewChecklist,
  submitApplication,
  type ChecklistPreview,
  type ProfileInput,
} from "../actions";
import { CATEGORIES, SECTORS, SIZES, STAGES, STATES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CategoryBadge } from "@/components/category-badge";
import { ScrutinyBadge } from "@/components/scrutiny-badge";

const initial: ProfileInput = {
  businessName: "",
  pan: "",
  sector: "food_processing",
  project_size: "medium",
  pollution_category: "orange",
  stage: "new_setup",
  location_state: "Telangana",
};

export default function NewApplication() {
  const [form, setForm] = useState<ProfileInput>(initial);
  const [preview, setPreview] = useState<ChecklistPreview | null>(null);
  const [pending, startTransition] = useTransition();
  const [submitting, startSubmit] = useTransition();

  function set<K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => setPreview(await previewChecklist(form)));
  }

  function onSubmit() {
    startSubmit(async () => {
      await submitApplication(form);
    });
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <Link
        href="/app"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
        Know Your Approvals
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Tell us about your unit. We generate the exact approvals from rules —
        change any answer and the checklist updates.
      </p>

      {/* Profile form */}
      <Card className="mt-6">
        <CardContent>
          <form onSubmit={onGenerate} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="bn">Business name</Label>
                <Input
                  id="bn"
                  required
                  value={form.businessName}
                  onChange={(e) => set("businessName", e.target.value)}
                  placeholder="e.g. Sunrise Foods Pvt Ltd"
                />
              </div>

              <div>
                <Label htmlFor="sector">Sector</Label>
                <Select
                  id="sector"
                  value={form.sector}
                  onChange={(e) => set("sector", e.target.value as any)}
                >
                  {SECTORS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="size">Project size</Label>
                <Select
                  id="size"
                  value={form.project_size}
                  onChange={(e) => set("project_size", e.target.value as any)}
                >
                  {SIZES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="cat">Pollution category (CPCB)</Label>
                <Select
                  id="cat"
                  value={form.pollution_category}
                  onChange={(e) =>
                    set("pollution_category", e.target.value as any)
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="stage">Stage</Label>
                <Select
                  id="stage"
                  value={form.stage}
                  onChange={(e) => set("stage", e.target.value as any)}
                >
                  {STAGES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="state">Location (state)</Label>
                <Select
                  id="state"
                  value={form.location_state}
                  onChange={(e) => set("location_state", e.target.value)}
                >
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="pan">PAN (optional)</Label>
                <Input
                  id="pan"
                  value={form.pan}
                  onChange={(e) => set("pan", e.target.value)}
                  placeholder="AAACS1234F"
                />
              </div>
            </div>

            <Button type="submit" size="lg" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" /> See my approvals
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Result */}
      {preview && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              {preview.items.length} approvals apply to you
            </h2>
            <div className="flex items-center gap-2">
              <CategoryBadge category={form.pollution_category} />
            </div>
          </div>

          {preview.inspectionCount > 1 && (
            <div className="mt-3 flex items-start gap-3 rounded-xl bg-accent-100/60 px-4 py-3 text-sm text-amber-900 ring-1 ring-accent-400/40">
              <CalendarCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
              <span>
                <strong>{preview.inspectionCount} approvals</strong> need a site
                inspection — Udyami Setu bundles these into{" "}
                <strong>one coordinated visit</strong>.
              </span>
            </div>
          )}

          <div className="mt-4 space-y-3">
            {preview.items.map((it) => (
              <Card key={it.approval.id}>
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-900">
                          {it.approval.name}
                        </span>
                        <ScrutinyBadge level={it.scrutiny_level} />
                        {it.requires_inspection && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-purple-200">
                            <ShieldCheck className="h-3 w-3" /> Inspection
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{it.reason}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {it.approval.authority}
                      </p>
                    </div>
                    <span className="whitespace-nowrap rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      SLA {it.approval.sla_days}d
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {preview.schemes.length > 0 && (
            <Card className="mt-4 border-none bg-gradient-to-br from-brand-50 to-white ring-brand-100">
              <CardContent>
                <div className="flex items-center gap-2 text-brand-700">
                  <Gift className="h-4 w-4" />
                  <span className="text-sm font-semibold">
                    Support schemes you may qualify for
                  </span>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {preview.schemes.map((s) => (
                    <li key={s.id}>
                      <span className="font-medium">{s.name}</span> — {s.benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="sticky bottom-4 mt-6 flex items-center justify-between gap-3 rounded-xl bg-white/90 p-3 shadow-lg ring-1 ring-slate-200 backdrop-blur">
            <span className="pl-2 text-sm text-slate-600">
              File all {preview.items.length} in parallel — one click, every
              department at once.
            </span>
            <Button size="lg" onClick={onSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Filing…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> File all now
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
