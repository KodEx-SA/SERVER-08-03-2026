import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { api } from '@/services/api';
import type { Ticket, TicketStatus } from '@/types';
import { STATUS_LABEL, PRIORITY_LABEL, ticketNumber } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const statusStyles: Record<TicketStatus,string> = {
  open:'bg-red-100 text-red-700 border border-red-200', in_progress:'bg-yellow-100 text-yellow-700 border border-yellow-200',
  resolved:'bg-green-100 text-green-700 border border-green-200', closed:'bg-gray-100 text-gray-600 border border-gray-200',
  cancelled:'bg-gray-100 text-gray-500 border border-gray-200',
};
const priorityStyles: Record<string,string> = {
  urgent:'bg-red-100 text-red-700', high:'bg-orange-100 text-orange-700', medium:'bg-yellow-100 text-yellow-700', low:'bg-blue-100 text-blue-700',
};

export default function AdminTicketDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!id) return;
    api.getTicket(Number(id))
      .then((d: unknown) => setTicket(d as Ticket))
      .catch(() => toast.error('Ticket not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticket) return;
    setSaving(true);
    try {
      const updated = await api.updateTicket(ticket.id, { status }) as Ticket;
      setTicket(updated); toast.success('Status updated');
    } catch { toast.error('Failed to update status'); }
    finally { setSaving(false); }
  };

  const handleAssignToMe = async () => {
    if (!ticket || !user) return;
    setSaving(true);
    try {
      const updated = await api.updateTicket(ticket.id, { assignedToId: user.id, status: 'in_progress' }) as Ticket;
      setTicket(updated); toast.success('Ticket assigned to you');
    } catch { toast.error('Failed to assign ticket'); }
    finally { setSaving(false); }
  };

  const handleSaveNotes = async () => {
    if (!ticket || !notes.trim()) return;
    setSaving(true);
    try {
      const updated = await api.updateTicket(ticket.id, { resolutionNotes: notes }) as Ticket;
      setTicket(updated); setNotes(''); toast.success('Notes saved');
    } catch { toast.error('Failed to save notes'); }
    finally { setSaving(false); }
  };

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div></AdminLayout>;
  if (!ticket) return <AdminLayout><div className="flex flex-col items-center justify-center h-64 gap-3"><p className="text-gray-500">Ticket not found.</p><button onClick={() => navigate('/admin/tickets')} className="text-blue-600 hover:underline text-sm">← Back</button></div></AdminLayout>;

  const assignedToMe = ticket.assigned_to === user?.id;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <button onClick={() => navigate('/admin/tickets')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back to Tickets
          </button>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="text-sm font-semibold" style={{ color: '#1d6fa4' }}>{ticketNumber(ticket)}</span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${statusStyles[ticket.status]}`}>{STATUS_LABEL[ticket.status]}</span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${priorityStyles[ticket.priority]}`}>{PRIORITY_LABEL[ticket.priority]}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={handleAssignToMe} disabled={saving || assignedToMe} className="px-4 py-2 text-white text-sm font-medium rounded-xl disabled:opacity-50 transition-colors" style={{ background: 'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>
                {assignedToMe ? '✓ Assigned to Me' : 'Assign to Me'}
              </button>
              <select value={ticket.status} onChange={e => handleStatusChange(e.target.value as TicketStatus)} disabled={saving}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                {(['open','in_progress','resolved','closed','cancelled'] as TicketStatus[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
          </div>
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
                {ticket.resolution_notes ? <p className="text-green-800 text-sm leading-relaxed">{ticket.resolution_notes}</p> : <p className="text-green-600 text-sm italic">No resolution notes added.</p>}
                {ticket.resolved_at && <p className="text-xs text-green-500 mt-3">Resolved on {new Date(ticket.resolved_at).toLocaleString('en-ZA')}</p>}
              </div>
            )}
            {ticket.status === 'resolved' && !ticket.resolution_notes && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Add Resolution Notes</h2>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Describe how the issue was resolved..." rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                <div className="flex justify-end mt-2">
                  <button onClick={handleSaveNotes} disabled={!notes.trim() || saving} className="px-4 py-2 text-white text-sm font-medium rounded-xl disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>Save Notes</button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Ticket Details</h2>
              <dl className="space-y-4">
                {[
                  { label: 'Requester',   value: ticket.createdBy?.first_name ? `${ticket.createdBy.first_name} ${ticket.createdBy.last_name}` : ticket.createdBy?.email ?? '—' },
                  { label: 'Department',  value: ticket.department?.name ?? '—' },
                  { label: 'Assigned To', value: ticket.assigned_to ? (ticket.assignedTo?.first_name ? `${ticket.assignedTo.first_name} ${ticket.assignedTo.last_name}` : ticket.assignedTo?.email ?? '—') : 'Unassigned' },
                  { label: 'Category',    value: ticket.category ?? '—' },
                  { label: 'Created',     value: new Date(ticket.created_at).toLocaleString('en-ZA') },
                  { label: 'Updated',     value: new Date(ticket.updated_at).toLocaleString('en-ZA') },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
