import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

// Pages
import LandingPage from '@/pages/LandingPage';
import RegisterPage from '@/pages/RegisterPage';
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import InternLoginPage from '@/pages/intern/InternLoginPage';
import InternDashboard from '@/pages/intern/Dashboard';
import InternProfile from '@/pages/intern/Profile';
import InternTasks from '@/pages/intern/Tasks';
import InternFiles from '@/pages/intern/Files';
import InternLoginHistory from '@/pages/intern/LoginHistory';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminInterns from '@/pages/admin/Interns';
import AdminInternDetails from '@/pages/admin/InternDetails';
import AdminAdvancedFeatures from '@/pages/admin/AdminAdvancedFeatures';
import SuperAdminDashboard from '@/pages/superadmin/Dashboard';
import SuperAdminAdmins from '@/pages/superadmin/Admins';

function AppRoutes() {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is logged in, show their dashboard
  if (user) {
    return (
      <Routes>
        {/* Intern Routes */}
        {user.role === 'intern' && (
          <>
            <Route path="/" element={<InternDashboard />} />
            <Route path="/profile" element={<InternProfile />} />
            <Route path="/tasks" element={<InternTasks />} />
            <Route path="/files" element={<InternFiles />} />
            <Route path="/login-history" element={<InternLoginHistory />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

        {/* Admin Routes */}
        {user.role === 'admin' && (
          <>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/interns" element={<AdminInterns />} />
            <Route path="/admin/interns/:id" element={<AdminInternDetails />} />
            <Route path="/admin/advanced" element={<AdminAdvancedFeatures />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </>
        )}

        {/* Super Admin Routes */}
        {user.role === 'super_admin' && (
          <>
            <Route path="/" element={<Navigate to="/superadmin" replace />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/interns" element={<AdminInterns />} />
            <Route path="/admin/interns/:id" element={<AdminInternDetails />} />
            <Route path="/admin/advanced" element={<AdminAdvancedFeatures />} />
            <Route path="/superadmin" element={<SuperAdminDashboard />} />
            <Route path="/superadmin/admins" element={<SuperAdminAdmins />} />
            <Route path="*" element={<Navigate to="/superadmin" replace />} />
          </>
        )}
      </Routes>
    );
  }

  // Not logged in - show public routes
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/intern/login" element={<InternLoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}

export default App;
