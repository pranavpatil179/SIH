import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import {
  ClipboardList, AlertTriangle, CheckCircle, MessageSquare,
  Clock, Users, TrendingUp, RefreshCw, ChevronRight,
  Shield, Calendar, BarChart3
} from 'lucide-react'

function SLABar({ percent, status }: { percent: number; status: string }) {
  const color = status === 'breached' ? 'bg-red-500' : status === 'at_risk' ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
      <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    submitted: 'bg-slate-100 text-slate-600',
    under_scrutiny: 'bg-blue-100 text-blue-700',
    query_raised: 'bg-amber-100 text-amber-700',
    inspection_required: 'bg-violet-100 text-violet-700',
    inspection_scheduled: 'bg-indigo-100 text-indigo-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {status.replace(/_/g, ' ').toUpperCase()}
    </span>
  )
}

export default function OfficerDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({ pending: 0, at_risk: 0, sla_breached: 0, queries: 0, inspections_today: 0, risk_distribution: {} })
  const [queue, setQueue] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    loadDashboard()

    // Realtime subscription
    let channel: any
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      setUserId(session.user.id)
      channel = supabase.channel('officer-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'application_approvals' }, () => {
          loadQueue(session.user.id)
          loadStats(session.user.id)
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'queries' }, () => {
          loadStats(session.user.id)
        })
        .subscribe()
    })

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  const loadDashboard = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { navigate('/login'); return }
    const uid = session.user.id
    setUserId(uid)

    const { data: prof } = await supabase.from('profiles').select('*, departments(*)').eq('id', uid).single()
    setProfile(prof)

    await Promise.all([loadStats(uid), loadQueue(uid)])
    setLoading(false)
  }

  const loadStats = async (uid: string) => {
    try {
      const data = await api.officer.getDashboard()
      setStats(data)
    } catch {
      // fallback: calculate from queue
    }
  }

  const loadQueue = async (uid: string) => {
    try {
      const data = await api.officer.getQueue()
      setQueue(data || [])
    } catch (e) {
      console.error('Queue load error', e)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Officer Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {profile?.departments?.name || profile?.department_id || 'All Departments'} ·{' '}
            <span className="text-green-600 font-medium flex-inline items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1" />
              Real-time
            </span>
          </p>
        </div>
        <button onClick={() => loadDashboard()} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <OfficerStatCard label="Pending" value={stats.pending} icon={<ClipboardList className="h-5 w-5 text-blue-600" />} color="blue" />
        <OfficerStatCard label="At Risk" value={stats.at_risk} icon={<TrendingUp className="h-5 w-5 text-amber-600" />} color="amber" />
        <OfficerStatCard label="SLA Breached" value={stats.sla_breached} icon={<AlertTriangle className="h-5 w-5 text-red-600" />} color="red" urgent={stats.sla_breached > 0} />
        <OfficerStatCard label="Open Queries" value={stats.queries} icon={<MessageSquare className="h-5 w-5 text-violet-600" />} color="violet"
          href="/officer/queries" navigate={navigate} />
        <OfficerStatCard label="Inspections Today" value={stats.inspections_today} icon={<Calendar className="h-5 w-5 text-indigo-600" />} color="indigo"
          href="/officer/inspections" navigate={navigate} />
      </div>

      {/* SLA Breach Alert */}
      {stats.sla_breached > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800">SLA Breach Alert</p>
            <p className="text-sm text-red-600">{stats.sla_breached} application(s) have breached their SLA. Escalation may be triggered.</p>
          </div>
          <button onClick={() => navigate('/officer/sla')} className="ml-auto text-sm text-red-700 font-medium hover:underline">
            View SLA Monitor →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Queue */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Application Queue</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{queue.length} items</span>
                <button onClick={() => navigate('/officer/queue')}
                  className="text-xs text-blue-600 hover:underline">View all →</button>
              </div>
            </div>

            {queue.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                <p>No pending applications</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {queue.slice(0, 8).map((item: any) => (
                  <div
                    key={item.id}
                    className="px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-4"
                    onClick={() => navigate(`/officer/applications/${item.applications?.id}`)}
                  >
                    {/* Risk level indicator */}
                    <div className={`w-1 h-10 rounded-full flex-shrink-0 ${
                      item.risk_level === 'HIGH' ? 'bg-red-500' :
                      item.risk_level === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800 truncate">
                          {item.applications?.projects?.businesses?.name || 'Unknown Business'}
                        </span>
                        <StatusPill status={item.status} />
                        {item.sla_status === 'breached' && (
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold animate-pulse">SLA BREACH</span>
                        )}
                        {item.sla_status === 'at_risk' && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">AT RISK</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.approval_types?.name} · {item.applications?.projects?.location_state}
                      </p>
                      <SLABar percent={item.sla_percent || 0} status={item.sla_status || 'on_track'} />
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-400">
                        {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : ''}
                      </p>
                      {item.risk_level && (
                        <span className={`text-xs font-medium ${
                          item.risk_level === 'HIGH' ? 'text-red-600' :
                          item.risk_level === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'
                        }`}>{item.risk_level} RISK</span>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Risk distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-700 mb-3 text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-400" /> Risk Distribution
            </h3>
            <div className="space-y-2">
              {[
                { label: 'HIGH', count: stats.risk_distribution?.HIGH || 0, color: 'bg-red-500' },
                { label: 'MEDIUM', count: stats.risk_distribution?.MEDIUM || 0, color: 'bg-amber-500' },
                { label: 'LOW', count: stats.risk_distribution?.LOW || 0, color: 'bg-emerald-500' },
              ].map(r => {
                const total = (stats.risk_distribution?.HIGH || 0) + (stats.risk_distribution?.MEDIUM || 0) + (stats.risk_distribution?.LOW || 0)
                const pct = total > 0 ? (r.count / total) * 100 : 0
                return (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">{r.label}</span>
                      <span className="font-medium text-slate-700">{r.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`${r.color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-slate-400 mt-3">Source: LIVE · Updated in real-time</p>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-700 mb-3 text-sm">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Manage Queries', href: '/officer/queries', icon: MessageSquare },
                { label: 'Schedule Inspection', href: '/officer/inspections', icon: Calendar },
                { label: 'SLA Monitor', href: '/officer/sla', icon: Clock },
              ].map(action => {
                const Icon = action.icon
                return (
                  <button key={action.href} onClick={() => navigate(action.href)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 text-left text-sm text-slate-700">
                    <Icon className="h-4 w-4 text-slate-400" />
                    {action.label}
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 ml-auto" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OfficerStatCard({ label, value, icon, color, urgent, href, navigate }: any) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200', amber: 'bg-amber-50 border-amber-200',
    red: 'bg-red-50 border-red-200', violet: 'bg-violet-50 border-violet-200',
    indigo: 'bg-indigo-50 border-indigo-200',
  }
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] || 'bg-white border-slate-200'} ${href ? 'cursor-pointer hover:shadow-sm' : ''} ${urgent ? 'ring-2 ring-red-300' : ''}`}
      onClick={() => href && navigate(href)}>
      <div className="mb-1">{icon}</div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}
