import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  useGLTF, 
  Environment, 
  Grid,
  Html,
  ContactShadows,
  MeshReflectorMaterial
} from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, ResponsiveContainer
} from 'recharts';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Compass,
  Cpu,
  Sparkles,
  RotateCcw,
  Play,
  Terminal,
  ChevronDown,
  ChevronUp,
  Trash2,
  Wifi,
  WifiOff,
  Activity,
  Brain,
  TrendingUp,
  AlertTriangle,
  Pause,
  SkipForward,
  GraduationCap,
  Zap
} from 'lucide-react';
import { roverState } from './stateManager.js';
import { controlsHandler } from './controlsHandler.js';
import { wsManager } from './websocketManager.js';
import { LidarDisplay, OdometryData, RewardBreakdown } from './SensorPanel.jsx';
import { TrainingPhaseBadge, RewardChart, SuccessRateChart, MetricsGrid } from './RightPanel.jsx';
import BottomControlBar from './BottomControlBar.jsx';
import TelemetryLog from './TelemetryLog.jsx';

// --- Synthetic Audio Engine ---
const useAudio = () => {
  const ctx = useRef(null);
  const engineOsc = useRef(null);
  const engineGain = useRef(null);

  const init = () => {
    if (ctx.current && ctx.current.state !== 'closed') {
      if (ctx.current.state === 'suspended') ctx.current.resume();
      return;
    }
    ctx.current = new (window.AudioContext || window.webkitAudioContext)();
    engineGain.current = ctx.current.createGain();
    engineGain.current.gain.value = 0;
    engineGain.current.connect(ctx.current.destination);
    engineOsc.current = ctx.current.createOscillator();
    engineOsc.current.type = 'sawtooth';
    engineOsc.current.frequency.value = 40;
    engineOsc.current.connect(engineGain.current);
    engineOsc.current.start();
  };

  useEffect(() => {
    const handle = () => { if (ctx.current && ctx.current.state === 'suspended') ctx.current.resume(); };
    window.addEventListener('click', handle, { once: true });
    return () => {
      window.removeEventListener('click', handle);
      try {
        if (engineOsc.current) engineOsc.current.stop();
        if (ctx.current) ctx.current.close();
      } catch(e) {}
    };
  }, []);

  const playBeep = (freq = 800, dur = 0.1) => {
    if (!ctx.current || ctx.current.state === 'closed') return;
    if (ctx.current.state === 'suspended') ctx.current.resume();
    const osc = ctx.current.createOscillator();
    const g = ctx.current.createGain();
    osc.connect(g);
    g.connect(ctx.current.destination);
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.1, ctx.current.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.current.currentTime + dur);
    osc.start();
    osc.stop(ctx.current.currentTime + dur);
  };

  const setEngineSfx = (speed) => {
    if (!engineGain.current || !ctx.current || ctx.current.state === 'closed') return;
    if (ctx.current.state === 'suspended') ctx.current.resume();
    engineGain.current.gain.setTargetAtTime(Math.min(speed * 0.05, 0.2), ctx.current.currentTime, 0.1);
    engineOsc.current.frequency.setTargetAtTime(40 + speed * 8, ctx.current.currentTime, 0.1);
  };

  return { init, playBeep, setEngineSfx };
};

// --- Configuration ---
const MODEL_URL = "/leo_rover.glb";

const THEMES = {
  moon: { 
    name: "Lunar", accent: "#06b6d4", bg: "#020617", ground: "#1e293b", fog: "#0f172a",
    gradient: ["#020617", "#0f172a"] 
  },
  mars: { 
    name: "Mars", accent: "#f97316", bg: "#1a0f0a", ground: "#43281c", fog: "#2d1b14",
    gradient: ["#1a0f0a", "#2d1b14"]
  },
  deep: { 
    name: "Deep", accent: "#a855f7", bg: "#05000a", ground: "#0d0118", fog: "#0a0015",
    gradient: ["#05000a", "#0a0015"]
  }
};

// --- Sub-Components ---


