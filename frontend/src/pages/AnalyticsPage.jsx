import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Terminal, Target, Activity, Cpu, Globe, Rocket } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import { useAlgoWebSocket } from '../hooks/useAlgoWebSocket';
import { generateEpisodeData } from '../utils';
import RadarView from '../components/RadarView';

export default function AnalyticsPage() {
  const { metrics: telemetry, chartHistory: liveHistory, isConnected, isDemoMode } = useAlgoWebSocket('ppo');
  const [logs, setLogs] = useState([]);
  
  // High-fidelity historical seed
  const mockHistory = useMemo(() => generateEpisodeData(100), []);
  
  const chartData = liveHistory.length > 0 ? liveHistory : mockHistory;
  const latest = chartData[chartData.length - 1] || { reward: 0, success_rate: 0, loss: 0.5, episode: 0 };

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-card p-6 border-l-4 border-l-indigo-500">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-[0.3em]">System Neural Observer</span>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Mission Analytics Control</h2>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Inference Latency</div>
            <div className="text-lg font-black text-white">{telemetry.latency || '0'} <span className="text-[10px] text-slate-400 font-normal">ms</span></div>
          </div>
          <div className="text-right border-l border-white/10 pl-6">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">System Status</div>
            <div className={`text-lg font-black ${telemetry.collision ? 'text-rose-400' : 'text-emerald-400'}`}>
              {telemetry.collision ? 'CRITICAL: COLLISION' : 'OPTIMIZED'}
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Visual Discovery */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <RadarView telemetry={telemetry} />
          
          {/* Real-time Neuro HUD */}
          <div className="glass-card p-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Neural Output HUD
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                <div className="text-[9px] font-mono text-slate-500 mb-1">VELOCITY (v)</div>
                <div className="text-xl font-black text-white font-mono">{telemetry.velocity?.toFixed(3) || '0.000'}</div>
              </div>
              <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                <div className="text-[9px] font-mono text-slate-500 mb-1">REWARD (r)</div>
                <div className="text-xl font-black text-white font-mono">{telemetry.reward?.toFixed(2) || '0.00'}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>EPISODE PROGRESS</span>
                <span>{telemetry.episode}</span>
              </div>

              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(100, 100 - telemetry.distance_to_goal * 10))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Terminal HUD */}
          <div className="glass-card p-0 overflow-hidden h-[300px] flex flex-col border border-indigo-500/20">
            <div className="px-4 py-2 border-b border-white/5 bg-indigo-500/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-3 h-3 text-indigo-400" />
                <span className="text-[9px] font-mono text-indigo-300 uppercase tracking-widest">Observer Console</span>
              </div>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
              </div>
            </div>
            <div className="flex-1 p-4 font-mono text-[10px] overflow-y-auto space-y-1 custom-scrollbar bg-black/40">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-slate-600 shrink-0">{i}</span>
                  <span className={log.includes('[ERROR]') ? 'text-rose-400' : 'text-slate-400'}>{log}</span>
                </div>
              ))}
              {logs.length === 0 && <div className="text-slate-600 italic">No console output...</div>}
            </div>
          </div>
        </div>

        {/* Right Column: Deep Analytics */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Main Stat Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Reward', value: (latest.reward || 0).toFixed(2), icon: <Target className="w-4 h-4" />, color: 'text-emerald-400' },
              { label: 'Success %', value: `${(latest.success_rate || 0).toFixed(2)}%`, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-cyan-400' },
              { label: 'Policy Loss', value: (latest.loss || 0).toFixed(4), icon: <Activity className="w-4 h-4" />, color: 'text-amber-400' },
              { label: 'Episode', value: latest.episode || 100, icon: <Cpu className="w-4 h-4" />, color: 'text-indigo-400' },
            ].map(s => (
              <div key={s.label} className="glass-card p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                  {s.icon}
                </div>
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">{s.label}</div>
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Large Performance Chart */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-300">Policy Reward Evolution</h4>
              <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Reward</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="an_rw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="episode" hide />
                  <YAxis stroke="#ffffff10" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="reward" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#an_rw)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Charts Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Success Trajectory</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="an_sr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="episode" hide />
                    <YAxis hide />
                    <Area type="monotone" dataKey="success_rate" stroke="#22d3ee" strokeWidth={2} fill="url(#an_sr)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass-card p-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Policy Loss Gradient</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="episode" hide />
                    <YAxis hide />
                    <Line type="monotone" dataKey="loss" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
