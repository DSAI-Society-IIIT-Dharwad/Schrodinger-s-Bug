import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Package, Target, GitBranch, Download, Layers, Box, Code2, ArrowRight } from 'lucide-react';

const APPLICATIONS = [
  {
    id: 'defense',
    title: 'Tactical Defense Ops',
    icon: <Shield className="w-8 h-8 text-indigo-400" />,
    badge: 'TD3 DEPLOYED',
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    gradient: 'from-indigo-600/20 to-blue-600/5',
    desc: 'High-speed autonomous defense system capable of real-time threat evaluation and dynamic interception using the Twin Delayed Deep Deterministic Policy Gradient (TD3) algorithm.',
    github: 'https://github.com/Abhay-aps001/drl_nav_project-Abhay',
    author: 'Abhay APS',
    dockerDrive: 'docker.io/abhaydocx001/drl_nav_robot',
    dockerLabel: 'Pull Defense Image'
  },
  {
    id: 'logistics',
    title: 'Warehouse Logistics',
    icon: <Package className="w-8 h-8 text-emerald-400" />,
    badge: 'PPO OPTIMIZED',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    gradient: 'from-emerald-600/20 to-teal-600/5',
    desc: 'Heavy payload path-finding and dynamic obstacle avoidance in narrow industrial corridors utilizing Proximal Policy Optimization for high-traffic fleets.',
    github: 'https://github.com/Pavan-Hosatti/Warehouse-simulation',
    author: 'Pavan Hosatti',
    dockerDrive: 'https://hub.docker.com/r/pavaninsights/warehouse-demo',
    dockerLabel: 'Pull Warehouse Image'
  },
  {
    id: 'traffic',
    title: 'Intelligent Traffic DRL',
    icon: <Target className="w-8 h-8 text-amber-400" />,
    badge: 'DOCKER UPLOAD',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    gradient: 'from-amber-600/20 to-orange-600/5',
    desc: 'Deep Reinforcement Learning applied to urban traffic flow optimization. Specifically tuned for crossroads navigation and autonomous elderly mobility assistance.',
    github: 'https://github.com/Pavan-Hosatti/Warehouse-simulation',
    author: 'Pavan Hosatti',
    dockerDrive: 'https://hub.docker.com/r/pavaninsights/traffic-drl',
    dockerLabel: 'Pull Traffic Image'
  }
];

export default function ApplicationsPage() {
  return (
    <div className="min-h-screen bg-[#020204] text-white p-6 lg:p-10 font-sans selection:bg-blue-500/30">
      <div className="max-w-[1400px] mx-auto space-y-12">
        
        <header className="space-y-4 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-4 text-indigo-400 font-mono text-xs uppercase tracking-[0.4em]">
            <Rocket className="w-4 h-4" />
            Project Deployment Hub
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">
            Neural <span className="text-indigo-500">Applications</span>
          </h1>
          <p className="text-slate-500 font-mono text-xs max-w-2xl leading-relaxed">
            A comprehensive showcase of Deep Reinforcement Learning applications in robotics navigation and tactical environment orchestration. Lead by the Research Team: Sreejith, Pavan, Abhay, Rishita.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {APPLICATIONS.map((app) => (
            <motion.div 
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group relative hwi-glass rounded-[40px] border border-white/5 overflow-hidden flex flex-col"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${app.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
              
              <div className="p-8 space-y-6 relative z-10 flex-1">
                <div className="flex justify-between items-start">
                  <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 text-white group-hover:scale-110 transition-transform duration-500">
                    {app.icon}
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${app.badgeColor}`}>
                    {app.badge}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black italic uppercase tracking-tight group-hover:text-white transition-colors">
                    {app.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase">
                    <span className="w-2 h-2 rounded-full bg-indigo-500/40" />
                    Authored by: <span className="text-slate-300">{app.author}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  {app.desc}
                </p>

                <div className="space-y-3 pt-4">
                  <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest flex items-center gap-3">
                    <Box className="w-3 h-3" />
                    Runtime Infrastructure
                  </div>
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 font-mono text-[10px] flex items-center justify-between group-hover:border-white/20 transition-colors">
                    <span className="text-indigo-400/80 truncate pr-4">{app.dockerDrive}</span>
                    <a href={app.dockerDrive} target="_blank" rel="noopener noreferrer" className="p-2 bg-indigo-500/10 rounded-lg hover:bg-indigo-500 transition-colors">
                      <Download className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-white/5 bg-white/[0.02] relative z-10 flex gap-2">
                <a href={app.github} target="_blank" rel="noopener noreferrer" className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center gap-3 hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest">
                  <Code2 className="w-4 h-4" />
                  Source Code
                </a>
                <a href={app.dockerDrive} target="_blank" rel="noopener noreferrer" className="flex-1 py-4 rounded-2xl bg-indigo-600 flex items-center justify-center gap-3 hover:bg-indigo-500 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/20">
                  Registry
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        <section className="hwi-glass rounded-[40px] p-10 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <GitBranch className="w-64 h-64" />
          </div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-black italic uppercase italic leading-none">Modular <span className="text-indigo-500">Environment</span> Architecture</h2>
              <p className="text-xs text-slate-400 leading-relaxed font-mono uppercase tracking-wide">
                Our platform supports plug-and-play environments optimized for both PPO and TD3 agents. Every application is containerized for seamless deployment across standard ROS2 Humble distributions.
              </p>
              <div className="flex gap-4">
                 {['ROS2 Humble', 'PyTorch 2.0', 'Gazebo 11', 'WSL2-g'].map(tech => (
                   <div key={tech} className="px-5 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-bold text-slate-300 font-mono">
                     {tech}
                   </div>
                 ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               {[
                 { label: 'Total Agents', val: '04' },
                 { label: 'Deployed Apps', val: '03' },
                 { label: 'Environment Latency', val: '< 15ms' },
                 { label: 'Success Variance', val: '±2.4%' }
               ].map(stat => (
                 <div key={stat.label} className="p-6 rounded-[32px] bg-black/40 border border-white/5 text-center">
                    <div className="text-3xl font-black text-white italic">{stat.val}</div>
                    <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mt-1">{stat.label}</div>
                 </div>
               ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

const Rocket = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4.5c1.62-1.63 5-2 5-2"></path><path d="M12 15v5s3.03-.55 4.5-2c1.63-1.62 2-5 2-5"></path></svg>
);
