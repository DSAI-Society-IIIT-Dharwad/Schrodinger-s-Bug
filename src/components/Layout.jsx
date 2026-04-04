import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Box, Database, Home, LayoutDashboard, BarChart3, Video, Terminal, Cpu, BrainCircuit, Network } from 'lucide-react';

const navItems = [
  { to: '/', icon: <Home size={18} />, label: 'Home' },
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
  { to: '/neural', icon: <BrainCircuit size={18} />, label: 'Neural HUD' },
  { to: '/demo', icon: <Video size={18} />, label: 'Demo' },
  { to: '/logs', icon: <Terminal size={18} />, label: 'Logs' },
  { to: '/tech', icon: <Cpu size={18} />, label: 'Tech Stack' },
  { to: '/architecture', icon: <Network size={18} />, label: 'Architecture' },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen text-slate-100 selection:bg-cyan-500/30 overflow-x-hidden grid-bg noise-overlay">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full -z-10 pointer-events-none animate-pulse-slow" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-600/10 blur-[150px] rounded-full -z-10 pointer-events-none animate-float" />

      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-[72px] lg:w-[220px] border-r border-white/5 bg-slate-900/80 backdrop-blur-xl z-50 flex flex-col">
        {/* Brand */}
        <div className="px-4 py-5 border-b border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 p-[1px] shrink-0">
            <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="text-sm font-bold tracking-tight text-white leading-tight">SCHRÖDINGER'S</div>
            <div className="text-[10px] font-mono text-cyan-400 tracking-[0.15em]">BUG</div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-indigo-500/15 text-white border border-indigo-500/20'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`
              }>
              <span className="shrink-0">{item.icon}</span>
              <span className="hidden lg:block">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom info */}
        <div className="p-3 border-t border-white/5 hidden lg:block">
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-white/5 border border-white/10">
            <Database className="w-3 h-3 text-indigo-400 shrink-0" />
            <span className="text-[9px] text-slate-400 font-mono truncate">WSL2-Ubuntu-22.04</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-[72px] lg:ml-[220px] min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
