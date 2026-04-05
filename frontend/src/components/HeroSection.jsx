import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Cpu, Shield, Zap } from 'lucide-react';

const features = [
  { icon: <Cpu className="w-5 h-5" />, title: 'Problem', desc: 'Traditional path-planning algorithms fail in dynamic, unpredictable environments with moving obstacles and real-time constraints.' },
  { icon: <Zap className="w-5 h-5" />, title: 'Solution', desc: 'Deep Reinforcement Learning (PPO) enables robots to learn optimal navigation policies through trial-and-error in simulated environments.' },
  { icon: <Shield className="w-5 h-5" />, title: 'Impact', desc: 'Reduced collision rates by 94%, enabling safe autonomous navigation in warehouses, hospitals, and manufacturing floors.' },
];

export default function HeroSection({ onScrollToControl }) {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 py-20 overflow-hidden">
      {/* Orbiting dots */}
      <div className="absolute w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
        {[0, 1, 2].map(i => (
          <div key={i} className="absolute w-2 h-2 rounded-full bg-indigo-400 top-1/2 left-1/2" style={{ animation: `orbit ${18 + i * 4}s linear infinite`, animationDelay: `${i * 2}s` }} />
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center max-w-4xl mx-auto relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 font-mono mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Deep Reinforcement Learning • PPO • ROS2
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6">
          <span className="text-white">AI-Powered</span><br />
          <span className="gradient-text">Autonomous Robot</span><br />
          <span className="text-white">Navigation</span>
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Learning-based navigation in dynamic environments. A production-grade platform
          integrating neural motion planning with high-fidelity physics simulation.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-20">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onScrollToControl}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold shadow-xl shadow-indigo-500/20 btn-shine">
            Launch Control Panel <ChevronRight className="w-5 h-5" />
          </motion.button>
          <button className="flex items-center gap-3 px-8 py-4 rounded-2xl border border-white/10 text-slate-300 font-medium hover:bg-white/5 transition-colors">
            View Documentation
          </button>
        </div>
      </motion.div>

      {/* Problem / Solution / Impact cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full relative z-10">
        {features.map((f, i) => (
          <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.15 }}
            className="glass-card glass-card-hover p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              {f.icon}
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">{f.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
