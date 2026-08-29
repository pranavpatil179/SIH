import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Calendar as CalendarIcon, Clock, MapPin, User, CheckCircle2,
  Plus, ChevronLeft, ChevronRight, AlertCircle, Sparkles, Building2, FileCheck
} from 'lucide-react';
import { formatDateTime, formatDate, formatTime } from '../../lib/utils';
import { toast } from 'sonner';

export default function OfficerInspectionsPage() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(Date.now() + 2 * 86400000));
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Form State
  const [selectedAppId, setSelectedAppId] = useState('');
  const [inspectorName, setInspectorName] = useState('S. K. Deshmukh (DIC Nodal Officer)');
  const [inspectionType, setInspectionType] = useState('Joint Single-Window Statutory Verification');
  const [inspectionTime, setInspectionTime] = useState('11:00');
  const [locationNotes, setLocationNotes] = useState('Plot A-42, MIDC Chakan Phase II, Pune');
  const [saving, setSaving] = useState(false);

  // Complete modal state
  const [completingInsp, setCompletingInsp] = useState<any | null>(null);
  const [findingsText, setFindingsText] = useState('On-site verification completed. All safety, fire hydrants, and effluent containment measures meet statutory norms.');
  const [inspectionResult, setInspectionResult] = useState<'approved' | 'action_required'>('approved');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [inspRes, appRes] = await Promise.all([
        api.get('/api/inspections'),
        api.get('/api/applications'),
      ]);
      setInspections(inspRes.data.inspections || []);
      const apps = appRes.data.applications || [];
      setApplications(apps);
      if (apps.length > 0) {
        setSelectedAppId(apps[0].application_id || apps[0].id);
      }
    } catch (err: any) {
      toast.error('Failed to load inspection data');
    } finally {
      setLoading(false);
    }
  }

  // Calendar Date Calculations
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) {
      toast.error('Please select an application');
      return;
    }

    setSaving(true);
    try {
      const [hours, minutes] = inspectionTime.split(':');
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(Number(hours), Number(minutes), 0, 0);

      await api.post('/api/inspections/schedule', {
        application_id: selectedAppId,
        scheduled_at: scheduledDateTime.toISOString(),
        inspector_name: inspectorName,
        inspection_type: inspectionType,
        location: locationNotes,
      });

      toast.success(`Inspection scheduled for ${formatDateTime(scheduledDateTime)}! Applicant notified.`);
      setShowScheduleModal(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule inspection');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingInsp) return;

    try {
      await api.post(`/api/inspections/${completingInsp.id}/complete`, {
        findings: findingsText,
        result: inspectionResult,
      });

      toast.success('Inspection report submitted and clearance decision recorded!');
      setCompletingInsp(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete inspection');
    }
  };

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
        title="Joint Statutory Inspection Calendar"
        subtitle="Schedule on-site inspections, pick dates, and assign multi-department field officers"
        actions={
          <Button onClick={() => setShowScheduleModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Schedule Site Inspection
          </Button>
        }
      />

      {/* Main Grid: Interactive Calendar & Inspection List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Calendar Widget (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-bold text-[#002046] flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                  {monthNames[month]} {year}
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any upcoming date to pick a joint site visit slot
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* Day Labels */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-400 pb-2 border-b border-slate-100">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Day Matrix */}
              <div className="grid grid-cols-7 gap-1.5 pt-2">
                {/* Empty slots for month start */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-14 rounded-lg bg-slate-50/40" />
                ))}

                {/* Days of Month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const slotDate = new Date(year, month, dayNum);
                  const isSelected =
                    selectedDate &&
                    selectedDate.getFullYear() === year &&
                    selectedDate.getMonth() === month &&
                    selectedDate.getDate() === dayNum;

                  const hasInspections = inspections.some((insp) => {
                    if (!insp.scheduled_at) return false;
                    const d = new Date(insp.scheduled_at);
                    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === dayNum;
                  });

                  return (
                    <button
                      key={`day-${dayNum}`}
                      onClick={() => {
                        setSelectedDate(slotDate);
                        setShowScheduleModal(true);
                      }}
                      className={`h-14 p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all relative ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                          : hasInspections
                          ? 'bg-amber-50/80 border-amber-300 text-slate-900 hover:bg-amber-100'
                          : 'bg-white border-slate-200/80 text-slate-700 hover:border-blue-300 hover:bg-blue-50/30'
                      }`}
                    >
                      <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                        {dayNum}
                      </span>
                      {hasInspections && (
                        <span
                          className={`text-[9px] font-bold px-1 py-0.5 rounded truncate ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-amber-500 text-white'
                          }`}
                        >
                          Inspection
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inspection Schedule & Review Queue (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-[#002046] flex items-center justify-between">
                <span>Scheduled Field Inspections</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                  {inspections.length} Active
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {inspections.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <CalendarIcon className="w-8 h-8 mx-auto opacity-50" />
                  <p className="text-xs">No site inspections scheduled yet.</p>
                </div>
              ) : (
                inspections.map((insp) => (
                  <div
                    key={insp.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-[#002046]">
                          {insp.inspection_type || 'Joint Single-Window Inspection'}
                        </h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{insp.inspector_name || 'Designated Officer'}</span>
                        </p>
                      </div>
                      <Badge variant={insp.status === 'completed' ? 'success' : 'warning'}>
                        {insp.status === 'completed' ? 'Completed' : 'Scheduled'}
                      </Badge>
                    </div>

                    <div className="text-[11px] bg-white p-2 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-semibold">{insp.scheduled_at ? formatDateTime(insp.scheduled_at) : 'TBD'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 truncate">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="truncate">{insp.location || 'MIDC Chakan'}</span>
                      </div>
                    </div>

                    {insp.status !== 'completed' && (
                      <Button
                        size="sm"
                        onClick={() => setCompletingInsp(insp)}
                        className="w-full text-xs font-bold py-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Record Inspection Findings
                      </Button>
                    )}

                    {insp.findings && (
                      <div className="p-2 bg-emerald-50/70 border border-emerald-200 rounded-lg text-[11px] text-emerald-900">
                        <span className="font-bold block">Outcome: {insp.result?.toUpperCase()}</span>
                        <span className="text-emerald-700">{insp.findings}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal: Schedule Site Visit */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-[#002046] flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                Schedule Statutory Site Inspection
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Application</label>
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-xs bg-slate-50 font-medium"
                  required
                >
                  {applications.map((app) => (
                    <option key={app.id} value={app.application_id || app.id}>
                      {app.approval_type?.name || 'Industrial Facility Clearance'} • App #{app.id?.substring(0, 8)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Selected Date</label>
                  <input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="w-full p-2.5 border rounded-lg text-xs bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Inspection Time</label>
                  <input
                    type="time"
                    value={inspectionTime}
                    onChange={(e) => setInspectionTime(e.target.value)}
                    className="w-full p-2.5 border rounded-lg text-xs bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Inspector Name</label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Site Location & Factory Address</label>
                <input
                  type="text"
                  value={locationNotes}
                  onChange={(e) => setLocationNotes(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-xs"
                  required
                />
              </div>

              <div className="pt-3 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" loading={saving} className="flex-1">
                  Confirm & Notify Applicant
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Inspection Completion */}
      {completingInsp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="font-bold text-base text-[#002046]">Record Inspection Outcome</h3>
            <form onSubmit={handleCompleteSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Inspection Result</label>
                <select
                  value={inspectionResult}
                  onChange={(e) => setInspectionResult(e.target.value as any)}
                  className="w-full p-2 border rounded-lg text-xs bg-slate-50 font-semibold"
                >
                  <option value="approved">Approved — Compliant with all norms</option>
                  <option value="action_required">Action Required — Minor adjustments needed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Findings & Observations</label>
                <textarea
                  rows={3}
                  value={findingsText}
                  onChange={(e) => setFindingsText(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-xs"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setCompletingInsp(null)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Submit Official Report
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
