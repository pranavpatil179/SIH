import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Gift } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSchemesPage() {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/schemes');
        setSchemes(res.data.schemes || res.data || []);
      } catch (err: any) {
        toast.error('Failed to load schemes');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fiscal Schemes & Incentive Policy Registry"
        subtitle="Manage government subsidies, eligibility rules, and budget allocations"
      />

      <div className="bg-white border rounded-lg divide-y">
        {schemes.map((s) => (
          <div key={s.id} className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-foreground">{s.name}</h4>
              <p className="text-xs text-muted-foreground">{s.authority || 'Government of Maharashtra'}</p>
              <p className="text-xs text-foreground bg-slate-50 p-1.5 rounded">{s.benefit}</p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
