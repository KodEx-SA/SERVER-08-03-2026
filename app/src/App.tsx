import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

// ── Public pages ───────────────────────────────────────────────────────────────
import LandingPage       from '@/pages/LandingPage';
import RegisterPage      from '@/pages/RegisterPage';
import AdminLoginPage    from '@/pages/admin/AdminLoginPage';
import InternLoginPage   from '@/pages/intern/InternLoginPage';

// ── Intern pages ───────────────────────────────────────────────────────────────
import InternDashboard   from '@/pages/intern/Dashboard';
import InternProfile     from '@/pages/intern/Profile';
import InternTasks       from '@/pages/intern/Tasks';
import InternFiles       from '@/pages/intern/Files';
import InternLoginHistory from '@/pages/intern/LoginHistory';
import InternTickets     from '@/pages/intern/Tickets';
import InternCreateTicket from '@/pages/intern/CreateTicket';
import InternTicketDetails from '@/pages/intern/InternTicketDetails';
import InternCheckIn     from '@/pages/intern/CheckIn';
import InternSettings    from '@/pages/intern/Settings';

// ── Admin pages ────────────────────────────────────────────────────────────────
import AdminDashboard    from '@/pages/admin/Dashboard';
import AdminInterns      from '@/pages/admin/Interns';
import AdminInternDetails from '@/pages/admin/InternDetails';
import AdminAdvanced     from '@/pages/admin/AdminAdvancedFeatures';
import AdminTickets      from '@/pages/admin/Tickets';
import AdminCreateTicket from '@/pages/admin/CreateTicket';
import AdminTicketDetails from '@/pages/admin/TicketDetails';
import AdminDepartments  from '@/pages/admin/Departments';
import AdminReports      from '@/pages/admin/Reports';
import AdminSettings     from '@/pages/admin/Settings';

// ── Super Admin pages ──────────────────────────────────────────────────────────
import SuperAdminDashboard from '@/pages/superadmin/Dashboard';
import SuperAdminAdmins    from '@/pages/superadmin/Admins';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1b2a' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(29,111,164,0.3)', borderTopColor: '#1d6fa4' }}/>
          <p className="text-sm font-medium" style={{ color: 'rgba(147,197,232,0.6)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // ── Intern routes ──────────────────────────────────────────────────────────
  if (user?.role === 'intern') {
    return (
      <Routes>
        <Route path="/"                 element={<InternDashboard />} />
        <Route path="/profile"          element={<InternProfile />} />
        <Route path="/tasks"            element={<InternTasks />} />
        <Route path="/files"            element={<InternFiles />} />
        <Route path="/login-history"    element={<InternLoginHistory />} />
        <Route path="/tickets"          element={<InternTickets />} />
        <Route path="/tickets/new"      element={<InternCreateTicket />} />
        <Route path="/tickets/:id"      element={<InternTicketDetails />} />
        <Route path="/checkin"          element={<InternCheckIn />} />
        <Route path="/settings"         element={<InternSettings />} />
        <Route path="*"                 element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // ── Admin routes ───────────────────────────────────────────────────────────
  if (user?.role === 'admin' || user?.role === 'super_admin') {
    return (
      <Routes>
        {/* Admin root */}
        <Route path="/"                          element={<Navigate to="/admin" replace />} />
        <Route path="/admin"                     element={<AdminDashboard />} />
        <Route path="/admin/interns"             element={<AdminInterns />} />
        <Route path="/admin/interns/:id"         element={<AdminInternDetails />} />
        <Route path="/admin/advanced"            element={<AdminAdvanced />} />
        <Route path="/admin/tickets"             element={<AdminTickets />} />
        <Route path="/admin/tickets/new"         element={<AdminCreateTicket />} />
        <Route path="/admin/tickets/:id"         element={<AdminTicketDetails />} />
        <Route path="/admin/departments"         element={<AdminDepartments />} />
        <Route path="/admin/reports"             element={<AdminReports />} />
        <Route path="/admin/settings"            element={<AdminSettings />} />

        {/* Super Admin routes (only accessible when role = super_admin) */}
        {user.role === 'super_admin' && (
          <>
            <Route path="/superadmin"            element={<SuperAdminDashboard />} />
            <Route path="/superadmin/admins"     element={<SuperAdminAdmins />} />
          </>
        )}

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  // ── Public routes (not logged in) ──────────────────────────────────────────
  return (
    <Routes>
      <Route path="/"              element={<LandingPage />} />
      <Route path="/register"      element={<RegisterPage />} />
      <Route path="/admin/login"   element={<AdminLoginPage />} />
      <Route path="/intern/login"  element={<InternLoginPage />} />
      <Route path="*"              element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </Router>
    </AuthProvider>
  );
}

export default App;
