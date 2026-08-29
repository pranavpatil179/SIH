import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { SLAIndicator } from '../../components/ui/SLAIndicator';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { BarChart3, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { toast } from 'sonner';

export default function OfficerSLAPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/applications');
        setApplications(res.data.applications || []);
      } catch (err: any) {
        toast.error('Failed to load SLA data');
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
        title="Department Statutory SLA Countdown Tracker"
        subtitle="Real-time statutory time limits under Maharashtra Right to Public Services Act"
      />

      <div className="bg-white border rounded-lg divide-y">
        {applications.map((app) => (
          <div key={app.id} className="p-4 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm">{app.approval_type?.name || app.approval_type_id}</h4>
              <p className="text-xs text-muted-foreground">
                Submitted: {formatDate(app.submitted_at || app.created_at)} • Standard Limit: {app.approval_type?.sla_days || 30} Days
              </p>
            </div>
            <div className="flex items-center gap-3">
              {app.sla_due_at && <SLAIndicator dueDate={app.sla_due_at} />}
              <StatusBadge status={app.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
