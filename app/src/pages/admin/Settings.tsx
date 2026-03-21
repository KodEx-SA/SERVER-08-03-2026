import { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { api } from '@/services/api';
import { toast } from 'sonner';

type Tab = 'general' | 'security' | 'notifications';
const Toggle = ({ checked, onChange, label, desc }: { checked: boolean; onChange: () => void; label: string; desc?: string }) => (
  <div className="flex items-start justify-between gap-4 py-3">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-800">{label}</p>
      {desc && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>}
    </div>
    <button type="button" onClick={onChange} className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}/>
    </button>
  </div>
);

export default function AdminSettings() {
  const [tab, setTab] = useState<Tab>('general');
  const [saving, setSaving] = useState(false);
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [notifs, setNotifs] = useState({ newIntern: true, ticketAssigned: true, ticketResolved: false, weeklyReport: true });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) { toast.error('New passwords do not match'); return; }
    if (newPwd.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await api.changePassword(curPwd, newPwd);
      toast.success('Password changed successfully');
      setCurPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    } finally { setSaving(false); }
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
  ];

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your admin account preferences.</p>
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <span>{t.icon}</span><span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {tab === 'general' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Regional Preferences</h3>
            <div className="space-y-4">
              {[
                { label: 'Language', options: ['English', 'Afrikaans', 'Zulu'] },
                { label: 'Timezone', options: ['Africa/Johannesburg', 'UTC', 'Europe/London'] },
                { label: 'Date Format', options: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] },
              ].map(f => (
                <div key={f.label} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm font-medium text-gray-800">{f.label}</label>
                  <select className="sm:w-48 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {f.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'security' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {[
                { label: 'Current password', value: curPwd, set: setCurPwd },
                { label: 'New password', value: newPwd, set: setNewPwd },
                { label: 'Confirm new password', value: confirmPwd, set: setConfirmPwd },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                  <input type="password" value={f.value} onChange={e => f.set(e.target.value)} required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
              ))}
              <button type="submit" disabled={saving} className="px-5 py-2.5 text-white text-sm font-medium rounded-xl disabled:opacity-60 transition-colors" style={{ background: 'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {tab === 'notifications' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Email Notifications</h3>
            <div className="divide-y divide-gray-50">
              <Toggle checked={notifs.newIntern}     onChange={() => setNotifs(p => ({...p, newIntern: !p.newIntern}))}       label="New intern registration"  desc="Get notified when a new intern registers for approval."/>
              <Toggle checked={notifs.ticketAssigned} onChange={() => setNotifs(p => ({...p, ticketAssigned: !p.ticketAssigned}))} label="Ticket assigned to me"  desc="Receive an email when a ticket is assigned to you."/>
              <Toggle checked={notifs.ticketResolved} onChange={() => setNotifs(p => ({...p, ticketResolved: !p.ticketResolved}))} label="Ticket resolved"         desc="Email when a ticket you manage is resolved."/>
              <Toggle checked={notifs.weeklyReport}  onChange={() => setNotifs(p => ({...p, weeklyReport: !p.weeklyReport}))}  label="Weekly digest"           desc="A summary of activity sent every Monday."/>
            </div>
            <button onClick={() => toast.success('Notification preferences saved')} className="mt-4 px-5 py-2.5 text-white text-sm font-medium rounded-xl" style={{ background: 'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>
              Save Preferences
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
