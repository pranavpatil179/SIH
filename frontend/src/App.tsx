import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/authStore';
import { AppLayout } from './components/layout/AppLayout';

// Public pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/auth/LoginPage';

// Entrepreneur pages
import DashboardPage from './pages/entrepreneur/DashboardPage';
import BusinessProfilePage from './pages/entrepreneur/BusinessProfilePage';
import RoadmapPage from './pages/entrepreneur/RoadmapPage';
import DocumentsPage from './pages/entrepreneur/DocumentsPage';
import ApplicationsPage from './pages/entrepreneur/ApplicationsPage';
import ApplicationDetailPage from './pages/entrepreneur/ApplicationDetailPage';
import QueriesPage from './pages/entrepreneur/QueriesPage';
import InspectionsPage from './pages/entrepreneur/InspectionsPage';
import SchemesPage from './pages/entrepreneur/SchemesPage';
import CompliancePage from './pages/entrepreneur/CompliancePage';
import NotificationsPage from './pages/entrepreneur/NotificationsPage';
import GrievancesPage from './pages/entrepreneur/GrievancesPage';

// Officer pages
import OfficerDashboard from './pages/officer/OfficerDashboard';
import OfficerApplicationsPage from './pages/officer/OfficerApplicationsPage';
import ApplicationReviewPage from './pages/officer/ApplicationReviewPage';
import OfficerQueriesPage from './pages/officer/OfficerQueriesPage';
import OfficerInspectionsPage from './pages/officer/OfficerInspectionsPage';
import OfficerSLAPage from './pages/officer/OfficerSLAPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDepartmentsPage from './pages/admin/AdminDepartmentsPage';
import AdminApprovalsPage from './pages/admin/AdminApprovalsPage';
import AdminSchemesPage from './pages/admin/AdminSchemesPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AuditLogPage from './pages/admin/AuditLogPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: string;
}) {
  const { user, profile, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f8f9fc]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002046]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && profile?.role !== requiredRole && profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { user, setUser, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }: any) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! });
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) setProfile(profile);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! });
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) setProfile(profile);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Login */}
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Entrepreneur Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/business" element={<BusinessProfilePage />} />
            <Route path="/business/setup" element={<BusinessProfilePage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/applications/:applicationId" element={<ApplicationDetailPage />} />
            <Route path="/queries" element={<QueriesPage />} />
            <Route path="/inspections" element={<InspectionsPage />} />
            <Route path="/schemes" element={<SchemesPage />} />
            <Route path="/compliance" element={<CompliancePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/grievances" element={<GrievancesPage />} />
          </Route>

          {/* Officer Routes */}
          <Route
            element={
              <ProtectedRoute requiredRole="officer">
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/officer/dashboard" element={<OfficerDashboard />} />
            <Route path="/officer/applications" element={<OfficerApplicationsPage />} />
            <Route path="/officer/applications/:approvalId" element={<ApplicationReviewPage />} />
            <Route path="/officer/queries" element={<OfficerQueriesPage />} />
            <Route path="/officer/inspections" element={<OfficerInspectionsPage />} />
            <Route path="/officer/sla" element={<OfficerSLAPage />} />
            <Route path="/officer/analytics" element={<AdminDashboard />} />
            <Route path="/officer/grievances" element={<GrievancesPage />} />
          </Route>

          {/* Admin Routes */}
          <Route
            element={
              <ProtectedRoute requiredRole="admin">
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/departments" element={<AdminDepartmentsPage />} />
            <Route path="/admin/approvals" element={<AdminApprovalsPage />} />
            <Route path="/admin/schemes" element={<AdminSchemesPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/analytics" element={<AdminDashboard />} />
            <Route path="/admin/audit" element={<AuditLogPage />} />
            <Route path="/admin/grievances" element={<GrievancesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
