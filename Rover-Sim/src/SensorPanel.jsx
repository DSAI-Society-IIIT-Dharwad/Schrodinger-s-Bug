import React from 'react';
import { motion } from 'framer-motion';

// LiDAR Polar Display Component
const LidarDisplay = ({ lidarRays }) => {
  const centerX = 100;
  const centerY = 100;
  const maxRadius = 80;
  
  return (
    <div className="relative w-full aspect-square">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Background circles */}
        {[0.25, 0.5, 0.75, 1].map((scale, i) => (
          <circle
            key={i}
            cx={centerX}
            cy={centerY}
            r={maxRadius * scale}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        ))}
        
        {/* Center dot */}
        <circle cx={centerX} cy={centerY} r="4" fill="#06b6d4" />
        
        {/* LiDAR rays */}
        {lidarRays && lidarRays.map((distance, i) => {
          const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
          const normalizedDist = Math.min(distance / 3.5, 1);
          const x = centerX + Math.cos(angle) * maxRadius * normalizedDist;
          const y = centerY + Math.sin(angle) * maxRadius * normalizedDist;
          const isObstacle = distance < 1.5;
          
          return (
            <g key={i}>
              <line
                x1={centerX}
                y1={centerY}
                x2={x}
                y2={y}
                stroke={isObstacle ? '#f43f5e' : '#06b6d4'}
                strokeWidth="2"
                opacity="0.8"
              />
              <circle
                cx={x}
                cy={y}
                r="2"
                fill={isObstacle ? '#f43f5e' : '#06b6d4'}
              />
            </g>
          );
        })}
      </svg>
      
      {/* Label */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-black text-white/60 tracking-widest uppercase">
        /scan — 360° LiDAR
      </div>
    </div>
  );
};

// Odometry Data Component
const OdometryData = ({ posX, posY, linearV, angularV }) => {
  return (
    <div className="space-y-3 p-3 bg-black/30 rounded-xl border border-white/5">
      <div className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2">
        /odom topic
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-white/40 text-[9px]">POS X:</span>
          <span className="ml-2 font-mono text-cyan-400">{posX.toFixed(3)} m</span>
        </div>
        <div>
          <span className="text-white/40 text-[9px]">POS Y:</span>
          <span className="ml-2 font-mono text-cyan-400">{posY.toFixed(3)} m</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-[9px] mb-1">
            <span className="text-white/40">LINEAR V</span>
            <span className="font-mono text-cyan-400">{linearV.toFixed(2)} m/s</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-cyan-500"
              animate={{ width: `${Math.min(100, linearV * 12.5)}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-[9px] mb-1">
            <span className="text-white/40">ANGULAR V</span>
            <span className="font-mono text-purple-400">{angularV.toFixed(2)} rad/s</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-purple-500"
              animate={{ width: `${Math.min(100, angularV * 50)}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Reward Breakdown Component
const RewardBreakdown = ({ reward, collisions, reachedGoal }) => {
  const [expanded, setExpanded] = React.useState(false);
  
  const distanceReward = Math.max(0, reward + (collisions * 50) - (reachedGoal ? 100 : 0));
  
  return (
    <div className="bg-black/30 rounded-xl border border-white/5 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center justify-between text-[9px] font-black text-white/60 uppercase tracking-widest hover:bg-white/5 transition-colors"
      >
        <span>Reward Breakdown</span>
        <span>{expanded ? '▼' : '▶'}</span>
      </button>
      
      {expanded && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          className="px-3 pb-3 space-y-2 text-xs"
        >
          <div className="flex justify-between">
            <span className="text-white/40">+ Distance:</span>
            <span className="font-mono text-green-400">+{distanceReward.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">- Collision:</span>
            <span className="font-mono text-rose-400">-{(collisions * 50).toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">+ Goal bonus:</span>
            <span className={`font-mono ${reachedGoal ? 'text-green-400' : 'text-white/40'}`}>
              {reachedGoal ? '+100' : '+0'}
            </span>
          </div>
          <div className="pt-2 border-t border-white/10 flex justify-between font-bold">
            <span className="text-white/60">= TOTAL:</span>
            <span className={`font-mono ${reward >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
              {reward.toFixed(1)}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export { LidarDisplay, OdometryData, RewardBreakdown };
