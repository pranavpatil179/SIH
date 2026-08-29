import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ListChecks } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/approvals/types');
        setApprovals(res.data.types || res.data || []);
      } catch (err: any) {
        toast.error('Failed to load approval definitions');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statutory Approval Types & Applicability Rules"
        subtitle="Configure state clearances, document requirement matrices, and inspection flags"
      />

      <div className="bg-white border rounded-lg divide-y">
        {approvals.map((a) => (
          <div key={a.id} className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-foreground">{a.name}</h4>
              <p className="text-xs text-muted-foreground">{a.authority} • {a.legal_basis}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {(a.required_documents || []).map((doc: string, idx: number) => (
                  <span key={idx} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                    {doc}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {a.requires_inspection && <Badge variant="warning">Inspection Required</Badge>}
              <Badge variant="info">SLA: {a.sla_days} Days</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
