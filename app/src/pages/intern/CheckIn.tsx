import { useState } from 'react';
import { InternLayout } from '@/components/layouts/InternLayout';
import { useAuth } from '@/contexts/AuthContext';

interface Location { id: string; name: string; address: string; type: 'office'|'site'|'remote'; activeStaff: number; capacity: number; }
const locations: Location[] = [
  { id:'1', name:'Head Office - IT Hub',     address:'12 Main St, Rustenburg',       type:'office', activeStaff:4, capacity:10 },
  { id:'2', name:'Branch A - Finance Floor', address:'45 Nelson Mandela Dr, Joburg',  type:'office', activeStaff:2, capacity:6  },
  { id:'3', name:'Data Centre - Server Room',address:'7 Tech Park, Centurion',        type:'site',   activeStaff:1, capacity:4  },
  { id:'4', name:'Remote / Work from Home',  address:'Virtual',                        type:'remote', activeStaff:3, capacity:99 },
];
const typeStyles: Record<string,{ bg:string; text:string; icon:string }> = {
  office:{ bg:'bg-blue-50', text:'text-blue-700', icon:'🏢' },
  site:  { bg:'bg-orange-50', text:'text-orange-700', icon:'🔧' },
  remote:{ bg:'bg-emerald-50', text:'text-emerald-700', icon:'🏠' },
};

export default function InternCheckIn() {
  const { user } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<string|null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [myStatus, setMyStatus] = useState<'on-site'|'break'|'responding'>('on-site');

  const locObj = locations.find(l => l.id === selectedLocation);

  const handleCheckIn = async () => {
    if (!selectedLocation) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const now = new Date();
    setCheckInTime(`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`);
    setIsCheckedIn(true);
    setLoading(false);
  };

  const handleCheckOut = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setIsCheckedIn(false); setSelectedLocation(null); setCheckInTime(''); setNotes('');
    setLoading(false);
  };

  const initials = (user?.email ?? 'IN').slice(0,2).toUpperCase();

  return (
    <InternLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Check-In</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your work location for today.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            {/* Status card */}
            <div className={`rounded-2xl shadow-sm border p-6 transition-all ${isCheckedIn ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
                  {initials}
                </div>
                <div>
                  <p className="text-gray-900 font-semibold">{user?.email}</p>
                  <p className="text-gray-500 text-xs">Intern</p>
                </div>
              </div>
              {isCheckedIn ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"/>
                    <span className="text-emerald-700 font-semibold text-sm">Checked in</span>
                    <span className="text-gray-400 text-xs">since {checkInTime}</span>
                  </div>
                  <p className="text-sm text-gray-600">📍 {locObj?.name}</p>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1.5">My Status</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['on-site','break','responding'] as const).map(s => (
                        <button key={s} onClick={() => setMyStatus(s)} className={`py-1.5 rounded-lg text-xs font-medium transition-all ${myStatus === s ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300'}`}
                          style={myStatus === s ? { background: 'linear-gradient(135deg,#16a34a,#15803d)' } : {}}>
                          {s === 'on-site' ? 'On Site' : s === 'break' ? 'Break' : 'Responding'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleCheckOut} disabled={loading} className="w-full py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
                    {loading ? 'Checking out...' : '📤 Check Out'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-300"/>
                  <span className="text-gray-500 text-sm">Not checked in</span>
                </div>
              )}
            </div>

            {/* Check-in form */}
            {!isCheckedIn && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Select Location</h2>
                <div className="space-y-2 mb-4">
                  {locations.map(loc => {
                    const style = typeStyles[loc.type];
                    const pct = Math.round((loc.activeStaff / loc.capacity) * 100);
                    return (
                      <button key={loc.id} onClick={() => setSelectedLocation(loc.id)}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${selectedLocation === loc.id ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-start gap-2.5">
                          <span className="text-lg flex-shrink-0">{style.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 leading-tight">{loc.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{loc.address}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex-1 bg-gray-200 rounded-full h-1"><div className="bg-green-500 h-1 rounded-full" style={{ width:`${Math.min(pct,100)}%` }}/></div>
                              <span className="text-xs text-gray-400 flex-shrink-0">{loc.activeStaff}/{loc.capacity}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Notes for today (optional)..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"/>
                <button onClick={handleCheckIn} disabled={!selectedLocation || loading}
                  className="w-full py-3 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
                  {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Checking in...</> : '📍 Check In Now'}
                </button>
              </div>
            )}
          </div>

          {/* Location overview */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Location Overview</h2>
            <div className="space-y-4">
              {locations.map(loc => {
                const style = typeStyles[loc.type];
                const pct = Math.round((loc.activeStaff / loc.capacity) * 100);
                return (
                  <div key={loc.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{style.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 leading-tight">{loc.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{loc.address}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${loc.type==='remote'?'bg-emerald-500':'bg-green-500'}`} style={{ width:`${Math.min(pct,100)}%` }}/></div>
                          <span className="text-xs text-gray-500 flex-shrink-0 font-medium">{loc.activeStaff} active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </InternLayout>
  );
}
