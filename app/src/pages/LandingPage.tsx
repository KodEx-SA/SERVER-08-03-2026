import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#070e1a' }}>
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full blur-3xl" style={{ background: 'rgba(29,111,164,0.12)' }}/>
        <div className="absolute bottom-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full blur-3xl" style={{ background: 'rgba(22,163,74,0.1)' }}/>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)', backgroundSize: '48px 48px' }}/>
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-extrabold text-sm leading-none">IMS</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Intern Management</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/intern/login" className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-white/10 transition-colors hover:border-white/20" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Intern Login
          </Link>
          <Link to="/admin/login" className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-white transition-opacity hover:opacity-90" style={{ background: 'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>
            Admin Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-16 sm:py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 border border-white/10" style={{ background: 'rgba(29,111,164,0.15)', backdropFilter: 'blur(8px)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"/>
          <span className="text-white/70 text-xs font-medium tracking-wide">Eullafied Tech Solutions</span>
        </div>
        <h1 className="text-white font-extrabold leading-[1.1] mb-5 max-w-2xl" style={{ fontSize: 'clamp(2rem,5vw,3.5rem)' }}>
          Intern Management<br/>
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg,#60b4e8,#4ade80)' }}>
            System
          </span>
        </h1>
        <p className="max-w-lg mx-auto mb-10 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(0.95rem,2vw,1.1rem)' }}>
          A comprehensive platform for managing interns, tracking attendance with GPS, managing support tickets and monitoring progress — built for Eullafied Tech Solutions.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm sm:max-w-none sm:w-auto">
          <Link to="/intern/login"
            className="flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-2xl text-white border border-white/10 hover:border-white/20 transition-colors"
            style={{ background: 'rgba(22,163,74,0.15)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            Intern Portal
          </Link>
          <Link to="/admin/login"
            className="flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-2xl text-white hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg,#1d6fa4,#0e4d7a)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            Admin Portal
          </Link>
          <Link to="/register"
            className="flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-2xl border border-white/10 hover:border-white/20 transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)' }}>
            Register as Intern
          </Link>
        </div>
      </div>

      {/* Feature cards */}
      <div className="relative z-10 px-5 sm:px-8 pb-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon:'👥', title:'Intern Management',  desc:'Approve registrations and track intern progress',  color:'rgba(29,111,164,0.15)',  border:'rgba(29,111,164,0.2)'  },
            { icon:'🎫', title:'Support Tickets',    desc:'Submit and resolve IT support requests',            color:'rgba(168,85,247,0.12)', border:'rgba(168,85,247,0.18)' },
            { icon:'📍', title:'GPS Attendance',     desc:'Location-based check-in and login tracking',       color:'rgba(22,163,74,0.12)',  border:'rgba(22,163,74,0.18)'  },
            { icon:'📊', title:'Reports & Analytics',desc:'Dashboard insights and performance metrics',        color:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.18)' },
          ].map(f => (
            <div key={f.title} className="rounded-2xl p-5 border" style={{ background: f.color, borderColor: f.border }}>
              <div className="text-2xl mb-3">{f.icon}</div>
              <p className="text-white font-semibold text-sm mb-1">{f.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 px-5 pb-6 text-center border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-xs pt-5" style={{ color: 'rgba(255,255,255,0.2)' }}>
          © {new Date().getFullYear()} Eullafied Tech Solutions (Pty) Ltd · Mosenthal Village, North West, South Africa
        </p>
      </div>
    </div>
  );
}