const FloatingHUD = ({ children, title, icon: Icon, className = "", isCollapsible = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-slate-950/80 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col ${className}`}
    >
      <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-xl"><Icon size={16} className="text-cyan-400" /></div>
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/80">{title}</span>
        </div>
        {isCollapsible && (
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white pointer-events-auto">
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        )}
      </div>
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const SimpleHUD = ({ battery, speed, signal }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-slate-950/40 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 flex gap-4 md:gap-8 items-center pointer-events-auto self-end mb-4 md:mb-8 mr-4 md:mr-8 shadow-2xl"
    >
      <div className="flex flex-col gap-1">
        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest text-left">Power</p>
        <div className="flex items-center gap-2">
          <div className="w-8 md:w-12 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              className={`h-full ${battery < 20 ? 'bg-rose-500' : 'bg-cyan-500'}`}
              animate={{ width: `${battery}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-cyan-400">{Math.round(battery)}%</span>
        </div>
      </div>
      <div className="w-px h-6 bg-white/10" />
      <div className="flex flex-col gap-1">
        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest text-left">Velocity</p>
        <p className="text-xs font-mono text-white/80">{speed.toFixed(1)} <span className="text-[8px] text-white/20 uppercase">m/s</span></p>
      </div>
      <div className="w-px h-6 bg-white/10 hidden sm:block" />
      <div className="flex flex-col gap-1 hidden sm:flex">
        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest text-left">Signal</p>
        <div className="flex gap-0.5 items-end h-3">
          {[1,2,3,4].map(i => (
            <div key={i} className={`w-0.5 rounded-full ${i <= signal ? 'bg-cyan-500' : 'bg-white/5'}`} style={{ height: `${i * 2 + 3}px` }} />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const Block = ({ item, onRemove }) => (
  <div className="relative group px-2 mb-1">
    <div className={`h-11 flex items-center gap-3 px-3 rounded-xl border border-white/10 bg-slate-900/90 hover:bg-slate-800 transition-all cursor-grab active:cursor-grabbing shadow-lg`}>
      <div className={`w-1.5 h-6 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)] ${item.type === 'forward' ? 'bg-cyan-500' : 'bg-purple-500'}`} />
      <div className="flex-1 text-left">
        <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">{item.label}</span>
        <span className="ml-2 text-[10px] font-mono text-white/40">{item.value}</span>
      </div>
      <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 p-1.5 text-white/20 hover:text-rose-400 transition-all">
        <Trash2 size={14} />
      </button>
    </div>
  </div>
);

// --- 3D Scene Components ---

// Procedural Terrain Height Function (Shared between Rover and Terrain)
const getHeight = (x, z) => {
  const dFromOrigin = Math.sqrt(x*x + z*z);
  // Flat landing zone at origin, transition starts at 15m and fully alien by 40m
  const blend = Math.max(0, Math.min(1, (dFromOrigin - 10) / 25));

  // Base rolling hills (large scale)
  let h = Math.sin(x * 0.04) * 4 + Math.cos(z * 0.04) * 4;
  
  // Moderate hills (medium scale)
  h += Math.sin(x * 0.15) * 1.5 + Math.cos(z * 0.15) * 1.5;
  
  // Rocks and jagged features (high scale)
  const rockLayer = Math.sin(x * 1.2) * Math.cos(z * 1.2);
  h += rockLayer * 0.4;

  // Apply blending factor to the terrain features
  h *= blend;
  
  // Craters (blended to prevent holes in the flat landing zone)
  const cx = 50, cz = 50, r = 25, d = 12;
  const dist = Math.sqrt((x-cx)**2 + (z-cz)**2);
  if (dist < r) h -= (d * (1 - (dist/r)**2)) * blend;
  
  return h;
};

function Rover({ position = [0, 5, 0], keys, speed, isManual, isRunning, missionCommand, onUpdateTelemetry, theme, resetKey }) {
  const { scene } = useGLTF(MODEL_URL);
  const t = THEMES[theme];
  const ref = useRef();

  // Internal State for Kinematics
  const driveState = useRef({
    speed: 0,
    angle: 0,
    x: position[0],
    z: position[2]
  });

  // Handle Reset Signal
  useEffect(() => {
    driveState.current = {
      speed: 0,
      angle: 0,
      x: position[0],
      z: position[2]
    };
    if (ref.current) {
        ref.current.position.set(position[0], 5, position[2]);
        ref.current.rotation.set(0, 0, 0);
    }
  }, [resetKey]);

  const wheelsRef = useRef([]);
  useEffect(() => {
    wheelsRef.current = [];
    scene.traverse((n) => {
      const name = n.name.toLowerCase();
      if (n.isMesh && (name.includes('wheel') || name.includes('tire') || name.includes('tyre') || name.includes('rim'))) {
        wheelsRef.current.push(n);
      }
    });
  }, [scene]);

  const normalizedModel = useMemo(() => {
    const clone = scene.clone();
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const targetScale = 6 / Math.max(size.x, size.y, size.z);
    clone.scale.setScalar(targetScale);
    
    // Seat the model firmly on the base of the physics box
    clone.position.set(
      -center.x * targetScale, 
      -0.5 - (box.min.y * targetScale), // Flat floor seat
      -center.z * targetScale
    );
    
    clone.traverse((n) => {
      if (n.isMesh) {
        n.castShadow = true;
        n.receiveShadow = true;
        if (n.material) {
          n.material.envMapIntensity = 2;
        }
      }
    });
    return clone;
  }, [scene]);

  const { init, playBeep, setEngineSfx } = useAudio();
  const lastUpdate = useRef(0);

  useEffect(() => {
    if (isRunning || isManual) init();
  }, [isRunning, isManual]);

  useFrame((state, delta) => {
    let velocity = 0;
    let turn = 0;

    // Input Logic
    if (isRunning && missionCommand) {
      if (missionCommand.type === 'forward') velocity = 10;
      if (missionCommand.type === 'turn_right') turn = 1.5;
      if (missionCommand.type === 'turn_left') turn = -1.5;
      if (missionCommand.type === 'u_turn') turn = 2.0;
    } else if (isManual) {
      const rs = roverState.getState();
      if (rs.v > 0) {
        velocity = (rs.v / 30) * (speed * 100);
      } else {
        velocity = (rs.v / 30) * (speed * 60);
      }
      turn = (rs.t / 2.5) * 2;
    }

    setEngineSfx(Math.abs(velocity) + Math.abs(turn) * 8);

    // KINEMATIC MOVEMENT
    driveState.current.speed = THREE.MathUtils.lerp(driveState.current.speed, velocity, 0.1);
    driveState.current.angle += turn * delta;
    
    const moveDist = driveState.current.speed * delta;
    driveState.current.x += Math.sin(driveState.current.angle) * moveDist;
    driveState.current.z += Math.cos(driveState.current.angle) * moveDist;

    if (!ref.current) return;
    ref.current.position.x = driveState.current.x;
    ref.current.position.z = driveState.current.z;
    ref.current.rotation.y = driveState.current.angle;

    // KINEMATIC SLOPE ALIGNMENT (Pitch & Roll)
    const offset = 1.5; // Sampling distance
    const hCenter = getHeight(driveState.current.x, driveState.current.z);
    
    // Front/Back sampling for Pitch
    const fx = driveState.current.x + Math.sin(driveState.current.angle) * offset;
    const fz = driveState.current.z + Math.cos(driveState.current.angle) * offset;
    const bx = driveState.current.x - Math.sin(driveState.current.angle) * offset;
    const bz = driveState.current.z - Math.cos(driveState.current.angle) * offset;
    const hFront = getHeight(fx, fz);
    const hBack = getHeight(bx, bz);
    
    // Left/Right sampling for Roll
    const lx = driveState.current.x + Math.cos(driveState.current.angle) * offset;
    const lz = driveState.current.z - Math.sin(driveState.current.angle) * offset;
    const rx = driveState.current.x - Math.cos(driveState.current.angle) * offset;
    const rz = driveState.current.z + Math.sin(driveState.current.angle) * offset;
    const hLeft = getHeight(lx, lz);
    const hRight = getHeight(rx, rz);

    const pitch = Math.atan2(hFront - hBack, offset * 2);
    const roll = Math.atan2(hRight - hLeft, offset * 2);

    const rs = roverState.getState();
    const visualPitch = isManual ? (rs.v / 30) * 0.15 : 0; 
    const visualRoll = isManual ? -(rs.t / 2.5) * 0.15 : 0;

    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, pitch + visualPitch, 0.2);
    ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, roll + visualRoll, 0.2);
    ref.current.position.y = hCenter + 1.45; // Further increased offset to keep wheels absolutely clear of terrain noise

    // Optimized Wheel Spin
    const spin = (velocity !== 0 ? velocity : turn * 5) * delta * 5;
    wheelsRef.current.forEach(w => {
      w.rotation.x += spin; 
    });

    // Performance Optimization: Throttle Telemetry to 10Hz
    if (state.clock.elapsedTime - lastUpdate.current > 0.1) {
      onUpdateTelemetry({
        x: driveState.current.x,
        z: driveState.current.z,
        y: hCenter,
        rot: THREE.MathUtils.radToDeg(driveState.current.angle) % 360,
        speed: Math.abs(driveState.current.speed)
      });
      lastUpdate.current = state.clock.elapsedTime;
    }
  });

  return (
    <group ref={ref} name="rover_root">
      <primitive object={normalizedModel} />
      
      {/* HUD Orientation Aid - Raised to avoid clipping flat floor */}
      <group position={[0, -0.49, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4, 4.3, 64]} />
          <meshBasicMaterial color={t.accent} transparent opacity={0.6} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0, 6]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.4, 1.2, 4]} />
          <meshBasicMaterial color={t.accent} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

function Terrain({ theme }) {
  const t = THEMES[theme];
  const meshRef = useRef();

  // Procedurally modify the plane vertices to match the getHeight function
  // This guarantees the visual terrain exactly matches the kinematic math
  useEffect(() => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry;
      const pos = geometry.attributes.position;
      
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i); // Note: PlaneGeometry in ThreeJS is XY flat before rotation
        
        // Map visual geometry directly to the mathematical drivetrain model
        const z = getHeight(x, -y); 
        pos.setZ(i, z);
      }
      geometry.computeVertexNormals();
      pos.needsUpdate = true;
    }
  }, []);

  return (
    <group>
      <mesh ref={meshRef} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        {/* High res plane for procedural displacement */}
        <planeGeometry args={[1000, 1000, 256, 256]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={40}
          roughness={1}
          depthScale={1.5}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#101015"
          metalness={0.6}
        />
      </mesh>
    </group>
  );
}

