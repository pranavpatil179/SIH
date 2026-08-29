import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import {
  ArrowLeft, Shield, Clock, MessageSquare, Calendar,
  CheckCircle, XCircle, AlertTriangle, FileText,
  ChevronDown, Send, User, Building2, MapPin, IndianRupee
} from 'lucide-react'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    submitted: 'bg-slate-100 text-slate-600',
    under_scrutiny: 'bg-blue-100 text-blue-700',
    query_raised: 'bg-amber-100 text-amber-700',
    inspection_required: 'bg-violet-100 text-violet-700',
    inspection_scheduled: 'bg-indigo-100 text-indigo-700',
    inspection_completed: 'bg-cyan-100 text-cyan-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {status.replace(/_/g, ' ').toUpperCase()}
    </span>
  )
}

function DataSourceBadge({ source }: { source: string }) {
  const map: Record<string, string> = {
    LIVE: 'badge-live', OFFICIAL: 'badge-official', VERIFIED: 'badge-verified',
    DEMO_DATA: 'badge-demo', AI_ANALYSIS: 'badge-ai', USER_PROVIDED: 'badge-user',
    NOT_VERIFIED: 'badge-unverified'
  }
  return <span className={map[source] || 'badge-user'}>{source.replace(/_/g, ' ')}</span>
}

const validNextStatuses: Record<string, Array<{ value: string; label: string; color: string }>> = {
  submitted: [{ value: 'under_scrutiny', label: 'Begin Scrutiny', color: 'blue' }],
  under_scrutiny: [
    { value: 'query_raised', label: 'Raise Query', color: 'amber' },
    { value: 'inspection_required', label: 'Request Inspection', color: 'violet' },
    { value: 'approved', label: 'Approve', color: 'emerald' },
    { value: 'rejected', label: 'Reject', color: 'red' },
  ],
  query_raised: [{ value: 'under_scrutiny', label: 'Resume Scrutiny', color: 'blue' }],
  inspection_required: [{ value: 'inspection_scheduled', label: 'Mark Scheduled', color: 'indigo' }],
  inspection_scheduled: [{ value: 'inspection_completed', label: 'Mark Completed', color: 'cyan' }],
  inspection_completed: [
    { value: 'approved', label: 'Approve', color: 'emerald' },
    { value: 'rejected', label: 'Reject', color: 'red' },
  ],
}

