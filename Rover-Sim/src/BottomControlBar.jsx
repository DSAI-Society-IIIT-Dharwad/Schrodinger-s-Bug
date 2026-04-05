import React from 'react';
import { Play, Pause, RotateCcw, SkipForward, GraduationCap } from 'lucide-react';

const BottomControlBar = ({ 
  isRunning,
  selectedAlgorithm,
  speedMultiplier,
  learnMode,
  onAlgorithmChange,
  onSpeedChange,
  onLearnModeToggle,
  onPause,
  onResume,
  onReset,
  onConverge
}) => {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-full max-w-[900px] px-4 pointer-events-none">
      <div className="bg-slate-950/70 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 shadow-2xl pointer-events-auto">
        <div className="flex items-center justify-between gap-6">
          
          {/* Left: Control Buttons */}
          <div className="flex gap-2">
            {!isRunning ? (
              <button
                onClick={onResume}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-[9px] font-black uppercase tracking-widest hover:bg-green-500/30 transition-all"
              >
                <Play size={14} fill="currentColor" /> START
              </button>
            ) : (
              <button
                onClick={onPause}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400 text-[9px] font-black uppercase tracking-widest hover:bg-amber-500/30 transition-all"
              >
                <Pause size={14} fill="currentColor" /> PAUSE
              </button>
            )}
            
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/60 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              <RotateCcw size={14} /> RESET
            </button>
            
            <button
              onClick={onConverge}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400 text-[9px] font-black uppercase tracking-widest hover:bg-purple-500/30 transition-all"
            >
              <SkipForward size={14} /> CONVERGE
            </button>
          </div>
          
          {/* Center: Speed Multiplier */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[7px] text-white/30 uppercase tracking-widest">Sim Speed</span>
            <div className="flex gap-1 bg-black/30 rounded-lg p-1">
              {[1, 2, 5, 10].map(speed => (
                <button
                  key={speed}
                  onClick={() => onSpeedChange(speed)}
                  className={`px-3 py-1 rounded-md text-[9px] font-black transition-all ${
                    speedMultiplier === speed 
                      ? 'bg-cyan-500 text-white' 
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {speed}×
                </button>
              ))}
            </div>
          </div>
          
          {/* Right: Learn Mode Toggle */}
          <button
            onClick={onLearnModeToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
              learnMode 
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]' 
                : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
            }`}
          >
            <GraduationCap size={14} /> LEARN MODE: {learnMode ? 'ON' : 'OFF'}
          </button>
          
        </div>
      </div>
    </div>
  );
};

export default BottomControlBar;
