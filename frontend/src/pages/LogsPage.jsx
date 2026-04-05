import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Terminal, Trash2 } from 'lucide-react';
import { BACKEND_URL } from '../utils';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const endRef = useRef(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/logs?last=100`);
        if (res.data.logs) setLogs(res.data.logs);
      } catch (e) {
        console.error("Logs fetch failed:", e);
      }
    };
    fetch();

    const socket = new WebSocket('ws://localhost:8000/ws');
    
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'log') {
        setLogs(prev => [...prev, msg.data].slice(-500)); // Keep last 500 logs
      }
    };

    return () => socket.close();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getStyle = (line) => {
    const isError = line.includes('[ERROR]') || line.includes('error') || line.includes('not found') || line.includes('Exited with code 1');
    const isWarn = line.includes('[WARN]') || line.includes('warning');
    const isPPO = line.includes('[DRL]') || line.includes('[PPO]');
    const isGazebo = line.includes('[GAZEBO]') || line.includes('[SIM]');
    const isROS = line.includes('[ROS]');

    if (isError) return 'bg-rose-500/10 text-rose-400 border-l-2 border-rose-500';
    if (isWarn) return 'bg-amber-500/10 text-amber-400 border-l-2 border-amber-500';
    if (isPPO) return 'text-cyan-300 border-l-2 border-cyan-500/30';
    if (isGazebo) return 'text-indigo-300 border-l-2 border-indigo-500/30';
    if (isROS) return 'text-emerald-300 border-l-2 border-emerald-500/30';
    
    return 'text-slate-400';
  };


  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto h-[calc(100vh-2rem)] flex flex-col">
      <div className="flex items-end justify-between mb-6">
        <div>
          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-[0.3em] block mb-2">Observability</span>
          <h2 className="text-3xl font-black text-white">System Logs</h2>
          <p className="text-sm text-slate-500 mt-1">Live output from ROS2, Gazebo, and PPO training processes.</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400" /> PPO</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-400" /> Gazebo</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" /> Error</span>
        </div>
      </div>

      <div className="flex-1 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md overflow-hidden flex flex-col">
        <div className="px-4 py-2.5 border-b border-white/10 bg-white/[0.03] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Neural-Terminal v2.0</span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-1 font-mono text-[11px] leading-relaxed">
          {logs.length === 0 && (
            <div className="text-slate-600 text-center py-20">
              <Terminal className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p>No logs available. Start a simulation or training session.</p>
            </div>
          )}
          {logs.map((line, i) => (
            <div key={i} className={`px-3 py-1.5 rounded-lg ${getStyle(line)}`}>{line}</div>
          ))}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}
