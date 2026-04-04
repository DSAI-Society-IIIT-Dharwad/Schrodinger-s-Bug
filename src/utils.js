import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const BACKEND_URL = 'http://localhost:8000';
export const SOCKET_URL = 'ws://localhost:8000/ws';


export const generateEpisodeData = (count) => {
  return Array.from({ length: count }).map((_, i) => ({
    episode: i + 1,
    reward: -100 + (Math.log(i + 1) * 35) + Math.sin(i / 5) * 15 + (Math.random() * 10),
    success_rate: Math.min(100, Math.pow(i / count, 0.6) * 105 + Math.random() * 5),
    loss: Math.max(0.01, 0.5 - (i * 0.005) + Math.random() * 0.03),
  }));
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
