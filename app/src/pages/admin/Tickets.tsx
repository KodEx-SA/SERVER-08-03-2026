import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { api } from '@/services/api';
import type { Ticket, TicketStatus } from '@/types';
import { STATUS_LABEL, PRIORITY_LABEL, ticketNumber } from '@/types';
import { toast } from 'sonner';

const statusStyles: Record<TicketStatus, string> = {
  open:        'bg-red-50 text-red-700 border border-red-200',
  in_progress: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  resolved:    'bg-green-50 text-green-700 border border-green-200',
  closed:      'bg-gray-100 text-gray-600 border border-gray-200',
  cancelled:   'bg-gray-100 text-gray-500 border border-gray-200',
};
const priorityStyles: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700', low: 'bg-blue-100 text-blue-700',
};
const priorityDot: Record<string, string> = {
  urgent: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-blue-500',
};

type FilterKey = 'all' | TicketStatus;

export default function AdminTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getTickets()
      .then((data: unknown) => setTickets(data as Ticket[]))
      .catch(() => toast.error('Failed to load tickets'))
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
    cancelled: tickets.filter(t => t.status === 'cancelled').length,
  };

  const filtered = tickets.filter(t => {
    const matchFilter = filter === 'all' || t.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || t.title.toLowerCase().includes(q) || ticketNumber(t).toLowerCase().includes(q) ||
      `${t.createdBy?.first_name ?? ''} ${t.createdBy?.last_name ?? ''}`.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
            <p className="text-gray-500 text-sm mt-1">{tickets.length} total tickets</p>
          </div>
          <button onClick={() => navigate('/admin/tickets/new')}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
            style={{ background: 'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            New Ticket
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input type="text" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all','open','in_progress','resolved','closed'] as FilterKey[]).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-colors ${filter === f ? 'text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                  style={filter === f ? { background: 'linear-gradient(135deg,#1d6fa4,#0e4d7a)' } : {}}>
                  {f === 'all' ? 'All' : STATUS_LABEL[f as TicketStatus]} ({counts[f]})
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Ticket','Title','Requester','Department','Status','Priority','Created',''].map(h => (
                      <th key={h} className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-16 text-center text-sm text-gray-400">
                      {tickets.length === 0 ? 'No tickets yet' : 'No tickets match your filter'}
                    </td></tr>
                  ) : filtered.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/admin/tickets/${ticket.id}`)}>
                      <td className="px-6 py-4"><span className="text-sm font-semibold" style={{ color: '#1d6fa4' }}>{ticketNumber(ticket)}</span></td>
                      <td className="px-6 py-4 max-w-xs"><span className="text-sm font-medium text-gray-900 line-clamp-1">{ticket.title}</span></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style={{ background: 'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>
                            {(ticket.createdBy?.first_name?.[0] ?? ticket.createdBy?.email?.[0] ?? '?').toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-700 truncate max-w-[120px]">
                            {ticket.createdBy?.first_name ? `${ticket.createdBy.first_name} ${ticket.createdBy.last_name}` : ticket.createdBy?.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className="text-sm text-gray-600">{ticket.department?.name ?? '—'}</span></td>
                      <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${statusStyles[ticket.status]}`}>{STATUS_LABEL[ticket.status]}</span></td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${priorityStyles[ticket.priority]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityDot[ticket.priority]}`}/>
                          {PRIORITY_LABEL[ticket.priority]}
                        </span>
                      </td>
                      <td className="px-6 py-4"><span className="text-sm text-gray-500">{new Date(ticket.created_at).toLocaleDateString('en-ZA')}</span></td>
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <button onClick={() => navigate(`/admin/tickets/${ticket.id}`)} className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors" style={{ color: '#1d6fa4', background: 'rgba(29,111,164,0.08)' }}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
