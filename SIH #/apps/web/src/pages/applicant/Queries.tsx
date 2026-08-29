import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { MessageSquare, Send, AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react'

export default function Queries() {
  const { id: applicationId } = useParams<{ id: string }>()
  const [queries, setQueries] = useState<any[]>([])
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<string | null>(null)

  useEffect(() => {
    loadQueries()

    let channel: any
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      setUserId(session.user.id)

      // Realtime: new queries or responses
      channel = supabase.channel(`applicant-queries-${applicationId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'queries' }, () => loadQueries())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'query_responses' }, () => loadQueries())
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'queries' }, () => loadQueries())
        .subscribe()
    })

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [applicationId])

  const loadQueries = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    setUserId(session.user.id)

    // Get all approvals for this application
    const { data: approvals } = await supabase
      .from('application_approvals')
      .select('id, approval_type_id, department_id, status, approval_types(name)')
      .eq('application_id', applicationId!)

    if (!approvals || approvals.length === 0) { setLoading(false); return }

    const approvalIds = approvals.map((a: any) => a.id)

    // Get queries with responses
    const { data } = await supabase
      .from('queries')
      .select(`
        *,
        query_responses(*, profiles!responded_by(full_name, role)),
        profiles!raised_by(full_name, department_id)
      `)
      .in('application_approval_id', approvalIds)
      .order('created_at', { ascending: false })

    // Merge approval info
    const enriched = (data || []).map(q => ({
      ...q,
      approval: approvals.find((a: any) => a.id === q.application_approval_id)
    }))

    setQueries(enriched)
    setLoading(false)
  }

  const handleRespond = async (queryId: string) => {
    const text = responses[queryId]?.trim()
    if (!text || !userId) return
    setSubmitting(queryId)
    try {
      await supabase.from('query_responses').insert({
        query_id: queryId,
        responded_by: userId,
        response: text
      })
      await supabase.from('queries').update({ status: 'answered' }).eq('id', queryId)
      setResponses(prev => ({ ...prev, [queryId]: '' }))
    } catch (err: any) {
      alert('Failed to submit response: ' + err.message)
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" /></div>

  const openQueries = queries.filter(q => q.status === 'open')
  const answeredQueries = queries.filter(q => q.status !== 'open')

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Query Center</h1>
          <p className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
            Department queries requiring your response
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-600 text-xs font-medium">Real-time</span>
          </p>
        </div>
        {openQueries.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-semibold text-red-700">{openQueries.length} Action Required</span>
          </div>
        )}
      </div>

      {queries.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <MessageSquare className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No queries raised</p>
          <p className="text-slate-400 text-sm mt-1">Department officers will send queries here if they need more information.</p>
        </div>
      )}

      {/* Open queries */}
      {openQueries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-red-700 uppercase flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Action Required ({openQueries.length})
          </h2>
          {openQueries.map(q => (
            <QueryCard
              key={q.id} query={q}
              response={responses[q.id] || ''}
              onResponseChange={(text) => setResponses(prev => ({ ...prev, [q.id]: text }))}
              onSubmit={() => handleRespond(q.id)}
              submitting={submitting === q.id}
            />
          ))}
        </div>
      )}

      {/* Answered queries */}
      {answeredQueries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Resolved ({answeredQueries.length})
          </h2>
          {answeredQueries.map(q => (
            <QueryCard key={q.id} query={q} readOnly />
          ))}
        </div>
      )}
    </div>
  )
}

function QueryCard({ query, response, onResponseChange, onSubmit, submitting, readOnly }: any) {
  const isOpen = query.status === 'open'

  return (
    <div className={`bg-white rounded-xl border ${isOpen ? 'border-amber-200 shadow-sm shadow-amber-100' : 'border-slate-200'} overflow-hidden`}>
      {isOpen && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span className="text-xs font-bold text-amber-700">ACTION REQUIRED</span>
        </div>
      )}

      <div className="p-5">
        {/* Approval context */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded font-medium">
            {query.approval?.approval_types?.name || query.approval?.approval_type_id}
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500">{query.approval?.department_id}</span>
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${isOpen ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {isOpen ? 'OPEN' : 'ANSWERED'}
          </span>
        </div>

        {/* Query */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">
              Department Query · {new Date(query.created_at).toLocaleString()}
            </p>
            <p className="text-sm text-slate-800 leading-relaxed">{query.question}</p>
          </div>
        </div>

        {/* Existing responses */}
        {query.query_responses?.map((r: any) => (
          <div key={r.id} className="ml-11 mb-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
            <p className="text-xs font-semibold text-emerald-700 mb-1">
              Your Response · {new Date(r.created_at).toLocaleString()}
            </p>
            <p className="text-sm text-slate-700">{r.response}</p>
          </div>
        ))}

        {/* Response input */}
        {isOpen && !readOnly && (
          <div className="ml-11 mt-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">Your Response</label>
            <textarea
              value={response} onChange={e => onResponseChange(e.target.value)}
              placeholder="Provide your response or upload the requested documents..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={onSubmit}
                disabled={submitting || !response?.trim()}
                className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Submit Response
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
