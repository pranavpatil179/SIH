import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  LayoutDashboard, FolderKanban, Bell, FileText, Shield, 
  ClipboardList, Users, Settings, LogOut, ChevronDown,
  AlertTriangle, CheckSquare, Search, BarChart3, Building2,
  Gavel, Plug, BookOpen, Menu, X
} from 'lucide-react'
import { NotificationBell } from './NotificationBell'

interface AppLayoutProps {
  role?: 'applicant' | 'officer' | 'admin'
}

const applicantNav = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Business Profile', icon: Building2, href: '/profile' },
  { label: 'New Project', icon: FolderKanban, href: '/projects/new' },
  { label: 'Schemes', icon: Award, href: '/schemes' },
  { label: 'Notifications', icon: Bell, href: '/notifications' },
  { label: 'Grievances', icon: AlertTriangle, href: '/grievances' },
]

const officerNav = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/officer/dashboard' },
  { label: 'Application Queue', icon: ClipboardList, href: '/officer/queue' },
  { label: 'Queries', icon: MessageSquare, href: '/officer/queries' },
  { label: 'Inspections', icon: Search, href: '/officer/inspections' },
  { label: 'SLA Monitor', icon: AlertTriangle, href: '/officer/sla' },
]

const adminNav = [
  { label: 'Regulatory Rules', icon: BookOpen, href: '/admin/regulatory-rules' },
  { label: 'Connectors', icon: Plug, href: '/admin/connectors' },
  { label: 'Audit Logs', icon: Shield, href: '/admin/audit-logs' },
  { label: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
]

// Award and MessageSquare aren't in the import above so we need a workaround
function Award({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="6" strokeWidth="2" />
      <path strokeWidth="2" d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  )
}

function MessageSquare({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export function AppLayout({ role = 'applicant' }: AppLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate('/login'); return }
      setUser(session.user)
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => setProfile(data))
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate('/login')
    })
    return () => listener.subscription.unsubscribe()
  }, [navigate])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = role === 'officer' ? officerNav : role === 'admin' ? adminNav : applicantNav

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} transition-all duration-200 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-slate-100 gap-3">
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <Gavel className="h-4 w-4 text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <div className="text-sm font-bold text-slate-800 leading-tight">InduApprove</div>
              <div className="text-xs text-slate-400">SIH 2026</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto p-1 rounded hover:bg-slate-100 text-slate-400"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {/* Demo mode badge */}
        {isDemoMode && sidebarOpen && (
          <div className="mx-3 mt-3 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 text-center font-medium">
            DEMO MODE
          </div>
        )}

        {/* Role badge */}
        {sidebarOpen && (
          <div className="mx-3 mt-2 mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              role === 'officer' ? 'bg-purple-100 text-purple-700' :
              role === 'admin' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {role === 'officer' ? '⚖️ OFFICER' : role === 'admin' ? '🛡️ ADMIN' : '🏭 APPLICANT'}
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                  ${isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-slate-100 p-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold flex-shrink-0">
                {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-700 truncate">
                  {profile?.full_name || user?.email || 'User'}
                </div>
                <div className="text-xs text-slate-400 truncate">{user?.email}</div>
              </div>
              <button onClick={handleLogout} className="p-1 text-slate-400 hover:text-red-500">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center p-1 text-slate-400 hover:text-red-500">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4">
          <div className="flex-1" />
          <NotificationBell />
          {isDemoMode && (
            <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-full font-medium">
              DEMO DATA
            </span>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
