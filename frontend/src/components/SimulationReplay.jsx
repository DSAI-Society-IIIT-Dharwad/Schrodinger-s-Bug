import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import axios from 'axios';
import { BACKEND_URL } from '../utils';

const SimulationReplay = () => {
  const [trajectories, setTrajectories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchTrajectories = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/trajectories`);
        if (mounted && res.data && Array.isArray(res.data.trajectories)) {
          setTrajectories(res.data.trajectories);
        }
      } catch (e) {
        // Suppress errors dynamically so it doesn't spam console if backend isn't ready
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    fetchTrajectories();
    const id = setInterval(fetchTrajectories, 2000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const latestPoint = trajectories[trajectories.length - 1];

  return (
    <div className="hwi-glass p-6 h-[450px] flex flex-col rounded-[32px] border border-white/5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-6 z-10">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-300">Live Mission Trajectory</h4>
          <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">Real-time Top-Down Sensor Plot</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse glow-dot" />
          <span className="text-[9px] text-indigo-300 font-bold uppercase">Uplink Active</span>
        </div>
      </div>

      <div className="flex-1 w-full relative z-10 bg-black/40 rounded-3xl border border-white/5 p-4 overflow-hidden flex items-center justify-center">
        {loading && trajectories.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm z-50 rounded-3xl">
            <div className="text-indigo-400 font-mono text-xs animate-pulse tracking-widest uppercase flex items-center gap-2">
               <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
               Waiting for coordinates...
            </div>
          </div>
        )}
        
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            {/* Fine Grid Background */}
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="x" 
              unit="m" 
              domain={[-4, 4]} 
              stroke="#ffffff15" 
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="y" 
              unit="m" 
              domain={[-4, 4]} 
              stroke="#ffffff15" 
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3', stroke: '#ffffff20' }} 
              contentStyle={{ backgroundColor: '#050508', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px' }}
              itemStyle={{ color: '#818cf8', fontSize: '12px', fontWeight: 'bold' }}
              labelStyle={{ display: 'none' }}
            />
            <Scatter 
              name="Robot Path" 
              data={trajectories} 
              fill="#6366f1" 
              line={{ stroke: '#6366f1', strokeWidth: 2, opacity: 0.6 }}
              shape="circle"
            />
            {/* Draw a larger impact point for the latest position if it exists */}
            {latestPoint && (
              <Scatter 
                name="Current Location" 
                data={[latestPoint]} 
                fill="#22d3ee" 
                shape="cross"
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-white/5 pt-4 z-10">
        {[
          { label: 'Data Points', value: trajectories.length },
          { label: 'Latest X', value: latestPoint?.x?.toFixed(2) || '0.00' },
          { label: 'Latest Y', value: latestPoint?.y?.toFixed(2) || '0.00' },
        ].map(s => (
          <div key={s.label}>
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{s.label}</div>
            <div className="text-sm font-bold text-white tracking-widest">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimulationReplay;
