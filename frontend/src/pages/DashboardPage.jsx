import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import RadarView from '../components/RadarView';
import { BACKEND_URL } from '../utils';

export default function DashboardPage() {
  const [systemMode, setSystemMode] = useState('manual'); // manual, training, testing
  const [trainAlgorithm, setTrainAlgorithm] = useState('TD3');
  const [activeScenario, setActiveScenario] = useState('logistics'); // logistics, healthcare, defense
  
  const [reward, setReward] = useState(0);
  const [progress, setProgress] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [telemetry, setTelemetry] = useState({ v: 0, w: 0, x: 0, y: 0, lidar: [] });
  const [trajectory, setTrajectory] = useState([]);
  
  const [recentLogs, setRecentLogs] = useState([]);
  const [backendOnline, setBackendOnline] = useState(false);
  const [chartData, setChartData] = useState([]);

  const logEndRef = useRef(null);
  const wsRef = useRef(null);

  const [simLoading, setSimLoading] = useState(false);
  const [procLoading, setProcLoading] = useState(false);
  const [simRunning, setSimRunning] = useState(false);
  const [procRunning, setProcRunning] = useState(false);

  useEffect(() => { 
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [recentLogs]);

  function addLog(tag, text) {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
    setRecentLogs(prev => [{ time, text, tag }, ...prev].slice(0, 100));
  }

  // Keyboard Teleop Control
  useEffect(() => {
    if (systemMode !== 'manual') return;

    const handleKeyDown = async (e) => {
      let linear = 0;
      let angular = 0;
      const key = e.key.toLowerCase();

      if (key === 'w') linear = 0.22;
      if (key === 's') linear = -0.22;
      if (key === 'a') angular = 1.2;
      if (key === 'd') angular = -1.2;

      if (linear !== 0 || angular !== 0) {
        try {
          await axios.post(`${BACKEND_URL}/teleop`, { linear, angular });
        } catch (err) {}
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [systemMode]);

  // WebSocket Sync
  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket('ws://localhost:8000/ws');
      ws.onopen = () => {
        setBackendOnline(true);
        addLog('sys', '[NODE] UP-LINK ESTABLISHED: 0x8000');
      };
      
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'telemetry') {
            const data = msg.data;
            setReward(data.reward || 0);
            setProgress(data.progress || 0);
            setAccuracy(data.accuracy || 0);
            
            setTelemetry(prev => ({
              ...prev,
              v: data.v ?? prev.v,
              w: data.w ?? prev.w,
              x: data.x ?? prev.x,
              y: data.y ?? prev.y,
              lidar: data.lidar ?? prev.lidar
            }));

            // Only update trajectory for mapping when moving
            if (Math.abs(data.x) > 0.01 || Math.abs(data.y) > 0.01) {
              setTrajectory(prev => [...prev, { x: data.x, y: data.y }].slice(-200));
            }

            setChartData(prev => {
               const last = prev[prev.length - 1];
               const newData = [...prev, { 
                 time: prev.length, 
                 ppo: data.algo === 'ppo' ? data.reward : (last?.ppo || 0),
                 td3: data.algo === 'td3' ? data.reward : (last?.td3 || 0)
               }].slice(-60);
               return newData;
            });
          } else if (msg.type === 'log') {
            addLog('drl', msg.data);
          } else if (msg.type === 'status') {
             setSimRunning(msg.data.sim === 'running');
             setProcRunning(msg.data.train === 'running');
             setTrainAlgorithm(msg.data.algo?.toUpperCase() || 'TD3');
             setActiveScenario(msg.data.scenario || 'logistics');
          }
        } catch (e) {}
      };
      
      ws.onclose = () => {
        setBackendOnline(false);
        setTimeout(connect, 3000);
      };
      wsRef.current = ws;
    };

    connect();
    return () => wsRef.current?.close();
  }, []);

  const handleLaunchSim = async () => {
    setSimLoading(true);
    addLog('ros', `[EXE] Dispatching Simulation Core: ${activeScenario.toUpperCase()}`);
    try {
      // Stage 1: ROS2 & Gazebo Launch
      await axios.post(`${BACKEND_URL}/launch-ros`);
      await axios.post(`${BACKEND_URL}/launch-sim`);
      
      // Stage 2: Wait for Gazebo physics and ROS2 topics to stabilize
      addLog('sys', `[SYS] Simulation online. Stabilizing LiDAR sensors...`);
      await new Promise(r => setTimeout(r, 6500));
      
      // Stage 3: Automatic Neural Handover (if not in manual mode)
      if (systemMode !== 'manual') {
        addLog('drl', `[CORE] Automated Mission Start: Loading ${systemMode.toUpperCase()} module [${trainAlgorithm}]`);
        const endpoint = systemMode === 'training' ? 'start-training' : 'start-testing';
        await axios.post(`${BACKEND_URL}/${endpoint}`);
      } else {
        addLog('sys', `[SYS] Environment Ready. Manual Control Overide Active.`);
      }
      
    } catch (e) {
       addLog('col', `[FAIL] Unified ignition failed: ${e.message}`);
    }
    setSimLoading(false);
  };

  const handleStartProcess = async () => {
    setProcLoading(true);
    const endpoint = systemMode === 'training' ? 'start-training' : 'start-testing';
    addLog('drl', `[CORE] Loading ${systemMode.toUpperCase()} module [${trainAlgorithm}]`);
    try {
      await axios.post(`${BACKEND_URL}/${endpoint}`);
    } catch (e) {
      addLog('col', `[FAIL] Module load failed: ${e.message}`);
    }
    setProcLoading(false);
  };

  const handleScenarioChange = async (scenario) => {
    try {
      await axios.post(`${BACKEND_URL}/set-scenario`, { scenario });
      setActiveScenario(scenario);
      if (simRunning) {
        addLog('sys', `[SYS] Environment update pending restart...`);
      }
    } catch (e) {}
  };

  const handleAlgorithmChange = async (algo) => {
    try {
      await axios.post(`${BACKEND_URL}/set-algorithm`, { algo: algo.toLowerCase() });
      setTrainAlgorithm(algo);
    } catch (e) {}
  };

  const handleHalt = async () => {
    try {
      await axios.post(`${BACKEND_URL}/stop-all`);
      setTrajectory([]);
      addLog('col', '[HALT] EMERGENCY PROTOCOL EXECUTED');
    } catch (e) {}
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto min-h-screen bg-[#050508] text-white selection:bg-indigo-500/30">
      {/* ── Background Grid ── */}
      <div className="fixed inset-0 neural-grid -z-10 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-rose-500/5 -z-10" />

      {/* ── HUD HEADER ── */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/5">
        <div className="relative">
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] rounded-full" />
          <h1 className="text-4xl font-black tracking-[0.1em] uppercase italic bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
            Neural Pathfinder <span className="text-indigo-400">01</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-[0.4em] animate-pulse">System Active</span>
            <span className="w-10 h-[1px] bg-white/10" />
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest italic">{activeScenario} Mission</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className={`px-5 py-2 rounded-xl hwi-glass flex items-center gap-3 border transition-all ${backendOnline ? 'border-emerald-500/20 text-emerald-400' : 'border-rose-500/20 text-rose-500 animate-pulse'}`}>
             <div className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500'}`} />
             <span className="text-[10px] font-mono font-bold tracking-widest">{backendOnline ? 'NODE_SYNC_STABLE' : 'NODE_SYNC_LOST'}</span>
          </div>

          <nav className="flex p-1.5 rounded-2xl hwi-glass border-white/5">
            {['manual', 'training', 'testing'].map(m => (
              <button key={m} onClick={() => setSystemMode(m)}
                className={`px-8 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all duration-500 ${systemMode === m ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
                {m}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-10">
        {/* ── LEFT COLUMN: Tactical & Scenarios ── */}
        <section className="col-span-12 lg:col-span-4 space-y-8">
          {/* Mission Scenarios */}
          <div className="hwi-glass p-8 rounded-[40px] tactical-border hover:border-indigo-500/20 transition-all duration-300">
            <h3 className="text-[9px] font-mono font-bold uppercase tracking-[0.4em] text-indigo-400 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              Mission Selection
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'logistics', name: 'Logistics', icon: '📦', world: 'World', desc: 'Efficient pathing' },
                { id: 'healthcare', name: 'Healthcare', icon: '🏥', world: 'House', desc: 'Soft navigation' },
                { id: 'defense', name: 'Defense', icon: '🛡️', world: 'Stage 4', desc: 'Tactical assault' }
              ].map(s => (
                <button key={s.id} onClick={() => handleScenarioChange(s.id)}
                  className={`group flex items-center justify-between p-5 rounded-3xl border transition-all duration-300 ${
                    activeScenario === s.id 
                      ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/10 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]' 
                      : 'bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/20 hover:bg-white/[0.04] hover:scale-[1.01]'
                  }`}>
                  <div className="flex items-center gap-4">
                    <span className={`text-2xl transition-all duration-300 ${activeScenario === s.id ? 'grayscale-0 scale-110' : 'grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100'}`}>
                      {s.icon}
                    </span>
                    <div className="text-left">
                      <div className="text-[11px] font-bold uppercase leading-none">{s.name}</div>
                      <div className="text-[9px] font-mono opacity-40 mt-1">{s.desc}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-[8px] font-mono opacity-30 uppercase">MAP: {s.world}</div>
                    {activeScenario === s.id && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500 glow-dot shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Ignition Control */}
          <div className="hwi-glass p-8 rounded-[40px] relative overflow-hidden hud-scanline hover:border-white/10 transition-all duration-300">
             <div className="space-y-4 mb-8">
               <button disabled={simRunning || simLoading} onClick={handleLaunchSim}
                 className={`group w-full py-5 rounded-3xl font-black text-sm uppercase tracking-widest transition-all duration-300 relative overflow-hidden ${
                   simRunning 
                     ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/20' 
                     : simLoading
                     ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 cursor-wait'
                     : 'glow-button-indigo text-white hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/30'
                 }`}>
                 {simRunning && (
                   <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                 )}
                 <span className="relative z-10 flex items-center justify-center gap-2">
                   {simRunning ? '✓ Sim Engine Online' : simLoading ? '⏳ Processing...' : '🚀 Launch Environment'}
                 </span>
               </button>
               
               <div className="flex gap-3">
                 {['PPO', 'TD3'].map(algo => (
                   <button key={algo} onClick={() => handleAlgorithmChange(algo)}
                     className={`flex-1 py-3 rounded-2xl text-[10px] font-bold border transition-all duration-300 ${
                       trainAlgorithm === algo 
                         ? 'bg-gradient-to-br from-indigo-500/20 to-violet-500/10 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/20 scale-105' 
                         : 'border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/20 hover:bg-white/[0.02]'
                     }`}>
                     {algo}
                   </button>
                 ))}
               </div>

               <button disabled={!simRunning || procRunning || procLoading} onClick={handleStartProcess}
                 className={`group w-full py-5 rounded-3xl font-black text-sm uppercase tracking-widest transition-all duration-300 relative overflow-hidden ${
                   procRunning 
                     ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/20' 
                     : procLoading
                     ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 cursor-wait'
                     : !simRunning
                     ? 'bg-white/[0.02] text-slate-600 border border-white/5 cursor-not-allowed opacity-50'
                     : 'glow-button-emerald text-white hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/30'
                 }`}>
                 {procRunning && (
                   <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                 )}
                 <span className="relative z-10 flex items-center justify-center gap-2">
                   {procRunning ? '✓ Runtime Loaded' : procLoading ? '⏳ Loading Weights...' : `⚡ Start ${systemMode === 'testing' ? 'Inference' : 'Training'}`}
                 </span>
               </button>
             </div>

             <button onClick={handleHalt} 
               className="group w-full py-4 rounded-3xl border-2 border-rose-500/30 text-rose-500 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-500/10 hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/20 transition-all duration-300 hover:scale-[1.02]">
               <span className="flex items-center justify-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                 Emergency Standby
               </span>
             </button>
          </div>

          <RadarView telemetry={telemetry} />
        </section>

        {/* ── RIGHT COLUMN: Metrics & Trajectory ── */}
        <section className="col-span-12 lg:col-span-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: 'Cumulative Reward', value: reward.toFixed(2), color: 'text-emerald-400', unit: 'PTS', icon: '📊' },
              { label: 'Model Accuracy', value: (accuracy * 100).toFixed(1), color: 'text-indigo-400', unit: '%', icon: '🎯' },
              { label: 'Current Velocity', value: telemetry.v.toFixed(2), color: 'text-violet-400', unit: 'm/s', icon: '⚡' },
            ].map((m, idx) => (
              <div key={m.label} className="hwi-glass p-8 rounded-[40px] group hover:border-white/20 transition-all duration-300 border-white/5 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/10 relative overflow-hidden">
                {/* Animated background gradient */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${idx === 0 ? 'from-emerald-500' : idx === 1 ? 'from-indigo-500' : 'from-violet-500'} to-transparent`} />
                
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{m.icon}</span>
                    {m.label}
                  </span>
                  <div className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-white/5'}`} />
                </div>
                <div className="flex items-baseline gap-2 relative z-10">
                  <span className={`text-5xl font-black ${m.color} tracking-tighter transition-all duration-300 group-hover:scale-110`}>{m.value}</span>
                  <span className="text-[10px] font-mono text-slate-500">{m.unit}</span>
                </div>
                
                {/* Progress bar for accuracy */}
                {m.label === 'Model Accuracy' && (
                  <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                      style={{ width: `${accuracy * 100}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-8">
            {/* Real-time Trajectory Map */}
            <div className="col-span-12 lg:col-span-7 hwi-glass rounded-[40px] p-8 h-[450px] flex flex-col border-white/5 hover:border-indigo-500/20 transition-all duration-300">
               <h3 className="text-[9px] font-mono font-bold uppercase tracking-[0.4em] text-indigo-400 mb-8 flex items-center gap-3">
                 <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                 Path Trajectory [X, Y]
                 {trajectory.length > 0 && (
                   <span className="ml-auto text-[8px] text-slate-500 normal-case tracking-normal">
                     {trajectory.length} points
                   </span>
                 )}
               </h3>
               <div className="flex-1 relative bg-gradient-to-br from-black/40 to-indigo-500/5 rounded-3xl overflow-hidden border border-white/10 shadow-inner">
                 {/* Grid overlay */}
                 <div className="absolute inset-0 opacity-20" 
                      style={{
                        backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                      }}
                 />
                 
                 <svg viewBox="-4 -4 8 8" className="w-full h-full transform scale-y-[-1] relative z-10">
                    {/* Grid lines */}
                    <path d="M-4 0 L4 0 M0 -4 L0 4" stroke="white" strokeWidth="0.02" strokeOpacity="0.2" />
                    
                    {/* Circular range indicators */}
                    {[1, 2, 3].map(radius => (
                      <circle key={radius} cx="0" cy="0" r={radius} fill="none" stroke="white" strokeWidth="0.01" strokeOpacity="0.05" strokeDasharray="0.1 0.1" />
                    ))}
                    
                    {/* Robot path with gradient */}
                    {trajectory.length > 1 && (
                      <>
                        <defs>
                          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="1" />
                          </linearGradient>
                        </defs>
                        <polyline
                          points={trajectory.map(p => `${p.x},${p.y}`).join(' ')}
                          fill="none"
                          stroke="url(#pathGradient)"
                          strokeWidth="0.06"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="trajectory-path"
                          style={{
                            filter: 'drop-shadow(0 0 4px rgba(99, 102, 241, 0.6))'
                          }}
                        />
                      </>
                    )}
                    
                    {/* Current position with pulse effect */}
                    {telemetry.x && (
                      <g>
                        <circle cx={telemetry.x} cy={telemetry.y} r="0.2" fill="#6366f1" opacity="0.3" className="animate-ping" />
                        <circle cx={telemetry.x} cy={telemetry.y} r="0.12" fill="#6366f1" className="animate-pulse" />
                        <circle cx={telemetry.x} cy={telemetry.y} r="0.08" fill="white" />
                      </g>
                    )}
                    
                    {/* Start point marker */}
                    {trajectory.length > 0 && (
                      <circle cx={trajectory[0].x} cy={trajectory[0].y} r="0.08" fill="#10b981" opacity="0.6" />
                    )}
                 </svg>
                 
                 <div className="absolute bottom-4 left-6 right-6 text-[8px] font-mono text-white/30 flex justify-between uppercase tracking-widest">
                   <span>Scale: 1m/Grid</span>
                   <span>Origin: 0,0</span>
                   <span>{telemetry.x?.toFixed(2)}, {telemetry.y?.toFixed(2)}</span>
                 </div>
               </div>
            </div>

            {/* Performance Comparison */}
            <div className="col-span-12 lg:col-span-5 hwi-glass rounded-[40px] p-8 h-[450px] flex flex-col border-white/5">
               <h3 className="text-[9px] font-mono font-bold uppercase tracking-[0.4em] text-indigo-400 mb-8">Model Performance</h3>
               <div className="flex-1 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData}>
                     <defs>
                       <linearGradient id="gPpo" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                       <linearGradient id="gTd3" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                     <XAxis dataKey="time" hide />
                     <YAxis hide domain={['auto', 'auto']} />
                     <Tooltip contentStyle={{ background: '#0a0a0c', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '9px' }} />
                     <Area type="monotone" dataKey="ppo" stroke="#6366f1" strokeWidth={3} fill="url(#gPpo)" />
                     <Area type="monotone" dataKey="td3" stroke="#10b981" strokeWidth={3} fill="url(#gTd3)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>

          <div className="hwi-glass rounded-[40px] p-10 border-white/5 hover:border-white/10 transition-all duration-300">
            <h3 className="text-[9px] font-mono font-bold uppercase tracking-[0.4em] text-slate-500 mb-8 flex items-center gap-4">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.6)]" /> 
              Neural Telemetry Stream
              {recentLogs.length > 0 && (
                <span className="ml-auto text-[8px] normal-case tracking-normal text-indigo-400">
                  {recentLogs.length} events
                </span>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-3 max-h-[180px] overflow-y-auto custom-scrollbar pr-4">
               {recentLogs.map((log, i) => (
                 <div key={i} className={`flex gap-4 text-[10px] font-mono border-l-2 pl-4 py-2 transition-all hover:bg-white/[0.03] rounded-r-lg ${
                   log.tag === 'col' ? 'border-rose-500 bg-rose-500/5' : 
                   log.tag === 'sys' ? 'border-indigo-500 bg-indigo-500/5' : 
                   log.tag === 'drl' ? 'border-emerald-500 bg-emerald-500/5' :
                   'border-white/10'
                 }`}>
                   <span className="text-white/15 shrink-0 select-none font-bold">[{log.time}]</span>
                   <span className={`${
                     log.tag === 'col' ? 'text-rose-400 font-bold' : 
                     log.tag === 'sys' ? 'text-indigo-400' : 
                     log.tag === 'drl' ? 'text-emerald-400' :
                     'text-slate-400'
                   }`}>
                     {log.text}
                   </span>
                 </div>
               ))}
               {recentLogs.length === 0 && (
                 <div className="col-span-2 text-center py-12 text-slate-600 text-xs font-mono">
                   Waiting for telemetry data...
                 </div>
               )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
