import React, { useState } from 'react';
import axios from 'axios';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import RadarView from '../components/RadarView';
import NeuralNetworkView from '../components/NeuralNetworkView';
import { BACKEND_URL } from '../utils';
import { useAlgoWebSocket } from '../hooks/useAlgoWebSocket';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Square, Shield, Package, Zap, Activity, Target, 
  Terminal, Globe, Cpu, AlertTriangle, Radio, BrainCircuit
} from 'lucide-react';

const MISSIONS = [
  { 
    id: 'defense', 
    name: 'Neural Defense', 
    icon: <Shield className="w-5 h-5" />, 
    algo: 'TD3', 
    success: '100%', 
    collision: '0%', 
    episodes: 1000,
    world: 'Industrial_Complex',
    tech: 'Actor-Critic / SAC / TD3'
  },
  { 
    id: 'logistics', 
    name: 'Warehouse Fleet', 
    icon: <Package className="w-5 h-5" />, 
    algo: 'PPO', 
    success: '94.2%', 
    collision: '1.5%', 
    episodes: 500,
    world: 'LogisticsHUB_V3',
    tech: 'Stochastic Policy / C-PPO'
  }
];

export default function NeuralPage() {
  const [activeMission, setActiveMission] = useState(MISSIONS[0]);
  const [algo, setAlgo] = useState(MISSIONS[0].algo.toLowerCase());
  
  const { metrics, chartHistory, isConnected } = useAlgoWebSocket(algo);
  
  const [logs, setLogs] = useState([]);
  const [isIgniting, setIsIgniting] = useState(false);

  const addLog = (tag, msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ time, tag, msg }, ...prev].slice(0, 30));
  };

  const handleIgnition = async () => {
    setIsIgniting(true);
    addLog('exe', `DISPATCHING MISSION: ${activeMission.name} [${algo.toUpperCase()}]`);
    try {
      await axios.post(`${BACKEND_URL}/launch-system`, { 
        algo: algo 
      });
      addLog('drl', `BRAIN LOADED: Weights synchronized for ${activeMission.world}`);
    } catch (err) {
      addLog('err', `UPLINK FAILURE: ${err.message}`);
    }
    setIsIgniting(false);
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white p-6 lg:p-10 selection:bg-indigo-500/30">
      <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="fixed top-20 left-1/4 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse-slow pointer-events-none" />

      <header className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 border-b border-white/5 pb-8">
        <div>
           <div className="flex items-center gap-3 mb-2 text-indigo-400 font-mono text-[10px] tracking-[0.4em] uppercase">
             <BrainCircuit className="w-4 h-4 animate-pulse" />
             Neural Architecture interface // HUB.NEURAL
           </div>
           <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">
             B-PRODIGY <span className="text-indigo-500">IGNITION</span>
           </h1>
        </div>
        
        <div className="flex flex-wrap items-center justify-end gap-6 text-[10px] font-mono tracking-widest text-slate-500">
           <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-rose-500 animate-pulse'}`} />
              {isConnected ? 'SYNC_STABLE' : 'SYNC_LOST'}
           </div>
           <div className="w-[1px] h-8 bg-white/10" />
           <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            {['ppo', 'td3'].map(a => (
              <button key={a} onClick={() => { setAlgo(a); setActiveMission(MISSIONS.find(m => m.algo.toLowerCase() === a)); }}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${algo === a ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
                {a.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="relative z-10 grid grid-cols-12 gap-8">
        {/* LEFT: MISSION CONTROL */}
        <section className="col-span-12 lg:col-span-4 space-y-8">
          <div className="space-y-4">
             <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.3em] ml-2">Active Architecture</h3>
             <div className="hwi-glass p-8 rounded-[40px] border border-white/5">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <Cpu className="w-6 h-6" />
                   </div>
                   <div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Model Engine</div>
                      <div className="text-xl font-black">{algo.toUpperCase()} Agent</div>
                   </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed italic mb-8">
                  "Dense multi-layer perceptron with Adam optimization, utilizing 24-point spatial inputs and continuous policy outputs."
                </p>
                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                   <div>
                      <div className="text-[8px] font-mono text-slate-600 uppercase">Input Shape</div>
                      <div className="text-xs font-bold text-white">(24,)</div>
                   </div>
                   <div>
                      <div className="text-[8px] font-mono text-slate-600 uppercase">Hidden Units</div>
                      <div className="text-xs font-bold text-white">256 x 2</div>
                   </div>
                </div>
             </div>
          </div>

          <div className="hwi-glass p-8 rounded-[40px] border border-white/5 space-y-6">
             <button disabled={isIgniting} onClick={handleIgnition}
               className={`w-full py-6 rounded-3xl font-black text-sm uppercase tracking-[0.2em] transition-all duration-300 group shadow-lg ${isConnected ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30' : 'bg-indigo-600 text-white shadow-indigo-500/30 hover:scale-105 active:scale-95'}`}>
               <span className="flex items-center justify-center gap-3">
                 {isIgniting ? <Cpu className="w-5 h-5 animate-spin" /> : isConnected ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                 {isIgniting ? 'RE-SYNCING...' : isConnected ? 'HALT MISSION' : 'NEURAL IGNITION'}
               </span>
             </button>
          </div>
        </section>

        {/* RIGHT: MODEL VISUALIZATION */}
        <section className="col-span-12 lg:col-span-8 space-y-8">
           <div className="hwi-glass p-8 rounded-[40px] border border-white/5 h-[500px] flex flex-col relative overflow-hidden">
              <h3 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.4em] mb-4">Deep Neural Approximation Diagram</h3>
              <div className="flex-1">
                 <NeuralNetworkView metrics={metrics} />
              </div>
              <div className="absolute bottom-8 right-8 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                 <span className="text-[9px] font-mono text-slate-600 uppercase">Real-time Inference</span>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="hwi-glass p-8 rounded-[40px] border border-white/5 min-h-[350px] flex flex-col">
                 <h3 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.4em] mb-8">Spatial Topology [LiDAR]</h3>
                 <div className="flex-1 rounded-3xl bg-black/40 border border-white/5 relative overflow-hidden flex items-center justify-center">
                    <RadarView telemetry={metrics} />
                 </div>
              </div>

              <div className="hwi-glass p-8 rounded-[40px] border border-white/5 min-h-[350px] flex flex-col">
                 <h3 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.4em] mb-8">Convergence Curve</h3>
                 <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={chartHistory}>
                          <defs>
                             <linearGradient id="gInd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis dataKey="time" hide />
                          <Tooltip contentStyle={{ backgroundColor: '#0a0a0e', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '10px' }} />
                          <Area type="monotone" dataKey="reward" stroke="#6366f1" strokeWidth={3} fill="url(#gInd)" isAnimationActive={false} />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
}
