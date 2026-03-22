import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/services/api';
import { toast } from 'sonner';

interface SAIdInfo { valid: boolean; dateOfBirth?: string; gender?: string; citizenship?: string; age?: number; error?: string; }

const SA_PROVINCES = ['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','North West','Northern Cape','Western Cape'];

const steps = [
  { num: 1, label: 'Account',  desc: 'Create your credentials' },
  { num: 2, label: 'Identity', desc: 'Personal & ID information' },
  { num: 3, label: 'Details',  desc: 'Address & work info' },
];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [saIdInfo, setSaIdInfo] = useState<SAIdInfo | null>(null);

  const [form, setForm] = useState({
    email:'', password:'', confirmPassword:'',
    firstName:'', lastName:'', saId:'', phone:'',
    address:'', city:'', province:'', postalCode:'',
    emergencyContactName:'', emergencyContactPhone:'',
    department:'', position:'',
  });

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const validateSAId = (id: string): SAIdInfo => {
    const clean = id.replace(/[\s-]/g, '');
    if (clean.length !== 13) return { valid: false, error: 'ID must be 13 digits' };
    if (!/^\d{13}$/.test(clean)) return { valid: false, error: 'ID must contain only digits' };
    const yy = parseInt(clean.slice(0,2)), mm = parseInt(clean.slice(2,4)), dd = parseInt(clean.slice(4,6));
    const cy = new Date().getFullYear(), cc = Math.floor(cy/100);
    const year = yy > cy % 100 ? (cc-1)*100+yy : cc*100+yy;
    const dob = new Date(year, mm-1, dd);
    if (isNaN(dob.getTime()) || dob.getDate()!==dd || dob.getMonth()!==mm-1) return { valid: false, error: 'Invalid date of birth in ID' };
    if (dob > new Date()) return { valid: false, error: 'Date of birth cannot be in the future' };
    const gender = parseInt(clean[6]) >= 5 ? 'Male' : 'Female';
    const citizenship = parseInt(clean[10]) === 0 ? 'South African Citizen' : 'Permanent Resident';
    let age = cy - year;
    const md = new Date().getMonth() - dob.getMonth();
    if (md < 0 || (md===0 && new Date().getDate() < dd)) age--;
    return { valid: true, dateOfBirth: `${year}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`, gender, citizenship, age };
  };

  const handleSAId = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setForm(f => ({ ...f, saId: v }));
    setSaIdInfo(v.length >= 13 ? validateSAId(v) : null);
  };

  const validate = (s: number) => {
    setError('');
    if (s === 1) {
      if (!form.email || !form.password || !form.confirmPassword) { setError('Please fill in all required fields'); return false; }
      if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return false; }
      if (form.password.length < 8) { setError('Password must be at least 8 characters'); return false; }
      if (!/[A-Z]/.test(form.password)) { setError('Password must contain an uppercase letter'); return false; }
      if (!/[0-9]/.test(form.password)) { setError('Password must contain a number'); return false; }
    }
    if (s === 2) {
      if (!form.firstName || !form.lastName || !form.saId) { setError('Please fill in all required fields'); return false; }
      if (!saIdInfo?.valid) { setError('Please enter a valid SA ID number'); return false; }
    }
    return true;
  };

  const handleNext = (e: React.FormEvent) => { e.preventDefault(); if (validate(step)) setStep(s => s+1); };
  const handleBack = () => { setError(''); setStep(s => s-1); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await api.register({ email:form.email, password:form.password, firstName:form.firstName, lastName:form.lastName, saId:form.saId, phone:form.phone, address:form.address, city:form.city, province:form.province, postalCode:form.postalCode, emergencyContactName:form.emergencyContactName, emergencyContactPhone:form.emergencyContactPhone, department:form.department, position:form.position });
      toast.success('Registration successful! Your account is pending admin approval.');
      navigate('/intern/login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: '#f8fafc' }}>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 flex-col p-10 xl:p-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0a1628 0%,#0d2044 50%,#0e3060 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage:'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)', backgroundSize:'48px 48px' }}/>
        <div className="absolute top-[-80px] left-[-80px] w-80 h-80 rounded-full blur-3xl" style={{ background:'rgba(22,163,74,0.15)' }}/>
        <div className="absolute bottom-[-60px] right-[-60px] w-72 h-72 rounded-full blur-3xl" style={{ background:'rgba(16,122,59,0.2)' }}/>

        <div className="relative z-10 flex items-center gap-3 mb-auto">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,#16a34a,#15803d)' }}>
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </div>
          <div>
            <p className="text-white font-bold text-base leading-none">IMS Intern</p>
            <p className="text-xs mt-0.5 font-medium" style={{ color:'rgba(134,239,172,0.6)' }}>Registration Portal</p>
          </div>
        </div>

        <div className="relative z-10 mt-auto mb-10">
          <h1 className="text-white font-extrabold leading-tight mb-4" style={{ fontSize:'clamp(1.8rem,3vw,2.5rem)' }}>
            Join the<br/>
            <span className="text-transparent bg-clip-text" style={{ backgroundImage:'linear-gradient(90deg,#4ade80,#86efac)' }}>ETS Team</span>
          </h1>
          <p className="leading-relaxed text-sm mb-8" style={{ color:'rgba(134,239,172,0.6)' }}>
            Register as an intern with Eullafied Tech Solutions. Your application will be reviewed and approved by an admin.
          </p>
          <div className="space-y-3">
            {['Fill in your credentials', 'Verify your SA ID', 'Submit for approval'].map((s,i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: step > i+1 ? 'rgba(74,222,128,0.3)' : step === i+1 ? 'rgba(22,163,74,0.5)' : 'rgba(255,255,255,0.08)', color: step >= i+1 ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>
                  {step > i+1 ? '✓' : i+1}
                </div>
                <span className="text-sm" style={{ color: step >= i+1 ? 'rgba(134,239,172,0.9)' : 'rgba(134,239,172,0.3)' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-5 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:'linear-gradient(135deg,#16a34a,#15803d)' }}>
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </div>
            <span className="font-bold text-gray-900 text-base">IMS Registration</span>
          </div>
          <span className="text-xs font-medium text-gray-500">Step {step}/3</span>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12 xl:px-16">
          <div className="w-full max-w-[480px]">

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {steps.map((s, i) => (
                <div key={s.num} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${step > s.num ? 'bg-green-600 text-white' : step === s.num ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-xs font-semibold ${step >= s.num ? 'text-gray-800' : 'text-gray-400'}`}>{s.label}</p>
                    <p className="text-xs text-gray-400">{s.desc}</p>
                  </div>
                  {i < 2 && <div className={`flex-1 h-0.5 ml-2 ${step > s.num ? 'bg-green-500' : 'bg-gray-200'}`}/>}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width:`${(step/3)*100}%`, background:'linear-gradient(90deg,#16a34a,#4ade80)' }}/>
            </div>

            <div className="mb-5">
              <h2 className="text-2xl font-bold text-gray-900">{steps[step-1].label}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{steps[step-1].desc}</p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {error}
              </div>
            )}

            {/* Step 1 */}
            {step === 1 && (
              <form onSubmit={handleNext} className="space-y-4">
                <Field label="Email Address" required>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    <input name="email" type="email" value={form.email} onChange={set} required autoComplete="email" placeholder="you@example.com" className={`${inputClass} pl-10`}/>
                  </div>
                </Field>
                <Field label="Password" required>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    <input name="password" type={showPwd ? 'text' : 'password'} value={form.password} onChange={set} required placeholder="Min 8 chars, 1 uppercase, 1 number" className={`${inputClass} pl-10 pr-10`}/>
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPwd ? '🙈' : '👁️'}
                    </button>
                  </div>
                </Field>
                <Field label="Confirm Password" required>
                  <input name="confirmPassword" type={showPwd ? 'text' : 'password'} value={form.confirmPassword} onChange={set} required placeholder="Repeat your password" className={inputClass}/>
                  {form.confirmPassword && (
                    <p className={`text-xs mt-1 ${form.password === form.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                      {form.password === form.confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
                    </p>
                  )}
                </Field>
                <button type="submit" className="w-full py-3.5 mt-2 text-white font-semibold rounded-xl transition-opacity hover:opacity-90" style={{ background:'linear-gradient(135deg,#16a34a,#15803d)' }}>
                  Continue →
                </button>
                <p className="text-center text-sm text-gray-500">
                  Already have an account? <Link to="/intern/login" className="text-green-600 hover:underline font-medium">Sign in</Link>
                </p>
              </form>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <form onSubmit={handleNext} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First Name" required>
                    <input name="firstName" value={form.firstName} onChange={set} required placeholder="John" className={inputClass}/>
                  </Field>
                  <Field label="Last Name" required>
                    <input name="lastName" value={form.lastName} onChange={set} required placeholder="Doe" className={inputClass}/>
                  </Field>
                </div>
                <Field label="SA ID Number" required>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/></svg>
                    <input name="saId" value={form.saId} onChange={handleSAId} required maxLength={13} placeholder="0000000000000" className={`${inputClass} pl-10 font-mono tracking-widest`}/>
                  </div>
                  {saIdInfo && (
                    <div className={`mt-2 p-3 rounded-xl text-sm border ${saIdInfo.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      {saIdInfo.valid ? (
                        <div>
                          <p className="text-green-700 font-semibold mb-2">✓ Valid SA ID</p>
                          <div className="grid grid-cols-2 gap-1 text-xs text-green-700">
                            <span>📅 DOB: {saIdInfo.dateOfBirth}</span>
                            <span>🎂 Age: {saIdInfo.age}</span>
                            <span>👤 Gender: {saIdInfo.gender}</span>
                            <span>🇿🇦 {saIdInfo.citizenship}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-red-600">✕ {saIdInfo.error}</p>
                      )}
                    </div>
                  )}
                </Field>
                <Field label="Phone Number">
                  <input name="phone" value={form.phone} onChange={set} placeholder="+27 12 345 6789" className={inputClass}/>
                </Field>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={handleBack} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">← Back</button>
                  <button type="submit" className="flex-1 py-3 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity" style={{ background:'linear-gradient(135deg,#16a34a,#15803d)' }}>Continue →</button>
                </div>
              </form>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Address">
                  <input name="address" value={form.address} onChange={set} placeholder="123 Main Street" className={inputClass}/>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City">
                    <input name="city" value={form.city} onChange={set} placeholder="Johannesburg" className={inputClass}/>
                  </Field>
                  <Field label="Postal Code">
                    <input name="postalCode" value={form.postalCode} onChange={set} placeholder="2000" className={inputClass}/>
                  </Field>
                </div>
                <Field label="Province">
                  <select name="province" value={form.province} onChange={set} className={inputClass}>
                    <option value="">Select Province</option>
                    {SA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Emergency Contact</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Contact Name">
                      <input name="emergencyContactName" value={form.emergencyContactName} onChange={set} placeholder="Jane Doe" className={inputClass}/>
                    </Field>
                    <Field label="Contact Phone">
                      <input name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={set} placeholder="+27 12 345 6789" className={inputClass}/>
                    </Field>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Work Information</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Department">
                      <input name="department" value={form.department} onChange={set} placeholder="IT Support" className={inputClass}/>
                    </Field>
                    <Field label="Position">
                      <input name="position" value={form.position} onChange={set} placeholder="Dev Intern" className={inputClass}/>
                    </Field>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={handleBack} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">← Back</button>
                  <button type="submit" disabled={loading} className="flex-1 py-3 text-white font-semibold rounded-xl disabled:opacity-60 hover:opacity-90 transition-opacity" style={{ background:'linear-gradient(135deg,#16a34a,#15803d)' }}>
                    {loading ? 'Registering…' : 'Complete Registration ✓'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="px-5 pb-6 text-center">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Eullafied Tech Solutions · Mosenthal Village, North West</p>
        </div>
      </div>
    </div>
  );
}
