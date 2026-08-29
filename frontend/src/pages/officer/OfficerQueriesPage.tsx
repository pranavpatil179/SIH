import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { MessageSquare, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { toast } from 'sonner';

export default function OfficerQueriesPage() {
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/queries');
        setQueries(res.data.queries || []);
      } catch (err: any) {
        toast.error('Failed to load queries');
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
        title="Department Query Monitor"
        subtitle="Manage and track active applicant clarification requests across your department"
      />

      {queries.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-bold mb-1">No Active Queries</h3>
            <p className="text-xs text-muted-foreground">You haven't raised queries on any pending dossiers.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {queries.map((q) => (
            <Card key={q.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm">{q.application_approvals?.approval_types?.name || 'Clearance Scrutiny'}</h4>
                  <p className="text-xs text-muted-foreground">Raised on: {formatDate(q.created_at)}</p>
                </div>
                <Badge variant={q.status === 'open' ? 'warning' : 'success'}>{q.status}</Badge>
              </div>
              <p className="text-xs bg-slate-50 p-2.5 rounded border text-foreground">
                <strong>Question:</strong> {q.question}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
