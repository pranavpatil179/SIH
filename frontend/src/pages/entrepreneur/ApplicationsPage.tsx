import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { businessService } from '../../services/businessService';
import { approvalService } from '../../services/approvalService';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SLAIndicator } from '../../components/ui/SLAIndicator';
import { ClipboardList, ChevronRight, Building2, Calendar, FileText, ArrowUpRight } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { toast } from 'sonner';
import type { Business, ApplicationApproval } from '../../types';

export default function ApplicationsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [approvals, setApprovals] = useState<ApplicationApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const biz = await businessService.getMyBusiness();
        setBusiness(biz);
        if (biz) {
          const res = await approvalService.getApplications(biz.id);
          setApprovals(res);
        }
      } catch (err: any) {
        toast.error('Failed to load applications');
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

  const filteredApprovals = filterStatus === 'all'
    ? approvals
    : approvals.filter(a => a.status === filterStatus);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clearance Applications & Approvals Tracking"
        subtitle="Track live department review progress, answer officer queries, and monitor statutory completion dates"
        actions={
          <Link to="/roadmap">
            <Button className="font-bold shadow-xs">
              <ClipboardList className="w-4 h-4 mr-1" /> View AI Roadmap
            </Button>
          </Link>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `All Clearances (${approvals.length})` },
          { id: 'submitted', label: 'In Officer Review' },
          { id: 'query_raised', label: 'Action Needed (Queries)' },
          { id: 'inspection_scheduled', label: 'Site Visit Scheduled' },
          { id: 'approved', label: 'Approved & Granted' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              filterStatus === tab.id
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applications Table / Cards */}
      {filteredApprovals.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-bold mb-1">No Applications Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-6">
              You haven't submitted any approval applications matching this filter.
            </p>
            <Link to="/roadmap">
              <Button>Generate Approval Roadmap</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white border border-border rounded-lg shadow-sm divide-y divide-border overflow-hidden">
          {filteredApprovals.map((app) => (
            <Link
              key={app.id}
              to={`/applications/${app.application_id || app.id}`}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
            >
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base text-foreground">
                    {app.approval_type?.name || app.approval_type_id}
                  </h4>
                  <StatusBadge status={app.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Department:</strong> {app.department?.name || app.department_id}
                </p>
                {app.approval_number && (
                  <p className="text-xs text-secondary-700 font-mono font-bold">
                    Reg / Certificate #: {app.approval_number}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span>Submitted: {app.submitted_at ? formatDate(app.submitted_at) : 'N/A'}</span>
                  {app.requires_inspection && (
                    <span className="text-amber-600 font-medium">🔍 On-site Inspection Applicable</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3 flex-shrink-0">
                {app.sla_due_at && <SLAIndicator dueDate={app.sla_due_at} />}
                <Button variant="outline" size="sm" className="gap-1">
                  View Dossier <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
