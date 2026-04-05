import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Maximize2, X, Film, Image as ImageIcon, Camera } from 'lucide-react';

const ASSET_PATH = '/demo';

// Helper to encode space as %20 for URL stability
const encodePath = (path) => path.replace(/ /g, '%20');

const GALLERY_ITEMS = [
  { id: 1, type: 'video', src: encodePath(`${ASSET_PATH}/WhatsApp Video 2026-04-05 at 11.49.42 AM.mp4`), title: 'Live Mission 1', desc: 'Real-time robot navigation and telemetry sync.' },
  { id: 2, type: 'video', src: encodePath(`${ASSET_PATH}/WhatsApp Video 2026-04-05 at 9.58.03 AM.mp4`), title: 'Defense Patrol', desc: 'Agent maneuvering through environment.' },
  { id: 3, type: 'video', src: encodePath(`${ASSET_PATH}/WhatsApp Video 2026-04-05 at 9.58.03 AM(1).mp4`), title: 'Patrol Continuation', desc: 'Extended run showing collision avoidance.' },
  { id: 4, type: 'video', src: encodePath(`${ASSET_PATH}/start.webm`), title: 'Engine Ignition', desc: 'Gazebo startup and spawn sequence.' },
  { id: 5, type: 'video', src: encodePath(`${ASSET_PATH}/Screencast from 04-04-26 091822 PM IST.webm`), title: 'System Demonstration', desc: 'End-to-End architecture operating in sync.' },
  { id: 6, type: 'image', src: encodePath(`${ASSET_PATH}/WhatsApp Image 2026-04-04 at 5.31.21 PM.jpeg`), title: 'Terminal Output 1', desc: 'ROS2 Node initialization log.' },
  { id: 7, type: 'image', src: encodePath(`${ASSET_PATH}/WhatsApp Image 2026-04-04 at 5.40.16 PM.jpeg`), title: 'Evaluation Metrics', desc: 'Algorithm graph.' },
  { id: 8, type: 'image', src: encodePath(`${ASSET_PATH}/WhatsApp Image 2026-04-05 at 11.50.20 AM.jpeg`), title: 'Simulation Capture', desc: 'Gazebo running on host.' },
  { id: 9, type: 'image', src: encodePath(`${ASSET_PATH}/WhatsApp Image 2026-04-05 at 11.50.20 AM(1).jpeg`), title: 'HUD Overview', desc: 'Status of the React Base Station.' },
];

export default function GalleryPage() {
  const [activeItem, setActiveItem] = useState(null);
  const [filter, setFilter] = useState('all');

  const filteredItems = GALLERY_ITEMS.filter(item => filter === 'all' || item.type === filter);

  return (
    <div className="min-h-screen bg-[#050508] p-6 lg:p-10 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="fixed top-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-1/4 w-[500px] h-[500px] bg-cyan-600/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-8">
        <div>
           <div className="flex items-center gap-3 mb-2 text-indigo-400 font-mono text-[10px] tracking-[0.4em] uppercase">
             <Camera className="w-4 h-4" />
             Media Exhibition Hub
           </div>
           <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">
             Project <span className="text-indigo-500">Gallery</span>
           </h1>
           <p className="text-xs text-slate-500 mt-3 font-mono max-w-xl">
             Static assets repository. High-fidelity visual records of the DRL training sequence and deployment outcomes.
           </p>
        </div>

        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
           {['all', 'video', 'image'].map(f => (
             <button key={f} onClick={() => setFilter(f)}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
                 filter === f ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
               }`}>
               {f === 'video' ? <Film className="w-3 h-3" /> : f === 'image' ? <ImageIcon className="w-3 h-3" /> : null}
               {f}
             </button>
           ))}
        </div>
      </header>

      {/* Gallery Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence>
          {filteredItems.map((item, idx) => (
            <motion.div 
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              onClick={() => setActiveItem(item)}
              className="group cursor-pointer aspect-video rounded-[32px] border border-white/5 bg-white/[0.02] hwi-glass overflow-hidden relative flex flex-col justify-end p-6 hover:border-indigo-500/30 transition-colors"
            >
              <div className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center bg-black/40">
                {item.type === 'video' ? (
                  <video 
                    src={item.src} 
                    className="w-full h-full object-cover"
                    autoPlay muted loop playsInline
                  />
                ) : (
                  <img 
                    src={item.src} 
                    alt={item.title} 
                    className="w-full h-full object-cover"
                  />
                )}
                
                <div className="absolute inset-0 flex flex-col items-center justify-center z-[-1] text-slate-600">
                  <span className="text-[10px] font-mono tracking-widest uppercase mb-2">Resource:</span>
                  <span className="text-xs font-bold text-indigo-400">{item.src.split('/').pop()}</span>
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent opacity-90" />

              <div className="relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 backdrop-blur-md">
                    {item.type === 'video' ? <Film className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                  </span>
                  <span className="text-[9px] font-mono tracking-[0.2em] text-indigo-300 uppercase">
                    {item.type} Asset
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{item.title}</h3>
                <p className="text-[11px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                  {item.desc}
                </p>
              </div>

              <div className="absolute top-6 right-6 p-2 rounded-full bg-white/5 backdrop-blur-md text-white/50 group-hover:text-white group-hover:bg-indigo-500 transition-all opacity-0 group-hover:opacity-100">
                <Maximize2 className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {activeItem && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 lg:p-12"
          >
            <button 
              onClick={() => setActiveItem(null)}
              className="absolute top-6 right-6 lg:top-10 lg:right-10 p-3 rounded-full bg-white/10 text-white hover:bg-rose-500 hover:text-white transition-colors z-50"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative w-full max-w-6xl aspect-video rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.2)] bg-slate-900 border border-white/10"
            >
              {activeItem.type === 'video' ? (
                <video 
                  src={activeItem.src} 
                  controls 
                  autoPlay 
                  loop
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
                <img 
                  src={activeItem.src} 
                  alt={activeItem.title} 
                  className="w-full h-full object-contain bg-black"
                />
              )}
              
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                 <h2 className="text-2xl font-black text-white">{activeItem.title}</h2>
                 <p className="text-slate-300 font-mono text-sm mt-2">{activeItem.desc}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
