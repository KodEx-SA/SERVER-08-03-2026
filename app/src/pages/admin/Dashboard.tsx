import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { api } from '@/services/api';
import type { DashboardStats, ActivityLog, LoginTrendPoint } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

function LoginChart({ trend }: { trend: LoginTrendPoint[] }) {
  const days: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const found = trend.find(t => t.date === dateStr);
    days.push({ label: d.toLocaleDateString('en-ZA', { weekday: 'short' }), count: found?.count ?? 0 });
  }
  const max = Math.max(...days.map(d => d.count), 1);
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1.5 h-16">
        {days.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end">
            <div className="rounded-sm transition-all duration-500" style={{
              height: `${Math.max((d.count / max) * 56, d.count > 0 ? 6 : 3)}px`,
              background: d.count > 0 ? 'linear-gradient(to top,#1d6fa4,#3b9fd1)' : '#e5e7eb',
            }}/>
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        {days.map((d, i) => <span key={i} className="flex-1 text-center text-xs text-gray-400">{d.label}</span>)}
      </div>
    </div>
  );
}

const actionConfig: Record<string, { label: string; icon: string; color: string }> = {
  LOGIN:            { label: 'logged in',        icon: '🔑', color: 'bg-blue-50 text-blue-600' },
  LOGOUT:           { label: 'logged out',        icon: '🚪', color: 'bg-gray-100 text-gray-500' },
  INTERN_APPROVED:  { label: 'intern approved',   icon: '✅', color: 'bg-green-50 text-green-600' },
  INTERN_REJECTED:  { label: 'intern rejected',   icon: '❌', color: 'bg-red-50 text-red-500' },
  INTERN_UPDATED:   { label: 'intern updated',    icon: '✏️', color: 'bg-yellow-50 text-yellow-600' },
  TICKET_CREATED:   { label: 'ticket created',    icon: '🎫', color: 'bg-purple-50 text-purple-600' },
  TICKET_UPDATED:   { label: 'ticket updated',    icon: '🔄', color: 'bg-indigo-50 text-indigo-600' },
  FILE_UPLOADED:    { label: 'file uploaded',     icon: '📎', color: 'bg-orange-50 text-orange-600' },
  TASK_CREATED:     { label: 'task created',      icon: '📋', color: 'bg-teal-50 text-teal-600' },
  PASSWORD_CHANGE:  { label: 'changed password',  icon: '🔒', color: 'bg-pink-50 text-pink-600' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminDashboard() {
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

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(29,111,164,0.2)', borderTopColor: '#1d6fa4' }}/>
          <p className="text-sm text-gray-400">Loading dashboard…</p>
        </div>
      </div>
    </AdminLayout>
  );

  const approvalRate = stats && stats.totalInterns > 0
    ? Math.round((stats.approvedInterns / stats.totalInterns) * 100) : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{greeting} 👋</h1>
            <p className="text-gray-500 text-sm mt-1">
              {now.toLocaleDateString('en-ZA', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
              &nbsp;·&nbsp;Admin overview
            </p>
          </div>
          {stats && stats.pendingApprovals > 0 && (
            <button onClick={() => navigate('/admin/interns')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl shadow-sm hover:opacity-90 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {stats.pendingApprovals} Pending Approval{stats.pendingApprovals > 1 ? 's' : ''}
            </button>
          )}
        </div>

        {/* Primary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label:'Total Interns',    value: stats?.totalInterns ?? 0,    sub:'registered',         bg:'bg-blue-50',   icon:'👥', color:'text-blue-600' },
            { label:'Pending Approval', value: stats?.pendingApprovals ?? 0, sub:'awaiting review',    bg:'bg-orange-50', icon:'⏳', color:'text-orange-500' },
            { label:'Approved Interns', value: stats?.approvedInterns ?? 0,  sub:'active interns',     bg:'bg-green-50',  icon:'✅', color:'text-green-600' },
            { label:"Today's Logins",   value: stats?.todayLogins ?? 0,      sub:'sessions today',     bg:'bg-purple-50', icon:'🔑', color:'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${s.bg}`}>{s.icon}</div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{s.label}</p>
                <p className={`text-3xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label:'Tasks Today',  value: stats?.tasksToday ?? 0,       icon:'📋', color:'text-teal-700',   bg:'bg-teal-50'   },
            { label:'Open Tickets', value: stats?.openTickets ?? 0,       icon:'🎫', color:'text-red-700',    bg:'bg-red-50'    },
            { label:'Departments',  value: stats?.totalDepartments ?? 0,  icon:'🏢', color:'text-cyan-700',   bg:'bg-cyan-50'   },
            { label:'Approval Rate',value: `${approvalRate}%`,            icon:'📈', color:'text-indigo-700', bg:'bg-indigo-50' },
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

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Login chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Login Activity</h2>
                <p className="text-xs text-gray-400 mt-0.5">Daily logins — last 7 days</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"/>Live
              </div>
            </div>
            <LoginChart trend={loginTrend}/>
            <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-gray-50">
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{stats?.todayLogins ?? 0}</p>
                <p className="text-xs text-gray-400">Today</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{loginTrend.reduce((a,b) => a + b.count, 0)}</p>
                <p className="text-xs text-gray-400">This week</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{approvalRate}%</p>
                <p className="text-xs text-gray-400">Approved</p>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label:'Manage Interns',   desc:`${stats?.totalInterns ?? 0} registered`,           path:'/admin/interns',     icon:'👥', color:'bg-blue-50' },
                { label:'View Tickets',     desc:`${stats?.openTickets ?? 0} open`,                  path:'/admin/tickets',     icon:'🎫', color:'bg-red-50' },
                { label:'Departments',      desc:`${stats?.totalDepartments ?? 0} active`,           path:'/admin/departments', icon:'🏢', color:'bg-cyan-50' },
                { label:'Reports',          desc:'Analytics & performance',                           path:'/admin/reports',     icon:'📊', color:'bg-purple-50' },
                { label:'Settings',         desc:'Account & preferences',                             path:'/admin/settings',    icon:'⚙️', color:'bg-gray-50' },
              ].map(a => (
                <button key={a.path} onClick={() => navigate(a.path)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all text-left group">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${a.color}`}>{a.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{a.label}</p>
                    <p className="text-xs text-gray-400 truncate">{a.desc}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
            <span className="text-xs text-gray-400">{activities.length} events</span>
          </div>
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-300">
              <span className="text-4xl mb-3">📋</span>
              <p className="text-sm">No activity yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-72 overflow-y-auto pr-1">
              {activities.map(a => {
                const cfg = actionConfig[a.action] ?? { label: a.action.toLowerCase(), icon: '•', color: 'bg-gray-100 text-gray-500' };
                const name = a.first_name ? `${a.first_name} ${a.last_name}` : a.email;
                return (
                  <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${cfg.color}`}>{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">
                        <span className="font-medium">{name}</span>{' '}
                        <span className="text-gray-500">{cfg.label}</span>
                      </p>
                      <p className="text-xs text-gray-400">{timeAgo(a.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
