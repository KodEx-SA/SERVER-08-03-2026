import { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';

type Period = '7d' | '30d' | '90d';

const Bar = ({ pct, color }: { pct: number; color: string }) => (
  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
    <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
  </div>
);

const MiniBarChart = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((v, i) => (
        <div key={i} className="flex-1">
          <div className={`w-full ${color} rounded-sm transition-all duration-500`} style={{ height: `${(v / max) * 56}px` }} />
        </div>
      ))}
    </div>
  );
};

const periodData: Record<Period, {
  stats: { totalTickets: number; resolved: number; avgTime: string; satisfaction: number };
  byStatus: { label: string; count: number; pct: number; color: string; bar: string }[];
  byPriority: { label: string; count: number; pct: number; color: string; bar: string }[];
  byDept: { name: string; pct: number }[];
  trend: number[];
  trendLabels: string[];
}> = {
  '7d':  { stats: { totalTickets:42,  resolved:31,  avgTime:'3.2h', satisfaction:94 }, byStatus:[{label:'Resolved',count:31,pct:74,color:'text-green-600',bar:'bg-green-500'},{label:'In Progress',count:7,pct:17,color:'text-yellow-600',bar:'bg-yellow-400'},{label:'Open',count:4,pct:9,color:'text-red-600',bar:'bg-red-500'}], byPriority:[{label:'High',count:12,pct:29,color:'text-red-600',bar:'bg-red-500'},{label:'Medium',count:20,pct:48,color:'text-yellow-600',bar:'bg-yellow-400'},{label:'Low',count:10,pct:23,color:'text-blue-600',bar:'bg-blue-500'}], byDept:[{name:'IT',pct:83},{name:'HR',pct:70},{name:'Finance',pct:75},{name:'Operations',pct:50}], trend:[5,8,4,7,9,6,3], trendLabels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
  '30d': { stats: { totalTickets:156, resolved:120, avgTime:'4.1h', satisfaction:91 }, byStatus:[{label:'Resolved',count:120,pct:77,color:'text-green-600',bar:'bg-green-500'},{label:'In Progress',count:23,pct:15,color:'text-yellow-600',bar:'bg-yellow-400'},{label:'Open',count:13,pct:8,color:'text-red-600',bar:'bg-red-500'}], byPriority:[{label:'High',count:42,pct:27,color:'text-red-600',bar:'bg-red-500'},{label:'Medium',count:78,pct:50,color:'text-yellow-600',bar:'bg-yellow-400'},{label:'Low',count:36,pct:23,color:'text-blue-600',bar:'bg-blue-500'}], byDept:[{name:'IT',pct:83},{name:'HR',pct:76},{name:'Finance',pct:77},{name:'Operations',pct:59}], trend:[12,18,14,22,17,19,15,21,16,20,13,17,19,22,18,14,20,16,23,18,15,19,21,14,17,22,19,15,18,20], trendLabels:Array.from({length:30},(_,i)=>`${i+1}`) },
  '90d': { stats: { totalTickets:489, resolved:401, avgTime:'5.3h', satisfaction:89 }, byStatus:[{label:'Resolved',count:401,pct:82,color:'text-green-600',bar:'bg-green-500'},{label:'In Progress',count:55,pct:11,color:'text-yellow-600',bar:'bg-yellow-400'},{label:'Open',count:33,pct:7,color:'text-red-600',bar:'bg-red-500'}], byPriority:[{label:'High',count:120,pct:25,color:'text-red-600',bar:'bg-red-500'},{label:'Medium',count:245,pct:50,color:'text-yellow-600',bar:'bg-yellow-400'},{label:'Low',count:124,pct:25,color:'text-blue-600',bar:'bg-blue-500'}], byDept:[{name:'IT',pct:86},{name:'HR',pct:81},{name:'Finance',pct:81},{name:'Operations',pct:76}], trend:[45,52,48,61,55,58,50,63,57,60,48,55], trendLabels:['Wk1','Wk2','Wk3','Wk4','Wk5','Wk6','Wk7','Wk8','Wk9','Wk10','Wk11','Wk12'] },
};

export default function AdminReports() {
  const [period, setPeriod] = useState<Period>('30d');
  const d = periodData[period];
  const resolutionPct = Math.round((d.stats.resolved / d.stats.totalTickets) * 100);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-500 text-sm mt-1">Track performance metrics and ticket trends.</p>
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {(['7d','30d','90d'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {p === '7d' ? '7 days' : p === '30d' ? '30 days' : '90 days'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label:'Total Tickets', value:d.stats.totalTickets, icon:'🎫', color:'text-blue-600', bg:'bg-blue-50', change:'12%', up:true },
            { label:'Resolved', value:d.stats.resolved, icon:'✅', color:'text-green-600', bg:'bg-green-50', change:'8%', up:true },
            { label:'Avg. Resolution', value:d.stats.avgTime, icon:'⏱️', color:'text-orange-600', bg:'bg-orange-50', change:'0.3h', up:false },
            { label:'Satisfaction', value:`${d.stats.satisfaction}%`, icon:'⭐', color:'text-purple-600', bg:'bg-purple-50', change:'2%', up:true },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center text-lg`}>{s.icon}</div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{s.up ? '↑' : '↓'} {s.change}</span>
              </div>
              <p className={`text-2xl sm:text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 text-sm mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Ticket Volume</h2>
              <span className="text-xs text-gray-400">Last {period === '7d' ? '7 days' : period === '30d' ? '30 days' : '90 days'}</span>
            </div>
            <MiniBarChart data={d.trend} color="bg-blue-500"/>
            <div className="flex justify-between mt-2">
              {(d.trendLabels.length <= 12 ? d.trendLabels : d.trendLabels.filter((_,i) => i % Math.ceil(d.trendLabels.length / 7) === 0)).map(l => (
                <span key={l} className="text-xs text-gray-400">{l}</span>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center">
            <h2 className="text-base font-semibold text-gray-900 self-start mb-4">Resolution Rate</h2>
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
                <circle cx="60" cy="60" r="50" fill="none" stroke="#2563eb" strokeWidth="12" strokeDasharray={`${(resolutionPct/100)*314} 314`} strokeLinecap="round"/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{resolutionPct}%</span>
                <span className="text-xs text-gray-400">resolved</span>
              </div>
            </div>
            <div className="mt-4 w-full space-y-1.5">
              {d.byStatus.map(s => (
                <div key={s.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{s.label}</span>
                  <span className={`font-semibold ${s.color}`}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">By Priority</h2>
            <div className="space-y-3">
              {d.byPriority.map(p => (
                <div key={p.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{p.label}</span>
                    <span className={`text-sm font-semibold ${p.color}`}>{p.count} ({p.pct}%)</span>
                  </div>
                  <Bar pct={p.pct} color={p.bar}/>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">By Department</h2>
            <div className="space-y-3">
              {d.byDept.map(dep => (
                <div key={dep.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{dep.name}</span>
                    <span className="text-sm font-semibold text-gray-800">{dep.pct}%</span>
                  </div>
                  <Bar pct={dep.pct} color="bg-blue-500"/>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
