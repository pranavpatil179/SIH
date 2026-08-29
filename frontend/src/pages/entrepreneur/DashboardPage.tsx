import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { businessService } from '../../services/businessService';
import { approvalService } from '../../services/approvalService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SLAIndicator } from '../../components/ui/SLAIndicator';
import { Button } from '../../components/ui/Button';
import {
  Building2, FileText, ClipboardList, AlertCircle, CheckCircle2,
  Clock, ChevronRight, TrendingUp, Sparkles, Shield, ArrowRight,
  MapPin, FileCheck, Layers, Award, HelpCircle, Check, MessageSquare
} from 'lucide-react';
import { HelpGlossaryModal } from '../../components/ui/HelpGlossaryModal';
import type { Business, ApplicationApproval } from '../../types';

export default function DashboardPage() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [applications, setApplications] = useState<ApplicationApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const biz = await businessService.getMyBusiness();
        setBusiness(biz);
        if (biz) {
          const apps = await approvalService.getApplications(biz.id);
          setApplications(apps);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = {
    total: applications.length,
    approved: applications.filter((a) => a.status === 'approved').length,
    pending: applications.filter((a) => !['approved', 'rejected', 'withdrawn'].includes(a.status)).length,
    queryRaised: applications.filter((a) => a.status === 'query_raised').length,
  };

  // Determine current onboarding step
  const currentStep = !business ? 1 : applications.length === 0 ? 3 : stats.queryRaised > 0 ? 4 : 4;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto shadow-2xs">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-[#002046]">Welcome to BizClear Maharashtra! 👋</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Let's get your business permissions approved. Start by entering basic details about your proposed factory or unit.
          </p>
        </div>
        <div className="pt-2">
          <Button onClick={() => navigate('/business/setup')} size="lg" className="font-bold shadow-md">
            Step 1: Set Up Factory Profile <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#002046] via-[#1b365d] to-[#003366] text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-white/15 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-blue-200">
                Industrial Unit Clearance Portal
              </span>
              <span className="text-[11px] text-emerald-400 font-medium">● Active Unit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {business.name}
            </h1>
            <p className="text-xs text-blue-200 flex flex-wrap items-center gap-2 pt-0.5">
              <span className="font-bold uppercase bg-blue-900/60 px-2 py-0.5 rounded text-[11px] border border-blue-700/50">
                {business.sector || 'Manufacturing'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {business.address || 'MIDC Chakan, Pune'}</span>
              {business.gstin && (
                <>
                  <span>•</span>
                  <span className="font-mono text-[11px]">GSTIN: {business.gstin}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/roadmap">
              <Button variant="secondary" size="sm" className="shadow font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5 mr-1" /> View Approval Roadmap
              </Button>
            </Link>
            <Link to="/documents">
              <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs">
                <FileText className="w-3.5 h-3.5 mr-1" /> Document Locker
              </Button>
            </Link>
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Open Beginner Guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Beginner Quick-Start Progress Tracker */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Clearance Progress Checklist
            </span>
            <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
              {applications.length > 0 ? 'Applications Live' : 'Action Needed'}
            </span>
          </div>
          <button
            onClick={() => setHelpOpen(true)}
            className="text-xs text-blue-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" /> How does this work?
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            {
              step: '1',
              title: 'Factory Profile',
              status: 'Completed',
              desc: 'Sector & power registered',
              done: true,
              link: '/business',
            },
            {
              step: '2',
              title: 'Document Locker',
              status: 'Documents Uploaded',
              desc: 'PAN, Land & Layout saved',
              done: true,
              link: '/documents',
            },
            {
              step: '3',
              title: 'AI Clearance Plan',
              status: applications.length > 0 ? 'Clearances Mapped' : 'Review & Submit',
              desc: 'Pollution, Labour, Fire mapped',
              done: applications.length > 0,
              link: '/roadmap',
            },
            {
              step: '4',
              title: 'Government Clearances',
              status: stats.approved > 0 ? `${stats.approved} Issued` : 'In Officer Review',
              desc: 'Working-day SLA countdown',
              done: stats.approved === stats.total && stats.total > 0,
              link: '/applications',
            },
          ].map((item) => (
            <Link
              key={item.step}
              to={item.link}
              className={`p-3 rounded-xl border transition-all text-left group ${
                item.done
                  ? 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50/80'
                  : 'bg-blue-50/40 border-blue-200 hover:bg-blue-50/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500">Step {item.step}</span>
                {item.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                )}
              </div>
              <p className="font-bold text-xs text-[#002046] group-hover:text-blue-700 transition-colors">
                {item.title}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Next Action Callout Card */}
      {stats.queryRaised > 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-amber-950">Action Needed: Officer Raised a Query</h3>
              <p className="text-xs text-amber-800 mt-0.5">
                The scrutiny officer has requested clarifying details on your application. Reply quickly to resume the statutory SLA clock.
              </p>
            </div>
          </div>
          <Link to="/queries">
            <Button size="sm" className="bg-amber-700 hover:bg-amber-800 text-white font-bold whitespace-nowrap">
              Reply to Query <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-blue-950">Next Step: Review AI Approval Roadmap</h3>
              <p className="text-xs text-blue-800 mt-0.5">
                Your factory documents are ready. Click below to inspect your clearance checklist and submit your parallel applications in 1 click.
              </p>
            </div>
          </div>
          <Link to="/roadmap">
            <Button size="sm" className="font-bold whitespace-nowrap shadow-xs">
              Open Approval Roadmap <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      ) : null}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Clearances',
            value: stats.total,
            desc: 'Statutory permissions mapped',
            icon: ClipboardList,
            bg: 'bg-blue-50 text-blue-700 border-blue-100',
          },
          {
            label: 'Approved & Granted',
            value: stats.approved,
            desc: 'Digital licences issued',
            icon: CheckCircle2,
            bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          },
          {
            label: 'In Scrutiny Review',
            value: stats.pending,
            desc: 'Under parallel review',
            icon: Clock,
            bg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
          },
          {
            label: 'Queries to Answer',
            value: stats.queryRaised,
            desc: stats.queryRaised > 0 ? 'Immediate reply needed' : 'All clear',
            icon: AlertCircle,
            bg: stats.queryRaised > 0 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200',
          },
        ].map((kpi, idx) => (
          <Card key={idx} className="border shadow-2xs hover:border-slate-300 transition-all">
            <CardContent className="p-4 sm:p-5 flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
                <p className="text-2xl sm:text-3xl font-black text-[#002046]">{kpi.value}</p>
                <p className="text-[11px] text-slate-500">{kpi.desc}</p>
              </div>
              <div className={`p-3 rounded-xl border ${kpi.bg}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Department Clearances */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-2xs border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <CardTitle className="text-base text-[#002046]">Department Clearance Pipeline</CardTitle>
                <p className="text-xs text-slate-500">Live multi-department scrutiny status with working-day statutory deadlines</p>
              </div>
              <Link to="/applications" className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {applications.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No applications initiated yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Generate your Approval Roadmap to trigger parallel clearance submissions to MPCB, Labour, and Fire authorities.
                  </p>
                  <Link to="/roadmap">
                    <Button size="sm">Generate Roadmap Now</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <Link
                      key={app.id}
                      to={`/applications/${app.application_id || app.id}`}
                      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/80 transition-colors group"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-[#002046] group-hover:text-blue-700 transition-colors">
                            {app.approval_type?.name || app.approval_type_id}
                          </span>
                          <StatusBadge status={app.status} />
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-500">
                          {app.department?.name || app.department_id}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-0 border-slate-100">
                        {app.sla_due_at && <SLAIndicator dueDate={app.sla_due_at} />}
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Industrial Assistant Widget */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200/80 rounded-2xl p-5 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-sm text-[#002046]">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Gemini AI Business Summary & Subsidies</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Your unit in MIDC Chakan is classified under the <strong>Orange Pollution Category</strong> with 100 workers. Factory layout blueprints and Consent to Establish (CTE) applications have been pre-validated. You are also eligible for fiscal subsidies under the Maharashtra Package Scheme of Incentives (PSI 2019).
            </p>
            <div className="flex items-center gap-3 pt-1">
              <Link to="/schemes" className="text-xs font-bold text-blue-800 hover:underline flex items-center gap-1">
                View Your Eligible Subsidies <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Navigation & Facility Details */}
        <div className="space-y-6">
          <Card className="shadow-2xs border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm text-[#002046]">Quick Access Shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              <Link to="/roadmap">
                <button className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer">
                  <span className="flex items-center gap-2.5 text-[#002046]">
                    <Layers className="w-4 h-4 text-blue-600" /> AI Approval Roadmap
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </Link>

              <Link to="/documents">
                <button className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer">
                  <span className="flex items-center gap-2.5 text-[#002046]">
                    <FileCheck className="w-4 h-4 text-emerald-600" /> Document Locker
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </Link>

              <Link to="/schemes">
                <button className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer">
                  <span className="flex items-center gap-2.5 text-[#002046]">
                    <Award className="w-4 h-4 text-amber-600" /> Subsidies & Incentives
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </Link>

              <button
                onClick={() => setHelpOpen(true)}
                className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2.5 text-[#002046]">
                  <HelpCircle className="w-4 h-4 text-purple-600" /> Jargon Buster & Help
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </CardContent>
          </Card>

          {/* Plant Specification Card */}
          <Card className="shadow-2xs border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm text-[#002046]">Registered Facility Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs p-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Location</span>
                <span className="font-semibold text-[#002046]">MIDC Chakan, Pune</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fixed Investment</span>
                <span className="font-semibold text-[#002046]">₹5.00 Crore</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Workforce</span>
                <span className="font-semibold text-[#002046]">100 Employees</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pollution Category</span>
                <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Orange Category
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Power Connected</span>
                <span className="font-semibold text-[#002046]">500 kW (MSEDCL)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <HelpGlossaryModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
