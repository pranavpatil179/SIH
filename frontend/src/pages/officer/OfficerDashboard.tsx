import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SLAIndicator } from '../../components/ui/SLAIndicator';
import { ClipboardList, AlertCircle, CheckCircle2, Clock, ChevronRight, Eye, Shield, BarChart3 } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { toast } from 'sonner';

export default function OfficerDashboard() {
  const { profile } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/analytics/officer-dashboard');
        setData(res.data);
      } catch (err: any) {
        // Fallback for officer applications directly if analytics endpoint structure differs
        try {
          const apps = await api.get('/api/applications');
          setData({
            total_assigned: apps.data.applications?.length || 0,
            pending_scrutiny: apps.data.applications?.filter((a: any) => a.status === 'submitted').length || 0,
            queries_open: apps.data.applications?.filter((a: any) => a.status === 'query_raised').length || 0,
            sla_breached: 0,
            recent_applications: apps.data.applications?.slice(0, 5) || []
          });
        } catch (e) {
          toast.error('Failed to load officer dashboard');
        }
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

  const apps = data?.recent_applications || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Department Scrutiny Portal: ${profile?.department_id?.toUpperCase() || 'Desk'}`}
        subtitle={`Welcome, Officer ${profile?.full_name || ''} • Competent Authority Scrutiny Console`}
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Assigned Applications', value: data?.total_assigned || 0, icon: ClipboardList, color: 'text-blue-600 bg-blue-50' },
          { label: 'Pending Scrutiny', value: data?.pending_scrutiny || 0, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Active Queries', value: data?.queries_open || 0, icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
          { label: 'SLA Escalations', value: data?.sla_breached || 0, icon: Shield, color: 'text-red-600 bg-red-50' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Applications Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Applications Requiring Action</CardTitle>
          <Link to="/officer/applications" className="text-xs text-primary-800 hover:underline flex items-center gap-1">
            View All Assigned <ChevronRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {apps.length === 0 ? (
            <div className="text-center py-10 text-xs text-muted-foreground">
              No pending applications in your department queue.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {apps.map((app: any) => (
                <div key={app.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-xs sm:text-sm text-[#002046]">{app.approval_type?.name || app.approval_type_id}</h4>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enterprise: {app.applications?.projects?.businesses?.name || 'Applicant'} • District: {app.applications?.projects?.district || 'Pune'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Submitted on: {formatDate(app.submitted_at || app.created_at)}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    {app.sla_due_at && <SLAIndicator dueDate={app.sla_due_at} />}
                    <Link to={`/officer/applications/${app.id}`}>
                      <Button size="sm">Scrutinize Dossier</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
