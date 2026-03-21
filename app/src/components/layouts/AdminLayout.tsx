import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AdminLayoutProps { children: React.ReactNode; }

// ── SVG icons ──────────────────────────────────────────────────────────────────
const Icon = {
  dashboard:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h7v7H3zM3 17h7v4H3zM14 3h7v5h-7zM14 12h7v9h-7z"/></svg>,
  interns:     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
  tickets:     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>,
  departments: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>,
  reports:     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  settings:    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  superadmin:  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
  signout:     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>,
  menu:        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>,
  close:       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  admins:      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isActive = (path: string) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);

  const isSuperAdmin = user?.role === 'super_admin';

  const handleLogout = async () => {
    try { await logout(); toast.success('Logged out'); }
    catch { toast.error('Logout failed'); }
  };

  const navGroups = [
    {
      label: 'Management',
      items: [
        { label: 'Dashboard',    path: '/admin',             icon: Icon.dashboard },
        { label: 'Interns',      path: '/admin/interns',     icon: Icon.interns },
        { label: 'Tickets',      path: '/admin/tickets',     icon: Icon.tickets },
        { label: 'Departments',  path: '/admin/departments', icon: Icon.departments },
      ],
    },
    {
      label: 'Analytics',
      items: [
        { label: 'Reports',      path: '/admin/reports',     icon: Icon.reports },
      ],
    },
    ...(isSuperAdmin ? [{
      label: 'Super Admin',
      items: [
        { label: 'Super Dashboard', path: '/superadmin',          icon: Icon.superadmin },
        { label: 'Manage Admins',   path: '/superadmin/admins',   icon: Icon.admins },
      ],
    }] : []),
    {
      label: 'Account',
      items: [
        { label: 'Settings',     path: '/admin/settings',    icon: Icon.settings },
      ],
    },
  ];

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'AD';

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(180deg,#0d1b2a 0%,#0f2137 100%)' }}>
      {/* Header */}
      <div className="px-5 py-5 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
            </svg>
          </div>
          <div>
            <h1 className="text-white font-extrabold text-sm leading-none tracking-tight">IMS Admin</h1>
            <p className="text-xs mt-0.5 font-medium" style={{ color: 'rgba(96,180,232,0.7)' }}>
              {isSuperAdmin ? 'Super Admin' : 'Admin Portal'}
            </p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {Icon.close}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(96,180,232,0.4)' }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <button key={item.path} onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left"
                  style={isActive(item.path) ? {
                    background: 'linear-gradient(135deg,rgba(29,111,164,0.9),rgba(14,77,122,0.9))',
                    color: '#fff',
                    boxShadow: '0 4px 15px -3px rgba(29,111,164,0.4)',
                  } : { color: 'rgba(147,197,232,0.5)' }}
                  onMouseEnter={e => { if (!isActive(item.path)) (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                  onMouseLeave={e => { if (!isActive(item.path)) (e.currentTarget as HTMLElement).style.color = 'rgba(147,197,232,0.5)'; }}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Tagline */}
      <div className="mx-3 mb-3 px-3 py-3 rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(147,197,232,0.5)' }}>
          <span className="font-semibold" style={{ color: 'rgba(147,197,232,0.85)' }}>Intern Management System</span><br/>
          Eullafied Tech Solutions · North West
        </p>
      </div>

      {/* User footer */}
      <div className="px-3 pb-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs truncate" style={{ color: 'rgba(96,180,232,0.5)' }}>
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ color: 'rgba(147,197,232,0.4)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(147,197,232,0.4)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          {Icon.signout}
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-20 lg:hidden" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)} />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 fixed inset-y-0 z-10">
        <SidebarContent />
      </aside>
      <div className="hidden lg:block w-64 flex-shrink-0" />

      {/* Mobile sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 lg:hidden transform transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-10 flex items-center gap-4 px-4 sm:px-6 h-14 border-b"
          style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderColor: '#e2e8f0' }}>
          <button onClick={() => setOpen(true)} className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100">
            {Icon.menu}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: isSuperAdmin ? 'rgba(168,85,247,0.1)' : 'rgba(29,111,164,0.1)',
                       color: isSuperAdmin ? '#9333ea' : '#1d6fa4' }}>
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>
              {initials}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
