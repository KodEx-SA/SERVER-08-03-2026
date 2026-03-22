import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { api } from '@/services/api';
import type { Intern, Task, LoginLog, FileItem } from '@/types';
import { toast } from 'sonner';

type Tab = 'overview' | 'tasks' | 'files' | 'logins';

const statusConfig = {
  approved: { bg:'bg-green-50', text:'text-green-700', dot:'bg-green-500', label:'Approved' },
  pending:  { bg:'bg-orange-50', text:'text-orange-700', dot:'bg-orange-500', label:'Pending' },
  rejected: { bg:'bg-red-50', text:'text-red-700', dot:'bg-red-500', label:'Rejected' },
};

const taskStatus = {
  completed:   { bg:'bg-green-50',  text:'text-green-700'  },
  in_progress: { bg:'bg-blue-50',   text:'text-blue-700'   },
  pending:     { bg:'bg-orange-50', text:'text-orange-700' },
  cancelled:   { bg:'bg-gray-100',  text:'text-gray-500'   },
};

function formatSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024*1024) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1024/1024).toFixed(1)} MB`;
}

function duration(login: string, logout?: string) {
  if (!logout) return 'Active';
  const diff = new Date(logout).getTime() - new Date(login).getTime();
  const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-gray-900 mt-1">{value || '—'}</p>
    </div>
  );
}

export default function AdminInternDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [intern, setIntern] = useState<Intern | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getInternDetails(parseInt(id!)) as any;
      setIntern(res.intern);
      setTasks(res.tasks ?? []);
      setLoginLogs(res.loginLogs ?? []);
      setFiles(res.files ?? []);
    } catch { toast.error('Failed to load intern details'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (id) load(); }, [id]);

  const handleApprove = async () => {
    try { await api.approveIntern(parseInt(id!)); toast.success('Intern approved'); load(); }
    catch { toast.error('Failed to approve intern'); }
  };

  const handleReject = async () => {
    if (!confirm('Reject this intern application?')) return;
    try { await api.rejectIntern(parseInt(id!)); toast.success('Intern rejected'); load(); }
    catch { toast.error('Failed to reject intern'); }
  };

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor:'rgba(29,111,164,0.2)', borderTopColor:'#1d6fa4' }}/>
      </div>
    </AdminLayout>
  );

  if (!intern) return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-gray-500">Intern not found.</p>
        <button onClick={() => navigate('/admin/interns')} className="text-sm font-medium" style={{ color:'#1d6fa4' }}>← Back to Interns</button>
      </div>
    </AdminLayout>
  );

  const sc = statusConfig[intern.approval_status as keyof typeof statusConfig] ?? statusConfig.pending;
  const age = intern.date_of_birth ? Math.floor((Date.now() - new Date(intern.date_of_birth).getTime()) / (365.25*24*60*60*1000)) : null;
  const totalHours = tasks.reduce((s, t) => s + (t.hours_spent ?? 0), 0);
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id:'overview', label:'Overview' },
    { id:'tasks',    label:'Tasks',  count: tasks.length },
    { id:'files',    label:'Files',  count: files.length },
    { id:'logins',   label:'Logins', count: loginLogs.length },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Back + header */}
        <div>
          <button onClick={() => navigate('/admin/interns')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back to Interns
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-20 relative" style={{ background:'linear-gradient(135deg,#0a1628,#0d2044,#0e3060)' }}>
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage:'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)', backgroundSize:'32px 32px' }}/>
            </div>
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-8">
                <div className="flex items-end gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold border-4 border-white shadow-lg flex-shrink-0"
                    style={{ background:'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>
                    {intern.first_name[0]}{intern.last_name[0]}
                  </div>
                  <div className="pb-1">
                    <h1 className="text-xl font-bold text-gray-900">{intern.first_name} {intern.last_name}</h1>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{intern.intern_code}</span>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}/>{sc.label}
                      </span>
                    </div>
                  </div>
                </div>
                {intern.approval_status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={handleReject} className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors">Reject</button>
                    <button onClick={handleApprove} className="px-4 py-2 text-sm font-semibold rounded-xl text-white hover:opacity-90 transition-opacity" style={{ background:'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>✓ Approve</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${activeTab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
              {t.count !== undefined && <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === t.id ? 'bg-gray-100 text-gray-700' : 'bg-gray-200 text-gray-500'}`}>{t.count}</span>}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label:'Total Tasks',     value: tasks.length,         bg:'bg-blue-50',   color:'text-blue-700'   },
                { label:'Completed',       value: completedTasks,       bg:'bg-green-50',  color:'text-green-700'  },
                { label:'Total Hours',     value: totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1), bg:'bg-purple-50', color:'text-purple-700' },
                { label:'Login Sessions',  value: loginLogs.length,     bg:'bg-orange-50', color:'text-orange-700' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Personal info */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Personal Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Email" value={intern.email}/>
                  <InfoItem label="Phone" value={intern.phone}/>
                  <InfoItem label="SA ID" value={intern.sa_id}/>
                  <InfoItem label="Date of Birth" value={intern.date_of_birth ? new Date(intern.date_of_birth).toLocaleDateString('en-ZA') : undefined}/>
                  <InfoItem label="Age" value={age ? `${age} years` : undefined}/>
                  <InfoItem label="Gender" value={intern.gender}/>
                  <InfoItem label="Citizenship" value={intern.citizenship}/>
                  <InfoItem label="Registered" value={intern.created_at ? new Date(intern.created_at).toLocaleDateString('en-ZA') : undefined}/>
                </div>
              </div>

              {/* Work + address */}
              <div className="space-y-5">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Work Information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoItem label="Department" value={intern.department}/>
                    <InfoItem label="Position" value={intern.position}/>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Address</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoItem label="Address" value={intern.address}/>
                    <InfoItem label="City" value={intern.city}/>
                    <InfoItem label="Province" value={intern.province}/>
                    <InfoItem label="Postal Code" value={intern.postal_code}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency contact */}
            {(intern.emergency_contact_name || intern.emergency_contact_phone) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Emergency Contact</h2>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Contact Name" value={intern.emergency_contact_name}/>
                  <InfoItem label="Contact Phone" value={intern.emergency_contact_phone}/>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tasks */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                <span className="text-5xl mb-3">📋</span>
                <p className="text-sm font-medium text-gray-400">No tasks logged yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Date','Title','Status','Hours'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {tasks.map(task => {
                      const ts = taskStatus[task.status as keyof typeof taskStatus] ?? taskStatus.pending;
                      return (
                        <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                            {new Date(task.task_date).toLocaleDateString('en-ZA', { day:'numeric', month:'short' })}
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-sm font-medium text-gray-900">{task.title}</p>
                            {task.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{task.description}</p>}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${ts.bg} ${ts.text}`}>{task.status.replace('_',' ')}</span>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-gray-600">{task.hours_spent ? `${task.hours_spent}h` : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Files */}
        {activeTab === 'files' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                <span className="text-5xl mb-3">📁</span>
                <p className="text-sm font-medium text-gray-400">No files uploaded yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['File Name','Category','Size','Uploaded'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {files.map(file => (
                      <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{file.original_name}</p>
                          <p className="text-xs text-gray-400">{file.file_type}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 capitalize">{file.category ?? 'general'}</span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-500">{formatSize(file.file_size)}</td>
                        <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                          {new Date(file.uploaded_at).toLocaleDateString('en-ZA', { day:'numeric', month:'short', year:'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Logins */}
        {activeTab === 'logins' && (
          <div className="space-y-3">
            {loginLogs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-16 text-gray-300">
                <span className="text-5xl mb-3">🔑</span>
                <p className="text-sm font-medium text-gray-400">No login records</p>
              </div>
            ) : loginLogs.map((log, index) => {
              const isActive = !log.logout_time;
              const dur = duration(log.login_time, log.logout_time);
              return (
                <div key={log.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}/>
                      <span className="text-sm font-semibold text-gray-800">Session #{loginLogs.length - index}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {isActive ? 'Active' : dur}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-gray-400">Date</p>
                      <p className="text-sm font-medium text-gray-800">{new Date(log.login_time).toLocaleDateString('en-ZA', { day:'numeric', month:'short' })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Login</p>
                      <p className="text-sm font-medium text-gray-800">{new Date(log.login_time).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Device</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{log.browser ?? '—'} / {log.os ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">IP</p>
                      <p className="text-sm font-mono text-gray-600">{log.ip_address ?? '—'}</p>
                    </div>
                  </div>
                  {log.login_latitude && (
                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2 text-xs text-gray-500">
                      <span>📍 GPS:</span>
                      <span className="font-mono">{log.login_latitude.toFixed(5)}, {log.login_longitude?.toFixed(5)}</span>
                      <a href={`https://www.google.com/maps?q=${log.login_latitude},${log.login_longitude}`} target="_blank" rel="noreferrer"
                        className="ml-auto font-medium hover:underline" style={{ color:'#1d6fa4' }}>View on map →</a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
