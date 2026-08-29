import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { BookOpen } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';
import { toast } from 'sonner';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/audit');
        setLogs(res.data.logs || res.data || []);
      } catch (err: any) {
        toast.error('Failed to load audit trail');
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
        title="Immutable Statutory Audit Trail"
        subtitle="Cryptographically tracked log of all status transitions, query events, and officer approvals"
      />

      {logs.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-xs text-muted-foreground">No audit logs recorded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white border rounded-lg divide-y text-xs">
          {logs.map((log) => (
            <div key={log.id} className="p-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-mono font-bold text-primary-900 bg-primary-50 px-2 py-0.5 rounded">
                  {log.action}
                </span>
                <pre className="text-[11px] bg-slate-50 p-2 rounded mt-1 overflow-x-auto text-slate-700">
                  {JSON.stringify(log.detail || {}, null, 2)}
                </pre>
              </div>
              <span className="text-[10px] text-muted-foreground flex-shrink-0">
                {formatDateTime(log.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
