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
  ChevronRight, Terminal, Globe, Cpu, AlertTriangle, Monitor, Radio
} from 'lucide-react';

const SCENARIOS = [
  { 
    id: 'defense', 
    name: 'Tactical Defense', 
    icon: <Shield className="w-5 h-5" />, 
    algo: 'TD3', 
    success: '100%', 
    collision: '0%', 
    episodes: 1000,
    desc: 'Autonomous patrol and intruder interception using Twin Delayed DDPG.',
    color: 'from-blue-600 to-indigo-600',
    world: 'tactical_world'
  },
  { 
    id: 'logistics', 
    name: 'Warehouse Logistics', 
    icon: <Package className="w-5 h-5" />, 
    algo: 'PPO', 
    success: '94%', 
    collision: '2%', 
    episodes: 500,
    desc: 'Dynamic obstacle avoidance in narrow industrial corridors.',
    color: 'from-emerald-600 to-teal-600',
    world: 'warehouse_v2'
  }
];

export default function DashboardPage() {
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0]);
  const [algo, setAlgo] = useState(SCENARIOS[0].algo.toLowerCase());
  
  const { metrics, chartHistory: liveHistory, isConnected, isDemoMode } = useAlgoWebSocket(algo);
  
  // Pre-seed history for "Alive" looks
  const [chartHistory, setChartHistory] = useState([]);
  
  useEffect(() => {
    if (liveHistory.length > 0) {
      setChartHistory(liveHistory);
    } else if (chartHistory.length === 0) {
      // Create initial 40 points of static-ish data for immediate display
      const initial = Array.from({ length: 40 }).map((_, i) => ({
        time: i,
        reward: 30 + Math.random() * 10,
        avg: 25,
        v_value: 0, a_linear: 0, a_angular: 0
      }));
      setChartHistory(initial);
    }
  }, [liveHistory]);
  
  const [logs, setLogs] = useState([]);
  const [isLaunching, setIsLaunching] = useState(false);

  const addLog = (tag, msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ time, tag, msg }, ...prev].slice(0, 50));
  };

  const handleLaunch = async () => {
    setIsLaunching(true);
    addLog('exe', `INITIATING IGNITION: ${activeScenario.name} [${algo.toUpperCase()}]`);
    try {
      await axios.post(`${BACKEND_URL}/launch-system`, { 
        algo: algo,
        scenario: activeScenario.id
      });
      addLog('drl', `BRAIN LOADED: Policy optimized for ${activeScenario.world}`);
    } catch (err) {
      addLog('err', `IGNITION FAILED: ${err.message}`);
    }
    setIsLaunching(false);
  };

  return (
    <div className="min-h-screen bg-[#020204] text-white p-6 lg:p-10 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <div className="fixed inset-0 neural-grid opacity-20 pointer-events-none" />
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 z-50" />

      <header className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 border-b border-white/5 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-blue-400 font-mono text-[10px] tracking-[0.3em] uppercase">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Neural Pathfinder OS // v2.0-Alpha
          </div>
          <h1 className="text-5xl font-black tracking-tighter italic uppercase">
            Tactical <span className="text-blue-500">Control</span> Center
          </h1>
        </div>

        <div className="flex items-center gap-4 hwi-glass p-2 rounded-2xl border border-white/5">
          {isDemoMode && (
            <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center gap-2 animate-pulse">
               <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
               <span className="text-[9px] font-black uppercase tracking-widest font-mono">Sim_Playback</span>
            </div>
          )}
          <div className={`px-4 py-2 rounded-xl flex items-center gap-3 border transition-all ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
            <Globe className={`w-3 h-3 ${isConnected ? 'animate-spin-slow' : ''}`} />
            <span className="text-[10px] font-bold tracking-widest font-mono uppercase">
              {isConnected ? 'ENGINE_ONLINE' : 'LINK_OFFLINE'}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-white/10" />
          <div className="flex bg-black/40 p-1 rounded-xl">
            {['ppo', 'td3'].map(a => (
              <button key={a} onClick={() => setAlgo(a)}
                className={`px-5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${algo === a ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
                {a.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="relative z-10 grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest ml-2">Active Mission Scenarios</label>
            <div className="space-y-4">
              {SCENARIOS.map(s => (
                <motion.div key={s.id} onClick={() => { setActiveScenario(s); setAlgo(s.algo.toLowerCase()); }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className={`cursor-pointer group relative overflow-hidden hwi-glass rounded-[32px] p-6 border transition-all duration-500 ${activeScenario.id === s.id ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/5 hover:border-white/10'}`}>
                  
                  {activeScenario.id === s.id && (
                    <motion.div layoutId="mission-indicator" className="absolute -left-1 top-6 bottom-6 w-1 rounded-full bg-blue-500 shadow-[0_0_15px_#3b82f6]" />
                  )}

                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg`}>
                      {s.icon}
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-slate-500 uppercase">Success Rate</div>
                      <div className={`text-xl font-black ${s.id === 'defense' ? 'text-blue-400' : 'text-emerald-400'}`}>{s.success}</div>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{s.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-6 italic">"{s.desc}"</p>

                  <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-4">
                    <div>
                      <div className="text-[8px] font-mono text-slate-600 uppercase">Algorithm</div>
                      <div className="text-[10px] font-bold uppercase">{s.algo}</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-mono text-slate-600 uppercase">Episodes</div>
                      <div className="text-[10px] font-bold">{s.episodes}</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-mono text-slate-600 uppercase">Collision</div>
                      <div className="text-[10px] font-bold text-rose-500">{s.collision}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 hwi-glass rounded-[32px] p-8 border border-white/10 bg-gradient-to-r from-blue-500/10 to-transparent relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Radio className="w-32 h-32 text-blue-500" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-sm font-mono font-bold text-blue-400 uppercase tracking-[0.3em] mb-2">Global Ignition Engine</h3>
                  <h2 className="text-3xl font-black italic uppercase leading-none mb-4">Launch <span className="text-white/40">Simulation</span></h2>
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                      <Monitor className="w-3 h-3 text-blue-400" />
                      <span className="text-[8px] font-bold text-blue-300 font-mono uppercase tracking-widest leading-none">GAZEBO 3D READY</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono leading-relaxed max-w-sm font-bold">
                    Triggers the full orchestration sequence: ROS2 environment setup, turtlebot3 spawning, and 3D visualizer.
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <button disabled={isLaunching} onClick={handleLaunch}
                    className={`w-full md:w-auto px-10 py-6 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 relative overflow-hidden group ${isConnected ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/30' : 'bg-blue-600 text-white shadow-2xl shadow-blue-500/40 hover:scale-[1.05] active:scale-95'}`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <span className="relative z-10 flex items-center justify-center gap-4">
                      {isLaunching ? <Activity className="w-5 h-5 animate-spin" /> : (isConnected ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />)}
                      {isLaunching ? 'BOOTING...' : isConnected ? 'ABORT GAZEBO' : 'IGNITE GAZEBO'}
                    </span>
                  </button>
                  <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-3 opacity-60">Opens external 3D window</div>
                </div>
              </div>
            </div>

            <div className="hwi-glass rounded-[32px] p-6 border border-white/5 flex flex-col justify-between bg-white/[0.01]">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                  <Layers className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-right">
                  <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest leading-none mb-1">Environment</div>
                  <div className="text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-tighter">WSLG_ACTIVE</div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-black text-white/80 uppercase tracking-tight">{activeScenario.world}</div>
                <div className="text-[9px] text-slate-500 font-mono uppercase tracking-widest leading-none">Bridged to Backend</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Cumulative Reward', val: metrics.reward.toFixed(2), icon: <Zap className="w-4 h-4 text-emerald-400" />, unit: 'pts' },
              { label: 'Average Reward', val: metrics.avg_reward.toFixed(2), icon: <Target className="w-4 h-4 text-blue-400" />, unit: 'pts' },
              { label: 'Global Steps', val: metrics.steps, icon: <Activity className="w-4 h-4 text-amber-400" />, unit: 'stp' },
              { label: 'Collision Risk', val: (metrics.collision_rate * 100).toFixed(2), icon: <AlertTriangle className="w-4 h-4 text-rose-500" />, unit: '%' },
            ].map((m, i) => (
              <div key={i} className="hwi-glass p-6 rounded-[28px] border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-white/[0.03]">{m.icon}</div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest leading-none">{m.label}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight">{m.val}</span>
                  <span className="text-[10px] font-mono text-slate-600 uppercase">{m.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="hwi-glass rounded-[32px] p-8 h-[350px] border border-white/5 flex flex-col">
              <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-3">
                <Target className="w-3 h-3 text-blue-400" />
                Policy HUD [Action Output]
              </h4>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartHistory}>
                    <defs>
                      <linearGradient id="gLin" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/><stop offset="95%" stopColor="#818cf8" stopOpacity={0}/></linearGradient>
                      <linearGradient id="gAng" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f472b6" stopOpacity={0.3}/><stop offset="95%" stopColor="#f472b6" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={[-1.2, 1.2]} />
                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="a_linear" stroke="#818cf8" fill="url(#gLin)" strokeWidth={2} isAnimationActive={false} />
                    <Area type="monotone" dataKey="a_angular" stroke="#f472b6" fill="url(#gAng)" strokeWidth={2} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="hwi-glass rounded-[32px] p-8 h-[350px] border border-white/5 flex flex-col">
              <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-3">
                <Zap className="w-3 h-3 text-amber-400" />
                Critic HUD [Approximation]
              </h4>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartHistory}>
                    <defs>
                      <linearGradient id="gVal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#facc15" stopOpacity={0.3}/><stop offset="95%" stopColor="#facc15" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }} />
                    <Area type="monotone" dataKey={algo === 'ppo' ? 'v_value' : 'q_value'} stroke="#facc15" fill="url(#gVal)" strokeWidth={2} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="hwi-glass rounded-[32px] p-8 h-[350px] border border-white/5 overflow-hidden flex flex-col">
              <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-3">
                <Globe className="w-3 h-3 text-blue-500" />
                Live Sensor Topology [LiDAR]
              </h4>
              <div className="flex-1 flex items-center justify-center bg-black/40 rounded-3xl border border-white/5 relative overflow-hidden">
                <RadarView telemetry={metrics} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
              </div>
            </div>

            <div className="hwi-glass rounded-[32px] p-8 h-[350px] border border-white/5 flex flex-col">
              <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-3">
                <Activity className="w-3 h-3 text-emerald-500" />
                Neural Performance Curve
              </h4>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartHistory}>
                    <defs>
                      <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                      <linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="reward" stroke="#3b82f6" fill="url(#gBlue)" strokeWidth={2} isAnimationActive={false} />
                    <Area type="monotone" dataKey="avg" stroke="#10b981" fill="url(#gGreen)" strokeWidth={2} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="hwi-glass rounded-[32px] p-8 border border-white/5">
            <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-3">
              <Terminal className="w-3 h-3 text-blue-500" />
              Real-time Neural Telemetry
            </h4>
            <div className="space-y-3 max-h-[160px] overflow-y-auto custom-scrollbar pr-4">
              <AnimatePresence initial={false}>
                {logs.map((log, i) => (
                  <motion.div key={log.time + i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border-l-2 border-white/10 text-[10px] font-mono ${log.tag === 'err' ? 'border-rose-500 bg-rose-500/5 text-rose-400' : log.tag === 'exe' ? 'border-blue-500 bg-blue-500/5 text-blue-400' : 'text-slate-400'}`}>
                    <span className="opacity-30">[{log.time}]</span>
                    <span className="uppercase font-bold tracking-tighter opacity-70">[{log.tag}]</span>
                    <span className="flex-1">{log.msg}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
