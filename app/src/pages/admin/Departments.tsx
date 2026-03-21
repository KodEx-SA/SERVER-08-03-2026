import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { api } from '@/services/api';
import type { Department } from '@/types';
import { toast } from 'sonner';

const deptColors = [
  { bg: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-700' },
  { bg: 'bg-purple-600', light: 'bg-purple-50', text: 'text-purple-700' },
  { bg: 'bg-green-600', light: 'bg-green-50', text: 'text-green-700' },
  { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-700' },
  { bg: 'bg-pink-600', light: 'bg-pink-50', text: 'text-pink-700' },
  { bg: 'bg-teal-600', light: 'bg-teal-50', text: 'text-teal-700' },
];

export default function AdminDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', headOfDepartment: '' });

  const load = () => {
    setLoading(true);
    api.getDepartments()
      .then((d: unknown) => setDepartments(d as Department[]))
      .catch(() => toast.error('Failed to load departments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createDepartment({ name: form.name, description: form.description || undefined, headOfDepartment: form.headOfDepartment || undefined });
      setShowModal(false);
      setForm({ name: '', description: '', headOfDepartment: '' });
      toast.success('Department created');
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create department');
    } finally { setSaving(false); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
            <p className="text-gray-500 text-sm mt-1">{departments.length} departments</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-xl shadow-sm" style={{ background: 'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Add Department
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: departments.length, icon: '🏢', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Active', value: departments.filter(d => d.is_active).length, icon: '✅', color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Inactive', value: departments.filter(d => !d.is_active).length, icon: '⏸️', color: 'text-gray-500', bg: 'bg-gray-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-5`}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>
        ) : departments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center text-gray-400">
            <div className="text-5xl mb-4">🏢</div>
            <p className="font-medium">No departments yet</p>
            <button onClick={() => setShowModal(true)} className="mt-4 text-sm hover:underline" style={{ color: '#1d6fa4' }}>Add the first department</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {departments.map((dept, i) => {
              const color = deptColors[i % deptColors.length];
              return (
                <div key={dept.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${color.bg} rounded-2xl flex items-center justify-center text-white font-bold text-lg`}>{dept.name[0]}</div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{dept.name}</h3>
                        {dept.head_of_department && <p className="text-sm text-gray-500">Head: {dept.head_of_department}</p>}
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${dept.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {dept.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {dept.description && <p className="text-sm text-gray-500 leading-relaxed">{dept.description}</p>}
                </div>
              );
            })}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-900">Add Department</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Department Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Department Head</label>
                  <input value={form.headOfDepartment} onChange={e => setForm(f => ({ ...f, headOfDepartment: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 text-white text-sm font-semibold rounded-xl disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>
                    {saving ? 'Creating...' : 'Create Department'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
