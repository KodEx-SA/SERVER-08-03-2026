import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function InternLoginPage() {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const services = [
    { icon: '📋', text: 'Log daily tasks and track work hours' },
    { icon: '🎫', text: 'Submit and track IT support tickets' },
    { icon: '📁', text: 'Upload and manage your documents' },
    { icon: '📍', text: 'GPS check-in for attendance tracking' },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: '#070e1a' }}>

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#0a1c10 0%,#0d3318 45%,#0e4a24 100%)' }}/>
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)', backgroundSize: '48px 48px' }}/>
        <div className="absolute top-[-80px] left-[-80px] w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(22,163,74,0.18)' }}/>
        <div className="absolute bottom-[-60px] right-[-60px] w-80 h-80 rounded-full blur-3xl" style={{ background: 'rgba(21,128,61,0.22)' }}/>

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center border border-white/10" style={{ background: 'rgba(22,163,74,0.3)', backdropFilter: 'blur(8px)' }}>
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <div>
              <span className="text-white font-extrabold text-lg tracking-tight leading-none">IMS Intern</span>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'rgba(134,239,172,0.6)' }}>Intern Workspace</p>
            </div>
          </div>

          {/* Hero */}
          <div className="mt-auto mb-12">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 border border-white/10" style={{ background: 'rgba(22,163,74,0.2)', backdropFilter: 'blur(8px)' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
              <span className="text-white/80 text-xs font-medium tracking-wide uppercase">Intern Workspace</span>
            </div>
            <h1 className="text-white font-extrabold leading-[1.1] mb-5" style={{ fontSize: 'clamp(2rem,3.5vw,3rem)' }}>
              Your ETS<br/>
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg,#4ade80,#86efac)' }}>
                work hub
              </span>
            </h1>
            <p className="leading-relaxed max-w-sm mb-10" style={{ color: 'rgba(134,239,172,0.65)', fontSize: 'clamp(.9rem,1.2vw,1.05rem)' }}>
              One platform to log tasks, manage tickets, upload documents and track attendance — built for ETS interns.
            </p>
            <div className="space-y-3.5">
              {services.map((s, i) => (
                <div key={i} className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base border border-white/8" style={{ background: 'rgba(22,163,74,0.2)' }}>{s.icon}</div>
                  <p className="text-sm" style={{ color: 'rgba(134,239,172,0.72)' }}>{s.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="grid grid-cols-3 gap-3 border-t pt-8" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            {[['ETS','Company'],['2015','Founded'],['NW','Province']].map(([v,l]) => (
              <div key={l}>
                <p className="text-white font-bold text-xl">{v}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(134,239,172,0.4)' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-5 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(22,163,74,0.4)' }}>
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">IMS Intern</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Intern Workspace</p>
            </div>
          </div>
          <Link to="/" className="text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10" style={{ color: 'rgba(255,255,255,0.5)' }}>
            ← Home
          </Link>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-16">
          <div className="w-full max-w-[420px]">

            <div className="hidden lg:flex items-center gap-2 mb-8">
              <Link to="/" className="flex items-center gap-2 text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.35)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                Back to Home
              </Link>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Welcome back</h2>
              <p className="text-sm sm:text-base mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Sign in to your Intern Workspace</p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-3 px-4 py-3.5 rounded-2xl border border-red-500/20" style={{ background: 'rgba(239,68,68,0.08)' }}>
                <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <p className="text-red-400 text-sm leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Email address</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  </div>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
                    placeholder="you@eullafied.co.za"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-white text-sm focus:outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}/>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  </div>
                  <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                    placeholder="••••••••••"
                    className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-white text-sm focus:outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}/>
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {showPwd
                      ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 mt-2 rounded-2xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#16a34a 0%,#15803d 100%)' }}>
                {loading
                  ? <span className="flex items-center justify-center gap-2.5"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Signing in…</span>
                  : 'Sign In to Intern Portal'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 mt-7 mb-4">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }}/>
              <span className="text-xs font-medium uppercase tracking-wider px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Quick fill</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }}/>
            </div>

            <button type="button" onClick={() => { setEmail('intern@eullafied.co.za'); setPassword('Intern@12345code'); setError(''); }}
              className="w-full flex flex-col items-center gap-0.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all hover:opacity-90 mb-6"
              style={{ background: 'rgba(22,163,74,0.08)', borderColor: 'rgba(22,163,74,0.25)', color: '#4ade80' }}>
              <span>Test Intern Account</span>
              <span className="font-normal opacity-60 text-xs">intern@eullafied.co.za · Intern@12345code</span>
            </button>

            <div className="space-y-3 text-center">
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Don't have an account?{' '}
                <Link to="/register" className="font-medium transition-colors" style={{ color: 'rgba(74,222,128,0.8)' }}>
                  Register here →
                </Link>
              </p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Are you an admin?{' '}
                <Link to="/admin/login" className="font-medium transition-colors" style={{ color: 'rgba(96,180,232,0.8)' }}>
                  Admin Portal →
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 text-center">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>
            © {new Date().getFullYear()} Eullafied Tech Solutions (Pty) Ltd · North West
          </p>
        </div>
      </div>
    </div>
  );
}
