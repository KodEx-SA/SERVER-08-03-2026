import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InternLayout } from '@/components/layouts/InternLayout';
import { api } from '@/services/api';
import type { Task, LoginLog } from '@/types';
import { toast } from 'sonner';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function sessionDuration(login: string, logout?: string) {
  if (!logout) return null;
  const diff = new Date(logout).getTime() - new Date(login).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const statusConfig = {
  completed:   { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500'  },
  in_progress: { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  pending:     { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  cancelled:   { bg: 'bg-gray-100',  text: 'text-gray-500',   dot: 'bg-gray-400'   },
};

export default function InternDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getProfile(), api.getTasks(), api.getLoginHistory()])
      .then(([p, t, h]) => {
        setProfile((p as any).profile);
        setTasks((t as any).tasks ?? []);
        setLoginHistory((h as any).history ?? []);
      })
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <InternLayout>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'rgba(22,163,74,0.2)', borderTopColor: '#16a34a' }}/>
          <p className="text-sm text-gray-400">Loading dashboard…</p>
        </div>
      </div>
    </InternLayout>
  );

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const todayTasks = tasks.filter(t => new Date(t.task_date).toDateString() === now.toDateString());
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekHours = tasks.filter(t => new Date(t.task_date) >= weekAgo).reduce((s, t) => s + (t.hours_spent ?? 0), 0);
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const recentTasks = [...tasks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
  const recentLogins = loginHistory.slice(0, 4);

  const approvalStatus = profile?.approval_status;
  const statusColors = { approved: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Approved' }, pending: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', label: 'Pending Approval' }, rejected: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Rejected' } };
  const sc = statusColors[approvalStatus as keyof typeof statusColors] ?? statusColors.pending;

  return (
    <InternLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {greeting}, {profile?.first_name ?? 'Intern'} 👋
            </h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-xs font-mono font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                {profile?.intern_code}
              </span>
              <span className="text-gray-300">·</span>
              <p className="text-gray-500 text-sm">
                {now.toLocaleDateString('en-ZA', { weekday:'long', month:'long', day:'numeric' })}
              </p>
            </div>
          </div>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${sc.bg} ${sc.text}`}>
            <span className={`w-2 h-2 rounded-full ${sc.dot}`}/>
            {sc.label}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Today's Tasks",  value: todayTasks.length,                                           bg: 'bg-green-50',  color: 'text-green-700',  icon: '📅' },
            { label: 'Hours This Week', value: weekHours % 1 === 0 ? weekHours : weekHours.toFixed(1),     bg: 'bg-blue-50',   color: 'text-blue-700',   icon: '⏱️' },
            { label: 'Tasks Completed', value: completedTasks,                                             bg: 'bg-teal-50',   color: 'text-teal-700',   icon: '✅' },
            { label: 'Total Tasks',     value: tasks.length,                                               bg: 'bg-purple-50', color: 'text-purple-700', icon: '📋' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${s.bg}`}>{s.icon}</div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{s.label}</p>
                <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Profile info banner */}
        {profile && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
                {profile.first_name?.[0]}{profile.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-gray-900">{profile.first_name} {profile.last_name}</p>
                <p className="text-sm text-gray-500">{profile.position ?? 'Intern'} · {profile.department ?? 'No department'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{profile.email}</p>
              </div>
              <button onClick={() => navigate('/profile')}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 flex-shrink-0 transition-colors">
                Edit Profile →
              </button>
            </div>
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent tasks */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Recent Tasks</h2>
              <button onClick={() => navigate('/tasks')} className="text-sm font-medium hover:underline" style={{ color: '#16a34a' }}>
                View all →
              </button>
            </div>
            {recentTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                <span className="text-4xl mb-3">📋</span>
                <p className="text-sm font-medium text-gray-400">No tasks logged yet</p>
                <button onClick={() => navigate('/tasks')} className="mt-3 px-4 py-2 text-sm font-medium rounded-xl text-white" style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
                  Log Your First Task
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentTasks.map(task => {
                  const sc = statusConfig[task.status] ?? statusConfig.pending;
                  return (
                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sc.dot}`}/>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(task.task_date).toLocaleDateString('en-ZA', { day:'numeric', month:'short' })}
                          {task.hours_spent ? ` · ${task.hours_spent}h` : ''}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${sc.bg} ${sc.text}`}>
                        {task.status.replace('_',' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { label: 'Log a Task',      desc: 'Record today\'s work',   path: '/tasks',         icon: '📋', color: 'bg-green-50' },
                  { label: 'Upload File',     desc: 'Submit documents',        path: '/files',         icon: '📎', color: 'bg-blue-50'  },
                  { label: 'Submit Ticket',   desc: 'Report an issue',         path: '/tickets/new',   icon: '🎫', color: 'bg-purple-50'},
                  { label: 'Check In',        desc: 'Sign in to location',     path: '/checkin',       icon: '📍', color: 'bg-orange-50'},
                ].map(a => (
                  <button key={a.path} onClick={() => navigate(a.path)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all text-left group">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${a.color}`}>{a.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{a.label}</p>
                      <p className="text-xs text-gray-400">{a.desc}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent logins */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">Recent Logins</h2>
                <button onClick={() => navigate('/login-history')} className="text-xs font-medium hover:underline" style={{ color: '#16a34a' }}>See all</button>
              </div>
              {recentLogins.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No login records</p>
              ) : (
                <div className="space-y-2.5">
                  {recentLogins.map(log => {
                    const dur = sessionDuration(log.login_time, log.logout_time);
                    return (
                      <div key={log.id} className="flex items-start gap-2.5">
                        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!log.logout_time ? 'bg-green-500' : 'bg-gray-300'}`}/>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700">
                            {new Date(log.login_time).toLocaleDateString('en-ZA', { day:'numeric', month:'short' })}
                            {' · '}{new Date(log.login_time).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                          </p>
                          <p className="text-xs text-gray-400">
                            {log.browser ?? 'Unknown'} · {dur ? `${dur}` : 'Active'}
                          </p>
                        </div>
                        {log.login_latitude && <span className="text-xs text-green-600 flex-shrink-0">📍</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </InternLayout>
  );
}
