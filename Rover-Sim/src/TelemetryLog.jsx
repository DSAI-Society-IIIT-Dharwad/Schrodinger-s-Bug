import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

const TelemetryLog = ({ logs, expanded, onToggle }) => {
  const getLogColor = (type) => {
    switch(type) {
      case 'collision': return 'text-rose-400';
      case 'safety': return 'text-amber-400';
      case 'randomization': return 'text-purple-400';
      case 'success': return 'text-green-400';
      case 'episode': return 'text-cyan-300';
      case 'info': return 'text-white/70';
      default: return 'text-white/60';
    }
  };

  return (
    <>
      {/* Expandable Tab */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        <button
          onClick={onToggle}
          className="pointer-events-auto mx-auto block bg-slate-950/80 backdrop-blur-2xl border border-t border-white/10 rounded-t-2xl px-8 py-2 flex items-center gap-2 text-[9px] font-black tracking-[0.2em] text-white/60 hover:text-white transition-all"
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          TELEMETRY LOG
        </button>
      </div>

      {/* Expanded Overlay */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 400, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="absolute bottom-8 left-0 right-0 z-19 bg-slate-950/90 backdrop-blur-3xl border-t border-white/10 overflow-hidden"
          >
            <div className="h-full p-4 font-mono text-[10px] overflow-y-auto custom-scrollbar space-y-1">
              {logs.map((log, i) => (
                <div key={i} className={`flex gap-3 ${getLogColor(log.type)}`}>
                  <span className="text-white/20 shrink-0">[{log.time}]</span>
                  <span className="break-all">{log.msg}</span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center text-white/30 mt-20">
                  <p>No telemetry data yet</p>
                  <p className="text-[9px] mt-1">Start DRL training to see logs</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TelemetryLog;
