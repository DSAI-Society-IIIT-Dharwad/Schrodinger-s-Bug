# Neural Pathfinder HWI: Advanced Robotics Control Interface

The Neural Pathfinder HWI (High-Wired Interface) is the authoritative frontend dashboard for the autonomous robotics navigation system. It provides high-fidelity, real-time visualization of neural decision-making processes, sensor topology, and agent performance analytics.

## System Overview

The interface is built upon a modern React architecture, utilizing Framer Motion for tactical animations and Recharts for performance curves. It serves as the primary observation deck for monitoring PPO and TD3 agent activity in the simulated environment.

## Key Features

- **Real-Time Neural HUD**: Live visualization of Policy, Value, and Q-function approximations.
- **Spatial Topology View**: High-frequency RadarView for LiDAR sensor data visualization.
- **Multi-Agent Telemetry**: Dedicated WebSocket streams for PPO (Warehouse) and TD3 (Defense) mission modes.
- **Deep Model Visualizer**: SVG-based diagram showing the 24-input LiDAR state pass through dense hidden layers to policy outputs.
- **Historical Analysis**: Cross-algorithm comparison engine for evaluating success rates and collision statistics over multiple training sessions.

## Technical Architecture

- **Framework**: React 19
- **Build Engine**: Vite
- **Styling**: Tailwind CSS with Glassmorphism configuration
- **Animation**: Framer Motion
- **Visualization**: Recharts / SVG
- **Middleware**: useAlgoWebSocket hook for algorithm-specific telemetry sync

## Installation and Deployment

### 1. Prerequisites
- Node.js 18.0 or higher
- npm or yarn
- Backend system (Neural Pathfinder Backend) active

### 2. Setup
Install the required dependencies:
```bash
npm install
```

### 3. Execution
Launch the development interface:
```bash
npm run dev
```

The interface will be accessible at `http://localhost:5173`.

## UI Navigation

- **Dashboard**: Real-time situational awareness and mission control.
- **Neural HUD**: Deep dive into neural network activations and model confidence.
- **Analytics**: Long-term convergence curves and efficiency metrics.
- **Comparison**: Side-by-side performance evaluation of PPO and TD3 agents.
- **Gallery**: High-fidelity media captures of previous mission success states.

## Team and Documentation

The dashboard was developed by the Neural Pathfinder core team: Sreejith Nair, Pavan Hosatti, Abhay, and Rishita. It integrates research from multiple Docker and GitHub repositories within the collective.

## License

This project is licensed under the MIT License.
