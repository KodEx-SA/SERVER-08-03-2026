import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InternLayout } from '@/components/layouts/InternLayout';
import { api } from '@/services/api';
import type { Ticket, TicketStatus } from '@/types';
import { STATUS_LABEL, PRIORITY_LABEL, ticketNumber } from '@/types';
import { toast } from 'sonner';

const statusStyles: Record<TicketStatus, string> = {
  open:'bg-red-50 text-red-700 border border-red-200', in_progress:'bg-yellow-50 text-yellow-700 border border-yellow-200',
  resolved:'bg-green-50 text-green-700 border border-green-200', closed:'bg-gray-100 text-gray-600 border border-gray-200',
  cancelled:'bg-gray-100 text-gray-500 border border-gray-200',
};
const priorityStyles: Record<string, string> = { urgent:'bg-red-100 text-red-700', high:'bg-orange-100 text-orange-700', medium:'bg-yellow-100 text-yellow-700', low:'bg-blue-100 text-blue-700' };

export default function InternTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | TicketStatus>('all');

  useEffect(() => {
    api.getTickets()
      .then((d: unknown) => setTickets(d as Ticket[]))
      .catch(() => toast.error('Failed to load tickets'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  return (
    <InternLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
            <p className="text-gray-500 text-sm mt-1">{tickets.length} total tickets</p>
          </div>
          <button onClick={() => navigate('/tickets/new')} className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-xl shadow-sm" style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            New Ticket
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all','open','in_progress','resolved','closed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-colors ${filter === f ? 'text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
              style={filter === f ? { background: 'linear-gradient(135deg,#16a34a,#15803d)' } : {}}>
              {f === 'all' ? 'All' : STATUS_LABEL[f as TicketStatus]} ({f === 'all' ? tickets.length : tickets.filter(t => t.status === f).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"/></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="text-5xl mb-4">🎫</div>
            <p className="text-gray-500 font-medium">{tickets.length === 0 ? 'No tickets yet — submit your first one!' : 'No tickets match your filter'}</p>
            {tickets.length === 0 && (
              <button onClick={() => navigate('/tickets/new')} className="mt-4 px-4 py-2 text-white text-sm font-medium rounded-xl" style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>Create Ticket</button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(ticket => (
              <div key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-semibold" style={{ color: '#16a34a' }}>{ticketNumber(ticket)}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${statusStyles[ticket.status]}`}>{STATUS_LABEL[ticket.status]}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${priorityStyles[ticket.priority]}`}>{PRIORITY_LABEL[ticket.priority]}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{ticket.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{ticket.department?.name ?? '—'} · {new Date(ticket.created_at).toLocaleDateString('en-ZA')}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </InternLayout>
  );
}
