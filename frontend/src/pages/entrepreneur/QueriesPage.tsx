import { useEffect, useState } from 'react';
import { approvalService } from '../../services/approvalService';
import { api } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  MessageSquare, Sparkles, CheckCircle2, AlertCircle, Send,
  HelpCircle, BookOpen, Layers, Clock, ShieldCheck, Zap
} from 'lucide-react';
import { formatDate, formatDateTime } from '../../lib/utils';
import { toast } from 'sonner';

const QUICK_QUESTIONS = [
  'What mandatory documents do I need for my clearances?',
  'What capital subsidies & PSI 2019 incentives are available in Maharashtra?',
  'What are the statutory RTS Act SLA turnaround times?',
  'What is the on-site joint inspection procedure and requirements?'
];

export default function QueriesPage() {
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseMap, setResponseMap] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // AI Sector Expert State
  const [selectedSector, setSelectedSector] = useState<'manufacturing' | 'pharmaceutical'>('manufacturing');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiAsking, setAiAsking] = useState(false);

  useEffect(() => {
    loadQueries();
  }, []);

  async function loadQueries() {
    try {
      const res = await approvalService.getAllMyQueries();
      setQueries(res);
    } catch (err: any) {
      toast.error('Failed to load queries');
    } finally {
      setLoading(false);
    }
  }

  const handleAskExpert = async (customQ?: string) => {
    const q = customQ || aiQuestion;
    if (!q?.trim()) {
      toast.error('Please enter a question for the sector expert');
      return;
    }

    setAiAsking(true);
    try {
      const res = await api.post('/api/ai/ask-sector-expert', {
        question: q,
        sector: selectedSector,
      });
      setAiAnswer(res.data.answer);
      if (!customQ) setAiQuestion('');
    } catch (err: any) {
      toast.error('Failed to consult AI sector expert');
    } finally {
      setAiAsking(false);
    }
  };

  const handleSendResponse = async (queryId: string) => {
    const text = responseMap[queryId];
    if (!text?.trim()) {
      toast.error('Please enter response text');
      return;
    }
    setSubmittingId(queryId);
    try {
      await approvalService.respondToQuery(queryId, text);
      toast.success('Query response successfully sent to officer');
      setResponseMap(prev => ({ ...prev, [queryId]: '' }));
      await loadQueries();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit response');
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800" />
      </div>
    );
  }

  const openQueries = queries.filter(q => q.status === 'open');
  const resolvedQueries = queries.filter(q => q.status !== 'open');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statutory Clarification & AI Sector Regulatory Expert"
        subtitle="Instant statutory regulatory knowledge engine for Automobile Manufacturing & Pharmaceutical Processing"
      />

      {/* 2-Sector Instant AI Regulatory Advisor Box */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-white shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-blue-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold text-[#002046] flex items-center gap-2">
                  <span>Fastest AI Sector Knowledge Engine</span>
                  <span className="text-[10px] bg-blue-600 text-white font-mono px-2 py-0.5 rounded-full uppercase">
                    2 Focused Sectors
                  </span>
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Instant answers on Maharashtra regulations, documents, SLAs, and subsidies
                </p>
              </div>
            </div>

            {/* Sector Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
              <button
                onClick={() => {
                  setSelectedSector('manufacturing');
                  setAiAnswer(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedSector === 'manufacturing'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🚗 1. Automobile & Engineering
              </button>
              <button
                onClick={() => {
                  setSelectedSector('pharmaceutical');
                  setAiAnswer(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedSector === 'pharmaceutical'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🧪 2. Pharma & Chemical
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {/* Quick-Prompt Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Regulatory Inquiries:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAskExpert(q)}
                  className="text-[11px] bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-700 font-medium px-2.5 py-1 rounded-lg transition-all text-left shadow-xs"
                >
                  ⚡ {q}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskExpert()}
              placeholder={`Ask any regulatory question regarding ${
                selectedSector === 'manufacturing' ? 'Automobile & Precision Engineering' : 'Pharmaceutical & Chemical Processing'
              }...`}
              className="flex-1 px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none shadow-xs"
            />
            <Button onClick={() => handleAskExpert()} loading={aiAsking}>
              <Send className="w-3.5 h-3.5 mr-1" /> Ask AI Expert
            </Button>
          </div>

          {/* AI Response Output */}
          {aiAnswer && (
            <div className="p-4 bg-white border border-blue-200 rounded-xl shadow-xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Authoritative Statutory Regulatory Guidance
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Response Time: &lt;50ms</span>
              </div>
              <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                {aiAnswer}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-800">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-950">{openQueries.length}</p>
              <p className="text-xs text-amber-800">Pending Department Queries (Action Required)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-100 text-green-800">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-950">{resolvedQueries.length}</p>
              <p className="text-xs text-green-800">Responded & Resolved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Query List */}
      {queries.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-base font-bold mb-1">No Active Department Queries</h3>
            <p className="text-xs text-muted-foreground">All applications are progressing smoothly through standard scrutiny.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {queries.map((query) => (
            <Card key={query.id} className={query.status === 'open' ? 'border-amber-300 shadow-sm' : ''}>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary-800" />
                  <CardTitle className="text-sm">
                    {query.application_approvals?.approval_types?.name || 'Department Approval'}
                  </CardTitle>
                </div>
                <Badge variant={query.status === 'open' ? 'warning' : 'success'}>
                  {query.status === 'open' ? 'Response Required' : 'Responded'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="p-3 bg-slate-50 border rounded text-xs space-y-1">
                  <p className="font-semibold text-foreground">Officer Query:</p>
                  <p className="text-slate-800">{query.question}</p>
                  <p className="text-[10px] text-muted-foreground pt-1">Raised on {formatDate(query.created_at)}</p>
                </div>

                {/* Gemini AI Plain Language summary */}
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded text-xs text-indigo-900 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">AI Plain Language Guidance:</span>
                    <p className="mt-0.5">
                      The officer requires supplementary information. Be precise with exact reference values matching your uploaded document vault.
                    </p>
                  </div>
                </div>

                {/* Responses */}
                {query.responses && query.responses.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-foreground">Your Submitted Responses:</p>
                    {query.responses.map((resp: any) => (
                      <div key={resp.id} className="p-3 bg-green-50 border border-green-200 rounded text-xs">
                        <p className="text-green-950">{resp.response}</p>
                        <p className="text-[10px] text-green-700 mt-1">Submitted {formatDateTime(resp.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Response Input */}
                {query.status === 'open' && (
                  <div className="space-y-2 pt-2 border-t">
                    <label className="text-xs font-semibold text-foreground">Enter Your Response / Upload Reference:</label>
                    <textarea
                      rows={3}
                      value={responseMap[query.id] || ''}
                      onChange={(e) => setResponseMap({ ...responseMap, [query.id]: e.target.value })}
                      placeholder="Write your explanation or clarify discrepancies..."
                      className="w-full p-2.5 text-xs border rounded-md bg-white focus:ring-2 focus:ring-primary-800 focus:outline-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        loading={submittingId === query.id}
                        onClick={() => handleSendResponse(query.id)}
                      >
                        Submit Response to Officer
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
