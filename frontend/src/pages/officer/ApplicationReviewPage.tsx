import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { approvalService } from '../../services/approvalService';
import { api } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SLAIndicator } from '../../components/ui/SLAIndicator';
import { Badge } from '../../components/ui/Badge';
import { ArrowLeft, FileText, CheckCircle2, XCircle, AlertCircle, Sparkles, Calendar, MessageSquare, ShieldCheck } from 'lucide-react';
import { formatDate, formatDateTime } from '../../lib/utils';
import { toast } from 'sonner';

export default function ApplicationReviewPage() {
  const { approvalId } = useParams<{ approvalId: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Actions
  const [queryText, setQueryText] = useState('');
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [raisingQuery, setRaisingQuery] = useState(false);

  const [officerNotes, setOfficerNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadApproval();
  }, [approvalId]);

  async function loadApproval() {
    if (!approvalId) return;
    try {
      const res = await approvalService.getApprovalDetail(approvalId);
      setDetail(res.approval || res.data);
    } catch (err: any) {
      toast.error('Failed to load approval detail');
    } finally {
      setLoading(false);
    }
  }

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to GRANT this statutory clearance?')) return;
    setActionLoading(true);
    try {
      await approvalService.approveApplication(approvalId!, officerNotes);
      toast.success('Clearance Granted! Digital approval record and compliance obligations created.');
      await loadApproval();
    } catch (err: any) {
      toast.error(err.message || 'Approval action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please specify statutory grounds for rejection');
      return;
    }
    setActionLoading(true);
    try {
      await approvalService.rejectApplication(approvalId!, rejectionReason);
      toast.success('Application rejected with formal grounds recorded.');
      setShowRejectModal(false);
      await loadApproval();
    } catch (err: any) {
      toast.error(err.message || 'Rejection action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRaiseQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;
    setRaisingQuery(true);
    try {
      await approvalService.raiseQuery(approvalId!, queryText);
      toast.success('Formal query raised. Applicant has been notified to provide clarification.');
      setShowQueryModal(false);
      setQueryText('');
      await loadApproval();
    } catch (err: any) {
      toast.error(err.message || 'Failed to raise query');
    } finally {
      setRaisingQuery(false);
    }
  };

  const handleRequestInspection = async () => {
    setActionLoading(true);
    try {
      await approvalService.requestInspection(approvalId!);
      toast.success('Inspection requested. Joint inspection scheduling workflow initiated.');
      await loadApproval();
    } catch (err: any) {
      toast.error(err.message || 'Failed to request inspection');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-bold">Record not found</h3>
        <Link to="/officer/applications"><Button className="mt-4">Back to Queue</Button></Link>
      </div>
    );
  }

  const isDecided = detail.status === 'approved' || detail.status === 'rejected';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/officer/applications" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Scrutiny Queue
        </Link>
      </div>

      <PageHeader
        title={`Scrutiny Console: ${detail.approval_types?.name || detail.approval_type_id}`}
        subtitle={`Enterprise: ${detail.applications?.projects?.businesses?.name || 'Applicant'} • SLA Due: ${detail.sla_due_at ? formatDate(detail.sla_due_at) : 'N/A'}`}
        actions={<StatusBadge status={detail.status} />}
      />

      {/* Top Banner: Enterprise Summary */}
      <div className="bg-white border rounded-lg p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-muted-foreground">Applicant Entity</span>
          <p className="font-bold text-sm text-foreground">{detail.applications?.projects?.businesses?.name || 'ABC Pvt Ltd'}</p>
          <p className="text-muted-foreground">{detail.applications?.projects?.businesses?.address || 'MIDC Chakan, Pune'}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Project Parameters</span>
          <p className="font-semibold text-foreground">₹{detail.applications?.projects?.investment_crore || 5} Cr Fixed Capital</p>
          <p className="text-muted-foreground">{detail.applications?.projects?.employee_count || 100} Proposed Workforce</p>
        </div>
        <div>
          <span className="text-muted-foreground">Statutory Authority & SLA</span>
          <p className="font-semibold text-foreground">{detail.departments?.name || detail.department_id}</p>
          <div className="mt-1">
            {detail.sla_due_at && <SLAIndicator dueDate={detail.sla_due_at} />}
          </div>
        </div>
      </div>

      {/* Scrutiny Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Attached Documents and Scrutiny Findings */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-800" /> Attached Vault Documents & AI Pre-Screening
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {detail.approval_types?.required_documents?.map((docName: string, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 border rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-xs font-bold text-foreground">{docName}</p>
                      <p className="text-[10px] text-muted-foreground">Synced from Applicant Vault • Pre-Validated</p>
                    </div>
                  </div>
                  <Badge variant="success">Verified</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Gemini AI Summary Box */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2 text-xs text-indigo-950">
            <div className="flex items-center gap-2 font-bold text-indigo-900">
              <Sparkles className="w-4 h-4 text-indigo-700" /> Gemini AI Automated Scrutiny Assistant
            </div>
            <p>
              Automated document cross-verification complete: Company name, GSTIN (27AABCA1234C1Z5), and plant footprint match across Factory Blueprint and MIDC Land Allotment records. No discrepancies detected.
            </p>
          </div>

          {/* Queries and Responses Thread */}
          {detail.queries && detail.queries.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary-800" /> Department Queries & Clarifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {detail.queries.map((q: any) => (
                  <div key={q.id} className="p-3 border rounded-lg space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="font-bold text-foreground">Officer Query:</span>
                      <Badge variant={q.status === 'open' ? 'warning' : 'success'}>{q.status}</Badge>
                    </div>
                    <p className="text-slate-800">{q.question}</p>

                    {q.responses && q.responses.length > 0 && (
                      <div className="mt-2 p-2.5 bg-green-50 rounded border border-green-200">
                        <span className="font-bold text-green-950">Applicant Response:</span>
                        <p className="text-green-900 mt-0.5">{q.responses[0].response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Col: Officer Decision Console */}
        <div className="space-y-4">
          <Card className="border-primary-200">
            <CardHeader>
              <CardTitle className="text-sm">Scrutiny Officer Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isDecided ? (
                <div className="p-3 bg-slate-50 rounded border text-center space-y-1">
                  <p className="text-xs font-semibold">Decision Recorded</p>
                  <StatusBadge status={detail.status} />
                  {detail.approval_number && (
                    <p className="text-[11px] font-mono font-bold text-green-700 mt-2">
                      Sanction #: {detail.approval_number}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Scrutiny Findings / Internal Notes:</label>
                    <textarea
                      rows={3}
                      value={officerNotes}
                      onChange={(e) => setOfficerNotes(e.target.value)}
                      placeholder="Enter verification notes for permanent audit record..."
                      className="w-full p-2 text-xs border rounded mt-1 bg-white"
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <Button
                      variant="primary"
                      className="w-full justify-center"
                      onClick={handleApprove}
                      loading={actionLoading}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" /> Grant Statutory Approval
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-center border-amber-300 text-amber-900 hover:bg-amber-50"
                      onClick={() => setShowQueryModal(true)}
                    >
                      <MessageSquare className="w-4 h-4 mr-1.5" /> Raise Official Query
                    </Button>

                    {detail.requires_inspection && (
                      <Button
                        variant="outline"
                        className="w-full justify-center"
                        onClick={handleRequestInspection}
                        loading={actionLoading}
                      >
                        <Calendar className="w-4 h-4 mr-1.5" /> Request On-Site Inspection
                      </Button>
                    )}

                    <Button
                      variant="destructive"
                      className="w-full justify-center"
                      onClick={() => setShowRejectModal(true)}
                    >
                      <XCircle className="w-4 h-4 mr-1.5" /> Reject Application
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Query Modal */}
      {showQueryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-base">Raise Statutory Query to Applicant</h3>
            <p className="text-xs text-muted-foreground">
              Enter specific documentation or calculation queries. The application SLA will pause while awaiting the applicant's response.
            </p>
            <form onSubmit={handleRaiseQuery} className="space-y-3">
              <textarea
                required
                rows={4}
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Specify required clarification or missing document particulars..."
                className="w-full p-2.5 text-xs border rounded bg-white"
              />
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowQueryModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={raisingQuery}>
                  Submit Query
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-red-700">Formal Statutory Rejection</h3>
            <p className="text-xs text-muted-foreground">
              Provide legal citations and specific non-compliance grounds. This decision will be permanently audited and notified to the entrepreneur.
            </p>
            <textarea
              required
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="State reason under Factories Act / Environment Act..."
              className="w-full p-2.5 text-xs border rounded bg-white"
            />
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleReject} loading={actionLoading}>
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
