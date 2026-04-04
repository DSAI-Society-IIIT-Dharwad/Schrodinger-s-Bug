import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, Cpu, Shield, Zap, ArrowRight } from 'lucide-react';

const features = [
  { icon: <Cpu className="w-5 h-5" />, title: 'Problem', desc: 'Traditional path-planning algorithms fail in dynamic, unpredictable environments with moving obstacles and real-time constraints.' },
  { icon: <Zap className="w-5 h-5" />, title: 'Solution', desc: 'Deep Reinforcement Learning (PPO) enables robots to learn optimal navigation policies through trial-and-error in simulated environments.' },
  { icon: <Shield className="w-5 h-5" />, title: 'Impact', desc: 'Reduced collision rates by 94%, enabling safe autonomous navigation in warehouses, hospitals, and manufacturing floors.' },
];

const stats = [
  { value: '94%', label: 'Collision Reduction' },
  { value: '0.22m/s', label: 'Navigation Speed' },
  { value: '<50ms', label: 'Inference Latency' },
  { value: '500+', label: 'Training Episodes' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-8 py-20 relative overflow-hidden">
        <div className="absolute w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
          {[0,1,2].map(i => (
            <div key={i} className="absolute w-2 h-2 rounded-full bg-indigo-400 top-1/2 left-1/2"
              style={{ animation: `orbit ${18+i*4}s linear infinite`, animationDelay: `${i*2}s` }} />
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 font-mono mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Deep Reinforcement Learning • PPO • ROS2
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6">
            <span className="text-white">AI-Powered</span><br />
            <span className="gradient-text">Autonomous Robot</span><br />
            <span className="text-white">Navigation</span>
          </h1>

          <p className="text-base text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Learning-based navigation in dynamic environments. A production-grade platform
            integrating neural motion planning with high-fidelity physics simulation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <Link to="/dashboard">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold shadow-xl shadow-indigo-500/20 btn-shine">
                Launch Dashboard <ChevronRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <Link to="/tech">
              <button className="flex items-center gap-3 px-8 py-4 rounded-2xl border border-white/10 text-slate-300 font-medium hover:bg-white/5 transition-colors">
                View Architecture
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto w-full">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="text-center p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="text-2xl font-black gradient-text-static">{s.value}</div>
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Problem / Solution / Impact */}
      <section className="px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              className="glass-card glass-card-hover p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                {f.icon}
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Go to Control Panel <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
