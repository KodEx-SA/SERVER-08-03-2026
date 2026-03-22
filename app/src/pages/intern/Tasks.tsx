import { useEffect, useState } from 'react';
import { InternLayout } from '@/components/layouts/InternLayout';
import { api } from '@/services/api';
import type { Task } from '@/types';
import { toast } from 'sonner';

type FilterStatus = 'all' | Task['status'];

const statusConfig = {
  completed:   { bg:'bg-green-50',  text:'text-green-700',  label:'Completed'   },
  in_progress: { bg:'bg-blue-50',   text:'text-blue-700',   label:'In Progress' },
  pending:     { bg:'bg-orange-50', text:'text-orange-700', label:'Pending'     },
  cancelled:   { bg:'bg-gray-100',  text:'text-gray-500',   label:'Cancelled'   },
};

export default function InternTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [form, setForm] = useState({ title:'', description:'', taskDate: new Date().toISOString().slice(0,10), hoursSpent:'', status:'completed' });

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try { const res = await api.getTasks(); setTasks((res as any).tasks ?? []); }
    catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingTask(null);
    setForm({ title:'', description:'', taskDate: new Date().toISOString().slice(0,10), hoursSpent:'', status:'completed' });
    setShowModal(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({ title: task.title, description: task.description ?? '', taskDate: task.task_date, hoursSpent: task.hours_spent?.toString() ?? '', status: task.status });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { title: form.title, description: form.description || undefined, taskDate: form.taskDate, hoursSpent: form.hoursSpent ? Number(form.hoursSpent) : undefined, status: form.status };
      if (editingTask) { await api.updateTask(editingTask.id, payload); toast.success('Task updated'); }
      else { await api.createTask(payload); toast.success('Task created'); }
      setShowModal(false); fetchTasks();
    } catch { toast.error(editingTask ? 'Failed to update task' : 'Failed to create task'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this task?')) return;
    try { await api.deleteTask(id); toast.success('Task deleted'); fetchTasks(); }
    catch { toast.error('Failed to delete task'); }
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const totalHours = tasks.filter(t => t.hours_spent).reduce((s, t) => s + (t.hours_spent ?? 0), 0);
  const todayCount = tasks.filter(t => new Date(t.task_date).toDateString() === new Date().toDateString()).length;

  return (
    <InternLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-gray-500 text-sm mt-1">Log and track your daily work</p>
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl shadow-sm hover:opacity-90"
            style={{ background:'linear-gradient(135deg,#16a34a,#15803d)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Log Task
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label:'Total Tasks',  value: tasks.length,                                                bg:'bg-blue-50',   color:'text-blue-700'   },
            { label:'Today',        value: todayCount,                                                  bg:'bg-green-50',  color:'text-green-700'  },
            { label:'Completed',    value: tasks.filter(t => t.status==='completed').length,            bg:'bg-teal-50',   color:'text-teal-700'   },
            { label:'Total Hours',  value: totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1),  bg:'bg-purple-50', color:'text-purple-700' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {(['all','completed','in_progress','pending','cancelled'] as FilterStatus[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-colors ${filter===f ? 'text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
              style={filter===f ? { background:'linear-gradient(135deg,#16a34a,#15803d)' } : {}}>
              {f === 'all' ? `All (${tasks.length})` : `${statusConfig[f as keyof typeof statusConfig]?.label} (${tasks.filter(t => t.status===f).length})`}
            </button>
          ))}
        </div>

        {/* Tasks list */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor:'rgba(22,163,74,0.2)', borderTopColor:'#16a34a' }}/></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-500 font-medium">{tasks.length === 0 ? 'No tasks yet — log your first one!' : 'No tasks match this filter'}</p>
            {tasks.length === 0 && <button onClick={openCreate} className="mt-4 px-4 py-2 text-white text-sm font-medium rounded-xl" style={{ background:'linear-gradient(135deg,#16a34a,#15803d)' }}>Log Task</button>}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(task => {
              const sc = statusConfig[task.status] ?? statusConfig.pending;
              return (
                <div key={task.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{sc.label}</span>
                        {task.hours_spent && <span className="text-xs text-gray-400">⏱ {task.hours_spent}h</span>}
                        <span className="text-xs text-gray-400">📅 {new Date(task.task_date).toLocaleDateString('en-ZA', { day:'numeric', month:'short' })}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                      {task.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => openEdit(task)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button onClick={() => handleDelete(task.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">{editingTask ? 'Edit Task' : 'Log New Task'}</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
                <input required value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))} placeholder="What did you work on?"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                  <input type="date" value={form.taskDate} onChange={e => setForm(f => ({...f, taskDate:e.target.value}))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Hours Spent</label>
                  <input type="number" step="0.5" min="0" max="24" value={form.hoursSpent} onChange={e => setForm(f => ({...f, hoursSpent:e.target.value}))} placeholder="e.g. 3.5"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({...f, status:e.target.value}))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))} rows={3} placeholder="Optional details…"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"/>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="flex-1 py-2.5 text-white text-sm font-semibold rounded-xl disabled:opacity-60" style={{ background:'linear-gradient(135deg,#16a34a,#15803d)' }}>
                  {saving ? 'Saving…' : editingTask ? 'Save Changes' : 'Log Task'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </InternLayout>
  );
}
