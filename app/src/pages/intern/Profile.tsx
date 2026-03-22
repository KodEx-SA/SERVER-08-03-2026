import { useEffect, useState } from 'react';
import { InternLayout } from '@/components/layouts/InternLayout';
import { api } from '@/services/api';
import { toast } from 'sonner';

const SA_PROVINCES = ['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','North West','Northern Cape','Western Cape'];
const inputClass = "w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-500";
const readClass  = "w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-500 cursor-not-allowed";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-gray-900 mt-1">{value || '—'}</p>
    </div>
  );
}

export default function InternProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  const fetchProfile = async () => {
    try {
      const res = await api.getProfile();
      const p = (res as any).profile;
      setProfile(p);
      setForm({
        phone: p.phone ?? '', address: p.address ?? '',
        city: p.city ?? '', province: p.province ?? '',
        postalCode: p.postal_code ?? '',
        emergencyContactName: p.emergency_contact_name ?? '',
        emergencyContactPhone: p.emergency_contact_phone ?? '',
      });
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile(form);
      toast.success('Profile updated');
      setEditing(false);
      fetchProfile();
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));

  const age = profile?.date_of_birth
    ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25*24*60*60*1000))
    : null;

  const statusConfig = {
    approved: { bg:'bg-green-50', text:'text-green-700', dot:'bg-green-500', label:'Approved' },
    pending:  { bg:'bg-orange-50', text:'text-orange-700', dot:'bg-orange-500', label:'Pending' },
    rejected: { bg:'bg-red-50', text:'text-red-700', dot:'bg-red-500', label:'Rejected' },
  };
  const sc = statusConfig[profile?.approval_status as keyof typeof statusConfig] ?? statusConfig.pending;

  if (loading) return (
    <InternLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor:'rgba(22,163,74,0.2)', borderTopColor:'#16a34a' }}/>
      </div>
    </InternLayout>
  );

  return (
    <InternLayout>
      <div className="max-w-4xl space-y-6">

        {/* Profile hero */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-24 relative" style={{ background:'linear-gradient(135deg,#14532d,#16a34a,#4ade80)' }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage:'radial-gradient(circle at 20% 50%,white 1px,transparent 1px),radial-gradient(circle at 80% 20%,white 1px,transparent 1px)', backgroundSize:'30px 30px' }}/>
          </div>
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10">
              <div className="flex items-end gap-4">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg flex-shrink-0"
                  style={{ background:'linear-gradient(135deg,#16a34a,#15803d)' }}>
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </div>
                <div className="pb-1">
                  <h1 className="text-xl font-bold text-gray-900">{profile?.first_name} {profile?.last_name}</h1>
                  <p className="text-sm text-gray-500">{profile?.position ?? 'Intern'} · {profile?.department ?? 'No department'}</p>
                  <div className={`mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}/>{sc.label}
                  </div>
                </div>
              </div>
              {!editing ? (
                <button onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-xl hover:opacity-90 flex-shrink-0"
                  style={{ background:'linear-gradient(135deg,#16a34a,#15803d)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-white text-sm font-medium rounded-xl disabled:opacity-60 hover:opacity-90" style={{ background:'linear-gradient(135deg,#16a34a,#15803d)' }}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — editable fields */}
          <div className="lg:col-span-2 space-y-5">

            {/* Contact */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-4">
                <Field label="Phone Number">
                  {editing
                    ? <input name="phone" value={form.phone} onChange={set} placeholder="+27 12 345 6789" className={`${inputClass} bg-white border-gray-200 text-gray-900`}/>
                    : <input readOnly value={profile?.phone ?? ''} placeholder="Not provided" className={readClass}/>}
                </Field>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Address</h2>
              <div className="space-y-4">
                <Field label="Street Address">
                  {editing
                    ? <input name="address" value={form.address} onChange={set} placeholder="123 Main Street" className={`${inputClass} bg-white border-gray-200 text-gray-900`}/>
                    : <input readOnly value={profile?.address ?? ''} placeholder="Not provided" className={readClass}/>}
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="City">
                    {editing
                      ? <input name="city" value={form.city} onChange={set} placeholder="City" className={`${inputClass} bg-white border-gray-200 text-gray-900`}/>
                      : <input readOnly value={profile?.city ?? ''} placeholder="—" className={readClass}/>}
                  </Field>
                  <Field label="Province">
                    {editing
                      ? <select name="province" value={form.province} onChange={set} className={`${inputClass} bg-white border-gray-200 text-gray-900`}>
                          <option value="">Select Province</option>
                          {SA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      : <input readOnly value={profile?.province ?? ''} placeholder="—" className={readClass}/>}
                  </Field>
                  <Field label="Postal Code">
                    {editing
                      ? <input name="postalCode" value={form.postalCode} onChange={set} placeholder="2000" className={`${inputClass} bg-white border-gray-200 text-gray-900`}/>
                      : <input readOnly value={profile?.postal_code ?? ''} placeholder="—" className={readClass}/>}
                  </Field>
                </div>
              </div>
            </div>

            {/* Emergency contact */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Emergency Contact</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Contact Name">
                  {editing
                    ? <input name="emergencyContactName" value={form.emergencyContactName} onChange={set} placeholder="Jane Doe" className={`${inputClass} bg-white border-gray-200 text-gray-900`}/>
                    : <input readOnly value={profile?.emergency_contact_name ?? ''} placeholder="Not provided" className={readClass}/>}
                </Field>
                <Field label="Contact Phone">
                  {editing
                    ? <input name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={set} placeholder="+27 12 345 6789" className={`${inputClass} bg-white border-gray-200 text-gray-900`}/>
                    : <input readOnly value={profile?.emergency_contact_phone ?? ''} placeholder="Not provided" className={readClass}/>}
                </Field>
              </div>
            </div>
          </div>

          {/* Right — read-only info */}
          <div className="space-y-5">
            {/* ID info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Identity</h2>
              <div className="space-y-4">
                <InfoRow label="Intern Code" value={profile?.intern_code}/>
                <InfoRow label="SA ID Number" value={profile?.sa_id}/>
                <InfoRow label="Date of Birth" value={profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('en-ZA') : ''}/>
                <InfoRow label="Age" value={age ? `${age} years` : ''}/>
                <InfoRow label="Gender" value={profile?.gender}/>
                <InfoRow label="Citizenship" value={profile?.citizenship}/>
              </div>
            </div>

            {/* Work info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Work Details</h2>
              <div className="space-y-4">
                <InfoRow label="Department" value={profile?.department}/>
                <InfoRow label="Position" value={profile?.position}/>
                <InfoRow label="Email" value={profile?.email}/>
                <InfoRow label="Member Since" value={profile?.user_created_at ? new Date(profile.user_created_at).toLocaleDateString('en-ZA', { month:'long', year:'numeric' }) : ''}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </InternLayout>
  );
}
