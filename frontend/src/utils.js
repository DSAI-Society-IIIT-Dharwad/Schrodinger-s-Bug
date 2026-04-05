import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const BACKEND_URL = 'http://localhost:8000';
export const SOCKET_URL = 'ws://localhost:8000/ws';


export const generateEpisodeData = (count = 100) => {
  return Array.from({ length: count }).map((_, i) => {
    const progress = i / count;
    const baseReward = -150 + (progress * 280);
    const noise = (Math.sin(i / 3) * 15) + (Math.random() * 25);
    const success = Math.min(100, (progress * 85) + 15 + (Math.random() * 10));
    
    return {
      episode: i + 1,
      reward: baseReward + noise,
      avg_reward: baseReward + (noise / 2),
      success_rate: success,
      collision_rate: Math.max(0, 0.4 - (progress * 0.35) + (Math.random() * 0.05)),
      steps: Math.floor(400 - (progress * 250) + (Math.random() * 50))
    };
  });
};

export const generateMockTelemetry = (step, algo = 'ppo') => {
  const isPPO = algo === 'ppo';
  const progress = (step % 500) / 500;
  const time = Date.now() / 1000;
  
  // Calculate dynamic X, Y for trajectory (circular path)
  const radius = 2.5;
  const angle = progress * Math.PI * 2;
  const x = radius * Math.sqrt(progress) * Math.cos(angle);
  const y = radius * Math.sqrt(progress) * Math.sin(angle);

  return {
    type: 'telemetry',
    data: {
      reward: (isPPO ? 40 : 55) + Math.random() * 5 + (progress * 20),
      avg_reward: (isPPO ? 38 : 52) + (progress * 15),
      steps: step,
      collision_rate: Math.max(0, 0.05 - (progress * 0.04)),
      success_rate: Math.min(100, (isPPO ? 92 : 98) + (progress * 5)),
      x,
      y,
      timestamp: time,
      v_value: Math.sin(progress * 10) * 5,
      q_value: Math.cos(progress * 10) * 10,
      action_linear: 0.15 + Math.random() * 0.05,
      action_angular: Math.sin(progress * 20) * 0.5,
      scan: Array.from({ length: 24 }).map((_, i) => {
        const base = 2.0;
        const scanAngle = (i / 24) * Math.PI * 2;
        const obstacle = Math.sin(angle + scanAngle) > 0.8 ? 0.5 : base;
        return obstacle + Math.random() * 0.2;
      })
    }
  };
};

export const TECH_STACK = [
  { name: 'ROS2 Humble', desc: 'Robot middleware for distributed systems', color: '#22d3ee' },
  { name: 'Gazebo', desc: 'High-fidelity physics simulation engine', color: '#818cf8' },
  { name: 'PyTorch', desc: 'Deep learning framework for PPO agent', color: '#f97316' },
  { name: 'PPO Algorithm', desc: 'Proximal Policy Optimization for stable RL', color: '#a78bfa' },
  { name: 'TurtleBot3', desc: 'Compact mobile robot platform (Burger)', color: '#34d399' },
  { name: 'WSL2', desc: 'Windows Subsystem for Linux integration', color: '#f472b6' },
];

export const APPLICATIONS = [
  { title: 'Warehouse Automation', desc: 'Autonomous inventory transport and shelf navigation in dynamic warehouse environments.', icon: '🏭' },
  { title: 'Healthcare Robotics', desc: 'Safe autonomous delivery of medicine and supplies in hospital corridors.', icon: '🏥' },
  { title: 'Smart Manufacturing', desc: 'Intelligent material handling with obstacle avoidance on factory floors.', icon: '⚙️' },
  { title: 'Search & Rescue', desc: 'Autonomous exploration of hazardous environments for survivor detection.', icon: '🔍' },
];
