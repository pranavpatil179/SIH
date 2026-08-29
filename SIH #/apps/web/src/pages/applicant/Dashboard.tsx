import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { useNavigate } from 'react-router-dom'
import { ApprovalJourneyTimeline } from '../../components/journey/ApprovalJourneyTimeline'
import {
  AlertTriangle, CheckCircle, Clock, MessageSquare,
  FileText, TrendingUp, ChevronRight, RefreshCw,
  Building2, MapPin, IndianRupee, Users, Plus
} from 'lucide-react'

function DataSourceBadge({ source }: { source: string }) {
  const map: Record<string, string> = {
    LIVE: 'badge-live', OFFICIAL: 'badge-official', VERIFIED: 'badge-verified',
    DEMO_DATA: 'badge-demo', AI_ANALYSIS: 'badge-ai', USER_PROVIDED: 'badge-user',
    NOT_VERIFIED: 'badge-unverified'
  }
  return <span className={map[source] || 'badge-user'}>{source.replace('_', ' ')}</span>
}

interface DashboardStats {
  totalApprovals: number
  approvedCount: number
  pendingCount: number
  queryCount: number
  atRiskCount: number
  inspectionCount: number
  complianceCount: number
  schemeCount: number
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [activeProject, setActiveProject] = useState<any>(null)
  const [application, setApplication] = useState<any>(null)
  const [approvals, setApprovals] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalApprovals: 0, approvedCount: 0, pendingCount: 0,
    queryCount: 0, atRiskCount: 0, inspectionCount: 0,
    complianceCount: 0, schemeCount: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
    
