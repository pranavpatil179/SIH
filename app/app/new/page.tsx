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


export default function NewApplication() {
  const [form, setForm] = useState<ProfileInput>({
    businessName: "",
    sector: "chemical",
    project_size: "micro",
    pollution_category: "red",
    stage: "new_setup",
    location_state: "Maharashtra",
    pan: "",
    generates_hazardous_waste: null,
    has_regulated_substances: null,
  });
  const [preview, setPreview] = useState<ChecklistPreview | null>(null);
  const [pending, setPending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof ProfileInput, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    setPreview(null);
    setPending(true);
    try {
      const p = await previewChecklist(form);
      setPreview(p);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPending(false);
    }
  }

  async function onSubmit() {
    setSubmitting(true);
    try {
      await submitApplication(form);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const reqCount = preview?.items.filter(i => i.status === "required").length || 0;
  const condCount = preview?.items.filter(i => i.status === "conditional").length || 0;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 pb-32">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        New Project Application
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Udyami Setu uses a deterministic rules engine to evaluate requirements. Fill out your profile and specific project details to determine exact applicability.
      </p>

      {/* Profile form */}
      <Card className="mt-6">
        <CardContent>
          <form onSubmit={onGenerate} className="space-y-5 pt-5">
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
                  onChange={(e) => set("sector", e.target.value)}
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
                  onChange={(e) => set("project_size", e.target.value)}
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
                  onChange={(e) => set("pollution_category", e.target.value)}
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
                  onChange={(e) => set("stage", e.target.value)}
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

              {/* Conditional Questionnaire */}
              <div className="sm:col-span-2 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Project Specifics</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Generates hazardous waste?</Label>
                    <Select
                      value={form.generates_hazardous_waste === null ? "" : String(form.generates_hazardous_waste)}
                      onChange={(e) => set("generates_hazardous_waste", e.target.value === "" ? null : e.target.value === "true")}
                    >
                      <option value="">Select...</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Stores regulated petroleum/explosives?</Label>
                    <Select
                      value={form.has_regulated_substances === null ? "" : String(form.has_regulated_substances)}
                      onChange={(e) => set("has_regulated_substances", e.target.value === "" ? null : e.target.value === "true")}
                    >
                      <option value="">Select...</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" size="lg" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing rules...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" /> Determine Applicability
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
              {reqCount} required approvals {condCount > 0 && <span className="text-amber-600">({condCount} conditional)</span>}
            </h2>
            <div className="flex items-center gap-2">
              <CategoryBadge category={form.pollution_category} />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {preview.items.map((it) => (
              <Card key={it.approval.id} className={
                it.status === 'not_applicable' ? 'opacity-50' : 
                it.status === 'conditional' ? 'ring-1 ring-amber-200 bg-amber-50/30' : ''
              }>
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900">
                          {it.approval.name}
                        </span>
                        {it.status === 'required' && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">Required</span>}
                        {it.status === 'conditional' && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-300">Conditional</span>}
                        {it.status === 'not_applicable' && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">Not Applicable</span>}
                        <ScrutinyBadge level={it.scrutiny_level} />
                      </div>
                      
                      {it.status === 'conditional' ? (
                        <div className="mt-2 text-sm text-amber-900">
                          <p>{it.reason}</p>
                          <p className="mt-1 font-medium bg-amber-100 px-2 py-1 rounded inline-block">
                            ? {it.missing_question}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-slate-600">{it.reason}</p>
                      )}
                      
                      <p className="mt-2 text-xs text-slate-400 font-medium">
                        Authority: {it.approval.authority}
                      </p>
                    </div>
                    {it.status !== 'not_applicable' && (
                      <span className="whitespace-nowrap rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        SLA {it.approval.sla_days}d
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="sticky bottom-4 mt-6 flex items-center justify-between gap-3 rounded-xl bg-white/90 p-3 shadow-lg ring-1 ring-slate-200 backdrop-blur">
            <span className="pl-2 text-sm text-slate-600">
              {condCount > 0 ? "Resolve conditional questions above to file." : `File all ${reqCount} required approvals.`}
            </span>
            <Button size="lg" onClick={onSubmit} disabled={submitting || condCount > 0}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Filing…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> File required now
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
