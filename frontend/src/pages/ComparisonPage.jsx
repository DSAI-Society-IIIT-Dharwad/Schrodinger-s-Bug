import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { useAlgoWebSocket } from '../hooks/useAlgoWebSocket';
import { motion } from 'framer-motion';
import { GitCompare, Trophy, Activity, BarChart3, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../utils';

export default function ComparisonPage() {
  const { metrics, chartHistory, isConnected, isSystemActive } = useAlgoWebSocket();
  const [history, setHistory] = useState({ ppo: [], td3: [] });

  // Fetch initial history only if active
  useEffect(() => {
    if (!isSystemActive) return;
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/compare`);
        if (res.data.history) {
          setHistory(res.data.history);
        }
      } catch (err) {}
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, [isSystemActive]);

  const ppoStats = history.ppo[history.ppo.length - 1] || { avg_reward: 0, collision_rate: 0, steps: 0 };
  const td3Stats = history.td3[history.td3.length - 1] || { avg_reward: 0, collision_rate: 0, steps: 0 };

  const barData = [
    { name: 'PPO Avg', value: ppoStats.avg_reward, color: '#3b82f6' },
    { name: 'TD3 Avg', value: td3Stats.avg_reward, color: '#ec4899' },
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-white p-6 lg:p-10 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      <div className="fixed inset-0 grid-bg opacity-20 pointer-events-none" />
      
      <div className="max-w-[1400px] mx-auto space-y-12 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-3 text-indigo-400 font-mono text-[10px] tracking-[0.4em] uppercase mb-2">
              <GitCompare className="w-4 h-4" />
              Neural Benchmark // Competitive Analysis
            </div>
            <h1 className="text-5xl font-black tracking-tighter italic uppercase">
              ALGO <span className="text-indigo-500">SHOWDOWN</span>
            </h1>
          </div>
        </header>

        {!isSystemActive ? (
            <div className="h-[600px] rounded-[40px] border border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center p-10">
                <AlertCircle className="w-16 h-16 text-slate-800 mb-6" />
                <h3 className="text-2xl font-black italic uppercase mb-2">Showdown Inactive</h3>
                <p className="text-slate-500 font-mono text-xs max-w-sm uppercase tracking-widest leading-relaxed">
                    Comparison engine is paused. Benchmark data is only aggregated during active flight missions.
                </p>
                <button disabled className="mt-8 px-10 py-5 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest opacity-20">
                    Engine Standby
                </button>
            </div>
        ) : (
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-8">
              <div className="hwi-glass p-8 rounded-[40px] border border-white/5 h-[500px] flex flex-col">
                <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-12 flex items-center gap-3">
                  <BarChart3 className="w-4 h-4 text-indigo-400" /> Overlaid Deployment Curve
                </h4>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#0a0a0e', border: '1px solid #ffffff10', borderRadius: '16px' }} />
                      <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                        {barData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 space-y-8">
                <div className="hwi-glass p-8 rounded-[40px] border border-white/5">
                   <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">PPO Efficiency</div>
                   <div className="text-3xl font-black text-blue-400">{ppoStats.avg_reward.toFixed(2)}</div>
                </div>
                <div className="hwi-glass p-8 rounded-[40px] border border-white/5">
                   <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">TD3 Efficiency</div>
                   <div className="text-3xl font-black text-pink-400">{td3Stats.avg_reward.toFixed(2)}</div>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
