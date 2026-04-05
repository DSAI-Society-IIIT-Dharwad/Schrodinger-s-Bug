import React from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { BACKEND_URL } from '../utils';

const stack = [
  { id: 'ros', name: 'ROS2 Humble', desc: 'Robot middleware for distributed pub/sub communication, sensor drivers, and navigation stack.', color: '#22d3ee', tag: 'Middleware' },
  { id: 'sim', name: 'Gazebo Sim', desc: 'High-fidelity physics engine for 3D robot simulation with sensor noise and collision detection.', color: '#818cf8', tag: 'Simulation' },
  { id: 'train', name: 'Neural Agents', desc: 'PPO & TD3 implementations — stable, sample-efficient policy gradient methods for continuous control.', color: '#a78bfa', tag: 'RL Algorithms' },
  { id: 'pytorch', name: 'PyTorch', desc: 'Deep learning framework powering the Actor-Critic neural network architecture.', color: '#f97316', tag: 'ML Framework' },
  { id: 'burger', name: 'TurtleBot3', desc: 'Compact differential-drive mobile robot platform (Burger variant) with 360° LiDAR.', color: '#34d399', tag: 'Hardware' },
  { id: 'wsl', name: 'WSL2-Ubuntu', desc: 'Windows Subsystem for Linux enabling native Ubuntu execution for ROS2 and training pipelines.', color: '#f472b6', tag: 'Infrastructure' },
];

const apps = [
  { title: 'Logistics Automation', desc: 'Autonomous inventory transport and shelf navigation in dynamic warehouse environments.', icon: '📦' },
  { title: 'Healthcare Support', desc: 'Safe delivery of medicine and supplies through hospital corridors with pedestrian awareness.', icon: '🏥' },
  { title: 'Military Defense', desc: 'Intelligent scouting with real-time obstacle avoidance in unstructured environments.', icon: '🛡️' },
  { title: 'Search & Recovery', desc: 'Autonomous exploration of hazardous environments for survivor detection and mapping.', icon: '🔍' },
];

export default function TechPage() {
  const [status, setStatus] = React.useState({ ros: 'stopped', sim: 'stopped', train: 'stopped' });

  React.useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws');
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'status') setStatus(msg.data);
      if (msg.type === 'heartbeat') setStatus(msg.status);
    };
    return () => socket.close();
  }, []);

  const getLiveIndicator = (id) => {
    const isRunning = status[id] === 'running' || status[id] === 'active';
    // For passive components, show ready
    if (['pytorch', 'burger', 'wsl'].includes(id)) {
        return (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">READY</span>
            </div>
        );
    }

    return (
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg ${isRunning ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
        <span className={`text-[9px] font-bold uppercase tracking-widest ${isRunning ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isRunning ? 'TX_ACTIVE' : 'TX_OFFLINE'}
        </span>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-14 max-w-[1500px] mx-auto space-y-24 min-h-screen">
      {/* Page Header */}
      <header className="relative">
        <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.5)] rounded-full" />
        <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white mb-2">Integrated Tech Stack</h1>
        <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.4em]">Full-Stack Robotics Intelligence v2.0</p>
      </header>

      {/* Tech Stack Grid */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stack.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="hwi-glass hwi-glass-hover p-8 group tactical-border">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shrink-0"
                    style={{ backgroundColor: t.color + '15', color: t.color, border: `1px solid ${t.color}30` }}>
                    {t.name.charAt(0)}
                    </div>
                    <div>
                    <h4 className="text-md font-black text-white uppercase tracking-tight">{t.name}</h4>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">{t.tag}</span>
                    </div>
                </div>
              </div>

              <div className="mb-6">{getLiveIndicator(t.id)}</div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">{t.desc}</p>
              
              <div className="mt-8 flex items-center justify-between">
                 <div className="h-[2px] w-12 rounded-full" style={{ background: t.color }} />
                 <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">{t.id}_node_01</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Applications Section */}
      <section className="space-y-10">
        <div className="text-center space-y-2">
            <h3 className="text-2xl font-black uppercase italic text-white tracking-widest">Operational Verticals</h3>
            <div className="w-20 h-1 bg-cyan-500 mx-auto rounded-full" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {apps.map((a, i) => (
            <motion.div key={a.title} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="hwi-glass hwi-glass-hover p-8 space-y-4 group text-center border-white/5">
              <div className="text-5xl transform group-hover:scale-110 transition-transform duration-500 mb-4 inline-block">{a.icon}</div>
              <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">{a.title}</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{a.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
      
      {/* Infrastructure Note */}
      <footer className="text-center pt-10">
         <p className="text-[9px] font-mono text-slate-600 uppercase tracking-[0.5em]">Neural Pathfinder Framework © 2026 Developed for Advanced Autonomous Navigation</p>
      </footer>
    </div>
  );
}
