import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { InternLayout } from '@/components/layouts/InternLayout';
import { api } from '@/services/api';
import type { Ticket, TicketStatus } from '@/types';
import { STATUS_LABEL, PRIORITY_LABEL, ticketNumber } from '@/types';
import { toast } from 'sonner';

const statusStyles: Record<TicketStatus,string> = {
  open:'bg-red-100 text-red-700 border border-red-200', in_progress:'bg-yellow-100 text-yellow-700 border border-yellow-200',
  resolved:'bg-green-100 text-green-700 border border-green-200', closed:'bg-gray-100 text-gray-600 border border-gray-200',
  cancelled:'bg-gray-100 text-gray-500 border border-gray-200',
};
const priorityStyles: Record<string,string> = { urgent:'bg-red-100 text-red-700', high:'bg-orange-100 text-orange-700', medium:'bg-yellow-100 text-yellow-700', low:'bg-blue-100 text-blue-700' };

export default function InternTicketDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.getTicket(Number(id))
      .then((d: unknown) => setTicket(d as Ticket))
      .catch(() => toast.error('Ticket not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <InternLayout><div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"/></div></InternLayout>;
  if (!ticket) return <InternLayout><div className="flex flex-col items-center justify-center h-64 gap-3"><p className="text-gray-500">Ticket not found.</p><button onClick={() => navigate('/tickets')} className="text-green-600 hover:underline text-sm">← Back</button></div></InternLayout>;

  return (
    <InternLayout>
      <div className="space-y-6">
        <div>
          <button onClick={() => navigate('/tickets')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back to My Tickets
          </button>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: '#16a34a' }}>{ticketNumber(ticket)}</span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${statusStyles[ticket.status]}`}>{STATUS_LABEL[ticket.status]}</span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${priorityStyles[ticket.priority]}`}>{PRIORITY_LABEL[ticket.priority]}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </div>
            {(ticket.status === 'resolved' || ticket.status === 'closed') && (
              <div className="bg-green-50 rounded-2xl border border-green-100 p-6">
                <h2 className="text-base font-semibold text-green-900 mb-3">✅ Resolution Notes</h2>
                {ticket.resolution_notes ? <p className="text-green-800 text-sm leading-relaxed">{ticket.resolution_notes}</p> : <p className="text-green-600 text-sm italic">No resolution notes added yet.</p>}
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Ticket Details</h2>
            <dl className="space-y-4">
              {[
                { label:'Department',  value: ticket.department?.name ?? '—' },
                { label:'Assigned To', value: ticket.assigned_to ? (ticket.assignedTo?.first_name ? `${ticket.assignedTo.first_name} ${ticket.assignedTo.last_name}` : 'Assigned') : 'Unassigned' },
                { label:'Category',    value: ticket.category ?? '—' },
                { label:'Submitted',   value: new Date(ticket.created_at).toLocaleString('en-ZA') },
                { label:'Last Updated',value: new Date(ticket.updated_at).toLocaleString('en-ZA') },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
              <p className="text-xs text-green-700 font-semibold mb-1">Need urgent help?</p>
              <p className="text-xs text-green-600 leading-relaxed">Contact IT Support directly at ext. 1234 or visit the IT Hub.</p>
            </div>
          </div>
        </div>
      </div>
    </InternLayout>
  );
}
