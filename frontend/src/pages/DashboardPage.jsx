import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import RadarView from '../components/RadarView';
import { BACKEND_URL } from '../utils';
import { useAlgoWebSocket } from '../hooks/useAlgoWebSocket';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Square, Shield, Package, Zap, Activity, Target, Layers, 
  Terminal, Globe, Monitor, Radio, AlertTriangle
} from 'lucide-react';

const SCENARIOS = [
  { 
    id: 'defense', 
    name: 'Tactical Defense', 
    icon: <Shield className="w-5 h-5" />, 
    algo: 'TD3', 
    desc: 'Twin Delayed DDPG policy for tactical interception.',
    color: 'from-blue-600 to-indigo-600',
    world: 'tactical_world'
  },
  { 
    id: 'logistics', 
    name: 'Warehouse Logistics', 
    icon: <Package className="w-5 h-5" />, 
    algo: 'PPO', 
    desc: 'Proximal Policy Optimization for industrial navigation.',
    color: 'from-emerald-600 to-teal-600',
    world: 'warehouse_v2'
  }
];

export default function DashboardPage() {
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0]);
  const [selectedAlgo, setSelectedAlgo] = useState(SCENARIOS[0].algo.toLowerCase());
  const [isLaunching, setIsLaunching] = useState(false);
  const [logs, setLogs] = useState([]);

  // Controlled Hook
  const { metrics, chartHistory, isConnected, isSystemActive } = useAlgoWebSocket();

  const addLog = (tag, msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ time, tag, msg }, ...prev].slice(0, 50));
  };

  const handleLaunch = async () => {
    if (isSystemActive) return;
    setIsLaunching(true);
    addLog('exe', `STARTING ENGINE: ${selectedAlgo.toUpperCase()}...`);
    try {
      const res = await axios.post(`${BACKEND_URL}/launch`, { 
        algo: selectedAlgo
      });
      if (res.data.status === 'started') {
          addLog('sys', `GAZEBO INITIALIZED. SPAWNING ROBOT...`);
          // Countdown is handled by backend wait, but we can log progress
      }
    } catch (err) {
      addLog('err', `LAUNCH FAILED: ${err.message}`);
    }
    setIsLaunching(false);
  };

  const handleAbort = async () => {
    addLog('warn', `ABORT SEQUENCE TRIPPED. SHUTTING DOWN...`);
    try {
      await axios.post(`${BACKEND_URL}/abort`);
      addLog('sys', `SYSTEM TERMINATED. PROCESSES KILLED.`);
    } catch (err) {
      addLog('err', `ABORT FAILED: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#020204] text-white p-6 lg:p-10 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <div className="fixed inset-0 neural-grid opacity-20 pointer-events-none" />
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 z-50" />

      <header className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 border-b border-white/5 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-blue-400 font-mono text-[10px] tracking-[0.3em] uppercase">
            <span className={`flex h-2 w-2 rounded-full ${isSystemActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
            Neural Pathfinder OS // v2.0-Alpha
          </div>
          <h1 className="text-5xl font-black tracking-tighter italic uppercase">
            Tactical <span className="text-blue-500">Control</span> Center
          </h1>
        </div>

        <div className="flex items-center gap-4 hwi-glass p-2 rounded-2xl border border-white/5">
          <div className={`px-4 py-2 rounded-xl flex items-center gap-3 border transition-all ${isSystemActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>
            <Globe className={`w-3 h-3 ${isSystemActive ? 'animate-spin-slow' : ''}`} />
            <span className="text-[10px] font-bold tracking-widest font-mono uppercase">
              {isSystemActive ? 'ENGINE_ONLINE' : 'ENGINE_OFFLINE'}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-white/10" />
          <div className="flex bg-black/40 p-1 rounded-xl">
            {['ppo', 'td3'].map(a => (
              <button key={a} onClick={() => setSelectedAlgo(a)} disabled={isSystemActive}
                className={`px-5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${selectedAlgo === a ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                {a.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="relative z-10 grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest ml-2">Mission Configuration</label>
            <div className="space-y-4">
              {SCENARIOS.map(s => (
                <div key={s.id} onClick={() => !isSystemActive && (setActiveScenario(s), setSelectedAlgo(s.algo.toLowerCase()))}
                  className={`group relative overflow-hidden hwi-glass rounded-[32px] p-6 border transition-all duration-500 ${activeScenario.id === s.id ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/5 opacity-50'} ${!isSystemActive ? 'cursor-pointer hover:border-white/10' : 'cursor-not-allowed'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg`}>
                      {s.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{s.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-6 italic">"{s.desc}"</p>
                  <div className="text-[8px] font-mono text-slate-600 uppercase">Hardware Mount: {s.world}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 hwi-glass rounded-[40px] p-8 border border-white/10 bg-gradient-to-r from-blue-500/10 to-transparent relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Radio className="w-32 h-32 text-blue-500" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-sm font-mono font-bold text-blue-400 uppercase tracking-[0.3em] mb-2">Global Simulation Controller</h3>
                  <h2 className="text-3xl font-black italic uppercase leading-none mb-4">{isSystemActive ? 'Simulation' : 'Launch'} <span className="text-white/40">{isSystemActive ? 'Running' : 'Ready'}</span></h2>
                  <p className="text-[10px] text-slate-500 font-mono leading-relaxed max-w-sm font-bold">
                    Independent process management across Gazebo Classic and DRL agent orchestration.
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  {!isSystemActive ? (
                    <button disabled={isLaunching} onClick={handleLaunch}
                      className={`w-full md:w-auto px-10 py-6 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] transition-all bg-blue-600 text-white shadow-2xl shadow-blue-500/40 hover:scale-[1.05] active:scale-95`}>
                      <span className="relative z-10 flex items-center justify-center gap-4">
                        {isLaunching ? <Activity className="w-5 h-5 animate-spin" /> : <Play className="w-4 h-4" />}
                        {isLaunching ? 'IGNITION...' : 'LAUNCH SIMULATION'}
                      </span>
                    </button>
                  ) : (
                    <button onClick={handleAbort}
                      className="w-full md:w-auto px-12 py-6 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] transition-all bg-rose-600 text-white shadow-2xl shadow-rose-600/40 hover:scale-[1.05] active:scale-95">
                      <span className="relative z-10 flex items-center justify-center gap-4">
                        <Square className="w-4 h-4" /> ABORT MISSION
                      </span>
                    </button>
                  )}
                  <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-3 opacity-60">Status: {isSystemActive ? 'ACTIVE' : 'IDLE'}</div>
                </div>
              </div>
            </div>

            <div className="hwi-glass rounded-[40px] p-6 border border-white/5 flex flex-col justify-between bg-white/[0.01]">
                <div className="px-5 py-5 h-full flex flex-col justify-center text-center">
                   <Monitor className={`w-8 h-8 mx-auto mb-4 ${isSystemActive ? 'text-emerald-400' : 'text-slate-700'}`} />
                   <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Environment</div>
                   <div className={`text-xs font-black uppercase ${isSystemActive ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {isSystemActive ? 'GAZEBO_ACTIVE' : 'STANDBY'}
                   </div>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Cumulative Reward', val: metrics.reward.toFixed(2), icon: <Zap className="w-4 h-4 text-emerald-400" /> },
              { label: 'Collision Risk', val: (metrics.collision_rate * 100).toFixed(2), icon: <AlertTriangle className="w-4 h-4 text-rose-500" /> },
              { label: 'Global Steps', val: metrics.steps, icon: <Activity className="w-4 h-4 text-amber-400" /> },
              { label: 'Neural Status', val: isSystemActive ? 'SYNCED' : 'OFFLINE', icon: <Globe className="w-4 h-4 text-blue-400" /> },
            ].map((m, i) => (
              <div key={i} className="hwi-glass p-6 rounded-[28px] border border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-white/[0.03]">{m.icon}</div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest leading-none">{m.label}</span>
                </div>
                <div className="text-3xl font-black tracking-tight">{m.val}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="hwi-glass rounded-[40px] p-8 h-[350px] border border-white/5 flex flex-col">
              <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-3">
                <Target className="w-3 h-3 text-blue-400" />
                Live Sensor Topology [LiDAR]
              </h4>
              <div className="flex-1 flex items-center justify-center bg-black/40 rounded-[32px] border border-white/5 relative overflow-hidden">
                <RadarView telemetry={metrics} />
                {!isSystemActive && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    Awaiting Simulation...
                  </div>
                )}
              </div>
            </div>

            <div className="hwi-glass rounded-[40px] p-8 h-[350px] border border-white/5 flex flex-col">
              <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-3">
                <Activity className="w-3 h-3 text-emerald-500" />
                Neural Performance Curve
              </h4>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis hide />
                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="reward" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="hwi-glass rounded-[40px] p-8 border border-white/5">
            <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-3">
              <Terminal className="w-3 h-3 text-blue-500" />
              Machine Stream Log
            </h4>
            <div className="space-y-3 max-h-[160px] overflow-y-auto custom-scrollbar pr-4 text-[10px] font-mono">
                <AnimatePresence initial={false}>
                  {logs.map((log, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                       <span className="opacity-30">[{log.time}]</span> [{log.tag.toUpperCase()}] {log.msg}
                    </motion.div>
                  ))}
                  {logs.length === 0 && <div className="opacity-20 uppercase tracking-widest">Awaiting Control Command...</div>}
                </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
