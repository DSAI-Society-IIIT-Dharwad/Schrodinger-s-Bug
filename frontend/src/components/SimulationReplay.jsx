import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip } from 'recharts';
import axios from 'axios';
import { BACKEND_URL } from '../utils';

const SimulationReplay = () => {
  const [trajectories, setTrajectories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrajectories = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/trajectories`);
        if (res.data.trajectories) {
          setTrajectories(res.data.trajectories);
        }
      } catch (e) {
        console.error("Failed to fetch trajectories", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTrajectories();
    const id = setInterval(fetchTrajectories, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass-card p-6 h-[450px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-300">Live Learning Trajectory</h4>
          <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">Real-time (x, y) plot from DRL Agent</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-[9px] text-indigo-300 font-bold uppercase">Recording Active</span>
        </div>
      </div>

      <div className="flex-1 w-full relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm z-10 rounded-2xl">
            <div className="text-indigo-400 font-mono text-xs animate-pulse tracking-widest uppercase">Initializing Stream...</div>
          </div>
        )}
        
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="x" 
              unit="m" 
              domain={[-5, 5]} 
              stroke="#ffffff10" 
              tick={{ fill: '#64748b', fontSize: 10 }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="y" 
              unit="m" 
              domain={[-5, 5]} 
              stroke="#ffffff10" 
              tick={{ fill: '#64748b', fontSize: 10 }}
            />
            <ZAxis type="number" dataKey="reward" range={[50, 400]} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }} 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
            />
            <Scatter 
              name="Robot Path" 
              data={trajectories} 
              fill="#6366f1" 
              line={{ stroke: '#6366f1', strokeWidth: 2, opacity: 0.3 }}
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
        {[
          { label: 'Data Points', value: trajectories.length },
          { label: 'Latest X', value: trajectories[trajectories.length - 1]?.x || '0.00' },
          { label: 'Latest Y', value: trajectories[trajectories.length - 1]?.y || '0.00' },
        ].map(s => (
          <div key={s.label}>
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{s.label}</div>
            <div className="text-sm font-bold text-white">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimulationReplay;
