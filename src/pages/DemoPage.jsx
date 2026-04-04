import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, AlertCircle, ArrowRight, LayoutDashboard, Database, Box, CheckCircle2 } from 'lucide-react';
import SimulationReplay from '../components/SimulationReplay';

function DemoCard({ title, subtitle, desc, type }) {
  const isBefore = type === 'before';
  const imgSrc = isBefore ? '/baseline.png' : '/optimized.png';
  
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: isBefore ? 0 : 0.2 }} className="space-y-4">
      <div className={`aspect-video rounded-3xl border overflow-hidden relative cursor-pointer group transition-all duration-500 ${
        isBefore ? 'border-white/10 grayscale saturate-50 contrast-75' : 'border-cyan-500/30 hover:border-cyan-400/50 glow-cyan font-bold'
      }`}>
        <img 
          src={imgSrc} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
        <div className="absolute top-4 left-4 flex gap-1.5 z-10">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
        </div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 backdrop-blur-xl border border-white/20 transition-all group-hover:scale-110 ${
            isBefore ? 'bg-white/5 text-slate-400' : 'bg-cyan-500/20 text-cyan-400'
          }`}>
            {isBefore ? <AlertCircle className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </div>
          <span className="text-[10px] font-mono text-white/70 tracking-[0.3em] uppercase">{title}</span>
        </div>

        {!isBefore && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-md z-10">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse glow-dot" />
            <span className="text-[9px] text-cyan-300 font-bold uppercase tracking-wider">Optimized Policy Active</span>
          </div>
        )}
      </div>
      <div className="px-1">
        <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-tight">{subtitle}</h4>
        <p className="text-xs text-slate-500 leading-relaxed max-w-[95%]">{desc}</p>
      </div>
    </motion.div>
  );
}

export default function DemoPage() {
  const [scenario, setScenario] = useState('warehouse');

  const scenarios = [
    { id: 'warehouse', label: 'Warehouse Log', icon: <Box className="w-4 h-4" /> },
    { id: 'office', label: 'Office Floor', icon: <Box className="w-4 h-4" /> },
    { id: 'hospital', label: 'Hospital Hall', icon: <Box className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-[0.3em] block mb-2">Demonstration Suite</span>
          <h2 className="text-3xl font-black text-white">Before vs After Training</h2>
          <p className="text-sm text-slate-500 mt-1">Telemetry-based visualization of baseline vs. optimized PPO navigation.</p>
        </div>

        
        {/* Scenario Selector */}
        <div className="flex gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
          {scenarios.map(s => (
            <button
              key={s.id}
              onClick={() => setScenario(s.id)}
               className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                scenario === s.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-7 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <DemoCard type="before" title="Baseline Path"
              subtitle="Random-Walk Baseline"
              desc="Pre-coordinated telemetry shows frequent collisions and non-goal-oriented navigation failure." />
            <DemoCard type="after" title="PPO Path"
              subtitle="Optimized weights"
              desc="After real-time PPO convergence, the agent achieves smooth, obstacle-aware navigation." />

          </div>
          
          <SimulationReplay />
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-8">
          <div className="glass-card h-full flex flex-col p-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-300 mb-6 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" /> Metric Differential
            </h4>
            
            <div className="space-y-6 flex-1">
              {[
                { label: 'Safety (Collision %)', before: 78, after: 4, unit: '%', inverse: true },
                { label: 'Efficiency (Avg Path)', before: 12.4, after: 3.2, unit: 'm', inverse: true },
                { label: 'Success (Goal Reach)', before: 12, after: 98, unit: '%' },
              ].map(m => (
                <div key={m.label} className="space-y-2">
                  <div className="flex justify-between text-[11px] font-mono text-slate-500 uppercase">
                    <span>{m.label}</span>
                    <span className="text-indigo-400 font-bold">{m.after}{m.unit}</span>
                  </div>
                  <div className="h-6 w-full bg-slate-900 rounded-lg overflow-hidden flex relative border border-white/5">
                    <div className="absolute top-1 bottom-1 left-1.5 w-1 rounded-full bg-rose-500 opacity-40" />
                    <div className="absolute top-1 bottom-1 left-3 w-1 rounded-full bg-indigo-500" />
                    <motion.div 
                      className="absolute inset-y-0 left-0 bg-indigo-500/20"
                      initial={{ width: 0 }}
                      animate={{ width: `${m.after}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
              <h5 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">Pipeline Status</h5>
              <div className="space-y-2">
                {['Agent Weights Updated', 'JSON-Traj Stream: OK', 'Policy Converged'].map(s => (
                  <div key={s} className="flex items-center gap-2 text-[10px] text-emerald-400/80">
                    <CheckCircle2 className="w-3 h-3" /> {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
