import { useState } from 'react';
import { InternLayout } from '@/components/layouts/InternLayout';
import { api } from '@/services/api';
import { toast } from 'sonner';

type Tab = 'security' | 'notifications';

const Toggle = ({ checked, onChange, label, desc }: { checked: boolean; onChange: () => void; label: string; desc?: string }) => (
  <div className="flex items-start justify-between gap-4 py-3">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-800">{label}</p>
      {desc && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>}
    </div>
    <button type="button" onClick={onChange}
      className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${checked ? 'bg-green-600' : 'bg-gray-200'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}/>
    </button>
  </div>
);

export default function InternSettings() {
  const [tab, setTab] = useState<Tab>('security');
  const [saving, setSaving] = useState(false);
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [notifs, setNotifs] = useState({
    ticketUpdated: true, ticketResolved: true, loginAlert: true, weeklyDigest: false,
  });

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

  return (
    <InternLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account preferences.</p>
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
          {([
            { id: 'security' as Tab, label: 'Security', icon: '🔒' },
            { id: 'notifications' as Tab, label: 'Notifications', icon: '🔔' },
          ]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1 justify-center ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>

        {tab === 'security' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {[
                { label: 'Current password', value: curPwd, set: setCurPwd },
                { label: 'New password (min 8 chars)', value: newPwd, set: setNewPwd },
                { label: 'Confirm new password', value: confirmPwd, set: setConfirmPwd },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                  <input type="password" value={f.value} onChange={e => f.set(e.target.value)} required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
                </div>
              ))}
              <button type="submit" disabled={saving}
                className="px-5 py-2.5 text-white text-sm font-medium rounded-xl disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {tab === 'notifications' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Notification Preferences</h3>
            <div className="divide-y divide-gray-50">
              <Toggle checked={notifs.ticketUpdated}  onChange={() => setNotifs(p => ({...p, ticketUpdated: !p.ticketUpdated}))}  label="Ticket status updates" desc="When your ticket status changes."/>
              <Toggle checked={notifs.ticketResolved} onChange={() => setNotifs(p => ({...p, ticketResolved: !p.ticketResolved}))} label="Ticket resolved"         desc="When your ticket is resolved."/>
              <Toggle checked={notifs.loginAlert}     onChange={() => setNotifs(p => ({...p, loginAlert: !p.loginAlert}))}         label="Login alerts"           desc="Get alerted on new login from unknown device."/>
              <Toggle checked={notifs.weeklyDigest}   onChange={() => setNotifs(p => ({...p, weeklyDigest: !p.weeklyDigest}))}    label="Weekly summary"         desc="Weekly digest of your activity."/>
            </div>
            <button onClick={() => toast.success('Preferences saved')}
              className="mt-4 px-5 py-2.5 text-white text-sm font-medium rounded-xl"
              style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
              Save Preferences
            </button>
          </div>
        )}
      </div>
    </InternLayout>
  );
}
