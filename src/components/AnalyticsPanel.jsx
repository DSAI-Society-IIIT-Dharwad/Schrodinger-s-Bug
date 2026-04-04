import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Video, CheckCircle2, Play, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { cn } from '../utils';

function TabButton({ active, icon, children, onClick }) {
  return (
    <button onClick={onClick} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all", active ? "bg-white text-slate-900 shadow-lg" : "text-slate-400 hover:text-white")}>
      {icon}{children}
    </button>
  );
}

function ChartMiniMetric({ label, value, trend }) {
  return (
    <div className="space-y-1">
      <span className="text-[9px] text-slate-500 font-mono uppercase tracking-tighter">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-slate-100">{value}</span>
        {trend === 'up' && <div className="text-[8px] text-emerald-400">▲</div>}
        {trend === 'down' && <div className="text-[8px] text-rose-400">▼</div>}
        {trend === 'stable' && <div className="text-[8px] text-slate-500">━</div>}
      </div>
    </div>
  );
}

function DemoVideo({ placeholder, desc, type }) {
  return (
    <div className="space-y-3 group">
      <div className={cn("aspect-video rounded-2xl border bg-black/40 overflow-hidden flex flex-col items-center justify-center relative p-6 cursor-pointer",
        type === 'before' ? 'border-white/5 grayscale saturate-50' : 'border-cyan-500/30 ring-4 ring-cyan-500/0 hover:ring-cyan-500/10 transition-all')}>
        <div className="absolute top-3 left-3 flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" /><div className="w-1.5 h-1.5 rounded-full bg-white/20" /><div className="w-1.5 h-1.5 rounded-full bg-white/20" />
        </div>
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-2", type === 'before' ? 'bg-white/5' : 'bg-cyan-500/20 text-cyan-400')}>
          {type === 'before' ? <AlertCircle className="w-6 h-6 text-slate-500" /> : <Play className="w-6 h-6" />}
        </div>
        <span className="text-[10px] font-mono text-slate-400 tracking-widest uppercase">{placeholder}</span>
        {type === 'after' && (
          <div className="absolute bottom-3 right-3 flex items-center gap-2 px-2 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[8px] text-cyan-300 font-bold uppercase">Ready</span>
          </div>
        )}
      </div>
      <div>
        <h5 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">{type === 'before' ? 'Zero-Learning Baseline' : 'Optimized Policy v2'}</h5>
        <p className="text-[9px] text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function AnalyticsPanel({ activeTab, setActiveTab, episodeCount, episodeData }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden flex flex-col min-h-[500px]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/40 border border-white/10">
          <TabButton active={activeTab === 'training'} icon={<BarChart3 className="w-4 h-4" />} onClick={() => setActiveTab('training')}>Training</TabButton>
          <TabButton active={activeTab === 'recap'} icon={<Video className="w-4 h-4" />} onClick={() => setActiveTab('recap')}>Performance Demo</TabButton>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest hide-mobile">
          <div className="flex items-center gap-2">Epochs: <span className="text-white font-bold">{episodeCount}</span></div>
          <div className="w-[1px] h-3 bg-white/10" />
          <div className="flex items-center gap-2">Loss: <span className="text-white font-bold">0.042</span></div>
        </div>
      </div>

      <div className="p-8 flex-1">
        {activeTab === 'training' ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 h-full">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold flex items-center gap-2">Reward Evolution <CheckCircle2 className="w-4 h-4 text-emerald-400" /></h4>
                <p className="text-xs text-slate-500 mt-1">Stochastic policy gradient improvement across iterations</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-white tracking-tight">+84.2</span>
                <div className="text-[10px] text-emerald-400 font-bold uppercase">Avg Reward Increase</div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={episodeData}>
                  <defs>
                    <linearGradient id="p-reward" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="p-success" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="episode" stroke="#ffffff10" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickMargin={12} />
                  <YAxis stroke="#ffffff10" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickMargin={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="reward" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#p-reward)" animationDuration={2000} />
                  <Area type="monotone" dataKey="success_rate" stroke="#22d3ee" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#p-success)" animationDuration={2500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/5">
              <ChartMiniMetric label="Variance" value="0.012" trend="stable" />
              <ChartMiniMetric label="Hit Rate" value="98.4%" trend="up" />
              <ChartMiniMetric label="Comp. Load" value="24ms" trend="down" />
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full items-center">
            <DemoVideo placeholder="Baseline Interaction" type="before" desc="Robot utilizes random policy with Epsilon 0.9. High collision rate and oscillatory motion." />
            <DemoVideo placeholder="Optimized PPO Inference" type="after" desc="Continuous navigation at v=0.22m/s. Agent resolves non-convex local minima effectively." />
          </motion.div>
        )}
      </div>
    </div>
  );
}
