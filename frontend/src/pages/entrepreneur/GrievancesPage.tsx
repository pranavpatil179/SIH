import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  AlertCircle, ShieldAlert, Clock, CheckCircle2, MessageSquare,
  Building2, ArrowRight, Plus, HelpCircle, FileText, Send, Scale
} from 'lucide-react';
import { formatDateTime, formatDate } from '../../lib/utils';
import { toast } from 'sonner';

export default function GrievancesPage() {
  const { profile } = useAuthStore();
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [category, setCategory] = useState('sla_breach');
  const [departmentId, setDepartmentId] = useState('dept_mpcb');
  const [departmentName, setDepartmentName] = useState('Maharashtra Pollution Control Board (MPCB)');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  // Resolve State for Admin/Appellate Officer
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  const isAuthority = profile?.role === 'admin' || profile?.role === 'officer';

  useEffect(() => {
    loadGrievances();
  }, []);

  async function loadGrievances() {
    try {
      const res = await api.get('/api/grievances');
      setGrievances(res.data.grievances || res.data || []);
    } catch (err: any) {
      toast.error('Failed to load grievance records');
    } finally {
      setLoading(false);
    }
  }

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setDepartmentId(val);
    const names: Record<string, string> = {
      dept_mpcb: 'Maharashtra Pollution Control Board (MPCB)',
      dept_dish: 'Directorate of Industrial Safety & Health (DISH / Labour)',
      dept_fire: 'Maharashtra Fire Prevention Services (MFES)',
      dept_midc: 'Maharashtra Industrial Development Corporation (MIDC)',
      dept_msedcl: 'Maharashtra State Electricity Distribution Co (MSEDCL)',
      dept_state_nodal: 'State Nodal Single Window Directorate',
    };
    setDepartmentName(names[val] || val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) {
      toast.error('Please enter a subject and description');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/grievances', {
        category,
        department_id: departmentId,
        department_name: departmentName,
        subject,
        description,
      });

      toast.success('Formal Grievance Registered! Escalated to State Nodal Appellate Authority with 7-Day RTS SLA.');
      setShowModal(false);
      setSubject('');
      setDescription('');
      await loadGrievances();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit grievance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id: string) => {
    if (!resolutionText) {
      toast.error('Please enter the official binding resolution directive');
      return;
    }

    try {
      await api.post(`/api/grievances/${id}/resolve`, {
        resolution_order: resolutionText,
        status: 'resolved',
      });
      toast.success('Grievance Resolution Order Issued & Directives Communicated!');
      setResolvingId(null);
      setResolutionText('');
      await loadGrievances();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve grievance');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statutory Grievance & Appellate Escalation Portal"
        subtitle="Formal applicant-initiated appeal mechanism under the Maharashtra Right to Public Services (RTS) Act with a 7-day binding resolution SLA"
        actions={
          <Button onClick={() => setShowModal(true)} className="font-bold shadow-xs">
            <Plus className="w-4 h-4 mr-1.5" /> File Formal Appeal / Grievance
          </Button>
        }
      />

      {/* Statutory Banner */}
      <div className="bg-gradient-to-r from-[#002046] via-[#1b365d] to-[#003366] text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-blue-200">
                Maharashtra RTS Act Section 18 Appellate Authority
              </span>
              <span className="text-xs text-emerald-300 font-bold">⚡ Guaranteed 7-Day Resolution SLA</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Direct State Nodal Oversight & Appellate Redressal
            </h2>
            <p className="text-xs text-blue-200/90 max-w-2xl leading-relaxed">
              If any department officer raises unjustified queries, delays joint site inspections, or breaches statutory working-day deadlines, file a formal grievance here. Grievances are routed directly to the State Nodal Appellate Authority with legally binding enforcement orders.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/15 text-center">
            <div className="px-3 border-r border-white/20">
              <span className="text-2xl font-black text-amber-400 block">{grievances.filter(g => g.status !== 'resolved').length}</span>
              <span className="text-[10px] uppercase font-bold text-slate-300">Active Appeals</span>
            </div>
            <div className="px-3">
              <span className="text-2xl font-black text-emerald-400 block">{grievances.filter(g => g.status === 'resolved').length}</span>
              <span className="text-[10px] uppercase font-bold text-slate-300">Resolved Orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grievances List */}
      {grievances.length === 0 ? (
        <Card className="text-center py-16 rounded-2xl border-slate-200 shadow-2xs">
          <CardContent className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Scale className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#002046]">No Grievances Filed</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              You haven't filed any formal complaints. If you experience delays or issues with any department scrutiny, click the button above to escalate directly to the State Appellate Authority.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {grievances.map((grv) => {
            const isResolved = grv.status === 'resolved';

            return (
              <Card key={grv.id} className="border-slate-200 shadow-2xs hover:shadow-xs transition-all overflow-hidden">
                <CardHeader className="bg-slate-50/70 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black bg-blue-100 text-blue-900 px-2 py-0.5 rounded border border-blue-200">
                        {grv.ticket_number}
                      </span>
                      <span className="font-bold text-sm text-[#002046]">
                        {grv.subject}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {isResolved ? '✅ Resolved by Order' : '⏳ In Review by Appellate Body'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Concerned Department: <strong className="text-slate-700">{grv.department_name}</strong> • Category: <span className="font-semibold text-slate-700">{grv.category_label || grv.category}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      RTS Due: {formatDate(grv.sla_due_at || new Date(Date.now() + 5 * 86400000).toISOString())}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 space-y-3">
                  <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="font-bold text-slate-500 uppercase text-[10px] block">Applicant Statement & Grievance Grounds:</span>
                    <p className="text-slate-800 leading-relaxed">{grv.description}</p>
                    <p className="text-[10px] text-slate-400 pt-1">
                      Filed on {formatDateTime(grv.created_at)} by {grv.applicant_name}
                    </p>
                  </div>

                  {/* Resolution Order */}
                  {isResolved && grv.resolution_order && (
                    <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-xl text-xs space-y-1 text-emerald-950">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Official Appellate Resolution Order & Directive:</span>
                      </div>
                      <p className="text-emerald-900 leading-relaxed font-medium pl-5">{grv.resolution_order}</p>
                      <p className="text-[10px] text-emerald-700/80 pl-5 pt-1">
                        Issued by <strong>{grv.resolved_by || 'State Nodal Appellate Authority'}</strong> on {formatDateTime(grv.resolved_at || new Date().toISOString())}
                      </p>
                    </div>
                  )}

                  {/* Resolve Action Form for Admin / Officer demo */}
                  {!isResolved && (
                    <div className="pt-1">
                      {resolvingId === grv.id ? (
                        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 text-xs">
                          <label className="font-bold text-[#002046] block">
                            Enter Binding Appellate Resolution Order:
                          </label>
                          <textarea
                            rows={3}
                            placeholder="e.g. Directive issued to MPCB Regional Officer to conduct joint site inspection within 48 hours and grant provisional clearance without further delay."
                            value={resolutionText}
                            onChange={(e) => setResolutionText(e.target.value)}
                            className="w-full p-2.5 border rounded-lg bg-white text-xs"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleResolve(grv.id)} className="font-bold">
                              Issue Binding Resolution Order
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setResolvingId(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setResolvingId(grv.id);
                              setResolutionText('Directive issued to department scrutiny officer to expedite application and resolve query within 48 hours as per Maharashtra RTS Act.');
                            }}
                            className="text-xs font-bold border-blue-300 text-blue-900 bg-blue-50/50 hover:bg-blue-100"
                          >
                            <Scale className="w-3.5 h-3.5 mr-1 text-blue-600" />
                            {isAuthority ? 'Issue Appellate Order' : 'Test Appellate Resolution'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: File Formal Grievance */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-[#002046] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                File Formal RTS Statutory Grievance
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 1-Click Live Pitch Demo Presets */}
            <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200/80 space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase text-blue-900 tracking-wider flex items-center gap-1">
                ⚡ 1-Click Demo Scenarios (For Live Pitch / Evaluators):
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCategory('inspection_delayed');
                    setDepartmentId('dept_mpcb');
                    setDepartmentName('Maharashtra Pollution Control Board (MPCB)');
                    setSubject('Joint Site Inspection delayed beyond 15-day statutory RTS limit');
                    setDescription('Our ETP construction and factory layout blueprints were submitted 18 working days ago for Consent to Establish (CTE). The coordinated MPCB and DISH joint inspection has not taken place without any official intimation or pause reason.');
                  }}
                  className="text-[11px] bg-white text-blue-950 px-2.5 py-1 rounded-md border border-blue-300 font-semibold hover:bg-blue-100/60 transition-colors cursor-pointer shadow-2xs"
                >
                  📅 1. Joint Inspection Delay (15 Days)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCategory('unreasonable_query');
                    setDepartmentId('dept_dish');
                    setDepartmentName('Directorate of Industrial Safety & Health (DISH / Labour)');
                    setSubject('Repetitive Query raised for document already in Verified Document Locker');
                    setDescription('Scrutiny officer raised a query asking for Factory Triplicate Architectural Blueprints, which were already verified by Gemini AI and attached from the single-upload Document Locker on Day 1.');
                  }}
                  className="text-[11px] bg-white text-blue-950 px-2.5 py-1 rounded-md border border-blue-300 font-semibold hover:bg-blue-100/60 transition-colors cursor-pointer shadow-2xs"
                >
                  📄 2. Repetitive / Redundant Query
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Grievance / Appeal Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-xs bg-slate-50 font-medium"
                >
                  <option value="sla_breach">Statutory SLA Timeline Breach (RTS Delay)</option>
                  <option value="unreasonable_query">Unreasonable / Repetitive Department Query</option>
                  <option value="inspection_delayed">Joint Inspection Delay Beyond 15 Days</option>
                  <option value="fee_dispute">Fee Calculation or Premium Calculation Dispute</option>
                  <option value="department_inaction">Officer Inaction / Unreasonable Withholding</option>
                  <option value="other">General Administrative Grievance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Concerned Department</label>
                <select
                  value={departmentId}
                  onChange={handleDepartmentChange}
                  className="w-full p-2.5 border rounded-lg text-xs bg-slate-50 font-medium"
                >
                  <option value="dept_mpcb">Maharashtra Pollution Control Board (MPCB)</option>
                  <option value="dept_dish">Directorate of Industrial Safety & Health (DISH / Labour)</option>
                  <option value="dept_fire">Maharashtra Fire Prevention Services (MFES)</option>
                  <option value="dept_midc">Maharashtra Industrial Development Corporation (MIDC)</option>
                  <option value="dept_msedcl">Maharashtra State Electricity Distribution Co (MSEDCL)</option>
                  <option value="dept_state_nodal">State Nodal Single Window Directorate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject / Summary</label>
                <input
                  type="text"
                  placeholder="e.g. MPCB CTE scrutiny delayed past 30-day statutory SLA"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Facts & Grievance Statement</label>
                <textarea
                  rows={4}
                  placeholder="State the application number, dates of submission, and the specific statutory timeline breach or issue encountered..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-xs"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" loading={submitting} className="flex-1 font-bold shadow-xs">
                  Escalate to Appellate Authority
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
