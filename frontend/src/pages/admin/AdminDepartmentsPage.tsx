import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/approvals/types');
        // Let's get distinct departments or query departments
        const depts = [
          { id: 'mah_labour', name: 'Maharashtra Labour Department', sla: 30 },
          { id: 'mpcb', name: 'Maharashtra Pollution Control Board', sla: 45 },
          { id: 'mah_fire', name: 'Maharashtra Fire Department', sla: 21 },
          { id: 'mseb', name: 'MSEB - Maharashtra State Electricity Board', sla: 30 },
          { id: 'mah_industry', name: 'Industries, Energy & Labour Department', sla: 60 },
          { id: 'epfo_esic', name: 'EPFO / ESIC Regional Directorate', sla: 15 },
        ];
        setDepartments(depts);
      } catch (err: any) {
        toast.error('Failed to load departments');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Registry & SLA Configuration"
        subtitle="Configure competent authorities, standard SLA turnarounds, and officer rosters"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((d) => (
          <Card key={d.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary-50 text-primary-800">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">{d.name}</h4>
                <p className="text-xs text-muted-foreground">Dept Code: {d.id}</p>
              </div>
            </div>
            <Badge variant="info">Default SLA: {d.sla} Days</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
