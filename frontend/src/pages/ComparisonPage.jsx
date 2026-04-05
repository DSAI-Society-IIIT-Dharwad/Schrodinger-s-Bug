import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { useAlgoWebSocket } from '../hooks/useAlgoWebSocket';
import { motion } from 'framer-motion';
import { GitCompare, Trophy, Zap, AlertTriangle, Activity, BarChart3 } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../utils';

export default function ComparisonPage() {
  const ppo = useAlgoWebSocket('ppo');
  const td3 = useAlgoWebSocket('td3');
  const [history, setHistory] = useState({ ppo: [], td3: [] });

  // Fetch initial history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/compare`);
        if (res.data.history) {
          setHistory(res.data.history);
        }
      } catch (err) {
        console.error("Comparison fetch failed:", err);
      }
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  const combinedData = [];
  const maxLen = Math.max(history.ppo.length, history.td3.length);
  for (let i = 0; i < maxLen; i++) {
    combinedData.push({
      index: i,
      ppo_reward: history.ppo[i]?.reward || 0,
      td3_reward: history.td3[i]?.reward || 0,
      ppo_avg: history.ppo[i]?.avg_reward || 0,
      td3_avg: history.td3[i]?.avg_reward || 0,
    });
  }

  const ppoStats = ppo.metrics;
  const td3Stats = td3.metrics;

  const barData = [
    { name: 'PPO Avg', value: ppoStats.avg_reward, color: '#3b82f6' },
    { name: 'TD3 Avg', value: td3Stats.avg_reward, color: '#ec4899' },
  ];

  const winner = ppoStats.avg_reward > td3Stats.avg_reward ? 'PPO' : 'TD3';
  const winnerColor = winner === 'PPO' ? 'text-blue-400' : 'text-pink-400';

  return (
    <div className="min-h-screen bg-[#050508] text-white p-6 lg:p-10 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      <div className="fixed inset-0 grid-bg opacity-20 pointer-events-none" />
      
      <header className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-3 text-indigo-400 font-mono text-[10px] tracking-[0.4em] uppercase mb-2">
            <GitCompare className="w-4 h-4" />
            Neural Benchmark // Competitive Analysis
          </div>
          <h1 className="text-5xl font-black tracking-tighter italic uppercase">
            ALGO <span className="text-indigo-500">SHOWDOWN</span>
          </h1>
        </div>

        <div className="hwi-glass px-8 py-4 rounded-3xl border border-white/10 flex items-center gap-6">
          <div className="flex items-center gap-4">
            <Trophy className={`w-6 h-6 ${winnerColor} animate-bounce`} />
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase">Current Leader</div>
              <div className={`text-2xl font-black ${winnerColor}`}>{winner} AGENT</div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 grid grid-cols-12 gap-8">
        {/* TOP ROW: Stats Comparison */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* PPO Stats Card */}
          <div className="hwi-glass p-8 rounded-[40px] border-l-4 border-l-blue-500 bg-blue-500/5">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black italic">PPO <span className="text-blue-400 text-sm not-italic opacity-50">Stochastic Policy</span></h3>
              <div className={`px-4 py-1 rounded-full text-[10px] font-bold ${ppo.isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {ppo.isConnected ? 'ONLINE' : 'OFFLINE'}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-[9px] font-mono text-slate-500 uppercase mb-1">Avg Reward</div>
                <div className="text-2xl font-black text-blue-400">{ppoStats.avg_reward.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-slate-500 uppercase mb-1">Collision Rate</div>
                <div className="text-2xl font-black text-rose-500">{(ppoStats.collision_rate * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-slate-500 uppercase mb-1">Total Steps</div>
                <div className="text-2xl font-black">{ppoStats.steps}</div>
              </div>
            </div>
          </div>

          {/* TD3 Stats Card */}
          <div className="hwi-glass p-8 rounded-[40px] border-l-4 border-l-pink-500 bg-pink-500/5">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black italic">TD3 <span className="text-pink-400 text-sm not-italic opacity-50">Deterministic + Noise</span></h3>
              <div className={`px-4 py-1 rounded-full text-[10px] font-bold ${td3.isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {td3.isConnected ? 'ONLINE' : 'OFFLINE'}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-[9px] font-mono text-slate-500 uppercase mb-1">Avg Reward</div>
                <div className="text-2xl font-black text-pink-400">{td3Stats.avg_reward.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-slate-500 uppercase mb-1">Collision Rate</div>
                <div className="text-2xl font-black text-rose-500">{(td3Stats.collision_rate * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-slate-500 uppercase mb-1">Total Steps</div>
                <div className="text-2xl font-black">{td3Stats.steps}</div>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE ROW: Reward Evolution Overlaid */}
        <div className="col-span-12 lg:col-span-8">
          <div className="hwi-glass p-8 rounded-[40px] border border-white/5 h-[500px] flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-3">
                <Activity className="w-4 h-4 text-indigo-400" /> Overlaid Reward Evolution
              </h4>
              <div className="flex gap-6">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[10px] text-slate-400">PPO</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-pink-500" /><span className="text-[10px] text-slate-400">TD3</span></div>
              </div>
            </div>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="index" hide />
                  <YAxis stroke="#ffffff10" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0e', border: '1px solid #ffffff10', borderRadius: '16px' }} />
                  <Line type="monotone" dataKey="ppo_reward" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="td3_reward" stroke="#ec4899" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* SIDE: Average Comparison Bar Chart */}
        <div className="col-span-12 lg:col-span-4">
          <div className="hwi-glass p-8 rounded-[40px] border border-white/5 h-[500px] flex flex-col">
            <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-12 flex items-center gap-3">
              <BarChart3 className="w-4 h-4 text-amber-400" /> Efficiency Benchmark
            </h4>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#0a0a0e', border: '1px solid #ffffff10', borderRadius: '16px' }} />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                Benchmark based on current cumulative average reward. PPO shows stability in stochastic exploration, while TD3 favors deterministic optimization.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
