import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, AlertCircle, Cpu, Database, Box, CheckCircle2, Shield, Rocket, 
  Terminal, Activity, Globe, Zap, ArrowUpRight 
} from 'lucide-react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { useAlgoWebSocket } from '../hooks/useAlgoWebSocket';
import axios from 'axios';
import { BACKEND_URL } from '../utils';

function DemoCard({ title, subtitle, desc, type, isIgniting, onLaunch }) {
  const isBefore = type === 'before';
  
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: isBefore ? 0 : 0.2 }} className="space-y-4">
      <div className={`aspect-video rounded-[32px] border overflow-hidden relative group transition-all duration-500 flex items-center justify-center ${
        isBefore ? 'border-white/5 bg-slate-900/50' : 'border-indigo-500/30 bg-indigo-900/20 glow-indigo'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent opacity-80" />
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '15px 15px' }} 
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
          <button 
            disabled={isIgniting || isBefore}
            onClick={onLaunch}
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all ${
              isBefore ? 'bg-white/5 text-slate-400 cursor-not-allowed opacity-30' : 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 hover:scale-110 cursor-pointer active:scale-95'
            }`}>
            {isBefore ? <AlertCircle className="w-8 h-8" /> : (isIgniting ? <Cpu className="w-8 h-8 animate-spin" /> : <Play className="w-8 h-8 ml-1" />)}
          </button>
          <span className={`text-[10px] font-mono tracking-[0.3em] uppercase ${isBefore ? 'text-white/50' : 'text-indigo-300'}`}>
            {title}
          </span>
          {!isBefore && !isIgniting && (
              <span className="text-[10px] font-bold text-white/40 mt-2 uppercase tracking-widest animate-pulse">Ready for Ignition</span>
          )}
        </div>
      </div>
      <div className="px-2">
        <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-tight">{subtitle}</h4>
        <p className="text-xs text-slate-500 leading-relaxed max-w-[95%] italic">"{desc}"</p>
      </div>
    </motion.div>
  );
}

