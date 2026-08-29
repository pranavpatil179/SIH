import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { approvalService } from '../../services/approvalService';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SLAIndicator } from '../../components/ui/SLAIndicator';
import { Badge } from '../../components/ui/Badge';
import { ArrowLeft, MessageSquare, FileText, CheckCircle2, AlertCircle, Eye, Calendar, Sparkles, Building2, User } from 'lucide-react';
import { formatDate, formatDateTime } from '../../lib/utils';
import { toast } from 'sonner';

export default function ApplicationDetailPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'queries' | 'inspections' | 'documents' | 'history'>('overview');
  
  // Query Response State
  const [responseMap, setResponseMap] = useState<Record<string, string>>({});
  const [submittingResponse, setSubmittingResponse] = useState<string | null>(null);

  useEffect(() => {
    loadDetail();
  }, [applicationId]);

  async function loadDetail() {
    if (!applicationId) return;
    try {
      const res = await approvalService.getApplicationDetail(applicationId);
      setApplication(res.application || res.data);
    } catch (err: any) {
      toast.error('Failed to load application detail');
    } finally {
      setLoading(false);
    }
  }

  const handleSendResponse = async (queryId: string) => {
    const text = responseMap[queryId];
    if (!text?.trim()) {
      toast.error('Please enter your response');
      return;
    }
    setSubmittingResponse(queryId);
    try {
      await approvalService.respondToQuery(queryId, text);
      toast.success('Query response submitted to the Department Officer for re-scrutiny!');
      setResponseMap(prev => ({ ...prev, [queryId]: '' }));
      await loadDetail();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit response');
    } finally {
      setSubmittingResponse(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-bold">Application Not Found</h3>
        <Link to="/applications"><Button className="mt-4">Back to Applications</Button></Link>
      </div>
    );
  }

  const approvals = application.application_approvals || [];
  const allQueries = approvals.flatMap((a: any) => (a.queries || []).map((q: any) => ({ ...q, approval_name: a.approval_types?.name, department_name: a.departments?.name })));
  const allInspections = application.inspections || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/applications" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Applications
        </Link>
      </div>

      <PageHeader
        title={`Application Package: ${application.projects?.name || 'Project Clearances'}`}
        subtitle={`Submitted for ${application.projects?.businesses?.name || 'Business'} • ID: ${application.id}`}
        actions={<StatusBadge status={application.status} />}
      />

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-6">
        {[
          { id: 'overview', label: `Clearances (${approvals.length})` },
          { id: 'queries', label: `Officer Queries (${allQueries.length})` },
          { id: 'inspections', label: `Inspections (${allInspections.length})` },
          { id: 'documents', label: 'Attached Vault Documents' },
          { id: 'history', label: 'Audit Trail' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-800 text-primary-800 font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview (Department Clearances) */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {approvals.map((item: any) => (
              <Card key={item.id} className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base">{item.approval_types?.name || item.approval_type_id}</h4>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <strong>Department:</strong> {item.departments?.name || item.department_id} • 
                      <strong> Authority:</strong> {item.approval_types?.authority || 'Competent Authority'}
                    </p>
                    {item.officer_notes && (
                      <p className="text-xs text-foreground bg-slate-50 p-2 rounded mt-2 border">
                        <strong>Officer Scrutiny Note:</strong> {item.officer_notes}
                      </p>
                    )}
                    {item.approval_number && (
                      <p className="text-xs text-green-700 font-bold font-mono">
                        Certificate #: {item.approval_number}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col md:items-end gap-2">
                    {item.sla_due_at && <SLAIndicator dueDate={item.sla_due_at} />}
                    <span className="text-xs text-muted-foreground">
                      SLA Limit: {item.approval_types?.sla_days || 30} Working Days
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Queries */}
      {activeTab === 'queries' && (
        <div className="space-y-4">
          {allQueries.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2" />
                <h4 className="font-bold text-sm">No Department Queries Raised</h4>
                <p className="text-xs text-muted-foreground">Your documentation is currently under standard scrutiny.</p>
              </CardContent>
            </Card>
          ) : (
            allQueries.map((query: any) => (
              <Card key={query.id} className="border-amber-200 bg-amber-50/10">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-amber-950">
                      Query on {query.approval_name} ({query.department_name})
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Raised on {formatDate(query.created_at)}</p>
                  </div>
                  <Badge variant={query.status === 'open' ? 'warning' : 'success'}>
                    {query.status === 'open' ? 'Response Required' : 'Responded'}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="p-3 bg-white rounded border border-amber-200 text-sm">
                    <p className="font-semibold text-xs text-muted-foreground mb-1">Official Query from Scrutiny Officer:</p>
                    <p className="text-foreground">{query.question}</p>
                  </div>

                  {/* Gemini AI Plain Language Clarification */}
                  <div className="p-3 bg-indigo-50/80 rounded border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">AI Clarification of Department Requirement:</span>
                      <p className="mt-0.5">
                        The officer requires additional verification details. Ensure you provide clear numbers and cross-reference with your uploaded factory blueprint or financial certificate.
                      </p>
                    </div>
                  </div>

                  {/* Responses */}
                  {query.responses && query.responses.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-bold text-foreground">Submitted Responses:</p>
                      {query.responses.map((resp: any) => (
                        <div key={resp.id} className="p-3 bg-slate-50 rounded border text-xs">
                          <p className="text-foreground">{resp.response}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Submitted on {formatDateTime(resp.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Response Form */}
                  {query.status === 'open' && (
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-semibold text-foreground">Your Official Response / Clarification:</label>
                      <textarea
                        rows={3}
                        value={responseMap[query.id] || ''}
                        onChange={(e) => setResponseMap({ ...responseMap, [query.id]: e.target.value })}
                        placeholder="Provide details or reference uploaded document IDs..."
                        className="w-full p-2 text-sm border border-border rounded-md bg-white focus:ring-2 focus:ring-primary-800 focus:outline-none"
                      />
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          loading={submittingResponse === query.id}
                          onClick={() => handleSendResponse(query.id)}
                        >
                          Submit Clarification to Officer
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab: Inspections */}
      {activeTab === 'inspections' && (
        <div className="space-y-4">
          {allInspections.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <h4 className="font-bold text-sm">No Inspections Scheduled Yet</h4>
                <p className="text-xs text-muted-foreground">If required, officers will schedule site visits after preliminary scrutiny.</p>
              </CardContent>
            </Card>
          ) : (
            allInspections.map((insp: any) => (
              <Card key={insp.id} className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm">{insp.inspection_type || 'On-site Factory Inspection'}</h4>
                    <p className="text-xs text-muted-foreground">Inspector: {insp.inspector_name || 'Assigned Officer'}</p>
                    <p className="text-xs text-foreground mt-1">Scheduled: {insp.scheduled_at ? formatDateTime(insp.scheduled_at) : 'Date TBD'}</p>
                  </div>
                  <Badge variant="info">{insp.status}</Badge>
                </div>
                {insp.findings && (
                  <div className="mt-3 p-3 bg-slate-50 rounded border text-xs">
                    <p className="font-semibold">Inspection Findings / Outcome:</p>
                    <p className="mt-0.5">{insp.findings}</p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab: Documents */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {application.documents && application.documents.length > 0 ? (
            application.documents.map((doc: any) => (
              <Card key={doc.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary-800" />
                  <div>
                    <p className="text-sm font-semibold">{doc.doc_type}</p>
                    <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                  </div>
                </div>
                <StatusBadge status={doc.validation_status || 'valid'} />
              </Card>
            ))
          ) : (
            <div className="col-span-2 text-center py-8 text-xs text-muted-foreground">
              Documents attached from your reusable Document Vault.
            </div>
          )}
        </div>
      )}

      {/* Tab: Audit History */}
      {activeTab === 'history' && (
        <div className="bg-white border border-border rounded-lg p-5 space-y-4">
          <h4 className="font-bold text-sm">Regulatory Audit Trail</h4>
          <div className="border-l-2 border-primary-200 ml-3 space-y-4 pl-4 text-xs">
            <div>
              <p className="font-semibold text-foreground">Application Created & Submitted</p>
              <p className="text-muted-foreground">{formatDateTime(application.created_at)}</p>
            </div>
            {approvals.map((aa: any) => (
              <div key={aa.id}>
                <p className="font-semibold text-foreground">Routed to {aa.departments?.name || aa.department_id}</p>
                <p className="text-muted-foreground">Status: {aa.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
