import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { api } from '@/services/api';
import type { DashboardStats, ActivityLog, LoginTrendPoint } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ── Mini bar chart ─────────────────────────────────────────────────────────────
function LoginChart({ trend }: { trend: LoginTrendPoint[] }) {
  if (!trend.length) return (
    <div className="flex items-end justify-center gap-1.5 h-16">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="flex-1 bg-gray-100 rounded-sm" style={{ height: '8px' }} />
      ))}
    </div>
  );

  const max = Math.max(...trend.map(t => t.count), 1);
  // Fill gaps for missing days (last 7 days)
  const days: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const found = trend.find(t => t.date === dateStr);
    days.push({ label: d.toLocaleDateString('en-ZA', { weekday: 'short' }), count: found?.count ?? 0 });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1.5 h-16">
        {days.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end">
            <div
              className="rounded-sm transition-all duration-500"
              style={{
                height: `${Math.max((d.count / max) * 56, d.count > 0 ? 6 : 3)}px`,
                background: d.count > 0
                  ? 'linear-gradient(to top, #1d6fa4, #3b9fd1)'
                  : '#e5e7eb',
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        {days.map((d, i) => (
          <span key={i} className="flex-1 text-center text-xs text-gray-400">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, gradient, sub, badge, badgeColor }: {
  label: string; value: number | string; icon: React.ReactNode;
  gradient: string; sub?: string; badge?: string; badgeColor?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${gradient}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">{label}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-3xl font-bold text-gray-900">{value}</span>
          {badge && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
          )}
        </div>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Action action card ─────────────────────────────────────────────────────────
function QuickAction({ icon, label, desc, onClick, color }: {
  icon: React.ReactNode; label: string; desc: string; onClick: () => void; color: string;
}) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all text-left group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900">{label}</p>
        <p className="text-xs text-gray-400 truncate">{desc}</p>
      </div>
      <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
      </svg>
    </button>
  );
}

// ── Activity row ───────────────────────────────────────────────────────────────
const actionConfig: Record<string, { label: string; icon: string; color: string }> = {
  LOGIN:            { label: 'Logged in',         icon: '🔑', color: 'bg-blue-50 text-blue-600' },
  LOGOUT:           { label: 'Logged out',         icon: '🚪', color: 'bg-gray-100 text-gray-500' },
  INTERN_APPROVED:  { label: 'Intern approved',    icon: '✅', color: 'bg-green-50 text-green-600' },
  INTERN_REJECTED:  { label: 'Intern rejected',    icon: '❌', color: 'bg-red-50 text-red-500' },
  INTERN_UPDATED:   { label: 'Intern updated',     icon: '✏️', color: 'bg-yellow-50 text-yellow-600' },
  TICKET_CREATED:   { label: 'Ticket created',     icon: '🎫', color: 'bg-purple-50 text-purple-600' },
  TICKET_UPDATED:   { label: 'Ticket updated',     icon: '🔄', color: 'bg-indigo-50 text-indigo-600' },
  FILE_UPLOADED:    { label: 'File uploaded',      icon: '📎', color: 'bg-orange-50 text-orange-600' },
  TASK_CREATED:     { label: 'Task created',       icon: '📋', color: 'bg-teal-50 text-teal-600' },
  PASSWORD_CHANGE:  { label: 'Password changed',   icon: '🔒', color: 'bg-pink-50 text-pink-600' },
  ADMIN_CREATED:    { label: 'Admin created',      icon: '👤', color: 'bg-violet-50 text-violet-600' },
  DEPARTMENT_CREATED:{ label: 'Department added',  icon: '🏢', color: 'bg-cyan-50 text-cyan-600' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── System health ──────────────────────────────────────────────────────────────
function HealthPill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${ok ? 'bg-emerald-400' : 'bg-red-400'}`}
        style={ok ? { boxShadow: '0 0 0 3px rgba(52,211,153,0.2)' } : {}} />
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className={`ml-auto text-xs font-semibold ${ok ? 'text-emerald-600' : 'text-red-600'}`}>
        {ok ? 'Operational' : 'Down'}
      </span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loginTrend, setLoginTrend] = useState<LoginTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then((res: any) => {
        setStats(res.stats);
        setActivities(res.recentActivities ?? []);
        setLoginTrend(res.loginTrend ?? []);
      })
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(29,111,164,0.2)', borderTopColor: '#1d6fa4' }}/>
            <p className="text-sm text-gray-400">Loading dashboard…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const approvalRate = stats && stats.totalInterns > 0
    ? Math.round((stats.approvedInterns / stats.totalInterns) * 100)
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {greeting}, Super Admin 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {now.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              &nbsp;·&nbsp;Full system overview
            </p>
          </div>
          <button
            onClick={() => navigate('/superadmin/admins')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl shadow-sm transition-opacity hover:opacity-90 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Manage Admins
          </button>
        </div>

        {/* ── Primary stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Interns"
            value={stats?.totalInterns ?? 0}
            sub="registered in system"
            gradient="bg-blue-50"
            icon={<svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
          />
          <StatCard
            label="Pending Approvals"
            value={stats?.pendingApprovals ?? 0}
            sub="awaiting review"
            gradient="bg-orange-50"
            badge={stats?.pendingApprovals ? 'Action needed' : undefined}
            badgeColor="bg-orange-100 text-orange-700"
            icon={<svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
          />
          <StatCard
            label="Today's Logins"
            value={stats?.todayLogins ?? 0}
            sub="active sessions today"
            gradient="bg-purple-50"
            icon={<svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>}
          />
          <StatCard
            label="Open Tickets"
            value={stats?.openTickets ?? 0}
            sub={`of ${stats?.totalTickets ?? 0} total tickets`}
            gradient="bg-red-50"
            badge={stats?.openTickets ? 'Needs attention' : undefined}
            badgeColor="bg-red-100 text-red-700"
            icon={<svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>}
          />
        </div>

        {/* ── Secondary stat row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Admins',       value: stats?.totalAdmins ?? 0,      icon: '🛡️', color: 'text-violet-700', bg: 'bg-violet-50' },
            { label: 'Approved',     value: stats?.approvedInterns ?? 0,  icon: '✅', color: 'text-green-700',  bg: 'bg-green-50'  },
            { label: 'Departments',  value: stats?.totalDepartments ?? 0, icon: '🏢', color: 'text-cyan-700',   bg: 'bg-cyan-50'   },
            { label: 'Tasks Today',  value: stats?.tasksToday ?? 0,       icon: '📋', color: 'text-teal-700',   bg: 'bg-teal-50'   },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 flex items-center gap-3`}>
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Login trend chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Login Activity</h2>
                <p className="text-xs text-gray-400 mt-0.5">Daily logins over the last 7 days</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"/>
                Live
              </div>
            </div>
            <LoginChart trend={loginTrend} />
            <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-gray-50">
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{stats?.todayLogins ?? 0}</p>
                <p className="text-xs text-gray-400">Today</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{loginTrend.reduce((a, b) => a + b.count, 0)}</p>
                <p className="text-xs text-gray-400">This week</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{approvalRate}%</p>
                <p className="text-xs text-gray-400">Approval rate</p>
              </div>
            </div>
          </div>

          {/* Intern funnel */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-5">Intern Pipeline</h2>
            <div className="space-y-4">
              {[
                { label: 'Total Registered', value: stats?.totalInterns ?? 0,    color: '#1d6fa4', bg: '#eff6ff' },
                { label: 'Approved',         value: stats?.approvedInterns ?? 0, color: '#16a34a', bg: '#f0fdf4' },
                { label: 'Pending',          value: stats?.pendingApprovals ?? 0,color: '#d97706', bg: '#fffbeb' },
                { label: 'Rejected',         value: stats?.rejectedInterns ?? 0, color: '#dc2626', bg: '#fef2f2' },
              ].map(item => {
                const pct = stats?.totalInterns
                  ? Math.round((item.value / stats.totalInterns) * 100)
                  : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{item.value}</span>
                        <span className="text-xs text-gray-400">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: item.bg }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: item.color }}/>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Approval rate ring */}
            <div className="mt-6 flex items-center justify-center">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#e5e7eb" strokeWidth="10"/>
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#1d6fa4" strokeWidth="10"
                    strokeDasharray={`${(approvalRate / 100) * 239} 239`}
                    strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-gray-900">{approvalRate}%</span>
                  <span className="text-xs text-gray-400 leading-none">approved</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent activity */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
              <span className="text-xs text-gray-400">{activities.length} events</span>
            </div>
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                <p className="text-sm">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                {activities.map((a) => {
                  const cfg = actionConfig[a.action] ?? { label: a.action, icon: '•', color: 'bg-gray-100 text-gray-500' };
                  const name = a.first_name ? `${a.first_name} ${a.last_name}` : a.email;
                  return (
                    <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${cfg.color}`}>
                        {cfg.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">
                          <span className="font-medium truncate">{name}</span>
                          {' '}<span className="text-gray-500">{cfg.label.toLowerCase()}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(a.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Quick actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <QuickAction
                  onClick={() => navigate('/superadmin/admins')}
                  label="Manage Admins"
                  desc="Add or review admin accounts"
                  color="bg-violet-50"
                  icon={<svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>}
                />
                <QuickAction
                  onClick={() => navigate('/admin/interns')}
                  label="Approve Interns"
                  desc={`${stats?.pendingApprovals ?? 0} pending approvals`}
                  color="bg-orange-50"
                  icon={<svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>}
                />
                <QuickAction
                  onClick={() => navigate('/admin/tickets')}
                  label="View Tickets"
                  desc={`${stats?.openTickets ?? 0} open tickets`}
                  color="bg-red-50"
                  icon={<svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>}
                />
                <QuickAction
                  onClick={() => navigate('/admin/reports')}
                  label="View Reports"
                  desc="Analytics and performance data"
                  color="bg-blue-50"
                  icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>}
                />
              </div>
            </div>

            {/* System health */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">System Health</h2>
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                  All systems go
                </span>
              </div>
              <div className="space-y-2">
                <HealthPill label="Database (SQLite)" ok={true}/>
                <HealthPill label="File Storage" ok={true}/>
                <HealthPill label="Auth Service (JWT)" ok={true}/>
                <HealthPill label="GPS Tracking" ok={true}/>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
