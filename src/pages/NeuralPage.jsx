import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldAlert, Cpu, Heart, AlertTriangle, MonitorPlay, Zap, ArrowRight, ChevronRight, Terminal } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import axios from 'axios';
import { useWebSocket } from '../hooks/useWebSocket';

// Assuming BACKEND_URL exists in utils
const BACKEND_URL = 'http://localhost:8000';

export default function NeuralPage() {
  const [telemetry, setTelemetry] = useState({ v: 0, w: 0, reward: 0, collision: false, episode: 0, distance: 0, state: 'Standby', progress: 0, success_rate: 0, accuracy: 0, algorithm: 'TD3' });
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState({ graphData: [] });
  const [filter, setFilter] = useState('ALL');
  const [activeAlgorithm, setActiveAlgorithm] = useState('TD3');
  const [scenario, setScenario] = useState('healthcare');
  const lastSpokenEpisode = React.useRef(-1);

  // Live training metrics from /ws/telemetry (Bug 5 & 6 fix)
  const { data: liveMetrics, connected: telemetryConnected } = useWebSocket('ws://localhost:8000/ws/telemetry');

  // When live metrics arrive, update telemetry state and graph
  useEffect(() => {
    if (!liveMetrics || liveMetrics.status === 'waiting') return;
    setTelemetry(prev => ({
      ...prev,
      reward: liveMetrics.reward ?? prev.reward,
      episode: liveMetrics.episode ?? prev.episode,
      success_rate: liveMetrics.success_rate ?? prev.success_rate,
      collision: (liveMetrics.collisions ?? 0) > 0,
      state: liveMetrics.phase ?? prev.state,
      algorithm: liveMetrics.algorithm ?? prev.algorithm,
      progress: Math.min(100, (liveMetrics.episode ?? 0) * 0.5),
      accuracy: liveMetrics.success_rate ?? prev.accuracy,
      v: liveMetrics.robot_x !== undefined ? Math.abs(liveMetrics.robot_x) : prev.v,
      distance: liveMetrics.avg_reward ?? prev.distance,
    }));

    // Build graph data from reward_history
    if (liveMetrics.reward_history && liveMetrics.reward_history.length > 0) {
      const graphData = liveMetrics.reward_history.map((r, i) => ({
        step: i,
        td3: liveMetrics.algorithm === 'TD3' ? r : null,
        ppo: liveMetrics.algorithm === 'PPO' ? r : null,
      }));
      setMetrics(prev => ({ ...prev, graphData }));
    }
  }, [liveMetrics]);
  
  // Legacy /ws connection for status/logs broadcast
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws');
    
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'log') {
        setLogs(prev => [msg.data, ...prev].slice(0, 100)); 
      }
    };

    // Fallback: Polling Recharts Metrics from /metrics endpoint
    const metricInterval = setInterval(async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/metrics`);
        if(res.data) {
          const { ppo_rewards = [], td3_rewards = [] } = res.data;
          const maxLen = Math.max(ppo_rewards.length, td3_rewards.length);
          if (maxLen > 0) {
            const graphData = [];
            for (let i = 0; i < maxLen; i++) {
               graphData.push({
                   step: i,
                   ppo: ppo_rewards[i] !== undefined ? ppo_rewards[i] : null,
                   td3: td3_rewards[i] !== undefined ? td3_rewards[i] : null
               });
            }
            setMetrics(prev => ({
              ...prev,
              graphData: prev.graphData.length > 0 ? prev.graphData : graphData,
            }));
          }
        }
      } catch (e) {
          // Silent catch for polling
      }
    }, 2000);

    return () => {
        socket.close();
        clearInterval(metricInterval);
    };
  }, []);

  const filteredLogs = logs.filter(log => {
      if (filter === 'ALL') return true;
      if (filter === 'TRAIN' && log.includes('[TEL]')) return true;
      if (filter === 'ERROR' && log.includes('error')) return true;
      if (filter === 'INFO' && !log.includes('[TEL]') && !log.includes('error')) return true;
      return false;
  });

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <Heart className="w-5 h-5 text-rose-500 animate-pulse" />
             <span className="text-xs font-mono text-rose-400 uppercase tracking-[0.3em]">
               {scenario} Mode — {scenario === 'healthcare' ? 'Baymax Assist' : 'Active Navigation'}
             </span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
            <MonitorPlay className="text-indigo-400 w-10 h-10" />
            Neural Pathfinder
          </h2>
          <p className="text-slate-400 mt-2 font-mono text-sm max-w-xl">
             Real-time autonomous navigation learning dashboard. Displaying active telemetry and predictive metrics from the Gazebo environment.
          </p>
        </div>

        <div className="flex flex-col gap-4 items-end">
          {/* Mode Switcher */}
          <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/5">
             {['defence', 'healthcare', 'commerce'].map(m => (
               <button
                 key={m}
                 onClick={() => {
                   setScenario(m);
                   axios.post(`${BACKEND_URL}/set-scenario`, { scenario: m }).catch(() => {});
                 }}
                 className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                   scenario === m ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                 }`}
               >
                 {m}
               </button>
             ))}
          </div>

          {/* Algorithm Toggle */}
          <div className="glass-card flex p-1.5 rounded-2xl items-center border-white/10">
          {['PPO', 'TD3'].map(algo => (
            <button
              key={algo}
              onClick={() => setActiveAlgorithm(algo)}
              className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                activeAlgorithm === algo 
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                 {algo === 'PPO' ? <Cpu className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                 {algo} Active
              </div>
            </button>
          ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column: Analytics & Graph */}
        <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
           
           <div className="glass-card p-6 border-t-4 border-t-indigo-500 flex flex-col h-[400px]">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="text-indigo-400 w-5 h-5" /> Live Reward Evolution
                </h3>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] uppercase font-mono text-emerald-400 tracking-wider">WebSocket Connected</span>
                </div>
             </div>

             <div className="flex-1 w-full min-h-0 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.graphData}>
                    <defs>
                      <linearGradient id="colorTd3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPpo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="step" hide />
                    <YAxis 
                        stroke="#475569" 
                        fontSize={10} 
                        tickFormatter={(v) => v.toFixed(0)} 
                        width={30}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                        itemStyle={{ color: '#00d1ff', fontWeight: 'bold' }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="td3" 
                        stroke="#818cf8" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorTd3)" 
                        isAnimationActive={false}
                        name="TD3 Reward"
                    />
                    <Area 
                        type="monotone" 
                        dataKey="ppo" 
                        stroke="#22d3ee" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorPpo)" 
                        isAnimationActive={false}
                        name="PPO Reward"
                    />
                  </AreaChart>
                </ResponsiveContainer>

                {/* Graph API Overlay alternative if empty */}
                {metrics.graphData.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm rounded-xl">
                     <p className="text-xs uppercase tracking-widest text-slate-400 font-mono">Waiting for training data...</p>
                  </div>
                )}
             </div>
           </div>

           <div className="grid grid-cols-3 gap-6">
              <div className="glass-card p-6">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</h3>
                  <span className="text-2xl font-black text-cyan-400">{telemetry.progress || 0}%</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5 shadow-inner">
                   <motion.div 
                     className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full"
                     initial={{ width: 0 }}
                     animate={{ width: `${telemetry.progress || 0}%` }}
                     transition={{ duration: 1 }}
                   />
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Success Rate</h3>
                  <span className="text-2xl font-black text-emerald-400">{((telemetry.success_rate || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5 shadow-inner">
                   <motion.div 
                     className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                     initial={{ width: 0 }}
                     animate={{ width: `${(telemetry.success_rate || 0) * 100}%` }}
                     transition={{ duration: 1 }}
                   />
                </div>
              </div>

              <div className="glass-card p-6 border-b-4 border-b-indigo-500">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Accuracy</h3>
                  <span className="text-2xl font-black text-indigo-400">{((telemetry.accuracy || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5 shadow-inner">
                   <motion.div 
                     className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full"
                     initial={{ width: 0 }}
                     animate={{ width: `${(telemetry.accuracy || 0) * 100}%` }}
                     transition={{ duration: 1 }}
                   />
                </div>
              </div>
           </div>

        </div>

        {/* Right Column: Status & Logs */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
          
          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Robot Status Panel</h3>
            
            <div className="flex items-center gap-4 mb-8">
               <div className={`p-4 rounded-full ${
                  telemetry.collision ? 'bg-rose-500/20 text-rose-500' :
                  telemetry.state === 'Avoiding' ? 'bg-amber-500/20 text-amber-500' :
                  telemetry.state === 'Goal Reached' ? 'bg-emerald-500/20 text-emerald-500' :
                  'bg-indigo-500/20 text-indigo-400'
               }`}>
                  {telemetry.collision ? <AlertTriangle className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
               </div>
               <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Current State</div>
                  <div className={`text-2xl font-black uppercase ${
                    telemetry.collision ? 'text-rose-500' :
                    telemetry.state === 'Avoiding' ? 'text-amber-500' :
                    telemetry.state === 'Goal Reached' ? 'text-emerald-500' :
                    'text-indigo-400'
                  }`}>
                    {telemetry.state || 'Standby'}
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex p-3 rounded-xl bg-white/5 border border-white/5 justify-between items-center">
                  <span className="text-xs font-mono text-slate-400 uppercase">Linear Velocity</span>
                  <span className="text-sm font-bold text-white">{telemetry.v?.toFixed(2)} m/s</span>
               </div>
               <div className="flex p-3 rounded-xl bg-white/5 border border-white/5 justify-between items-center">
                  <span className="text-xs font-mono text-slate-400 uppercase">Distance to Goal</span>
                  <span className="text-sm font-bold text-white">{telemetry.distance?.toFixed(2)} m</span>
               </div>
               <div className="flex p-3 rounded-xl bg-white/5 border border-white/5 justify-between items-center">
                  <span className="text-xs font-mono text-slate-400 uppercase">Current Episode</span>
                  <span className="text-sm font-bold text-indigo-400">#{telemetry.episode}</span>
               </div>
            </div>
          </div>

          <div className="glass-card flex-1 flex flex-col overflow-hidden border border-slate-700/50 min-h-[300px]">
            <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Terminal className="w-4 h-4" /> System Logs
               </h3>
               <div className="flex gap-2">
                 {['ALL', 'INFO', 'TRAIN', 'ERROR'].map(f => (
                   <button 
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`text-[9px] font-bold py-1 px-2 rounded font-mono transition-colors ${
                        filter === f ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-500 hover:text-white'
                      }`}
                   >
                     {f}
                   </button>
                 ))}
               </div>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar font-mono text-[10px] leading-relaxed space-y-1">
               <AnimatePresence>
                 {filteredLogs.map((log, i) => {
                   const isError = log.includes('error') || log.includes('ERROR');
                   const isTrain = log.includes('[TEL]');
                   return (
                     <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i} 
                        className={`truncate ${
                          isError ? 'text-rose-400' : 
                          isTrain ? 'text-emerald-400' : 
                          'text-slate-400'
                        }`}
                     >
                       <span className="opacity-30 mr-2">{'>'}</span>{log}
                     </motion.div>
                   )
                 })}
               </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
