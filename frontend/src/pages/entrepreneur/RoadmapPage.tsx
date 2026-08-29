import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { businessService } from '../../services/businessService';
import { approvalService } from '../../services/approvalService';
import { api } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  CheckCircle2, Clock, FileText, ArrowRight, ShieldCheck, AlertTriangle,
  Building2, Sparkles, HelpCircle, Layers, ArrowDown, ExternalLink, Zap,
  Check, AlertCircle, RefreshCw, GitFork, Award, BookOpen, ShieldAlert,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { HelpGlossaryModal } from '../../components/ui/HelpGlossaryModal';
import type { Business, Project } from '../../types';

export default function RoadmapPage() {
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const biz = await businessService.getMyBusiness();
      setBusiness(biz);
      if (biz) {
        const projs = await businessService.getProjects(biz.id);
        setProjects(projs);
        if (projs.length > 0) {
          setSelectedProject(projs[0]);
          await loadAnalysis(projs[0].id);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load approvals roadmap');
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalysis(projId: string) {
    try {
      const res = await api.get(`/api/approvals/checklist/${projId}`);
      setAnalysis(res.data.analysis || res.data);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to run regulatory analysis');
    }
  }

  const handleProjectChange = async (projId: string) => {
    const proj = projects.find(p => p.id === projId) || null;
    setSelectedProject(proj);
    if (proj) {
      setLoading(true);
      await loadAnalysis(proj.id);
      setLoading(false);
    }
  };

  const handleSubmitAll = async () => {
    if (!selectedProject) return;
    setSubmitting(true);
    try {
      await approvalService.submitApplication(selectedProject.id);
      toast.success('Single-Window Application Package submitted successfully to all departments!');
      navigate('/applications');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900" />
      </div>
    );
  }

  if (!business || !selectedProject) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-sm space-y-4">
        <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-[#002046]">No Factory Unit Registered</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Complete your enterprise entity and factory parameters to automatically map your required government clearances.
        </p>
        <Link to="/business">
          <Button>Setup Business Profile & Factory</Button>
        </Link>
      </div>
    );
  }

  const summary = analysis?.summary || {
    total_identified: 0,
    high_confidence_count: 0,
    conditional_count: 0,
    estimated_statutory_turnaround_days: 30,
  };

  const msme = analysis?.msme_classification;
  const tracks = analysis?.tracks || [];
  const warnings = analysis?.warnings || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Approval Roadmap & Clearance Checklist"
        subtitle={`Instant statutory clearance mapping and parallel review tracks for ${business.name}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setHelpOpen(true)}
              className="text-xs font-bold border-slate-300"
            >
              <HelpCircle className="w-4 h-4 mr-1 text-blue-600" /> Jargon Buster
            </Button>
            <Button onClick={handleSubmitAll} loading={submitting} size="lg" className="font-bold shadow-md">
              Submit All Applications (1-Click) <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        }
      />

      {/* Facility Header Banner & Project Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#002046]">{selectedProject.name}</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full uppercase">
                {business.sector === 'pharmaceutical' ? 'Pharma & Chemicals' : 'Automobile & Engineering'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedProject.district || 'Maharashtra'} • Total Project Cost: ₹{selectedProject.investment_crore || 12.5} Cr • {selectedProject.employee_count} Workers • {selectedProject.connected_load_kw || 200} kW Connected Load
            </p>
          </div>
        </div>

        {projects.length > 1 && (
          <select
            value={selectedProject.id}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 font-medium"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Clearances Overview Banner */}
      <div className="bg-gradient-to-br from-[#002046] via-[#0b2d59] to-[#1b365d] text-white rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-blue-200">
                AI Clearance Intelligence
              </span>
              <span className="text-xs text-emerald-300 font-bold">
                ⚡ Max Guaranteed SLA: {summary.estimated_statutory_turnaround_days} Working Days
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {summary.total_identified} Total Permissions & Licences Required
            </h2>
            <p className="text-xs text-blue-200/90 max-w-2xl leading-relaxed">
              Mapped automatically for your sector under Maharashtra state regulations (MPCB Pollution Control, DISH Factory Safety, Fire Department, and Electricity Board). All applications will proceed in parallel.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 p-3 rounded-xl border border-white/15">
            <div className="text-center px-3 border-r border-white/20">
              <span className="text-xl font-black text-emerald-400 block">{summary.high_confidence_count}</span>
              <span className="text-[10px] uppercase font-bold text-slate-300">Directly Applicable</span>
            </div>
            <div className="text-center px-3">
              <span className="text-xl font-black text-amber-400 block">{summary.conditional_count}</span>
              <span className="text-[10px] uppercase font-bold text-slate-300">Conditional Rules</span>
            </div>
          </div>
        </div>

        {/* Extreme Input Warning Banner */}
        {warnings.length > 0 && (
          <div className="p-3 bg-amber-500/20 border border-amber-400/40 rounded-xl space-y-1 text-xs text-amber-200">
            {warnings.map((w: string, idx: number) => (
              <p key={idx} className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-300 flex-shrink-0" />
                <span>{w}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {/* MSME Classification Card (Udyam Notification S.O. 2119(E)) */}
      {msme && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white shadow-2xs">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-700" />
                <div>
                  <span className="font-extrabold text-sm text-blue-950">
                    Official MSME Enterprise Category: {msme.category}
                  </span>
                  <span className="text-[10px] text-blue-800 ml-2 font-mono bg-blue-100/80 px-2 py-0.5 rounded">
                    Govt of India Udyam Standard
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-blue-900">
                {msme.statutory_basis}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Plant & Machinery (P&M)</span>
                <span className="font-bold text-[#002046]">₹{msme.cost_breakdown?.plant_machinery_crore} Cr</span>
                <span className="text-[9px] text-blue-600 block">★ Qualifying Udyam Capital</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Annual Turnover</span>
                <span className="font-bold text-[#002046]">₹{msme.annual_turnover_crore} Cr</span>
                <span className="text-[9px] text-blue-600 block">★ Turnover Limit</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Land + Building</span>
                <span className="font-bold text-slate-700">₹{(msme.cost_breakdown?.land_crore || 0) + (msme.cost_breakdown?.building_civil_crore || 0)} Cr</span>
                <span className="text-[9px] text-slate-400 block italic">Excluded from Udyam</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Project Cost</span>
                <span className="font-bold text-[#002046]">₹{msme.total_project_cost_crore} Cr</span>
                <span className="text-[9px] text-slate-500 block">Gross Capital</span>
              </div>
            </div>
            <p className="text-[11px] text-blue-900/80 italic pt-0.5">
              💡 {msme.regulatory_note}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Risk-Based Scrutiny & Inspection Policy Card (PS Requirement) */}
      {analysis?.risk_assessment && (() => {
        const risk = analysis.risk_assessment;
        const isLow = risk.level === 'low';
        const isHigh = risk.level === 'high' || risk.level === 'critical';

        return (
          <Card className={`border shadow-2xs ${
            isLow
              ? 'border-emerald-200 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white'
              : isHigh
              ? 'border-red-200 bg-gradient-to-r from-red-50/70 via-rose-50/40 to-white'
              : 'border-amber-200 bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-white'
          }`}>
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                    isLow ? 'bg-emerald-600' : isHigh ? 'bg-red-600' : 'bg-amber-600'
                  }`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-[#002046]">
                        Risk-Based Scrutiny Engine: {risk.tier_label}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${
                        isLow
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : isHigh
                          ? 'bg-red-100 text-red-900 border-red-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        Risk Score: {risk.score} / 100 ({risk.level.toUpperCase()} RISK)
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Deterministic risk evaluation calibrating scrutiny depth & physical inspection frequency
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    risk.deemed_approval_eligible
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-slate-100 text-slate-800 border-slate-300'
                  }`}>
                    {risk.deemed_approval_eligible ? '⚡ Deemed Approval Eligible' : '📋 Standard Officer Review'}
                  </span>
                </div>
              </div>

              {/* Policy Explanations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200/90 space-y-1">
                  <span className="font-bold text-[#002046] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Department Scrutiny Depth:
                  </span>
                  <p className="text-slate-700 leading-relaxed">{risk.scrutiny_depth}</p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200/90 space-y-1">
                  <span className="font-bold text-[#002046] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    Joint Inspection Protocol:
                  </span>
                  <p className="text-slate-700 leading-relaxed">{risk.inspection_policy}</p>
                </div>
              </div>

              {/* Explainability Callout (Evaluation Feature) */}
              <div className="p-3 bg-white/90 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-800">
                <span className="font-extrabold text-[#002046] flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                  💡 Risk Score Explainability & Regulatory Grounding:
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Your unit scored <strong>{risk.score}/100 points</strong>. {risk.level === 'low' ? (
                    <span>Because this unit is classified under Non-Polluting / Green Category with no hazardous solvents, pre-inspection is <strong>waived</strong> under Maharashtra Ease of Doing Business rules and granted provisional deemed status.</span>
                  ) : (
                    <span>The combination of <strong>{risk.factors[0]?.reason}</strong> ({risk.factors[0]?.points} pts) and <strong>{risk.factors[1]?.reason}</strong> ({risk.factors[1]?.points} pts) triggers mandatory joint scrutiny across MPCB, DISH, and MFES Fire services.</span>
                  )}
                </p>
              </div>

              {/* Risk Factor Breakdown */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Statutory Factor Evaluation Weights:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {risk.factors.map((f: any, idx: number) => (
                    <div key={idx} className="p-2.5 bg-white/90 rounded-lg border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                        <span>{f.name}</span>
                        <span className="text-blue-700 font-bold">{f.points}/{f.max_points} pts</span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-800 leading-tight">{f.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Visual Multi-Track Dependency Overview */}
      <Card className="shadow-2xs border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitFork className="w-5 h-5 text-blue-600" />
              <div>
                <CardTitle className="text-sm font-bold text-[#002046]">
                  Parallel Department Approval Pathways
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  All {tracks.length} tracks below proceed simultaneously at the exact same time without waiting for each other
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
              {tracks.length} Simultaneous Tracks
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {tracks.map((track: any, idx: number) => (
              <div
                key={track.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    {track.approvals.length} Approval(s)
                  </span>
                </div>
                <h4 className="font-bold text-xs text-[#002046]">{track.name}</h4>
                <p className="text-[11px] text-slate-500 leading-tight">{track.description}</p>
                <div className="pt-2 border-t border-slate-200/80 space-y-1">
                  {track.approvals.map((app: any) => (
                    <div key={app.approval_type_id} className="text-[11px] flex items-center gap-1.5 text-slate-700">
                      <span className={`w-1.5 h-1.5 rounded-full ${app.verification_tier === 'verified_statutory' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="truncate">{app.approval_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive Statutory Clearance Details (Grouped by Tracks) */}
      <div className="space-y-6">
        {tracks.map((track: any) => (
          <div key={track.id} className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-extrabold text-[#002046]">{track.name}</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {track.approvals.map((item: any) => {
                const isConditional = item.status === 'conditional';
                const isVerified = item.verification_tier === 'verified_statutory';

                return (
                  <Card
                    key={item.approval_type_id}
                    className={`border transition-all shadow-xs ${
                      isConditional
                        ? 'border-amber-200/90 bg-amber-50/20'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <CardHeader className="pb-3 border-b border-slate-100/80">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base font-bold text-[#002046]">
                              {item.approval_name}
                            </CardTitle>
                            
                            {/* Verification Tier Badge */}
                            {isVerified ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                                🛡️ Verified Statutory Rule
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                ⚙️ Conditional / Procedural Rule
                              </span>
                            )}

                            <Badge variant={isConditional ? 'warning' : 'success'}>
                              {isConditional ? '⚠️ Conditional' : '✅ Applicable'}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Competent Authority: <strong className="text-slate-700">{item.department_name}</strong> • Regulatory Body: {item.statutory_authority}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                            ⏱️ Statutory RTS SLA: {item.sla_days} Days
                          </span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 space-y-4">
                      {/* Reason & Statutory Basis */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <span className="font-bold text-[#002046] block">Applicability Finding:</span>
                          <p className="text-slate-700 leading-relaxed">{item.reason}</p>
                          {item.user_action_required && (
                            <p className="text-amber-800 font-semibold pt-1">
                              👉 Note: {item.user_action_required}
                            </p>
                          )}
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <span className="font-bold text-[#002046] block flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                            Statutory Legal Source:
                          </span>
                          <p className="text-slate-800 font-mono text-[11px] font-semibold">{item.regulatory_source || item.legal_basis}</p>
                          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 mt-1">
                            💳 Statutory Fee Basis: <span className="text-slate-700 font-medium">{item.fee_calculation}</span>
                          </p>
                        </div>
                      </div>

                      {/* Applicable If / Not Applicable If for Conditional Approvals */}
                      {isConditional && (
                        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs grid grid-cols-1 md:grid-cols-2 gap-2 text-amber-900">
                          <div>
                            <span className="font-bold block text-emerald-800">✓ Applicable If:</span>
                            <span>{item.applicable_if}</span>
                          </div>
                          <div>
                            <span className="font-bold block text-red-800">✕ Excluded / Not Applicable If:</span>
                            <span>{item.not_applicable_if}</span>
                          </div>
                        </div>
                      )}

                      {/* Split Document Checklists */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        {/* Pre-Establishment Documents */}
                        <div className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-2">
                          <span className="text-[11px] font-bold text-[#002046] uppercase tracking-wide flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            1. Pre-Establishment Prerequisites (Application Stage):
                          </span>
                          <div className="space-y-1.5">
                            {(item.required_documents_pre_establishment || item.required_documents || []).map((doc: string, idx: number) => (
                              <div key={idx} className="text-xs flex items-start gap-1.5 text-slate-700">
                                <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <span>{doc}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Post-Construction Documents */}
                        <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-2">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                            2. Post-Construction / Commissioning Verification (CTO / Final NOC):
                          </span>
                          <div className="space-y-1.5">
                            {(item.required_documents_post_construction || []).length > 0 ? (
                              item.required_documents_post_construction.map((doc: string, idx: number) => (
                                <div key={idx} className="text-xs flex items-start gap-1.5 text-slate-600">
                                  <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                                  <span>{doc}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-400 italic">No secondary post-construction documents required for this step.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <HelpGlossaryModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
