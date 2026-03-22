import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { api } from '@/services/api';
import type { Intern } from '@/types';
import { toast } from 'sonner';

type SortField = 'name' | 'intern_code' | 'department' | 'created_at' | 'approval_status';
type SortOrder = 'asc' | 'desc';

const statusConfig = {
  approved: { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'Approved' },
  pending:  { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', label: 'Pending'  },
  rejected: { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500',    label: 'Rejected' },
};

function SortIcon({ active, order }: { active: boolean; order: SortOrder }) {
  return (
    <svg className={`w-3 h-3 ml-1 flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {order === 'asc' && active
        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7"/>
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/>}
    </svg>
  );
}

const PAGE_SIZE = 10;

export default function AdminInterns() {
  const navigate = useNavigate();
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);

  useEffect(() => { fetchInterns(); }, []);
  useEffect(() => { setPage(1); }, [search, statusFilter, departmentFilter]);

  const fetchInterns = async () => {
    setLoading(true);
    try {
      const res = await api.getInterns();
      setInterns((res as any).interns ?? []);
    } catch { toast.error('Failed to load interns'); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try { await api.approveIntern(id); toast.success('Intern approved'); fetchInterns(); }
    catch { toast.error('Failed to approve intern'); }
  };

  const handleReject = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Reject this intern?')) return;
    try { await api.rejectIntern(id); toast.success('Intern rejected'); fetchInterns(); }
    catch { toast.error('Failed to reject intern'); }
  };

  const handleSort = (field: SortField) => {
    setSortField(field);
    setSortOrder(sortField === field && sortOrder === 'asc' ? 'desc' : 'asc');
    setPage(1);
  };

  const exportCSV = () => {
    const headers = ['Code','First Name','Last Name','Email','Department','Status','Registered'];
    const rows = processed.map(i => [i.intern_code, i.first_name, i.last_name, i.email ?? '', i.department ?? '', i.approval_status, new Date(i.created_at).toLocaleDateString('en-ZA')]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `interns-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    toast.success('CSV exported');
  };

  const departments = [...new Set(interns.map(i => i.department).filter(Boolean))] as string[];

  const processed = interns
    .filter(i => {
      if (statusFilter !== 'all' && i.approval_status !== statusFilter) return false;
      if (departmentFilter !== 'all' && i.department !== departmentFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return [i.first_name, i.last_name, i.intern_code, i.email, i.department]
          .some(v => v?.toLowerCase().includes(q));
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name')            cmp = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      else if (sortField === 'intern_code') cmp = (a.intern_code ?? '').localeCompare(b.intern_code ?? '');
      else if (sortField === 'department')  cmp = (a.department ?? '').localeCompare(b.department ?? '');
      else if (sortField === 'created_at')  cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortField === 'approval_status') cmp = a.approval_status.localeCompare(b.approval_status);
      return sortOrder === 'asc' ? cmp : -cmp;
    });

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const paginated = processed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const Th = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th onClick={() => handleSort(field)}
      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none whitespace-nowrap">
      <span className="flex items-center">
        {children}
        <SortIcon active={sortField === field} order={sortOrder}/>
      </span>
    </th>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Interns</h1>
            <p className="text-gray-500 text-sm mt-1">View, filter and manage all registered interns</p>
          </div>
          <button onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Export CSV
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label:'Total',    value: interns.length,                                  bg:'bg-blue-50',   color:'text-blue-700'   },
            { label:'Pending',  value: interns.filter(i => i.approval_status==='pending').length,  bg:'bg-orange-50', color:'text-orange-700' },
            { label:'Approved', value: interns.filter(i => i.approval_status==='approved').length, bg:'bg-green-50',  color:'text-green-700'  },
            { label:'Rejected', value: interns.filter(i => i.approval_status==='rejected').length, bg:'bg-red-50',    color:'text-red-700'    },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input type="text" placeholder="Search by name, email or intern code…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-40">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-44">
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {processed.length} intern{processed.length !== 1 ? 's' : ''}
              {(search || statusFilter !== 'all' || departmentFilter !== 'all') && <span className="text-gray-400"> (filtered)</span>}
            </span>
            <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor:'rgba(29,111,164,0.2)', borderTopColor:'#1d6fa4' }}/>
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300">
              <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <p className="text-sm font-medium">{interns.length === 0 ? 'No interns registered yet' : 'No interns match your filter'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <Th field="intern_code">Code</Th>
                    <Th field="name">Name</Th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                    <Th field="department">Department</Th>
                    <Th field="approval_status">Status</Th>
                    <Th field="created_at">Registered</Th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(intern => {
                    const sc = statusConfig[intern.approval_status as keyof typeof statusConfig] ?? statusConfig.pending;
                    const initials = `${intern.first_name[0]}${intern.last_name[0]}`.toUpperCase();
                    return (
                      <tr key={intern.id} className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/admin/interns/${intern.id}`)}>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-mono font-semibold" style={{ color:'#1d6fa4' }}>{intern.intern_code}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ background:'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>{initials}</div>
                            <span className="text-sm font-medium text-gray-900 whitespace-nowrap">{intern.first_name} {intern.last_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className="text-sm text-gray-500 truncate max-w-[180px] block">{intern.email}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-600">{intern.department ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`}/>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{sc.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-500 whitespace-nowrap">
                            {new Date(intern.created_at).toLocaleDateString('en-ZA', { day:'numeric', month:'short', year:'numeric' })}
                          </span>
                        </td>
                        <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => navigate(`/admin/interns/${intern.id}`)}
                              className="px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors"
                              style={{ color:'#1d6fa4', background:'rgba(29,111,164,0.08)' }}>
                              View
                            </button>
                            {intern.approval_status === 'pending' && (
                              <>
                                <button onClick={e => handleApprove(intern.id, e)}
                                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                                  ✓
                                </button>
                                <button onClick={e => handleReject(intern.id, e)}
                                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                                  ✕
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Showing {((page-1)*PAGE_SIZE)+1}–{Math.min(page*PAGE_SIZE, processed.length)} of {processed.length}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-white transition-colors">
                  ← Prev
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const p = totalPages <= 5 ? i+1 : page <= 3 ? i+1 : page >= totalPages-2 ? totalPages-4+i : page-2+i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${page === p ? 'text-white' : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-white'}`}
                      style={page === p ? { background:'linear-gradient(135deg,#1d6fa4,#0e4d7a)' } : {}}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-white transition-colors">
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
