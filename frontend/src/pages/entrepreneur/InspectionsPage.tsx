import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SLAIndicator } from '../../components/ui/SLAIndicator';
import {
  Calendar as CalendarIcon, Clock, MapPin, User, CheckCircle2,
  AlertTriangle, ShieldCheck, FileCheck2, Building2, Sparkles, AlertCircle
} from 'lucide-react';
import { formatDateTime, formatDate, getRealTimeRemaining } from '../../lib/utils';
import { toast } from 'sonner';

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCir, setSelectedCir] = useState<any | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/inspections');
        const data = res.data.inspections || res.data || [];
        if (data.length === 0) {
          // Demo default joint inspection record
          setInspections([
            {
              id: 'insp_demo_01',
              inspection_type: 'Joint Statutory Single-Window Site Inspection (MPCB + DISH + Fire)',
              scheduled_at: new Date(Date.now() + 2 * 86400000).toISOString(),
              inspector_name: 'Joint Team (Dr. A. P. Shinde, MPCB & V. R. Kulkarni, DISH)',
              location: 'Plot A-42, MIDC Chakan Phase II, Pune',
              status: 'scheduled',
              departments: ['MPCB', 'DISH', 'MFES'],
              findings: null,
            }
          ]);
        } else {
          setInspections(data);
        }
      } catch (err: any) {
        toast.error('Failed to load inspection records');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Joint Statutory Site Inspection Schedule & Live Countdown"
        subtitle="Track scheduled inspector visits, on-site readiness checklists, and statutory document approval timeframes"
      />

      {inspections.length === 0 ? (
        <Card className="text-center py-16 shadow-sm border-slate-200">
          <CardContent className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <CalendarIcon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#002046]">No Site Visits Scheduled</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When department scrutiny officers (MPCB, DISH, MFES) pick a date on their calendar to visit your facility, your scheduled visit date and live approval countdown will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {inspections.map((insp) => {
            const timeRemaining = insp.scheduled_at ? getRealTimeRemaining(insp.scheduled_at) : null;
            const isCompleted = insp.status === 'completed';

            // Post-inspection approval statutory due time (e.g. 7 days after inspection)
            const postInspectionApprovalDue = insp.scheduled_at
              ? new Date(new Date(insp.scheduled_at).getTime() + 7 * 86400000).toISOString()
              : new Date(Date.now() + 7 * 86400000).toISOString();

            return (
              <div
                key={insp.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden"
              >
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#002046] via-[#0b2d59] to-[#1b365d] text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] bg-white/20 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider text-blue-200">
                        Maharashtra Single-Window RTS Inspection
                      </span>
                      <Badge variant={isCompleted ? 'success' : 'warning'}>
                        {isCompleted ? 'Inspection Completed' : 'Visit Scheduled'}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-extrabold text-white tracking-tight">
                      {insp.inspection_type || 'Joint Field Inspection'}
                    </h3>
                    <p className="text-xs text-blue-200/80 mt-0.5">
                      Coordinated Joint Verification across participating regulatory authorities
                    </p>
                  </div>

                  {/* Countdown Card */}
                  {!isCompleted && insp.scheduled_at && (
                    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-3.5 text-center min-w-[200px]">
                      <span className="text-[10px] uppercase font-bold text-blue-200 block mb-0.5">
                        Countdown to Officer Visit
                      </span>
                      <div className="font-mono text-base font-extrabold text-white flex items-center justify-center gap-1">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        <span>{timeRemaining?.formatted}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-6">
                  {/* Key Visit Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-blue-600" /> Scheduled Date & Time
                      </span>
                      <p className="text-sm font-bold text-[#002046]">
                        {insp.scheduled_at ? formatDateTime(insp.scheduled_at) : 'Date TBD'}
                      </p>
                      <p className="text-[11px] text-slate-500">Official visiting slot allocated by department</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-600" /> Assigned Inspector
                      </span>
                      <p className="text-sm font-bold text-[#002046]">
                        {insp.inspector_name || 'Designated Inspection Officer'}
                      </p>
                      <p className="text-[11px] text-slate-500">Field Scrutiny Section • DIC / MPCB</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" /> Inspection Venue
                      </span>
                      <p className="text-sm font-bold text-[#002046] truncate">
                        {insp.location || 'MIDC Industrial Area, Pune'}
                      </p>
                      <p className="text-[11px] text-slate-500">Registered Plant & Manufacturing Facility</p>
                    </div>
                  </div>

                  {/* Statutory Document Approval Timeframe Indicator */}
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-blue-700" />
                        <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                          Post-Inspection Document Approval SLA Limit
                        </h4>
                      </div>
                      <p className="text-xs text-blue-900/80">
                        Under Maharashtra Right to Public Services Act (RTS), the visiting authority must finalize the inspection report and issue the clearance within standard statutory turnaround days:
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      <SLAIndicator dueDate={postInspectionApprovalDue} className="text-xs py-1.5 px-3" />
                    </div>
                  </div>

                  {/* Checklist of On-Site Documents to Keep Ready */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                    <h4 className="text-xs font-bold text-[#002046] flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-emerald-600" />
                      Physical Documents Checklist to Keep Ready on Site:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="text-slate-700">Original MIDC Plot Allotment & Lease Deed</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="text-slate-700">Sanctioned Factory Structural Drawing Blueprints</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="text-slate-700">Fire Fighting Equipment & Hydrant Test Logbook</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="text-slate-700">Effluent Treatment Plant (ETP/STP) Flow Diagram</span>
                      </div>
                    </div>
                  </div>

                  {/* Common Inspection Report (CIR) Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Coordinated Departments: <strong>MPCB (Pollution) + DISH (Labour) + MFES (Fire Services)</strong></span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCir(insp)}
                      className="text-xs font-bold border-blue-300 text-blue-950 bg-blue-50/50 hover:bg-blue-100 flex items-center gap-1.5 shadow-2xs"
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                      View Unified Common Inspection Report (CIR)
                    </Button>
                  </div>

                  {/* Official Findings if completed */}
                  {insp.findings && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs font-bold text-emerald-950">
                          Official Inspection Findings • Result: {insp.result?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 leading-relaxed">{insp.findings}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Common Inspection Report (CIR) Modal Viewer */}
      {selectedCir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-200">
            {/* Govt Header Banner */}
            <div className="border-b-2 border-[#002046] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[#002046]">
              <div>
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase block">
                  GOVERNMENT OF MAHARASHTRA • INDUSTRY SINGLE WINDOW
                </span>
                <h3 className="text-lg font-black text-[#002046] flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-blue-700" />
                  Common Statutory Inspection Report (CIR)
                </h3>
                <p className="text-xs text-slate-600">
                  Form CIR-1 • Multi-Agency Single-Window Physical Verification
                </p>
              </div>

              <div className="text-right sm:border-l sm:pl-4 border-slate-200">
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 block">
                  CIR-MH-2026-9921-PUNE
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">QR Verification Enabled</span>
              </div>
            </div>

            {/* Factory Details */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Unit Name</span>
                <span className="font-bold text-[#002046]">Apex Precision Formulations Ltd</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Location / Plot</span>
                <span className="font-bold text-slate-700">Plot A-42, MIDC Chakan Phase II</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">GPS Coordinates</span>
                <span className="font-mono text-slate-600">18.7606° N, 73.8636° E</span>
              </div>
            </div>

            {/* 3 Department Verification Matrix */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-[#002046] uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Joint Department Findings & Verification Matrix (3-in-1 Sign-off):
              </h4>

              <div className="space-y-2.5">
                {/* 1. MPCB */}
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      1. Maharashtra Pollution Control Board (MPCB)
                    </span>
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300">
                      COMPLIANT & APPROVED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700">
                    • 50 KLD Zero Liquid Discharge (ZLD) Effluent Treatment Plant civil tanks inspected.<br />
                    • 30m air stack with wet scrubbing mechanism verified as per Orange category norms.
                  </p>
                  <p className="text-[10px] text-emerald-800 font-mono pt-1">
                    Signed by: Dr. A. P. Shinde (MPCB Field Officer, Pune-II)
                  </p>
                </div>

                {/* 2. DISH */}
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      2. Directorate of Industrial Safety & Health (DISH / Labour)
                    </span>
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300">
                      COMPLIANT & APPROVED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700">
                    • Factory machinery spacing conforms to Rule 3-A of Maharashtra Factory Rules.<br />
                    • Emergency escape corridors, mechanical ventilation, and first-aid rooms verified.
                  </p>
                  <p className="text-[10px] text-emerald-800 font-mono pt-1">
                    Signed by: V. R. Kulkarni (Joint Director, DISH Pune Division)
                  </p>
                </div>

                {/* 3. MFES / Fire */}
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      3. Maharashtra Fire Prevention & Life Safety (MFES)
                    </span>
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300">
                      COMPLIANT & APPROVED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700">
                    • 6-metre clear motorable peripheral ring road for fire brigade entry verified.<br />
                    • Dedicated 100,000 L underground static fire water tank & diesel booster pumps tested at 3.5 bar.
                  </p>
                  <p className="text-[10px] text-emerald-800 font-mono pt-1">
                    Signed by: S. G. Mane (Chief Fire Officer, MIDC Fire Services)
                  </p>
                </div>
              </div>
            </div>

            {/* Final Joint Statutory Conclusion */}
            <div className="p-3.5 bg-blue-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold uppercase text-[10px] text-blue-200 block">Unified Joint Verification Outcome:</span>
                <span className="font-black text-sm text-emerald-300">
                  PASSED — ALL 3 DEPARTMENTS CLEAR UNIT FOR FORMAL GRANT
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  toast.success('Official CIR Certificate downloaded with digital seals');
                  setSelectedCir(null);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Download Signed CIR PDF
              </Button>
            </div>

            <div className="flex justify-end pt-1">
              <Button variant="outline" size="sm" onClick={() => setSelectedCir(null)}>
                Close Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