export default function ApplicationReview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [application, setApplication] = useState<any>(null)
  const [approvals, setApprovals] = useState<any[]>([])
  const [selectedApproval, setSelectedApproval] = useState<any>(null)
  const [queries, setQueries] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [riskData, setRiskData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

  // Action states
  const [actionModal, setActionModal] = useState<string | null>(null)
  const [actionNote, setActionNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadApplication()

    // Realtime for query responses
    const channel = supabase.channel(`app-review-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'query_responses' }, () => {
        loadQueries(selectedApproval?.id)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'application_approvals',
        filter: `application_id=eq.${id}` }, () => {
        loadApprovals()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  const loadApplication = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) setUserId(session.user.id)

    const { data: app } = await supabase
      .from('applications')
      .select(`*, projects!inner(*, businesses!inner(*))`)
      .eq('id', id!).single()
    setApplication(app)

    await loadApprovals()
    setLoading(false)
  }

  const loadApprovals = async () => {
    const { data } = await supabase
      .from('application_approvals')
      .select('*, approval_types(*), queries(*, query_responses(*))')
      .eq('application_id', id!)
    const list = data || []
    setApprovals(list)
    if (!selectedApproval && list.length > 0) setSelectedApproval(list[0])
    if (selectedApproval) {
      const updated = list.find((a: any) => a.id === selectedApproval.id)
      if (updated) setSelectedApproval(updated)
    }
  }

  const loadQueries = async (approvalId?: string) => {
    if (!approvalId) return
    const { data } = await supabase
      .from('queries')
      .select('*, query_responses(*), profiles!raised_by(*)')
      .eq('application_approval_id', approvalId)
      .order('created_at', { ascending: false })
    setQueries(data || [])
  }

  useEffect(() => {
    if (selectedApproval) loadQueries(selectedApproval.id)
  }, [selectedApproval?.id])

  const handleStatusChange = async (status: string) => {
    if (!selectedApproval || !userId) return
    setSubmitting(true)
    try {
      await api.officer.updateApprovalStatus(selectedApproval.id, {
        status,
        reason: actionNote,
        officer_id: userId
      })
      setActionModal(null)
      setActionNote('')
      await loadApprovals()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRaiseQuery = async () => {
    if (!actionNote.trim() || !selectedApproval || !userId) return
    setSubmitting(true)
    try {
      // Create query record
      await supabase.from('queries').insert({
        application_approval_id: selectedApproval.id,
        raised_by: userId,
        question: actionNote
      })
      // Change status to query_raised
      await api.officer.updateApprovalStatus(selectedApproval.id, {
        status: 'query_raised', officer_id: userId
      })
      setActionModal(null)
      setActionNote('')
      await loadApprovals()
      await loadQueries(selectedApproval.id)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const triggerRiskAssessment = async () => {
    if (!selectedApproval) return
    try {
      const data = await api.officer.riskAssess(selectedApproval.id)
      setRiskData(data)
    } catch (err: any) {
      alert('Risk assessment failed: ' + err.message)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
    </div>
  )

  if (!application) return <div className="p-8 text-center text-slate-500">Application not found</div>

  const project = application.projects
  const business = project?.businesses

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/officer/queue')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{business?.name || 'Application Review'}</h1>
          <p className="text-sm text-slate-500">{project?.name} · {project?.location_state}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Real-time
          </span>
          {selectedApproval && <StatusBadge status={selectedApproval.status} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Approval selector + details */}
        <div className="space-y-4">
          {/* Approval tabs */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Approvals</h3>
            <div className="space-y-2">
              {approvals.map((a: any) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedApproval(a)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedApproval?.id === a.id ? 'border-blue-300 bg-blue-50' : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-semibold text-slate-800 truncate">{a.approval_types?.name || a.approval_type_id}</div>
                  <div className="mt-1"><StatusBadge status={a.status} /></div>
                  {a.sla_due_at && (
                    <div className="text-xs text-slate-400 mt-1">
                      Due: {new Date(a.sla_due_at).toLocaleDateString()}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Project info */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Project Details</h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-slate-400" />{project?.sector}</div>
              <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400" />{project?.location_state}, {project?.district}</div>
              {project?.investment_crore && <div className="flex items-center gap-2"><IndianRupee className="h-3.5 w-3.5 text-slate-400" />₹{project.investment_crore} Cr</div>}
              <div className="flex gap-2 mt-2 flex-wrap">
                {project?.hazardous_materials && <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded text-xs font-medium">⚠ Hazardous</span>}
                <span className="bg-slate-50 text-slate-600 border border-slate-100 px-2 py-0.5 rounded text-xs">{project?.stage}</span>
                <span className="bg-slate-50 text-slate-600 border border-slate-100 px-2 py-0.5 rounded text-xs">{project?.pollution_category} pollution</span>
              </div>
              <DataSourceBadge source="USER_PROVIDED" />
            </div>
          </div>
        </div>

        {/* Center: Main action area */}
        <div className="lg:col-span-2 space-y-4">
          {selectedApproval && (
            <>
              {/* Status action bar */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-800">{selectedApproval.approval_types?.name}</h3>
                    <p className="text-xs text-slate-500">{selectedApproval.approval_types?.authority}</p>
                  </div>
                  <StatusBadge status={selectedApproval.status} />
                </div>

                {/* Action buttons based on current status */}
                <div className="flex flex-wrap gap-2">
                  {(validNextStatuses[selectedApproval.status] || []).map(action => {
                    const btnColors: Record<string, string> = {
                      blue: 'bg-blue-600 hover:bg-blue-700', emerald: 'bg-emerald-600 hover:bg-emerald-700',
                      red: 'bg-red-600 hover:bg-red-700', amber: 'bg-amber-500 hover:bg-amber-600',
                      violet: 'bg-violet-600 hover:bg-violet-700', indigo: 'bg-indigo-600 hover:bg-indigo-700',
                      cyan: 'bg-cyan-600 hover:bg-cyan-700',
                    }
                    const isQueryAction = action.value === 'query_raised'
                    return (
                      <button
                        key={action.value}
                        onClick={() => setActionModal(action.value)}
                        className={`${btnColors[action.color] || 'bg-slate-600 hover:bg-slate-700'} text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2`}
                      >
                        {action.value === 'approved' && <CheckCircle className="h-4 w-4" />}
                        {action.value === 'rejected' && <XCircle className="h-4 w-4" />}
                        {isQueryAction && <MessageSquare className="h-4 w-4" />}
                        {action.label}
                      </button>
                    )
                  })}
                  <button onClick={triggerRiskAssessment}
                    className="border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50">
                    <Shield className="h-4 w-4" /> Risk Assessment
                  </button>
                </div>

                {/* Risk data */}
                {riskData && (
                  <div className={`mt-4 p-3 rounded-lg border ${
                    riskData.level === 'HIGH' ? 'bg-red-50 border-red-200' :
                    riskData.level === 'MEDIUM' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Risk Score: {riskData.score}/100</span>
                      <span className={`text-xs font-bold ${riskData.level === 'HIGH' ? 'text-red-700' : riskData.level === 'MEDIUM' ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {riskData.level} RISK
                      </span>
                    </div>
                    <div className="space-y-1">
                      {(riskData.factors || []).map((f: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-slate-600">{f.factor}</span>
                          <span className="font-medium text-slate-700">+{f.contribution}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 italic">
                      AI Analysis — Decision support only. Final decision rests with authorized officials.
                    </p>
                    <DataSourceBadge source="AI_ANALYSIS" />
                  </div>
                )}
              </div>

              {/* Queries section */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-slate-400" /> Queries & Responses
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Real-time" />
                  </h3>
                  <span className="text-xs text-slate-400">{queries.length} queries</span>
                </div>

                {queries.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No queries raised</p>
                ) : (
                  <div className="space-y-4">
                    {queries.map((q: any) => (
                      <div key={q.id} className="border border-slate-100 rounded-lg p-3">
                        <div className="flex items-start gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-slate-800">{q.question}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{new Date(q.created_at).toLocaleString()}</p>
                          </div>
                          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${q.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {q.status}
                          </span>
                        </div>

                        {/* Responses */}
                        {q.query_responses?.map((r: any) => (
                          <div key={r.id} className="ml-6 mt-2 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                            <div className="flex items-center gap-1.5 mb-1">
                              <User className="h-3 w-3 text-blue-500" />
                              <span className="text-xs font-semibold text-blue-700">APPLICANT RESPONSE RECEIVED</span>
                            </div>
                            <p className="text-xs text-slate-700">{r.response}</p>
                            <p className="text-xs text-slate-400 mt-1">{new Date(r.created_at).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-800 mb-4">
              {actionModal === 'query_raised' ? 'Raise Query' :
               actionModal === 'approved' ? 'Approve Application' :
               actionModal === 'rejected' ? 'Reject Application' :
               `Change Status: ${actionModal.replace(/_/g, ' ')}`}
            </h3>

            {(actionModal === 'query_raised' || actionModal === 'approved' || actionModal === 'rejected') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {actionModal === 'query_raised' ? 'Query message *' :
                   actionModal === 'rejected' ? 'Rejection reason *' : 'Conditions / Notes (optional)'}
                </label>
                <textarea
                  value={actionNote} onChange={e => setActionNote(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-28 resize-none"
                  placeholder={actionModal === 'query_raised' ? 'Please provide the environmental clearance certificate...' :
                    actionModal === 'rejected' ? 'Reason for rejection...' : 'Any conditions of approval...'}
                />
              </div>
            )}

            {actionModal === 'approved' && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
                ✅ This action will: mark as approved, generate compliance obligations, and notify the applicant in real-time.
              </div>
            )}
            {actionModal === 'rejected' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                ⚠ This is a statutory decision. Only authorized officers may reject. This action cannot be undone.
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={() => { setActionModal(null); setActionNote('') }}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button
                onClick={() => actionModal === 'query_raised' ? handleRaiseQuery() : handleStatusChange(actionModal)}
                disabled={submitting || ((actionModal === 'query_raised' || actionModal === 'rejected') && !actionNote.trim())}
                className={`px-4 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-50 ${
                  actionModal === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  actionModal === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {submitting ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
