import React, { useRef, useEffect } from 'react';
import { Terminal } from 'lucide-react';
import { cn } from '../utils';

export default function LogsPanel({ logs }) {
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getLogType = (msg) => {
    if (msg.includes('ERROR') || msg.includes('[ERROR]')) return 'error';
    if (msg.includes('WARN') || msg.includes('[WARN]')) return 'warn';
    if (msg.includes('Episode') || msg.includes('success')) return 'success';
    return 'info';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[280px]">
      <div className="md:col-span-8 rounded-3xl border border-white/10 bg-black/60 overflow-hidden flex flex-col group transition-all hover:ring-1 hover:ring-white/10">
        <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">System Terminal</span>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-rose-500/50" />
            <div className="w-2 h-2 rounded-full bg-amber-500/50" />
            <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
          </div>
        </div>
        <div className="flex-1 p-4 font-mono text-[11px] overflow-y-auto space-y-1.5 custom-scrollbar">
          {logs.map((log, i) => {
            const type = typeof log === 'string' ? getLogType(log) : log.type;
            const msg = typeof log === 'string' ? log : log.msg;
            return (
              <div key={i} className={cn("flex items-start gap-3", type === 'error' ? 'text-rose-400' : type === 'warn' ? 'text-amber-400' : 'text-slate-300')}>
                <span className={cn("px-1.5 rounded uppercase text-[8px] font-bold shrink-0 mt-0.5",
                  type === 'error' ? 'bg-rose-500/20 text-rose-300' :
                  type === 'warn' ? 'bg-amber-500/20 text-amber-300' :
                  type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'
                )}>{type}</span>
                <p className="flex-1 opacity-90 break-all">{msg}</p>
              </div>
            );
          })}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Neural architecture sidebar */}
      <div className="md:col-span-4 rounded-3xl border border-white/10 bg-indigo-500/5 p-6 flex flex-col justify-between">
        <h5 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">Neural Architecture</h5>
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 uppercase"><span>Exploration</span><span>12%</span></div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-cyan-400 w-[12%] transition-all duration-1000" /></div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 uppercase"><span>Consistency</span><span>94%</span></div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-indigo-400 w-[94%] transition-all duration-1000" /></div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 uppercase"><span>Convergence</span><span>87%</span></div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-emerald-400 w-[87%] transition-all duration-1000" /></div>
          </div>
        </div>
        <div className="pt-6 mt-auto">
          <div className="flex justify-center -space-x-2">
            {[1, 2, 3, 4].map(x => <div key={x} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold">L{x}</div>)}
          </div>
          <p className="text-[9px] text-center text-slate-500 mt-2">PPO Actor-Critic MLP Policy Network</p>
        </div>
      </div>
    </div>
  );
}
