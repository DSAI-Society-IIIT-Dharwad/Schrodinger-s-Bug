import React from 'react';
import { motion } from 'framer-motion';
import { TECH_STACK, APPLICATIONS } from '../utils';

export function TechStackSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="text-center mb-12">
          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-[0.3em] mb-4 block">Technology</span>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Integrated Tech Stack</h2>
          <p className="text-slate-500 max-w-xl mx-auto">End-to-end robotics intelligence — from physics simulation to neural policy optimization.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {TECH_STACK.map((tech, i) => (
            <motion.div key={tech.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="glass-card glass-card-hover p-5 text-center group cursor-default">
              <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center text-lg font-black" style={{ backgroundColor: tech.color + '15', color: tech.color, border: `1px solid ${tech.color}30` }}>
                {tech.name.charAt(0)}
              </div>
              <h4 className="text-xs font-bold text-white mb-1">{tech.name}</h4>
              <p className="text-[9px] text-slate-500 leading-relaxed">{tech.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ApplicationsSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="text-center mb-12">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-[0.3em] mb-4 block">Applications</span>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Real-World Deployment</h2>
          <p className="text-slate-500 max-w-xl mx-auto">From simulation to production — enabling intelligent navigation across industries.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {APPLICATIONS.map((app, i) => (
            <motion.div key={app.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="glass-card glass-card-hover p-6 space-y-4 group">
              <div className="text-4xl">{app.icon}</div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">{app.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{app.desc}</p>
              <div className="h-[2px] w-0 group-hover:w-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500 rounded-full" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
