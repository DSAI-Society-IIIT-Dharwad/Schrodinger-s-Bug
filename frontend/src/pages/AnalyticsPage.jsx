import React from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { useAlgoWebSocket } from '../hooks/useAlgoWebSocket';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, Activity, Cpu, AlertCircle } from 'lucide-react';
import RadarView from '../components/RadarView';

export default function AnalyticsPage() {
  const { metrics, chartHistory, isConnected, isSystemActive } = useAlgoWebSocket();

  // No mock data - only use live history
  const chartData = chartHistory;
  const latest = metrics;

  return (
    <div className="min-h-screen bg-[#020204] text-white p-6 lg:p-10 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      <div className="fixed inset-0 neural-grid opacity-20 pointer-events-none" />
      
      <div className="max-w-[1400px] mx-auto space-y-12 relative z-10">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-white/5 pb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-indigo-400 font-mono text-[10px] tracking-[0.4em] uppercase">
              <Activity className="w-4 h-4" />
              Inference Analysis Hub
            </div>
            <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">
              Mission <span className="text-indigo-500">Analytics</span>
            </h1>
          </div>
          
          <div className={`px-6 py-3 rounded-2xl border transition-all flex items-center gap-4 ${isSystemActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>
            <span className={`w-2 h-2 rounded-full ${isSystemActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest font-mono">
              {isSystemActive ? 'Live Stream Active' : 'System Standby'}
            </span>
          </div>
        </header>

        {/* Status Guard for Analytics */}
        {!isSystemActive ? (
            <div className="h-[600px] rounded-[40px] border border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center p-10">
                <AlertCircle className="w-16 h-16 text-slate-800 mb-6" />
                <h3 className="text-2xl font-black italic uppercase mb-2">Analytics Offline</h3>
                <p className="text-slate-500 font-mono text-xs max-w-sm uppercase tracking-widest leading-relaxed">
                    Awaiting System Launch. Analytics engine requires an active Gazebo DRL session to aggregate real-time telemetry.
                </p>
                <button disabled className="mt-8 px-10 py-5 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest opacity-20">
                    Engine Standby
                </button>
            </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Reward', value: latest.reward.toFixed(2), icon: <Target className="w-4 h-4" />, color: 'text-emerald-400' },
                  { label: 'Success %', value: `${latest.success_rate?.toFixed(1) || '0.0'}%`, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-cyan-400' },
                  { label: 'Policy Loss', value: (latest.loss || 0).toFixed(4), icon: <Activity className="w-4 h-4" />, color: 'text-amber-400' },
                  { label: 'Episode', value: latest.episode || '---', icon: <Cpu className="w-4 h-4" />, color: 'text-indigo-400' },
                ].map(s => (
                  <div key={s.label} className="glass-card p-5 border border-white/5">
                    <div className="flex items-center gap-3 text-slate-500 mb-3 uppercase font-mono text-[9px] tracking-widest">
                       {s.icon} {s.label}
                    </div>
                    <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="glass-card p-8 border border-white/5 h-[400px] flex flex-col">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">Policy Reward Evolution</h4>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis dataKey="time" hide />
                      <YAxis stroke="#ffffff10" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="reward" stroke="#6366f1" strokeWidth={3} fill="#6366f1" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 h-[600px] glass-card p-8 border border-white/5 flex flex-col">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">Neural Output Topology</h4>
                <div className="flex-1 bg-black/40 rounded-[32px] border border-white/5 relative overflow-hidden flex items-center justify-center">
                    <RadarView telemetry={latest} />
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