    // Realtime subscription for approval changes
    let channel: any = null
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      channel = supabase
        .channel('dashboard-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'application_approvals' }, () => {
          loadApprovals()
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications',
          filter: `user_id=eq.${session.user.id}` }, (payload) => {
          setNotifications(prev => [payload.new as any, ...prev].slice(0, 5))
        })
        .subscribe()
    })

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      setUser(session.user)

      // Load business
      const { data: biz } = await supabase
        .from('businesses').select('*').eq('owner_id', session.user.id).single()
      setBusiness(biz)

      // Load projects
      const { data: projs } = await supabase
        .from('projects').select('*').eq('business_id', biz?.id ?? '').order('created_at', { ascending: false })
      const projList = projs || []
      setProjects(projList)

      if (projList.length > 0) {
        setActiveProject(projList[0])
        await loadProjectData(projList[0].id, biz?.id)
      }

      // Load notifications
      const { data: notifs } = await supabase
        .from('notifications').select('*').eq('user_id', session.user.id)
        .eq('is_read', false).order('created_at', { ascending: false }).limit(5)
      setNotifications(notifs || [])
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadProjectData = async (projectId: string, businessId: string) => {
    // Load application
    const { data: apps } = await supabase
      .from('applications').select('*').eq('project_id', projectId)
      .order('created_at', { ascending: false }).limit(1)
    const app = apps?.[0] || null
    setApplication(app)

    if (app) await loadApprovals(app.id)

    // Load schemes count
    const { data: schemes } = await supabase.from('schemes').select('id')
    setStats(prev => ({ ...prev, schemeCount: schemes?.length || 0 }))
  }

  const loadApprovals = async (applicationId?: string) => {
    if (!applicationId && !application?.id) return
    const appId = applicationId || application.id
    
    const { data: approvs } = await supabase
      .from('application_approvals')
      .select('*, approval_types(*)')
      .eq('application_id', appId)
    
    const list = approvs || []
    setApprovals(list)

    const now = new Date()
    const approved = list.filter((a: any) => a.status === 'approved').length
    const query = list.filter((a: any) => a.status === 'query_raised').length
    const pending = list.filter((a: any) => !['approved', 'rejected'].includes(a.status)).length
    const atRisk = list.filter((a: any) => {
      if (!a.sla_due_at || ['approved', 'rejected'].includes(a.status)) return false
      const due = new Date(a.sla_due_at)
      const sub = a.submitted_at ? new Date(a.submitted_at) : new Date(a.created_at || '')
      const total = due.getTime() - sub.getTime()
      const elapsed = now.getTime() - sub.getTime()
      return total > 0 && elapsed / total >= 0.8
    }).length

    // Load inspections
    const { data: inspections } = await supabase
      .from('inspections').select('id').eq('application_id', appId).eq('status', 'scheduled')
    
    // Load compliance
    const approvalIds = list.map((a: any) => a.id)
    let complianceCount = 0
    if (approvalIds.length > 0) {
      const { data: compliance } = await supabase
        .from('compliance_obligations').select('id').in('application_approval_id', approvalIds)
        .eq('status', 'upcoming')
      complianceCount = compliance?.length || 0
    }

    setStats(prev => ({
      ...prev,
      totalApprovals: list.length,
      approvedCount: approved,
      pendingCount: pending,
      queryCount: query,
      atRiskCount: atRisk,
      inspectionCount: inspections?.length || 0,
      complianceCount
    }))
  }

  // Build journey steps based on real data
  const buildJourneySteps = () => {
    const hasBusiness = !!business
    const hasProject = !!activeProject
    const hasApplication = !!application
    const isSubmitted = application?.status && application.status !== 'draft'

    return [
      {
        id: 'profile', label: 'Business Profile',
        status: hasBusiness ? 'completed' : 'active',
        description: business?.name || 'Set up your business details',
        href: '/profile'
      },
      {
        id: 'project', label: 'Project Details',
        status: hasProject ? 'completed' : hasBusiness ? 'active' : 'pending',
        description: activeProject?.name || 'Define your industrial project',
        href: hasProject ? undefined : '/projects/new'
      },
      {
        id: 'intelligence', label: 'Approval Intelligence',
        status: approvals.length > 0 ? 'completed' : hasProject ? 'active' : 'pending',
        description: `${approvals.length || 0} approvals identified`,
        href: activeProject ? `/projects/${activeProject.id}/approval-intelligence` : undefined
      },
      {
        id: 'checklist', label: 'Approval Checklist',
        status: approvals.length > 0 ? (isSubmitted ? 'completed' : 'active') : 'pending',
        description: `${stats.approvedCount}/${stats.totalApprovals} complete`,
        count: { current: stats.approvedCount, total: stats.totalApprovals },
        href: activeProject ? `/projects/${activeProject.id}/checklist` : undefined
      },
      {
        id: 'documents', label: 'Documents',
        status: isSubmitted ? 'completed' : hasProject ? 'active' : 'pending',
        href: activeProject ? `/projects/${activeProject.id}/documents` : undefined
      },
      {
        id: 'submit', label: 'Submitted',
        status: isSubmitted ? 'completed' : hasProject ? 'pending' : 'pending',
        description: application?.created_at ? `Submitted ${new Date(application.created_at).toLocaleDateString()}` : 'Ready to submit'
      },
      {
        id: 'scrutiny', label: 'Department Scrutiny',
        status: isSubmitted ? (stats.approvedCount === stats.totalApprovals ? 'completed' : stats.queryCount > 0 ? 'warning' : 'active') : 'pending',
        badge: stats.queryCount > 0 ? `${stats.queryCount} QUERY` : undefined,
        subItems: approvals.slice(0, 4).map((a: any) => ({
          label: a.approval_types?.name || a.approval_type_id,
          status: a.status === 'approved' ? 'completed' : a.status === 'query_raised' ? 'warning' : a.status === 'rejected' ? 'error' : isSubmitted ? 'active' : 'pending',
          badge: a.status === 'query_raised' ? 'QUERY' : undefined
        }))
      },
      {
        id: 'decision', label: 'Decision',
        status: stats.approvedCount === stats.totalApprovals && stats.totalApprovals > 0 ? 'completed' :
          approvals.some((a: any) => a.status === 'rejected') ? 'error' : 'pending',
        description: stats.approvedCount === stats.totalApprovals && stats.totalApprovals > 0 ? 'All approved ✓' : 'Awaiting decisions'
      },
      {
        id: 'compliance', label: 'Compliance',
        status: stats.complianceCount > 0 ? 'active' : 'pending',
        description: stats.complianceCount > 0 ? `${stats.complianceCount} obligations upcoming` : 'Post-approval tracking',
        href: activeProject ? `/projects/${activeProject.id}/compliance` : undefined
      },
    ] as any[]
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )

  if (!business) return (
    <div className="p-8 max-w-2xl mx-auto text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Building2 className="h-8 w-8 text-blue-600" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Welcome to InduApprove</h2>
      <p className="text-slate-500 mb-6">Start by creating your business profile to unlock the full approval journey.</p>
      <button onClick={() => navigate('/profile')} className="bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 font-medium">
        Create Business Profile →
      </button>
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{business.name}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-sm text-slate-500">{activeProject?.name || 'No active project'}</span>
            <DataSourceBadge source="USER_PROVIDED" />
            {import.meta.env.VITE_DEMO_MODE === 'true' && <DataSourceBadge source="DEMO_DATA" />}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={loadDashboard} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <RefreshCw className="h-4 w-4" />
          </button>
          {projects.length === 0 && (
            <button onClick={() => navigate('/projects/new')}
              className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 text-sm font-medium">
              <Plus className="h-4 w-4" /> New Project
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Approval Progress"
          value={`${stats.approvedCount}/${stats.totalApprovals}`}
          icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
          color="emerald"
          sub="Approvals obtained"
        />
        <StatCard
          label="At Risk"
          value={stats.atRiskCount}
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          color="amber"
          sub="SLA risk"
          href={application ? `/applications/${application.id}/sla` : undefined}
          navigate={navigate}
        />
        <StatCard
          label="Open Queries"
          value={stats.queryCount}
          icon={<MessageSquare className="h-5 w-5 text-blue-600" />}
          color="blue"
          sub="Action required"
          href={application ? `/applications/${application.id}/queries` : undefined}
          navigate={navigate}
          urgent={stats.queryCount > 0}
        />
        <StatCard
          label="Compliance Due"
          value={stats.complianceCount}
          icon={<FileText className="h-5 w-5 text-violet-600" />}
          color="violet"
          sub="Obligations upcoming"
          href={activeProject ? `/projects/${activeProject.id}/compliance` : undefined}
          navigate={navigate}
        />
      </div>

      {/* Action Required Banner */}
      {stats.queryCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">Action Required</p>
              <p className="text-sm text-red-600">{stats.queryCount} open {stats.queryCount === 1 ? 'query' : 'queries'} require your response</p>
            </div>
          </div>
          <button
            onClick={() => application && navigate(`/applications/${application.id}/queries`)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
          >
            Respond Now →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Journey Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800">Industrial Approval Journey</h2>
              <span className="text-xs text-slate-400">REAL-TIME</span>
            </div>
            <ApprovalJourneyTimeline
              steps={buildJourneySteps()}
              projectId={activeProject?.id}
              applicationId={application?.id}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Project Summary */}
          {activeProject && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-700 mb-3 text-sm">Active Project</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">{activeProject.name}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{activeProject.location_state || 'Location not set'}</span>
                </div>
                {activeProject.investment_crore && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <IndianRupee className="h-4 w-4 text-slate-400" />
                    <span>₹{activeProject.investment_crore} Crore</span>
                  </div>
                )}
                {activeProject.employee_count && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>{activeProject.employee_count} employees</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate(`/projects/${activeProject.id}/approval-intelligence`)}
                className="mt-3 w-full text-xs text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg py-2 hover:bg-blue-50"
              >
                View Approval Intelligence →
              </button>
            </div>
          )}

          {/* Recent notifications */}
          {notifications.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-700 mb-3 text-sm flex items-center gap-2">
                Recent Activity
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Real-time" />
              </h3>
              <div className="space-y-2">
                {notifications.slice(0, 4).map(n => (
                  <div key={n.id} className="flex items-start gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-700 font-medium">{n.title}</p>
                      <p className="text-slate-400">{new Date(n.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/notifications')} className="mt-2 text-xs text-blue-600 hover:underline">
                View all →
              </button>
            </div>
          )}

          {/* Scheme opportunities */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-blue-800 text-sm">Government Schemes</h3>
            </div>
            <p className="text-xs text-blue-600 mb-3">{stats.schemeCount} schemes available for your sector</p>
            <button onClick={() => navigate('/schemes')} className="text-xs text-blue-700 font-medium hover:underline">
              Check eligibility →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color, sub, href, navigate, urgent }: any) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-200',
    amber: 'bg-amber-50 border-amber-200',
    blue: 'bg-blue-50 border-blue-200',
    violet: 'bg-violet-50 border-violet-200',
  }
  return (
    <div
      className={`rounded-xl border p-4 ${colorMap[color] || 'bg-white border-slate-200'} ${href ? 'cursor-pointer hover:shadow-sm transition-shadow' : ''} ${urgent ? 'animate-pulse ring-2 ring-red-300' : ''}`}
      onClick={() => href && navigate(href)}
    >
      <div className="flex items-start justify-between mb-1">
        {icon}
        {href && <ChevronRight className="h-4 w-4 text-slate-400" />}
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-xs font-semibold text-slate-600 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
}