function BackgroundGradient({ theme }) {
  const t = THEMES[theme];
  
  const canvas = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    const grad = context.createRadialGradient(256, 256, 0, 256, 256, 400);
    grad.addColorStop(0, t.gradient[1]);
    grad.addColorStop(1, t.gradient[0]);
    context.fillStyle = grad;
    context.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(canvas);
  }, [theme]);

  return (
    <Environment background>
      <mesh scale={100}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial 
          side={THREE.BackSide} 
          map={canvas}
        />
      </mesh>
    </Environment>
  );
}

function LoadingScreen() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-4 whitespace-nowrap">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-cyan-400 font-black tracking-widest uppercase text-xs">Syncing Neural Core...</p>
      </div>
    </Html>
  );
}

// --- New UI Components ---
const ConnectionStatusIndicator = () => {
  const [status, setStatus] = useState('DISCONNECTED');
  useEffect(() => {
    return roverState.subscribe((s) => {
      if (s.status !== status) setStatus(s.status);
    });
  }, [status]);

  const config = {
    DISCONNECTED: { color: 'text-rose-500', bg: 'bg-rose-500/10 hover:bg-rose-500/20', border: 'border-rose-500/50', icon: WifiOff, pulse: '' },
    CONNECTING: { color: 'text-amber-400', bg: 'bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]', border: 'border-amber-500/50', icon: Activity, pulse: 'animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]' },
    CONNECTED: { color: 'text-green-400', bg: 'bg-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.4)]', border: 'border-green-500/50', icon: Wifi, pulse: '' }
  };
  const current = config[status] || config.DISCONNECTED;
  const Icon = current.icon;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border backdrop-blur-md pointer-events-auto transition-all duration-500 ${current.bg} ${current.border}`}>
      <div className={`relative flex items-center justify-center w-8 h-8 rounded-full bg-black/40 border border-white/5`}>
        <Icon size={16} className={`${current.color} ${current.pulse}`} />
        {status === 'CONNECTING' && <div className="absolute inset-0 border-2 border-amber-500/30 rounded-full animate-ping" />}
        {status === 'CONNECTED' && <div className="absolute inset-0 border-2 border-green-500/30 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />}
      </div>
      <div className="flex flex-col pr-2">
         <span className={`text-[8px] uppercase tracking-[0.3em] font-black md:opacity-50 ${current.color}`}>ESP32 LINK</span>
         <span className={`text-xs font-black tracking-widest ${current.color}`}>{status}</span>
      </div>
    </div>
  );
};

const DebugPanelOverlay = () => {
  const [data, setData] = useState({ v: 0, t: 0, lastPacketStr: '', status: 'DISCONNECTED', logs: [] });
  useEffect(() => {
    let lastTime = 0;
    return roverState.subscribe((s) => {
      const now = performance.now();
      if (now - lastTime > 100) {
        setData({ v: s.v, t: s.t, lastPacketStr: s.lastPacketStr, status: s.status, logs: s.logs });
        lastTime = now;
      }
    });
  }, []);

  return (
    <FloatingHUD title="ESP32 Debug" icon={Activity} className="pointer-events-auto w-full" isCollapsible={true}>
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
          <span className="text-[10px] text-white/50 tracking-widest uppercase">Target</span>
          <span className="font-mono text-cyan-400 text-xs">{data.status}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/40 rounded-xl p-3 border border-white/5">
            <p className="text-[9px] text-white/40 mb-1 tracking-widest uppercase">Velocity (V)</p>
            <p className="font-mono text-lg text-white">{(data.v || 0).toFixed(1).padStart(5, ' ')}</p>
          </div>
          <div className="bg-black/40 rounded-xl p-3 border border-white/5">
            <p className="text-[9px] text-white/40 mb-1 tracking-widest uppercase">Turn (T)</p>
            <p className="font-mono text-lg text-white">{(data.t || 0).toFixed(1).padStart(5, ' ')}</p>
          </div>
        </div>

        <div className="bg-black/40 rounded-xl p-3 border border-white/5">
          <p className="text-[9px] text-white/40 mb-1 tracking-widest uppercase">Last Payload</p>
          <p className="font-mono text-[10px] text-green-400 break-all">{data.lastPacketStr || "{}"}</p>
        </div>

        <div className="h-24 overflow-y-auto custom-scrollbar font-mono text-[9px] space-y-1 bg-black/40 rounded-xl p-2 border border-white/5">
          {data.logs.map((l, i) => (
            <div key={i} className="flex gap-2 opacity-80">
              <span className="text-white/20 shrink-0">[{l.time}]</span>
              <span className="text-cyan-300/80">{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </FloatingHUD>
  );
};

// --- DRL UI Components ---
const DRLProgressTracker = ({ drlState }) => {
  if (!drlState || !drlState.isRunning) return null;

  const getPhaseColor = (phase) => {
    switch(phase) {
      case 'EXPLORATION': return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
      case 'LEARNING': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'CONVERGENCE': return 'text-green-400 bg-green-500/10 border-green-500/30';
      default: return 'text-white/50 bg-white/5 border-white/10';
    }
  };

  const getPhaseTarget = (phase) => {
    switch(phase) {
      case 'EXPLORATION': return 20;
      case 'LEARNING': return 60;
      case 'CONVERGENCE': return 100;
      default: return 100;
    }
  };

  const getPhaseStart = (phase) => {
    switch(phase) {
      case 'EXPLORATION': return 0;
      case 'LEARNING': return 20;
      case 'CONVERGENCE': return 60;
      default: return 0;
    }
  };

  const phaseProgress = ((drlState.episode - getPhaseStart(drlState.phase)) / 
    (getPhaseTarget(drlState.phase) - getPhaseStart(drlState.phase))) * 100;

  return (
    <FloatingHUD title="DRL Training" icon={Brain} className="pointer-events-auto w-full" isCollapsible={true}>
      <div className="p-4 space-y-4">
        {/* Phase Indicator */}
        <div className="flex items-center justify-between">
          <div className={`px-3 py-1.5 rounded-lg border ${getPhaseColor(drlState.phase)}`}>
            <span className="text-[9px] font-black tracking-widest uppercase">{drlState.phase}</span>
          </div>
          <div className="text-right">
            <p className="text-[8px] text-white/40 uppercase tracking-widest">Episode</p>
            <p className="font-mono text-lg text-white">{drlState.episode}<span className="text-white/30 text-sm">/100</span></p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[8px] text-white/40 uppercase tracking-wider">
            <span>Phase Progress</span>
            <span>{Math.min(100, Math.max(0, phaseProgress)).toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              className={`h-full ${drlState.phase === 'EXPLORATION' ? 'bg-rose-500' : drlState.phase === 'LEARNING' ? 'bg-amber-500' : 'bg-green-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, phaseProgress))}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/40 rounded-xl p-3 border border-white/5">
            <p className="text-[8px] text-white/40 mb-1 tracking-widest uppercase flex items-center gap-1">
              <TrendingUp size={10} /> Success Rate
            </p>
            <p className="font-mono text-xl text-cyan-400">{(drlState.successRate * 100).toFixed(1)}%</p>
          </div>
          <div className="bg-black/40 rounded-xl p-3 border border-white/5">
            <p className="text-[8px] text-white/40 mb-1 tracking-widest uppercase flex items-center gap-1">
              <Activity size={10} /> Stability
            </p>
            <p className="font-mono text-xl text-purple-400">{(drlState.policyStability * 100).toFixed(0)}%</p>
          </div>
          <div className="bg-black/40 rounded-xl p-3 border border-white/5">
            <p className="text-[8px] text-white/40 mb-1 tracking-widest uppercase">Collisions</p>
            <p className="font-mono text-xl text-rose-400">{drlState.collisions}</p>
          </div>
          <div className="bg-black/40 rounded-xl p-3 border border-white/5">
            <p className="text-[8px] text-white/40 mb-1 tracking-widest uppercase">Distance</p>
            <p className="font-mono text-xl text-white">{drlState.distanceToGoal.toFixed(1)}m</p>
          </div>
        </div>

        {/* Velocity Indicator */}
        <div className="bg-black/40 rounded-xl p-3 border border-white/5">
          <p className="text-[8px] text-white/40 mb-2 tracking-widest uppercase">Current Velocity</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-cyan-500"
                animate={{ width: `${Math.min(100, Math.abs(drlState.velocity) * 12.5)}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <span className="font-mono text-sm text-cyan-400">{drlState.velocity.toFixed(1)} m/s</span>
          </div>
        </div>
      </div>
    </FloatingHUD>
  );
};

const DRLTelemetryStream = ({ drlLogs }) => {
  if (!drlLogs || drlLogs.length === 0) {
    return (
      <div className="p-8 text-center">
        <Brain size={32} className="mx-auto mb-3 text-white/20" />
        <p className="text-xs text-white/30">No telemetry data yet</p>
        <p className="text-[10px] text-white/20 mt-1">Enable DRL Training to start streaming</p>
      </div>
    );
  }

  const getLogColor = (type) => {
    switch(type) {
      case 'collision': return 'text-rose-400';
      case 'safety': return 'text-amber-400';
      case 'randomization': return 'text-purple-400';
      case 'success': return 'text-green-400';
      case 'episode': return 'text-cyan-300';
      case 'telemetry': return 'text-cyan-200/70';
      default: return 'text-white/60';
    }
  };

  return (
    <div className="p-2 font-mono text-[9px] h-full overflow-y-auto custom-scrollbar space-y-0.5">
      {drlLogs.map((log, i) => (
        <div key={i} className={`flex gap-3 opacity-90 hover:opacity-100 transition-opacity ${getLogColor(log.type)}`}>
          <span className="text-white/20 shrink-0">[{log.time}]</span>
          <span className="break-all">{log.msg}</span>
        </div>
      ))}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [theme, setTheme] = useState('moon');
  const [isManual, setIsManual] = useState(false);
  const [speed, setSpeed] = useState(0.2);
  const [activeTab, setActiveTab] = useState('blocks');
  const [showTerminal, setShowTerminal] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(false);
  const [currentCommand, setCurrentCommand] = useState(null);
  const [telemetry, setTelemetry] = useState({ x: 0, z: 0, rot: 0, speed: 0 });
  const [battery, setBattery] = useState(100);
  const [resetKey, setResetKey] = useState(0);
  const [logs, setLogs] = useState([{ msg: "System Link Stable.", time: "00:00:00" }]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [pythonCode, setPythonCode] = useState(`rover.forward(20)\nrover.turn_right(90)`);
  const [blocks, setBlocks] = useState([
    { id: '1', type: 'forward', value: 20, label: 'Drive' },
    { id: '2', type: 'turn_right', value: 90, label: 'Pivot' }
  ]);
  
  // DRL State
  const [drlState, setDrlState] = useState({
    isRunning: false,
    episode: 0,
    timestep: 0,
    distanceToGoal: 0,
    velocity: 0,
    angularVelocity: 0,
    reward: 0,
    cumulativeReward: 0,
    collisions: 0,
    successRate: 0,
    policyStability: 0,
    phase: 'EXPLORATION',
    logs: [],
    lidarRays: [],
    posX: 0,
    posY: 0,
    linearV: 0,
    angularV: 0,
    steps: 0,
    timeToGoal: 0,
    policyLoss: 0,
    algorithm: 'TD3'
  });
  const [terminalTab, setTerminalTab] = useState('system');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('TD3');
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [learnMode, setLearnMode] = useState(false);
  const [showTelemetryLog, setShowTelemetryLog] = useState(false);
  const [controlMode, setControlMode] = useState('DRL'); // 'DRL' or 'MANUAL'

  const keys = useRef({});
  useEffect(() => {
    controlsHandler.start();
    wsManager.start();
    return () => {
      controlsHandler.stop();
      wsManager.stop();
    };
  }, []);

  useEffect(() => {
    controlsHandler.setManualMode(isManual);
  }, [isManual]);

  // Subscribe to DRL state updates
  useEffect(() => {
    if (drlState.isRunning) {
      const unsubscribe = roverState.subscribe((state) => {
        if (state.drlState && state.drlState.isRunning) {
          setDrlState(state.drlState);
        }
      });
      return unsubscribe;
    }
  }, [drlState.isRunning]);

  const toggleDRLMode = () => {
    if (drlState.isRunning) {
      wsManager.stopDRLMode();
      setDrlState(prev => ({ ...prev, isRunning: false }));
      setControlMode('MANUAL');
    } else {
      wsManager.startDRLMode();
      setControlMode('DRL');
    }
  };

  const toggleControlMode = () => {
    const newMode = controlMode === 'DRL' ? 'MANUAL' : 'DRL';
    setControlMode(newMode);
    
    if (newMode === 'MANUAL' && drlState.isRunning) {
      // Pause DRL when switching to manual
      drlEngine.pause();
    } else if (newMode === 'DRL' && drlState.isRunning) {
      // Resume DRL when switching back
      drlEngine.resume();
    }
  };

  const handleAlgorithmChange = (algo) => {
    setSelectedAlgorithm(algo);
    drlEngine.setAlgorithm(algo);
  };

  const handleSpeedChange = (speed) => {
    setSpeedMultiplier(speed);
    drlEngine.setSpeedMultiplier(speed);
  };

  const toggleLearnMode = () => {
    setLearnMode(!learnMode);
    drlEngine.toggleLearnMode();
  };

  const handlePause = () => {
    drlEngine.pause();
  };

  const handleResume = () => {
    drlEngine.resume();
  };

  const handleReset = () => {
    drlEngine.reset();
  };

  const handleConverge = () => {
    drlEngine.converge();
  };

  const execute = async () => {
    if (isRunningRef.current) return;
    setIsRunning(true);
    isRunningRef.current = true;
    setLogs(prev => [{ msg: "INITIATING COMMAND SEQUENCE...", time: new Date().toLocaleTimeString() }, ...prev]);
    
    // Improved command line parsing
    const codeLines = activeTab === 'blocks' 
      ? blocks.map(b => `${b.type}(${b.value})`) 
      : pythonCode.toLowerCase().split('\n');

    for (const rawLine of codeLines) {
      if (!isRunningRef.current) break; // Allow stopping mid-sequence
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      // Match commands with or without 'rover.' prefix
      const match = line.match(/(?:rover\.)?(forward|turn_right|turn_left|u_turn)\s*\(\s*(\d+)\s*\)/);
      
      if (match) {
        const cmd = { type: match[1], value: parseInt(match[2]) };
        setCurrentCommand(cmd);
        setLogs(prev => [{ msg: `EXECUTING: ${cmd.type.toUpperCase()}(${cmd.value})`, time: new Date().toLocaleTimeString() }, ...prev]);
        
        const duration = cmd.type.includes('turn') ? cmd.value * 25 : cmd.value * 120;
        await new Promise(r => setTimeout(r, duration));
      } else {
        setLogs(prev => [{ msg: `SYNTAX ERROR: "${line}" NOT RECOGNIZED`, time: new Date().toLocaleTimeString() }, ...prev]);
      }
    }
    
    setCurrentCommand(null);
    setIsRunning(false);
    isRunningRef.current = false;
    setLogs(prev => [{ msg: "MISSION SEQUENCE COMPLETE.", time: new Date().toLocaleTimeString() }, ...prev]);
  };

  const resetMission = () => {
    setResetKey(prev => prev + 1);
    setIsRunning(false);
    isRunningRef.current = false;
    setCurrentCommand(null);
    setBattery(100);
    setTelemetry({ x: 0, z: 0, rot: 0, speed: 0 });
    setLogs(prev => [{ msg: "MISSION RESET. POINT ZERO REACHED.", time: new Date().toLocaleTimeString() }, ...prev]);
  };

  // Touch Controls for Manual Mode
  const touchHandlers = {
    w: (val) => controlsHandler.setKey('w', val),
    s: (val) => controlsHandler.setKey('s', val),
    a: (val) => controlsHandler.setKey('a', val),
    d: (val) => controlsHandler.setKey('d', val)
  };

  // Battery Drain Logic
  useEffect(() => {
    if (!isRunning && !isManual) return;
    const interval = setInterval(() => {
      setBattery(prev => Math.max(0, prev - 0.05));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isManual]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden font-sans select-none text-white">
      {/* 3D VIEWPORT */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows gl={{ antialias: true }} camera={{ position: [30, 25, 30], fov: 45 }}
          onCreated={({ gl }) => {
            gl.shadowMap.type = THREE.PCFShadowMap;
          }}>
          <Suspense fallback={<LoadingScreen />}>
            <BackgroundGradient theme={theme} />
            <fog attach="fog" args={[THEMES[theme].fog, 20, 200]} />
            <Environment preset="city" intensity={0.5} />
            <ambientLight intensity={0.8} />
            <directionalLight position={[10, 20, 10]} intensity={2} castShadow 
              shadow-mapSize={[1024, 1024]} 
              shadow-camera-left={-50} shadow-camera-right={50} shadow-camera-top={50} shadow-camera-bottom={-50}
            />
            <pointLight position={[0, 10, 0]} intensity={3} color={THEMES[theme].accent} />
            
            <Rover 
              keys={keys.current} 
              speed={speed} 
              isManual={isManual} 
              isRunning={isRunning} 
              missionCommand={currentCommand}
              onUpdateTelemetry={setTelemetry}
              theme={theme}
              resetKey={resetKey}
            />
            
            <Terrain theme={theme} />
            <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={30} blur={2.5} far={10} />
            <OrbitControls 
              makeDefault 
              maxDistance={100} 
              minDistance={10} 
              enableDamping 
              target={[telemetry.x, 0, telemetry.z]}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* TOP HUD */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 md:p-8 pointer-events-none flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex gap-4 pointer-events-auto">
          <div className="bg-slate-950/60 backdrop-blur-2xl border border-white/10 rounded-2xl px-4 md:px-6 py-3 md:py-4 flex gap-6 md:gap-10 shadow-2xl">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 bg-cyan-500/20 rounded-lg"><Compass size={18} className="text-cyan-400" /></div>
              <div className="text-left">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Pos</p>
                <p className="font-mono text-xs md:text-sm">{telemetry.x.toFixed(1)}, {telemetry.z.toFixed(1)}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-white/10 self-center" />
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 bg-green-500/20 rounded-lg"><Cpu size={18} className="text-green-400" /></div>
              <div className="text-left">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Alt</p>
                <p className="font-mono text-xs md:text-sm">{(telemetry.y || 0).toFixed(2)}m</p>
              </div>
            </div>
          </div>
          <div className="hidden md:flex ml-4">
            <ConnectionStatusIndicator />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-4 pointer-events-auto items-center">
           <div className="flex md:hidden">
             <ConnectionStatusIndicator />
           </div>
           <div className="hidden sm:flex bg-slate-950/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-1 gap-1 shadow-2xl">
              {Object.entries(THEMES).map(([k, t]) => (
                <button 
                  key={k} 
                  onClick={() => setTheme(k)} 
                  className={`px-3 md:px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all tracking-widest ${theme === k ? 'bg-white/10 text-white shadow-xl' : 'text-white/30 hover:text-white/60'}`}
                >
                  {t.name}
                </button>
              ))}
           </div>
           <button 
             onClick={resetMission}
             className="px-4 py-3 bg-slate-950/60 border border-white/10 hover:border-cyan-500 hover:text-cyan-400 text-white/40 rounded-2xl transition-all shadow-xl"
             title="Reset Mission Position"
           >
             <RotateCcw size={16} />
           </button>
           {/* Control Mode Toggle */}
           <button 
             onClick={toggleControlMode}
             className={`px-4 py-3 rounded-2xl border text-[10px] font-black tracking-[0.1em] transition-all backdrop-blur-2xl shadow-xl ${
               controlMode === 'MANUAL' 
                 ? 'bg-orange-500/20 border-orange-500 text-orange-400' 
                 : 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
             }`}
           >
             {controlMode === 'DRL' ? '🤖 DRL MODE' : '🎮 MANUAL MODE'}
           </button>
           {!drlState.isRunning && (
             <button 
               onClick={(e) => {
                 setIsManual(!isManual);
                 e.currentTarget.blur();
               }}
               className={`px-4 py-3 rounded-2xl border text-[10px] font-black tracking-[0.1em] transition-all backdrop-blur-2xl shadow-xl ${isManual ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-slate-950/60 border-white/10 text-white/40 hover:text-white'}`}
             >
               MANUAL: {isManual ? 'ON' : 'OFF'}
             </button>
           )}
           <button 
             onClick={toggleDRLMode}
             className={`px-4 py-3 rounded-2xl border text-[10px] font-black tracking-[0.1em] transition-all backdrop-blur-2xl shadow-xl ${drlState.isRunning ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-slate-950/60 border-white/10 text-white/40 hover:text-white'}`}
           >
             DRL TRAINING: {drlState.isRunning ? 'ON' : 'OFF'}
           </button>
           <div className="hidden lg:flex bg-green-500/10 border border-green-500/20 rounded-2xl px-6 py-4 text-[11px] font-black text-green-400 items-center gap-4 tracking-[0.2em] backdrop-blur-2xl shadow-xl">
             <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" /> LEO_ACTIVE
           </div>
        </div>
      </div>

      {/* MOBILE TOUCH CONTROLS - Only when manual mode is on */}
      {controlMode === 'MANUAL' && isManual && (
        <div className="absolute bottom-32 left-8 z-10 md:hidden flex flex-col gap-4 pointer-events-auto">
          <div className="flex justify-center">
            <button 
              onTouchStart={() => touchHandlers.w(true)} onTouchEnd={() => touchHandlers.w(false)}
              className="p-4 bg-white/5 border border-white/10 rounded-2xl text-cyan-400 active:bg-cyan-500/20 active:border-cyan-500 transition-all shadow-xl"
            ><ArrowUp size={24} /></button>
          </div>
          <div className="flex gap-4">
            <button 
              onTouchStart={() => touchHandlers.a(true)} onTouchEnd={() => touchHandlers.a(false)}
              className="p-4 bg-white/5 border border-white/10 rounded-2xl text-cyan-400 active:bg-cyan-500/20 active:border-cyan-500 transition-all shadow-xl"
            ><ArrowLeft size={24} /></button>
            <button 
              onTouchStart={() => touchHandlers.s(true)} onTouchEnd={() => touchHandlers.s(false)}
              className="p-4 bg-white/5 border border-white/10 rounded-2xl text-cyan-400 active:bg-cyan-500/20 active:border-cyan-500 transition-all shadow-xl"
            ><ArrowDown size={24} /></button>
            <button 
              onTouchStart={() => touchHandlers.d(true)} onTouchEnd={() => touchHandlers.d(false)}
              className="p-4 bg-white/5 border border-white/10 rounded-2xl text-cyan-400 active:bg-cyan-500/20 active:border-cyan-500 transition-all shadow-xl"
            ><ArrowRight size={24} /></button>
          </div>
        </div>
      )}

      {/* LEFT PANEL - SENSOR DATA (DRL Mode) or MISSION CONTROL (Manual Mode) */}
      {controlMode === 'DRL' && drlState.isRunning && (
        <div className="absolute top-24 md:top-32 left-4 md:left-8 w-[calc(100%-2rem)] md:w-80 lg:w-96 z-10 pointer-events-none flex flex-col gap-4">
          <FloatingHUD title="Sensor Data" icon={Activity} className="pointer-events-auto" isCollapsible={false}>
            <div className="p-4 space-y-4">
              {/* LiDAR Display */}
              <LidarDisplay lidarRays={drlState.lidarRays} />
              
              {/* Odometry Data */}
              <OdometryData 
                posX={drlState.posX}
                posY={drlState.posY}
                linearV={drlState.linearV}
                angularV={drlState.angularV}
              />
              
              {/* Reward Breakdown */}
              <RewardBreakdown 
                reward={drlState.reward}
                collisions={drlState.collisions}
                reachedGoal={drlState.distanceToGoal <= 2}
              />
            </div>
          </FloatingHUD>
        </div>
      )}

      {/* Manual Control Panel */}
      {controlMode === 'MANUAL' && (
        <div className="absolute top-24 md:top-32 left-4 md:left-8 w-[calc(100%-2rem)] md:w-80 lg:w-96 z-10 pointer-events-none flex flex-col gap-4">
          <FloatingHUD title="Mission Control" icon={Cpu} className="pointer-events-auto" isCollapsible={true}>
            <div className="p-1 flex bg-black/40 mx-4 mt-4 rounded-xl border border-white/5">
              <button onClick={() => setActiveTab('blocks')} className={`flex-1 py-2.5 text-[9px] font-black rounded-lg transition-all tracking-widest ${activeTab === 'blocks' ? 'bg-cyan-500 text-white shadow-lg' : 'text-white/30 hover:text-white/50'}`}>BLOCKS</button>
              <button onClick={() => setActiveTab('code')} className={`flex-1 py-2.5 text-[9px] font-black rounded-lg transition-all tracking-widest ${activeTab === 'code' ? 'bg-cyan-500 text-white shadow-lg' : 'text-white/30 hover:text-white/50'}`}>PYTHON</button>
            </div>

            <div className="px-4 mt-4">
              <div className="relative">
                <input 
                  value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                  placeholder="Talk to mission AI..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-cyan-500 shadow-inner"
                />
                <Sparkles size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400/30" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 px-2 space-y-2 custom-scrollbar max-h-[25vh] md:max-h-[30vh]">
              {activeTab === 'blocks' ? (
                <Reorder.Group axis="y" values={blocks} onReorder={setBlocks} className="space-y-2">
                  {blocks.map(b => (
                    <Reorder.Item key={b.id} value={b}>
                      <Block item={b} onRemove={() => setBlocks(blocks.filter(x => x.id !== b.id))} />
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              ) : (
                <textarea 
                  value={pythonCode} onChange={e => setPythonCode(e.target.value)}
                  className="w-full h-32 bg-transparent p-4 font-mono text-[10px] text-cyan-200 outline-none resize-none leading-relaxed"
                />
              )}
            </div>

            <div className="p-4 bg-black/20 border-t border-white/5 grid grid-cols-2 gap-2">
              <button onClick={() => setBlocks([...blocks, {id: String(Math.random()), type:'forward', value:10, label:'Drive'}])} className="py-2.5 bg-white/5 border border-white/5 rounded-xl text-[8px] font-black hover:bg-white/10 transition-all uppercase tracking-widest">FORWARD</button>
              <button onClick={() => setBlocks([...blocks, {id: String(Math.random()), type:'turn_right', value:90, label:'Pivot'}])} className="py-2.5 bg-white/5 border border-white/5 rounded-xl text-[8px] font-black hover:bg-white/10 transition-all uppercase tracking-widest">RIGHT</button>
              <button onClick={() => setBlocks([...blocks, {id: String(Math.random()), type:'turn_left', value:90, label:'Pivot'}])} className="py-2.5 bg-white/5 border border-white/5 rounded-xl text-[8px] font-black hover:bg-white/10 transition-all uppercase tracking-widest">LEFT</button>
              <button onClick={() => setBlocks([...blocks, {id: String(Math.random()), type:'u_turn', value:180, label:'Pivot'}])} className="py-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-[8px] font-black text-cyan-400 hover:bg-cyan-500/20 transition-all uppercase tracking-widest truncate">U-TURN</button>
            </div>
          </FloatingHUD>

          <button 
            onClick={execute}
            disabled={isRunning}
            style={{ backgroundColor: THEMES[theme].accent }}
            className="pointer-events-auto h-14 md:h-20 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex items-center justify-center gap-4 md:gap-6 text-sm font-black uppercase tracking-[0.3em] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isRunning ? <RotateCcw size={20} className="animate-spin" /> : <Play size={20} fill="currentColor" />}
            {isRunning ? "Operational..." : "Start Sequence"}
          </button>
        </div>
      )}

      {/* RIGHT PANEL - TRAINING METRICS (DRL Mode) or DEBUG (Manual Mode) */}
      {controlMode === 'DRL' && drlState.isRunning && (
        <div className="absolute top-32 md:top-40 right-4 md:right-8 w-[calc(100%-2rem)] md:w-80 z-10 pointer-events-none flex flex-col gap-4">
          <DRLProgressTracker drlState={drlState} />
        </div>
      )}

      {controlMode === 'MANUAL' && isManual && (
        <div className="absolute top-32 md:top-40 right-4 md:right-8 w-[calc(100%-2rem)] md:w-80 z-10 pointer-events-none flex flex-col gap-4">
          <DebugPanelOverlay />
        </div>
      )}

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-4 w-full px-4 pointer-events-none md:max-w-[800px]">
        <AnimatePresence>
          {showTerminal && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 160, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full max-w-[800px] bg-slate-950/70 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl pointer-events-auto"
            >
              {/* Terminal Tabs */}
              <div className="flex border-b border-white/10">
                <button 
                  onClick={() => setTerminalTab('system')}
                  className={`flex-1 py-2 text-[9px] font-black tracking-widest transition-all ${terminalTab === 'system' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/30 hover:text-white/50'}`}
                >
                  SYSTEM LOG
                </button>
                {drlState.isRunning && (
                  <button 
                    onClick={() => setTerminalTab('drl')}
                    className={`flex-1 py-2 text-[9px] font-black tracking-widest transition-all ${terminalTab === 'drl' ? 'bg-purple-500/20 text-purple-400' : 'text-white/30 hover:text-white/50'}`}
                  >
                    DRL TELEMETRY
                  </button>
                )}
              </div>
              
              {/* Terminal Content */}
              {terminalTab === 'system' ? (
                <div className="p-4 font-mono text-[9px] h-full overflow-y-auto custom-scrollbar space-y-1">
                  {logs.map((l, i) => (
                    <div key={i} className="flex gap-4 opacity-80 text-left">
                      <span className="text-white/20 shrink-0">[{l.time}]</span>
                      <span><span className="text-cyan-500 mr-2 opacity-50">/</span>{l.msg}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <DRLTelemetryStream drlLogs={drlState.logs} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        <button 
          onClick={() => setShowTerminal(!showTerminal)}
          className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-full px-6 md:px-10 py-3 flex items-center gap-3 text-[9px] font-black tracking-[0.2em] text-white/60 hover:text-white transition-all shadow-2xl pointer-events-auto"
        >
          <Terminal size={14} className={showTerminal ? "text-cyan-400" : ""} />
          {showTerminal ? "DISCONNECT" : "ESTABLISH UPLINK"}
        </button>
      </div>

      <div className="absolute bottom-12 right-0 z-10 p-4 pointer-events-none flex flex-col items-end">
        <SimpleHUD battery={battery} speed={telemetry.speed} signal={4} />
      </div>

      {/* Bottom Control Bar - DRL Mode Only */}
      {controlMode === 'DRL' && drlState.isRunning && (
        <BottomControlBar
          isRunning={!drlEngine.isPaused}
          selectedAlgorithm={selectedAlgorithm}
          speedMultiplier={speedMultiplier}
          learnMode={learnMode}
          onAlgorithmChange={handleAlgorithmChange}
          onSpeedChange={handleSpeedChange}
          onLearnModeToggle={toggleLearnMode}
          onPause={handlePause}
          onResume={handleResume}
          onReset={handleReset}
          onConverge={handleConverge}
        />
      )}

      {/* Telemetry Log - DRL Mode Only */}
      {controlMode === 'DRL' && drlState.isRunning && (
        <TelemetryLog 
          logs={drlState.logs}
          expanded={showTelemetryLog}
          onToggle={() => setShowTelemetryLog(!showTelemetryLog)}
        />
      )}

      <footer className="absolute bottom-0 left-0 right-0 h-8 md:h-10 bg-black/60 backdrop-blur-md border-t border-white/5 flex items-center justify-between px-4 md:px-10 text-[8px] font-black text-white/20 tracking-[0.2em] uppercase">
         <div className="flex gap-4 md:gap-12">
            <span className="flex items-center gap-2 md:gap-3"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500/40" /> LINK: 100%</span>
            <span className="hidden sm:inline opacity-50 text-left">RELAY: LEO-4</span>
         </div>
         <div className="flex items-center gap-2 md:gap-3 text-right">
            <Sparkles size={10} className="opacity-50" /> PRODUCTION READY
         </div>
      </footer>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
