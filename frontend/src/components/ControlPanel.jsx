import React from 'react';
import { motion } from 'framer-motion';
import { Play, Square, RefreshCcw, AlertCircle, ChevronRight, Activity, Zap, Settings } from 'lucide-react';
import { cn } from '../utils';

function StatusCard({ title, isActive, icon, color }) {
  const colors = {
    indigo: 'from-indigo-500/20 text-indigo-400 border-indigo-500/30',
    cyan: 'from-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };
  return (
    <div className={cn("p-5 rounded-3xl border bg-gradient-to-tr via-slate-900/40 to-slate-900/60 transition-all duration-500 backdrop-blur-md", isActive ? colors[color] : 'border-white/5 text-slate-500')}>
      <div className="flex items-center gap-3 mb-2">
        {isActive ? <div className="animate-pulse">{React.cloneElement(icon, { size: 18 })}</div> : React.cloneElement(icon, { size: 18, className: 'opacity-40' })}
        <span className="text-[10px] font-mono uppercase tracking-widest font-bold opacity-80">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", isActive ? (color === 'indigo' ? 'bg-indigo-400 glow-dot' : 'bg-cyan-400 glow-dot') : 'bg-slate-700')} />
        <span className={cn("text-lg font-black tracking-tighter", isActive ? 'text-white' : 'text-slate-600')}>{isActive ? 'ACTIVE' : 'OFFLINE'}</span>
      </div>
    </div>
  );
}

function ExecutionButton({ onClick, disabled, label, subLabel, icon, variant, mini }) {
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20",
    accent: "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20",
    danger: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20",
    neutral: "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10",
    warning: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20",
  };
  return (
    <motion.button whileHover={{ scale: 1.01, translateY: -2 }} whileTap={{ scale: 0.98 }} onClick={onClick} disabled={disabled}
      className={cn("flex items-center gap-4 rounded-2xl transition-all shadow-xl disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed group relative overflow-hidden btn-shine", mini ? "p-3 px-4" : "p-5", variants[variant])}>
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex flex-col items-start">
        <span className={cn("font-bold text-left", mini ? "text-xs" : "text-sm")}>{label}</span>
        {!mini && <span className="text-[9px] opacity-70 font-mono tracking-widest uppercase">{subLabel}</span>}
      </div>
      <ChevronRight className="ml-auto w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
    </motion.button>
  );
}

export default function ControlPanel({ status, loadingAction, onAction }) {
  return (
    <section className="col-span-12 lg:col-span-4 space-y-6">
      {/* Hero overview */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
        className="p-6 rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-slate-900/40 to-slate-900/60 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-400/10 blur-[60px] rounded-full" />
        <h2 className="text-2xl font-bold mb-2">Autonomous Navigation</h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-[90%]">
          PPO-based deep reinforcement learning for dynamic mobile robotics.
          Integrating high-fidelity physics with neural motion planning.
        </p>
        <div className="flex items-center gap-4 mt-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Target Platform</span>
            <span className="text-sm font-medium text-slate-200">TurtleBot3 Burger</span>
          </div>
          <div className="w-[1px] h-6 bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Physics Eng</span>
            <span className="text-sm font-medium text-slate-200">Gazebo Sim</span>
          </div>
        </div>
      </motion.div>

      {/* Status heartbeats */}
      <div className="grid grid-cols-2 gap-4">
        <StatusCard title="Simulation" isActive={status.simulation_running} icon={<Activity />} color="indigo" />
        <StatusCard title="Neural Agent" isActive={status.training_running} icon={<Zap />} color="cyan" />
      </div>

      {/* Control buttons */}
      <div className="p-6 rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-sm tracking-widest uppercase text-slate-400">Control Interface</h3>
          <Settings className="w-4 h-4 text-slate-600" />
        </div>
        <div className="grid grid-cols-1 gap-3">
          <ExecutionButton onClick={() => onAction('start_simulation', 'start simulation')} disabled={status.simulation_running || loadingAction}
            label="Launch Environment" subLabel="Gazebo Sim" icon={<Play className="w-5 h-5" />} variant="primary" />
          <div className="grid grid-cols-2 gap-3">
            <ExecutionButton onClick={() => onAction('start_training', 'start training')} disabled={status.training_running || !status.simulation_running || loadingAction}
              label="PPO Train" subLabel="Start Loop" mini icon={<RefreshCcw className="w-4 h-4" />} variant="accent" />
            <ExecutionButton onClick={() => onAction('stop_training', 'stop training')} disabled={!status.training_running || loadingAction}
              label="Halt Agent" subLabel="Save Model" mini icon={<Square className="w-4 h-4" />} variant="neutral" />
          </div>
          <ExecutionButton onClick={() => onAction('stop_simulation', 'stop simulation')} disabled={!status.simulation_running || loadingAction}
            label="Terminate Simulation" subLabel="Safety Halt" icon={<AlertCircle className="w-5 h-5" />} variant="danger" />
          <ExecutionButton onClick={() => onAction('reset', 'reset system')} disabled={loadingAction}
            label="Reset System" subLabel="Full Reset" icon={<RefreshCcw className="w-5 h-5" />} variant="warning" />
        </div>
      </div>
    </section>
  );
}
