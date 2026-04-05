import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, AlertCircle, Cpu, Database, Box, CheckCircle2, Shield, Rocket } from 'lucide-react';
import SimulationReplay from '../components/SimulationReplay';
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
        
        {/* Placeholder for actual visual / image if any */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent opacity-80" />
        
        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
        />

        {/* Central Icon Button */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
          <button 
            disabled={isIgniting}
            onClick={!isBefore ? onLaunch : undefined}
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all ${
              isBefore ? 'bg-white/5 text-slate-400 cursor-not-allowed' : 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 hover:scale-110 cursor-pointer active:scale-95'
            }`}>
            {isBefore ? <AlertCircle className="w-8 h-8" /> : (isIgniting ? <Cpu className="w-8 h-8 animate-spin" /> : <Play className="w-8 h-8 ml-1" />)}
          </button>
          <span className={`text-[10px] font-mono tracking-[0.3em] uppercase ${isBefore ? 'text-white/50' : 'text-indigo-300'}`}>
            {title}
          </span>
          {!isBefore && (
              <span className="text-xs text-white/70 mt-2">Click to Ignite Interactive Showcase</span>
          )}
        </div>

        {!isBefore && (
          <div className="absolute bottom-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md z-10">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse glow-dot" />
            <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider">Optimized Policy Target</span>
          </div>
        )}
      </div>
      <div className="px-2">
        <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-tight">{subtitle}</h4>
        <p className="text-xs text-slate-500 leading-relaxed max-w-[95%]">{desc}</p>
      </div>
    </motion.div>
  );
}

export default function DemoPage() {
  const [scenario, setScenario] = useState('defense');
  const [isIgniting, setIsIgniting] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
      setLogs(prev => [msg, ...prev].slice(0, 5));
  };

  const handleLaunch = async () => {
      setIsIgniting(true);
      addLog(`INIT: Dispatching ${scenario} scenario...`);
      try {
          const algo = scenario === 'defense' ? 'td3' : 'ppo';
          await axios.post(`${BACKEND_URL}/launch-system`, { scenario, algo });
          addLog(`SUCCESS: Engine started for ${scenario} [${algo.toUpperCase()}]`);
      } catch (e) {
          addLog(`ERROR: Failed to launch engine.`);
      }
      setIsIgniting(false);
  };

  const scenarios = [
    { id: 'defense', label: 'Tactical Defense Ops', icon: <Shield className="w-4 h-4" /> },
    { id: 'logistics', label: 'Warehouse Logistics', icon: <Box className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-[1500px] mx-auto space-y-10 min-h-screen bg-[#050508] selection:bg-indigo-500/30">
      {/* Background effects */}
      <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <Rocket className="w-4 h-4 text-indigo-400" />
             <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-[0.4em]">Interactive Showcase</span>
          </div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Project <span className="text-indigo-500">Exhibition</span></h2>
          <p className="text-xs text-slate-500 mt-2 font-mono tracking-widest uppercase">Compare baseline random-walks directly against our optimized neural policies.</p>
        </div>

        {/* Scenario Selector */}
        <div className="flex gap-2 p-1.5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
          {scenarios.map(s => (
            <button
              key={s.id}
              onClick={() => setScenario(s.id)}
               className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
                scenario === s.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-12 gap-8">
        {/* Left Column: Visual Comparisons */}
        <div className="col-span-12 lg:col-span-7 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <DemoCard type="before" title="Baseline Path"
              subtitle="Random-Walk Behavior"
              desc="Simulated baseline. Notice frequent collisions and inability to navigate complex corridors without optimization." />
            
            <DemoCard 
              type="after" 
              title="Optimized Reality"
              subtitle={`${scenario === 'defense' ? 'TD3' : 'PPO'} Neural Policy`}
              desc={scenario === 'defense' ? "100% Success Rate. Zero collisions during tactical patrol interception." : "94% Success Rate. Smooth dynamic obstacle avoidance in tight spaces."}
              isIgniting={isIgniting}
              onLaunch={handleLaunch}
            />
          </div>
          
          <SimulationReplay />
        </div>

        {/* Right Column: Metrics & Integrity */}
        <div className="col-span-12 lg:col-span-5 space-y-8">
          <div className="hwi-glass flex flex-col p-8 rounded-[40px] border border-white/5">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] font-mono text-slate-400 mb-8 flex items-center gap-3">
              <Database className="w-4 h-4 text-indigo-400" /> Performance Differential
            </h4>
            
            <div className="space-y-8 flex-1">
              {[
                { label: 'Safety (Collision Risk)', before: 78, after: scenario === 'defense' ? 0 : 2, unit: '%', inverse: true },
                { label: 'Efficiency (Avg Path Nav)', before: 12.4, after: 3.2, unit: 'm', inverse: true },
                { label: 'Mission Success Rate', before: 12, after: scenario === 'defense' ? 100 : 94.2, unit: '%' },
              ].map(m => (
                <div key={m.label} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{m.label}</span>
                    <span className="text-xl font-black text-indigo-400">{m.after}<span className="text-sm">{m.unit}</span></span>
                  </div>
                  <div className="h-4 w-full bg-slate-900/50 rounded-full overflow-hidden flex relative border border-white/5">
                    {/* Baseline marker */}
                    <div className="absolute top-0 bottom-0 z-20 w-1 bg-rose-500" style={{ left: `${m.before}%` }}>
                        <div className="absolute -top-4 -translate-x-1/2 text-[8px] text-rose-500 font-mono">BASE</div>
                    </div>
                    
                    <motion.div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 to-indigo-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${m.after}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-white/5">
              <h5 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-6 border-l-2 border-indigo-500 pl-3">Live Integration Logs</h5>
              <div className="space-y-3">
                  {logs.length === 0 ? (
                      <div className="text-[10px] text-slate-600 font-mono italic">Waiting for ignition sequence...</div>
                  ) : (
                      logs.map((log, i) => (
                          <div key={i} className="flex items-start gap-2 text-[10px] font-mono text-emerald-400/80 bg-emerald-500/5 p-2 rounded border border-emerald-500/10">
                            <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" /> 
                            <span>{log}</span>
                          </div>
                      ))
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
