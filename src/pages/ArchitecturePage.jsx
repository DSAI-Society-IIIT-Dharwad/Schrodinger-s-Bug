import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Cpu, BrainCircuit, Activity, Database, Server } from 'lucide-react';

const Node = ({ x, y, label, icon: Icon, active, color }) => (
  <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    {/* Connection Glow */}
    <AnimatePresence>
      {active && (
        <motion.circle
          cx={x} cy={y} r={45}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 0.2 }}
          exit={{ opacity: 0 }}
          transition={{ repeat: Infinity, duration: 2 }}
          fill={color}
        />
      )}
    </AnimatePresence>
    
    <rect x={x - 40} y={y - 40} width={80} height={80} rx={20} className="hwi-glass" style={{ stroke: active ? color : 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
    <foreignObject x={x - 20} y={y - 20} width={40} height={40}>
      <div className="flex items-center justify-center h-full">
        <Icon size={24} style={{ color: active ? 'white' : 'rgba(255,255,255,0.3)' }} />
      </div>
    </foreignObject>
    <text x={x} y={y + 60} textAnchor="middle" className="text-[10px] font-mono fill-slate-400 uppercase tracking-widest">{label}</text>
  </motion.g>
);

const Line = ({ x1, y1, x2, y2, active, color }) => (
  <g>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />
    {active && (
      <motion.line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color}
        strokeWidth={2}
        strokeDasharray="4 8"
        animate={{ strokeDashoffset: -200 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
    )}
  </g>
);

export default function ArchitecturePage() {
  const [status, setStatus] = useState({ sim: 'stopped', train: 'stopped', ros: 'stopped' });
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    ws.onopen = () => setOnline(true);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'status') setStatus(msg.data);
      if (msg.type === 'heartbeat') setStatus(msg.status);
    };
    ws.onclose = () => setOnline(false);
    return () => ws.close();
  }, []);

  const isSimActive = status.sim === 'running';
  const isTrainActive = status.train === 'running';

  return (
    <div className="p-10 max-w-[1200px] mx-auto min-h-screen">
      <header className="mb-16">
        <h1 className="text-4xl font-black uppercase italic tracking-wider text-white">System Architecture</h1>
        <p className="text-slate-500 font-mono text-xs mt-2 uppercase tracking-[0.2em]">Live Distributed Control Stack</p>
      </header>

      <div className="hwi-glass rounded-[40px] p-12 aspect-[16/9] relative overflow-hidden tactical-border">
        {/* SVG Diagram */}
        <svg viewBox="0 0 800 450" className="w-full h-full">
          {/* Connections */}
          <Line x1={150} y1={225} x2={350} y2={100} active={online} color="#6366f1" />
          <Line x1={150} y1={225} x2={350} y2={350} active={online} color="#6366f1" />
          <Line x1={350} y1={100} x2={600} y2={100} active={isTrainActive} color="#a78bfa" />
          <Line x1={350} y1={350} x2={600} y2={350} active={isSimActive} color="#22d3ee" />
          <Line x1={600} y1={100} x2={600} y2={350} active={isSimActive && isTrainActive} color="#f43f5e" />

          {/* Nodes */}
          <Node x={150} y={225} label="HUD Interface" icon={Activity} active={online} color="#6366f1" />
          
          <Node x={350} y={100} label="FastAPI Hub" icon={Server} active={online} color="#6366f1" />
          <Node x={350} y={350} label="WSL2 Bridge" icon={Database} active={online} color="#6366f1" />

          <Node x={600} y={100} label="DRL Core" icon={BrainCircuit} active={isTrainActive} color="#a78bfa" />
          <Node x={600} y={350} label="ROS2/Gazebo" icon={Cpu} active={isSimActive} color="#22d3ee" />
        </svg>

        {/* Legend Overlay */}
        <div className="absolute bottom-10 left-12 grid grid-cols-2 gap-x-12 gap-y-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
            <span className="text-[10px] font-mono text-slate-400 uppercase">Management Link</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
            <span className="text-[10px] font-mono text-slate-400 uppercase">Telemetry Stream</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]" />
            <span className="text-[10px] font-mono text-slate-400 uppercase">Neural Gradient</span>
          </div>
        </div>

        {/* Status HUD Scanline Overlay */}
        <div className="absolute inset-x-0 top-0 h-40 pointer-events-none opacity-20">
          <div className="w-full h-full bg-gradient-to-b from-indigo-500/20 to-transparent animate-scan" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {[
          { title: 'Neural Hub', desc: 'React context managing WebSocket state and real-time Chart injection.' },
          { title: 'WSL Orchestrator', desc: 'Subprocess management bridging Windows UI with Linux Robot OS.' },
          { title: 'LiDAR Pipe', desc: 'Serialized scan frames flowing from Gazebo to the Pytorch Inference engine.' },
        ].map(card => (
          <div key={card.title} className="hwi-glass p-8 rounded-[30px] border-white/5">
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-3">{card.title}</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
