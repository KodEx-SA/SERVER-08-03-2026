import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { api } from '@/services/api';
import type { Department, TicketPriority } from '@/types';
import { toast } from 'sonner';

export default function AdminCreateTicket() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' as TicketPriority, departmentId: '' as string | number, category: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { api.getDepartments().then((d: unknown) => setDepartments(d as Department[])).catch(() => {}); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.departmentId) { toast.error('Please select a department'); return; }
    setSubmitting(true);
    try {
      await api.createTicket({ title: form.title, description: form.description, priority: form.priority, departmentId: Number(form.departmentId), category: form.category || undefined });
      setSubmitted(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally { setSubmitting(false); }
  };

  if (submitted) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Created!</h2>
          <p className="text-gray-500 mb-8">The ticket has been submitted successfully.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/admin/tickets')} className="px-6 py-2.5 text-white text-sm font-medium rounded-xl" style={{ background: 'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>View Tickets</button>
            <button onClick={() => { setSubmitted(false); setForm({ title:'',description:'',priority:'medium',departmentId:'',category:'' }); }} className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl">Create Another</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <div className="mb-6">
          <button onClick={() => navigate('/admin/tickets')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back to Tickets
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create New Ticket</h1>
          <p className="text-gray-500 text-sm mt-1">Fill in the details to submit a support request.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject <span className="text-red-500">*</span></label>
              <input type="text" name="title" value={form.title} onChange={handleChange} required placeholder="Brief description of the issue"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                <select name="priority" value={form.priority} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Department <span className="text-red-500">*</span></label>
                <select name="departmentId" value={form.departmentId} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select category</option>
                {['SA-SAMS / Valistractor Support','OS Installation / Upgrade','Virus Removal / Antivirus','Networking / Connectivity','Hardware Repair','Software Installation','CSDI Teaching Support','Website Development','Digital Marketing','University Applications','Business Registration','General IT Support','Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-red-500">*</span></label>
              <textarea name="description" value={form.description} onChange={handleChange} required rows={5} placeholder="Provide as much detail as possible..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-3 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>
                {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Submitting...</> : 'Submit Ticket'}
              </button>
              <button type="button" onClick={() => navigate('/admin/tickets')} className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
