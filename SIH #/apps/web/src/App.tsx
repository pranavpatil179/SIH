import { RouterProvider, createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { AppLayout } from './components/layout/AppLayout'

// Public pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import HowItWorks from './pages/HowItWorks'

// Applicant pages
import Dashboard from './pages/applicant/Dashboard'
import BusinessProfile from './pages/applicant/BusinessProfile'
import CreateProject from './pages/applicant/CreateProject'
import ApprovalIntelligence from './pages/applicant/ApprovalIntelligence'
import ApprovalChecklist from './pages/applicant/ApprovalChecklist'
import DependencyGraph from './pages/applicant/DependencyGraph'
import DocumentCenter from './pages/applicant/DocumentCenter'
import PreValidation from './pages/applicant/PreValidation'
import VerifiedDataPassport from './pages/applicant/VerifiedDataPassport'
import ApplicationDetails from './pages/applicant/ApplicationDetails'
import Queries from './pages/applicant/Queries'
import InspectionSchedule from './pages/applicant/InspectionSchedule'
import SLATracker from './pages/applicant/SLATracker'
import Compliance from './pages/applicant/Compliance'
import Renewals from './pages/applicant/Renewals'
import Schemes from './pages/applicant/Schemes'
import Incentives from './pages/applicant/Incentives'
import Notifications from './pages/applicant/Notifications'
import Grievances from './pages/applicant/Grievances'

// Officer pages
import OfficerDashboard from './pages/officer/OfficerDashboard'
import ApplicationQueue from './pages/officer/ApplicationQueue'
import ApplicationReview from './pages/officer/ApplicationReview'
import DocumentReview from './pages/officer/DocumentReview'
import QueryManagement from './pages/officer/QueryManagement'
import RiskAssessment from './pages/officer/RiskAssessment'
import InspectionPlanner from './pages/officer/InspectionPlanner'
import SLAMonitor from './pages/officer/SLAMonitor'

// Admin pages
import RegulatoryRules from './pages/admin/RegulatoryRules'
import Connectors from './pages/admin/Connectors'
import AuditLogs from './pages/admin/AuditLogs'
import Analytics from './pages/admin/Analytics'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data }) => { setProfile(data); setLoading(false) })
      } else {
        setLoading(false)
      }
    })
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}

const router = createBrowserRouter([
  // Public routes
  { path: '/', element: <Landing /> },
  { path: '/how-it-works', element: <HowItWorks /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },

  // Applicant routes
  {
    element: <ProtectedRoute allowedRoles={['applicant', 'admin']} />,
    children: [{
      element: <AppLayout role="applicant" />,
      children: [
        { path: '/dashboard', element: <Dashboard /> },
        { path: '/profile', element: <BusinessProfile /> },
        { path: '/projects/new', element: <CreateProject /> },
        { path: '/projects/:id/approval-intelligence', element: <ApprovalIntelligence /> },
        { path: '/projects/:id/checklist', element: <ApprovalChecklist /> },
        { path: '/projects/:id/dependency-graph', element: <DependencyGraph /> },
        { path: '/projects/:id/documents', element: <DocumentCenter /> },
        { path: '/projects/:id/pre-validation', element: <PreValidation /> },
        { path: '/projects/:id/verified-data', element: <VerifiedDataPassport /> },
        { path: '/projects/:id/compliance', element: <Compliance /> },
        { path: '/projects/:id/renewals', element: <Renewals /> },
        { path: '/projects/:id/incentives', element: <Incentives /> },
        { path: '/applications/:id', element: <ApplicationDetails /> },
        { path: '/applications/:id/queries', element: <Queries /> },
        { path: '/applications/:id/inspection', element: <InspectionSchedule /> },
        { path: '/applications/:id/sla', element: <SLATracker /> },
        { path: '/schemes', element: <Schemes /> },
        { path: '/notifications', element: <Notifications /> },
        { path: '/grievances', element: <Grievances /> },
      ]
    }]
  },

  // Officer routes
  {
    element: <ProtectedRoute allowedRoles={['officer', 'department_head', 'admin']} />,
    children: [{
      element: <AppLayout role="officer" />,
      children: [
        { path: '/officer/dashboard', element: <OfficerDashboard /> },
        { path: '/officer/queue', element: <ApplicationQueue /> },
        { path: '/officer/applications/:id', element: <ApplicationReview /> },
        { path: '/officer/applications/:id/documents', element: <DocumentReview /> },
        { path: '/officer/queries', element: <QueryManagement /> },
        { path: '/officer/risk/:id', element: <RiskAssessment /> },
        { path: '/officer/inspections', element: <InspectionPlanner /> },
        { path: '/officer/sla', element: <SLAMonitor /> },
      ]
    }]
  },

  // Admin routes
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [{
      element: <AppLayout role="admin" />,
      children: [
        { path: '/admin/regulatory-rules', element: <RegulatoryRules /> },
        { path: '/admin/connectors', element: <Connectors /> },
        { path: '/admin/audit-logs', element: <AuditLogs /> },
        { path: '/admin/analytics', element: <Analytics /> },
      ]
    }]
  },

  // Catch-all
  { path: '*', element: <Navigate to="/" replace /> },
])

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

export default App
