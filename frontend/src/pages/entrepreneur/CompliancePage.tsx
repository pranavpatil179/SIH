import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, AlertCircle, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { toast } from 'sonner';

export default function CompliancePage() {
  const [obligations, setObligations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/compliance');
        setObligations(res.data.compliance || res.data.obligations || []);
      } catch (err: any) {
        toast.error('Failed to load compliance records');
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

  const overdue = obligations.filter(o => o.status === 'overdue');
  const dueSoon = obligations.filter(o => o.status === 'due_soon' || o.status === 'pending');
  const compliant = obligations.filter(o => o.status === 'compliant' || o.status === 'completed');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Post-Approval Statutory Compliance & Obligation Tracker"
        subtitle="Automatic recurring filings and environment audit timelines created from your approved permits"
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-100 text-green-800">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-950">{compliant.length}</p>
              <p className="text-xs text-green-800">Compliant Filings</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-800">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-950">{dueSoon.length}</p>
              <p className="text-xs text-amber-800">Upcoming Obligations</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-100 text-red-800">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-950">{overdue.length}</p>
              <p className="text-xs text-red-800">Overdue Filings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Obligation List */}
      {obligations.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-bold mb-1">No Compliance Obligations Yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Once your Factory Licence, MPCB Consent to Operate, or Fire NOC are granted, recurring statutory return requirements will automatically populate here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {obligations.map((item) => (
            <Card key={item.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                  <Badge variant={item.status === 'overdue' ? 'danger' : item.status === 'completed' ? 'success' : 'warning'}>
                    {item.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Frequency:</strong> {item.frequency} • <strong>Authority:</strong> {item.department_id || 'Department'}
                </p>
                {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Statutory Deadline</p>
                  <p className="text-xs font-bold text-foreground">{formatDate(item.due_date)}</p>
                </div>
                <Button size="sm" variant="outline" className="text-xs">
                  Submit Return
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