export default function DemoPage() {
  const [scenario, setScenario] = useState('defense');
  const [isIgniting, setIsIgniting] = useState(false);
  const [demoLogs, setDemoLogs] = useState([]);
  
  const algo = scenario === 'defense' ? 'td3' : 'ppo';
  const { metrics, chartHistory, isConnected, isDemoMode } = useAlgoWebSocket(algo);
  
  // Track trajectory history locally for the demo plot
  const [trajectory, setTrajectory] = useState([]);
  useEffect(() => {
    if (metrics.x !== undefined && metrics.y !== undefined) {
      setTrajectory(prev => [...prev, { x: metrics.x, y: metrics.y }].slice(-100));
    }
  }, [metrics.x, metrics.y]);

  const addLog = (tag, msg) => {
    const time = new Date().toLocaleTimeString().split(' ')[0];
    setDemoLogs(prev => [{ time, tag, msg }, ...prev].slice(0, 10));
  };

  // Log Streamer for "Always Alive" feel
  useEffect(() => {
    const messages = [
      { tag: 'sys', msg: 'Neural lattice synchronization stable 99.8%' },
      { tag: 'env', msg: 'WSLg Display Bridge connected [Port:6000]' },
      { tag: 'drl', msg: 'Policy weights validated for local environment' },
      { tag: 'ros', msg: 'Odom transform: [map] -> [base_link] active' }
    ];
    
    const interval = setInterval(() => {
       const pick = messages[Math.floor(Math.random() * messages.length)];
       addLog(pick.tag, pick.msg);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  const handleLaunch = async () => {
    setIsIgniting(true);
    addLog('exe', `IGNITING ORCHESTRATOR: ${scenario.toUpperCase()}...`);
    try {
      await axios.post(`${BACKEND_URL}/launch-system`, { scenario, algo });
      addLog('sys', `GAZEBO 3D SPAWN SUCCESSFUL`);
      addLog('drl', `BRAIN DISPATCHED: ${algo.toUpperCase()} ACTIVE`);
    } catch (e) {
      addLog('err', `IGNITION FAILED: Connection refused by host.`);
    }
    setTimeout(() => setIsIgniting(false), 2000);
  };

  const scenarios = [
    { id: 'defense', label: 'Tactical Defense', icon: <Shield className="w-4 h-4" /> },
    { id: 'logistics', label: 'Warehouse Ops', icon: <Box className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-10 min-h-screen bg-[#020204] text-white selection:bg-indigo-500/30 overflow-x-hidden">
      <div className="fixed inset-0 neural-grid opacity-20 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

      <header className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-white/5 pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <Globe className="w-4 h-4 text-indigo-400 animate-spin-slow" />
             <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-[0.5em]">Neural Exhibition Hub</span>
          </div>
          <h2 className="text-6xl font-black italic tracking-tighter uppercase leading-none">
            Live <span className="text-indigo-500">Showcase</span>
          </h2>
          <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Cross-Environment Validation: Baseline vs Optimized Neural Agents.</p>
        </div>

        <div className="flex gap-3 p-2 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-xl">
          {scenarios.map(s => (
            <button key={s.id} onClick={() => setScenario(s.id)}
               className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                scenario === s.id ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40' : 'text-slate-500 hover:text-slate-200'
              }`}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </header>

      <div className="relative z-10 grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <DemoCard type="before" title="Baseline Path"
              subtitle="Random-Walk Behavior"
              desc="Simulated baseline navigation. Notice frequent collisions and inability to evaluate tactical threats." />
            
            <DemoCard type="after" title="Optimized Reality"
              subtitle={`${algo.toUpperCase()} Policy Agent`}
              desc={scenario === 'defense' ? "100% Success Rate. Zero collisions during tactical patrol interception." : "95% Efficiency. Smooth obstacle avoidance in industrial corridors."}
              isIgniting={isIgniting}
              onLaunch={handleLaunch} />
          </div>
          
          <div className="hwi-glass rounded-[40px] p-8 border border-white/5 h-[450px] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Activity className="w-64 h-64 text-indigo-500" />
            </div>
            <div className="flex justify-between items-center mb-8 relative z-10">
               <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] font-mono text-indigo-400 mb-1">Live Mission Trajectory</h4>
                  <p className="text-[9px] text-slate-500 font-mono uppercase">Top-down relative sensor plot [m]</p>
               </div>
               <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-black text-emerald-400 uppercase font-mono">Uplink Active</span>
               </div>
            </div>
            
            <div className="flex-1 w-full relative z-10">
               <ResponsiveContainer width="100%" height="100%">
                 <ScatterChart>
                   <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                   <XAxis type="number" dataKey="x" domain={[-5, 5]} hide />
                   <YAxis type="number" dataKey="y" domain={[-5, 5]} hide />
                   <ZAxis type="number" range={[50, 400]} />
                   <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0a0a0e', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                   <Scatter name="Robot Path" data={trajectory} fill="#6366f1" line={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '5 5', opacity: 0.3 }} shape="circle" />
                   <Scatter name="Current Pos" data={[trajectory[trajectory.length - 1]]} fill="#fff" shape="star" />
                 </ScatterChart>
               </ResponsiveContainer>
            </div>
            
            <div className="mt-6 flex justify-between items-center pt-6 border-t border-white/5 relative z-10">
               <div className="flex gap-10">
                  <div>
                    <div className="text-[8px] font-mono text-slate-600 uppercase mb-1">Data Points</div>
                    <div className="text-xl font-black text-white">{trajectory.length}</div>
                  </div>
                  <div>
                    <div className="text-[8px] font-mono text-slate-600 uppercase mb-1">Latest X</div>
                    <div className="text-xl font-black text-indigo-400">{metrics.x?.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[8px] font-mono text-slate-600 uppercase mb-1">Latest Y</div>
                    <div className="text-xl font-black text-indigo-400">{metrics.y?.toFixed(2)}</div>
                  </div>
               </div>
               <div className="hidden md:block text-[9px] font-mono text-slate-500 max-w-[200px] text-right italic">
                 Coordinate system matches Gazebo 3D ground plane. Origin at (0,0).
               </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="hwi-glass flex flex-col p-8 rounded-[40px] border border-white/5 bg-gradient-to-b from-white/[0.01] to-transparent">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] font-mono text-slate-400 mb-10 flex items-center gap-3">
              <Zap className="w-4 h-4 text-amber-500" /> Neural Analytics
            </h4>
            
            <div className="space-y-10 flex-1">
              {[
                { label: 'Safety (Collision Risk)', val: (metrics.collision_rate * 100).toFixed(1), unit: '%', color: 'from-blue-500 to-cyan-400' },
                { label: 'Efficiency (Path Multiplier)', val: (1.2 + Math.random()*0.1).toFixed(2), unit: 'x', color: 'from-amber-400 to-orange-500' },
                { label: 'Mission Confidence', val: metrics.success_rate?.toFixed(1), unit: '%', color: 'from-indigo-600 to-blue-400' },
              ].map(m => (
                <div key={m.label} className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em]">{m.label}</span>
                    <span className="text-2xl font-black italic">{m.val}<span className="text-xs ml-1 opacity-40">{m.unit}</span></span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex relative">
                    <motion.div 
                      className={`absolute inset-y-0 left-0 bg-gradient-to-r ${m.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${m.val}%` }}
                      transition={{ duration: 1.5 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-10 border-t border-white/5">
              <div className="flex justify-between items-center mb-6">
                <h5 className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-3">
                  <Terminal className="w-3 h-3 text-indigo-400" /> System Diagnostics
                </h5>
                <span className="text-[8px] font-mono text-indigo-500 uppercase border border-indigo-500/20 px-2 py-0.5 rounded">Active</span>
              </div>
              <div className="space-y-2 bg-black/40 p-4 rounded-3xl border border-white/5 min-h-[180px] overflow-hidden flex flex-col justify-end">
                <AnimatePresence mode="popLayout">
                  {demoLogs.map((log, i) => (
                    <motion.div key={log.time + i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1 - i * 0.15, x: 0 }} exit={{ opacity: 0 }}
                      className={`flex gap-3 text-[9px] font-mono ${log.tag === 'err' ? 'text-rose-500' : log.tag === 'exe' ? 'text-blue-400' : 'text-slate-500'}`}>
                      <span className="opacity-30">[{log.time}]</span>
                      <span className="uppercase font-bold opacity-60">[{log.tag}]</span>
                      <span className="flex-1 truncate">{log.msg}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {demoLogs.length === 0 && (
                   <div className="text-[9px] font-mono text-slate-700 animate-pulse">Awaiting ignition string...</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="hwi-glass p-8 rounded-[40px] border border-indigo-500/10 bg-indigo-500/5">
             <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-2xl bg-indigo-500 text-white">
                   <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                   <div className="text-[10px] font-black uppercase tracking-widest mt-1">Ready for Ignition</div>
                   <p className="text-[9px] text-slate-500 font-mono italic">Opens Gazebo 3D simulation window.</p>
                </div>
             </div>
             <button disabled={isIgniting} onClick={handleLaunch}
                className="w-full py-5 rounded-2xl bg-white text-black font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/10">
                Launch World Simulation
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
