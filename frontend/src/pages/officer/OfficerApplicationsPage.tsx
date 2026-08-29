import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SLAIndicator } from '../../components/ui/SLAIndicator';
import { ClipboardList, ChevronRight, Search } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { toast } from 'sonner';

export default function OfficerApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/applications');
        setApplications(res.data.applications || []);
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

  const filtered = applications.filter((a) => {
    const name = a.approval_type?.name || a.approval_type_id || '';
    const biz = a.applications?.projects?.businesses?.name || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || biz.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Scrutiny Queue"
        subtitle="Review applicant submissions, scrutinize documents, raise queries, or sanction approvals"
      />

      <div className="flex items-center gap-3 bg-white p-3 rounded-lg border">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by approval name or enterprise..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs outline-none bg-transparent"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No applications match your search criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white border rounded-lg divide-y">
          {filtered.map((app) => (
            <div key={app.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm">{app.approval_type?.name || app.approval_type_id}</h4>
                  <StatusBadge status={app.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Applicant: <strong>{app.applications?.projects?.businesses?.name || 'ABC Mfg'}</strong> • State: Maharashtra
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Submitted: {formatDate(app.submitted_at || app.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {app.sla_due_at && <SLAIndicator dueDate={app.sla_due_at} />}
                <Link to={`/officer/applications/${app.id}`}>
                  <Button size="sm">Scrutinize</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
