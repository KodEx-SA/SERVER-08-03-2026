import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { api } from '@/services/api';
import { toast } from 'sonner';

interface Admin {
  id: number;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

const roleConfig: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  super_admin: { label: 'Super Admin', bg: 'bg-violet-100', text: 'text-violet-700', icon: '🛡️' },
  admin:       { label: 'Admin',       bg: 'bg-blue-100',   text: 'text-blue-700',   icon: '👤' },
};

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  active:   { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
  inactive: { bg: 'bg-gray-100',  text: 'text-gray-500',   dot: 'bg-gray-400'  },
  pending:  { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
};

export default function SuperAdminAdmins() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getAdmins() as { admins: Admin[] };
      setAdmins(res.admins);
    } catch {
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (form.password.length < 8) { setFormError('Password must be at least 8 characters'); return; }
    setCreating(true);
    try {
      await api.createAdmin(form as unknown as Record<string, unknown>);
      toast.success('Admin created successfully');
      setShowModal(false);
      setForm({ email: '', password: '', firstName: '', lastName: '' });
      load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create admin';
      setFormError(msg);
    } finally {
      setCreating(false);
    }
  };

  const filtered = admins.filter(a =>
    !search || a.email.toLowerCase().includes(search.toLowerCase())
  );

  const superAdmins = admins.filter(a => a.role === 'super_admin').length;
  const regularAdmins = admins.filter(a => a.role === 'admin').length;
  const activeAdmins = admins.filter(a => a.status === 'active').length;

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Admins</h1>
            <p className="text-gray-500 text-sm mt-1">Create and manage administrator accounts</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl shadow-sm hover:opacity-90 transition-opacity flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Add Admin
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Admins',   value: admins.length,  icon: '👥', color: 'text-blue-700',   bg: 'bg-blue-50' },
            { label: 'Super Admins',   value: superAdmins,    icon: '🛡️', color: 'text-violet-700', bg: 'bg-violet-50' },
            { label: 'Regular Admins', value: regularAdmins,  icon: '👤', color: 'text-indigo-700', bg: 'bg-indigo-50' },
            { label: 'Active',         value: activeAdmins,   icon: '✅', color: 'text-green-700',  bg: 'bg-green-50' },
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

        {/* Search + table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Table toolbar */}
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input
                type="text"
                placeholder="Search by email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-sm text-gray-400 flex-shrink-0">{filtered.length} of {admins.length} shown</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(29,111,164,0.2)', borderTopColor: '#1d6fa4' }}/>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Administrator', 'Role', 'Status', 'Added'].map(h => (
                      <th key={h} className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-300">
                          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                          <p className="text-sm font-medium">{admins.length === 0 ? 'No admins yet' : 'No results match your search'}</p>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.map(admin => {
                    const role   = roleConfig[admin.role]   ?? roleConfig.admin;
                    const status = statusConfig[admin.status] ?? statusConfig.inactive;
                    const initials = admin.email.slice(0, 2).toUpperCase();
                    return (
                      <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                              style={{ background: admin.role === 'super_admin' ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{admin.email}</p>
                              <p className="text-xs text-gray-400">ID #{admin.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${role.bg} ${role.text}`}>
                            {role.icon} {role.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${status.dot}`}/>
                            <span className={`text-xs font-medium capitalize ${status.text}`}>{admin.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">
                            {new Date(admin.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Admin Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Add New Admin</h2>
                <p className="text-xs text-gray-400 mt-0.5">They'll receive full admin access</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {formError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{formError}</div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                  <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="John"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                  <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Doe"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@eullafied.co.za"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                <input required type="password" minLength={8} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-opacity"
                  style={{ background: 'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>
                  {creating ? 'Creating…' : 'Create Admin'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
