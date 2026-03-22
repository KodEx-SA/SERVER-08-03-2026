import { useEffect, useState } from 'react';
import { InternLayout } from '@/components/layouts/InternLayout';
import { api } from '@/services/api';
import type { LoginLog } from '@/types';
import { toast } from 'sonner';

function duration(login: string, logout?: string) {
  if (!logout) return null;
  const diff = new Date(logout).getTime() - new Date(login).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function GoogleMapsLink({ lat, lng }: { lat: number; lng: number }) {
  return (
    <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs font-medium hover:underline" style={{ color:'#16a34a' }}>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
      View on map
    </a>
  );
}

export default function InternLoginHistory() {
  const [history, setHistory] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLoginHistory()
      .then(res => setHistory((res as any).history ?? []))
      .catch(() => toast.error('Failed to load login history'))
      .finally(() => setLoading(false));
  }, []);

  const todayLogins  = history.filter(h => new Date(h.login_time).toDateString() === new Date().toDateString()).length;
  const activeNow    = history.filter(h => !h.logout_time).length;
  const withGPS      = history.filter(h => h.login_latitude).length;

  if (loading) return (
    <InternLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor:'rgba(22,163,74,0.2)', borderTopColor:'#16a34a' }}/>
      </div>
    </InternLayout>
  );

  return (
    <InternLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Login History</h1>
          <p className="text-gray-500 text-sm mt-1">Your login sessions and GPS attendance records</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label:'Total Sessions', value: history.length,  bg:'bg-blue-50',   color:'text-blue-700'   },
            { label:'Today',          value: todayLogins,      bg:'bg-green-50',  color:'text-green-700'  },
            { label:'Active Now',     value: activeNow,        bg:'bg-orange-50', color:'text-orange-700' },
            { label:'With GPS',       value: withGPS,          bg:'bg-purple-50', color:'text-purple-700' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Sessions */}
        {history.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="text-5xl mb-4">📍</div>
            <p className="text-gray-500 font-medium">No login records yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((log, index) => {
              const isActive = !log.logout_time;
              const dur = duration(log.login_time, log.logout_time);
              const loginDate = new Date(log.login_time);
              const isToday = loginDate.toDateString() === new Date().toDateString();

              return (
                <div key={log.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Session header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}/>
                      <div>
                        <span className="text-sm font-semibold text-gray-800">
                          Session #{history.length - index}
                        </span>
                        {isToday && <span className="ml-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Today</span>}
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {isActive ? '● Active' : 'Closed'}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Date</p>
                        <p className="text-sm font-medium text-gray-800">
                          {loginDate.toLocaleDateString('en-ZA', { day:'numeric', month:'short', year:'numeric' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Login Time</p>
                        <p className="text-sm font-medium text-gray-800">
                          {loginDate.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                        </p>
                        {log.logout_time && (
                          <p className="text-xs text-gray-400">
                            → {new Date(log.logout_time).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Duration</p>
                        <p className="text-sm font-medium text-gray-800">{dur ?? (isActive ? 'In progress' : '—')}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Device</p>
                        <p className="text-sm font-medium text-gray-800 truncate">{log.browser ?? 'Unknown'}</p>
                        <p className="text-xs text-gray-400">{log.os ?? ''}</p>
                      </div>
                    </div>

                    {/* IP */}
                    {log.ip_address && (
                      <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-xs text-gray-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                        {log.ip_address}
                      </div>
                    )}

                    {/* GPS locations */}
                    {(log.login_latitude || log.logout_latitude) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {log.login_latitude && (
                          <div className="p-3 rounded-xl bg-green-50 border border-green-100">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold text-green-700">📍 Login Location</p>
                              <GoogleMapsLink lat={log.login_latitude} lng={log.login_longitude!}/>
                            </div>
                            <p className="text-xs font-mono text-green-800">
                              {log.login_latitude.toFixed(5)}, {log.login_longitude?.toFixed(5)}
                            </p>
                            {log.login_accuracy && (
                              <p className="text-xs text-green-600 mt-0.5">±{Math.round(log.login_accuracy)}m accuracy</p>
                            )}
                          </div>
                        )}
                        {log.logout_latitude && (
                          <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold text-orange-700">📍 Logout Location</p>
                              <GoogleMapsLink lat={log.logout_latitude} lng={log.logout_longitude!}/>
                            </div>
                            <p className="text-xs font-mono text-orange-800">
                              {log.logout_latitude.toFixed(5)}, {log.logout_longitude?.toFixed(5)}
                            </p>
                            {log.logout_accuracy && (
                              <p className="text-xs text-orange-600 mt-0.5">±{Math.round(log.logout_accuracy)}m accuracy</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* GPS info card */}
        <div className="bg-green-50 rounded-2xl border border-green-100 p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">🔒</span>
            <div>
              <p className="text-sm font-semibold text-green-800">About GPS Tracking</p>
              <p className="text-xs text-green-700 mt-1 leading-relaxed">
                Allow location access when prompted during login and logout for accurate attendance recording. Your location is securely stored and only accessible to authorised administrators.
              </p>
            </div>
          </div>
        </div>
      </div>
    </InternLayout>
  );
}
