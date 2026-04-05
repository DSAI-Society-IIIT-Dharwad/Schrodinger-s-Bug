import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Package, HeartPulse, GitBranch, Download, Layers, Box, Code2, ArrowRight } from 'lucide-react';

const APPLICATIONS = [
  {
    id: 'defense',
    title: 'Tactical Defense Ops',
    icon: <Shield className="w-8 h-8 text-indigo-400" />,
    badge: 'TD3 DEPLOYED',
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    gradient: 'from-indigo-600/20 to-blue-600/5',
    desc: 'Autonomous patrol and intruder interception systems utilizing Twin Delayed DDPG for 100% mission success and secure navigation in hostile environments.',
    github: 'https://github.com/Abhay-aps001/drl_nav_project-Abhay',
    author: 'Abhay-aps001',
    dockerDrive: 'https://drive.google.com/file/d/1klItWutuXhI8koP6ho6g156DHVKJMyL5/view?usp=sharing',
    dockerLabel: 'Pull Defense Image'
  },
  {
    id: 'warehouse',
    title: 'Warehouse Logistics',
    icon: <Package className="w-8 h-8 text-emerald-400" />,
    badge: 'PPO DEPLOYED',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    gradient: 'from-emerald-600/20 to-teal-600/5',
    desc: 'Heavy payload path-finding and dynamic obstacle avoidance in narrow industrial corridors utilizing Proximal Policy Optimization for high-traffic fleets.',
    github: 'https://github.com/Sreejith-nair511/DRLWarehouse-simulation',
    author: 'Sreejith-nair511',
    dockerDrive: 'https://drive.google.com/file/d/1kqLoGtJuU1Yht3c5w4MhMPYM6ql_usYV/view?usp=sharing',
    dockerLabel: 'Pull Warehouse Image'
  },
  {
    id: 'eldercare',
    title: 'Elder Support & Healthcare',
    icon: <HeartPulse className="w-8 h-8 text-rose-400" />,
    badge: 'IN DEVELOPMENT',
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    gradient: 'from-rose-600/20 to-pink-600/5',
    desc: 'Soft robotic navigation optimized for human-dense and fragile environments. Prioritizes zero-collision constraints and smooth velocity trajectories over pure speed.',
    github: '#',
    author: 'Project Team',
    dockerDrive: '#',
    dockerLabel: 'Image Unreleased',
    disabled: true
  }
];

export default function ApplicationsPage() {
  return (
    <div className="min-h-screen bg-[#050508] p-6 lg:p-10 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="fixed top-20 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-10 w-[600px] h-[600px] bg-cyan-600/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-8">
        <div>
           <div className="flex items-center gap-3 mb-2 text-indigo-400 font-mono text-[10px] tracking-[0.4em] uppercase">
             <Layers className="w-4 h-4 animate-pulse" />
             Real-World Deployments
           </div>
           <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">
             Applications <span className="text-indigo-500">& Container Hub</span>
           </h1>
           <p className="text-xs text-slate-500 mt-3 font-mono max-w-2xl leading-relaxed">
             Explore our team's isolated workflows spanning Defense, Logistics, and Healthcare. Download pre-built Docker Images to deploy our trained Neural Agents directly into your environments.
           </p>
        </div>
      </header>

      {/* Cards Grid */}
      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-3 gap-8">
        {APPLICATIONS.map((app, index) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`hwi-glass flex flex-col rounded-[40px] border border-white/5 overflow-hidden transition-all duration-300 relative group
                        hover:-translate-y-2 ${app.disabled ? 'opacity-80' : 'hover:border-white/10 hover:shadow-2xl hover:shadow-indigo-500/10'}`}
          >
            {/* Top Gradient Area */}
            <div className={`p-8 bg-gradient-to-br ${app.gradient} relative overflow-hidden backdrop-blur-sm`}>
               {/* Decorative background grid inside header */}
               <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
               />
               <div className="relative z-10 flex justify-between items-start mb-6">
                 <div className="p-4 rounded-2xl bg-[#050508] border border-white/10 shadow-xl group-hover:scale-110 transition-transform duration-500">
                   {app.icon}
                 </div>
                 <div className={`px-3 py-1.5 rounded-xl border text-[9px] font-bold tracking-widest font-mono uppercase ${app.badgeColor}`}>
                   {app.badge}
                 </div>
               </div>
               
               <h2 className="relative z-10 text-2xl font-black text-white tracking-tight mb-2">
                 {app.title}
               </h2>
               <div className="relative z-10 flex items-center gap-2 text-[10px] text-white/50 font-mono">
                 <Code2 className="w-3 h-3" /> Built by <span className="text-white/80">{app.author}</span>
               </div>
            </div>

            {/* Content Body */}
            <div className="p-8 flex flex-col flex-1">
               <p className="text-sm text-slate-400 leading-relaxed mb-8 flex-1">
                  {app.desc}
               </p>

               {/* Action Buttons */}
               <div className="space-y-4">
                  {/* GitHub Repo */}
                  <a 
                    href={app.github} 
                    target="_blank" 
                    rel="noreferrer"
                    className={`group/btn relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                      app.disabled 
                        ? 'border-white/5 bg-white/[0.01] cursor-not-allowed text-slate-600' 
                        : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <GitBranch className="w-5 h-5" />
                      <div className="text-left">
                        <div className="text-xs font-bold uppercase tracking-wider">{app.disabled ? 'Source Unavailable' : 'View Source Hub'}</div>
                        <div className="text-[9px] font-mono opacity-50">GitHub Repository</div>
                      </div>
                    </div>
                    {!app.disabled && <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-300" />}
                  </a>

                  {/* Docker Container Link */}
                  <a 
                    href={app.dockerDrive} 
                    target="_blank" 
                    rel="noreferrer"
                    className={`group/docker relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 shadow-xl overflow-hidden ${
                      app.disabled 
                        ? 'border-rose-500/10 bg-rose-500/5 text-rose-500/50 cursor-not-allowed'
                        : 'border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 hover:border-indigo-500/50 text-indigo-300 hover:text-indigo-200'
                    }`}
                  >
                    {!app.disabled && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/docker:translate-x-full transition-transform duration-1000" />
                    )}
                    
                    <div className="relative z-10 flex items-center gap-3">
                      <Box className="w-5 h-5" />
                      <div className="text-left">
                        <div className="text-xs font-black uppercase tracking-wider">{app.dockerLabel}</div>
                        <div className="text-[9px] font-mono opacity-70">.tar Google Drive Archive</div>
                      </div>
                    </div>
                    
                    {!app.disabled && (
                      <div className="relative z-10 p-2 rounded-xl bg-indigo-500/20 group-hover/docker:bg-indigo-500 text-white transition-colors duration-300">
                        <Download className="w-4 h-4" />
                      </div>
                    )}
                  </a>
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
