import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer } from 'recharts';

const TrainingPhaseBadge = ({ phase, episode }) => {
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
      case 'CONVERGENCE': return 200;
      default: return 200;
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

  const phaseProgress = ((episode - getPhaseStart(phase)) / 
    (getPhaseTarget(phase) - getPhaseStart(phase))) * 100;

  return (
    <div className="space-y-3">
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getPhaseColor(phase)}`}>
        <div className={`w-2 h-2 rounded-full ${phase === 'EXPLORATION' ? 'bg-rose-500' : phase === 'LEARNING' ? 'bg-amber-400' : 'bg-green-400'}`} />
        <span className="text-[10px] font-black tracking-widest uppercase">{phase}</span>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-[8px] text-white/40 uppercase tracking-wider">
          <span>Episode Progress</span>
          <span>Episode {episode} / 200</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            className={`h-full ${phase === 'EXPLORATION' ? 'bg-rose-500' : phase === 'LEARNING' ? 'bg-amber-500' : 'bg-green-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, phaseProgress))}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
};

const RewardChart = ({ data }) => {
  return (
    <div className="space-y-2">
      <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">Cumulative Reward</div>
      <div className="h-[120px] bg-black/30 rounded-xl border border-white/5 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line 
              type="monotone" 
              dataKey="reward" 
              stroke="#06b6d4" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const SuccessRateChart = ({ data }) => {
  return (
    <div className="space-y-2">
      <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">Success Rate %</div>
      <div className="h-[100px] bg-black/30 rounded-xl border border-white/5 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="rate" 
              stroke="#22c55e" 
              fill="url(#successGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, color = 'text-white' }) => (
  <div className="bg-black/30 rounded-xl p-3 border border-white/5 text-center">
    <div className="text-[7px] text-white/40 uppercase tracking-wider mb-1">{label}</div>
    <div className={`font-mono text-sm font-bold ${color}`}>{value}</div>
  </div>
);

const MetricsGrid = ({ episode, successRate, avgReward, collisions, timeToGoal, policyLoss }) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      <MetricCard label="Episode" value={episode} color="text-cyan-400" />
      <MetricCard label="Success" value={`${(successRate * 100).toFixed(1)}%`} color="text-green-400" />
      <MetricCard label="Avg Rew" value={avgReward.toFixed(1)} color="text-purple-400" />
      <MetricCard label="Collide" value={collisions} color="text-rose-400" />
      <MetricCard label="Time/Goal" value={`${timeToGoal}s`} color="text-amber-400" />
      <MetricCard label="Pol Loss" value={policyLoss.toFixed(4)} color="text-blue-400" />
    </div>
  );
};

export { TrainingPhaseBadge, RewardChart, SuccessRateChart, MetricsGrid };
