# Neural Pathfinder: Autonomous Robotics Navigation System

Neural Pathfinder is an advanced, production-grade autonomous robotics navigation platform developed to evaluate and deploy Deep Reinforcement Learning (DRL) agents in complex, simulated environments. The system integrates a robust ROS2-based simulation backplane with a high-fidelity React-based dashboard, orchestrated by a centralized FastAPI engine.

## Executive Summary

The project provides a complete, end-to-end pipeline for DRL agent training, evaluation, and real-time monitoring. By bridging the gap between raw neural network inference and physical robotic control loops, Neural Pathfinder enables researchers and engineers to visualize internal model approximations (Policy, Value, and Q-functions) alongside spatial LiDAR topology.

## Core Technological Pillars

### 1. Simulation Framework
- **Platform**: ROS2 Humble Hawksbill / Ubuntu 22.04 LTS via WSL2.
- **Simulator**: Gazebo Classic with TurtleBot3 configuration.
- **Sensor Integration**: 360-degree LiDAR, Odometry, and IMU data fused through the Rclpy middleware.

### 2. Deep Reinforcement Learning Core
- **Framework**: PyTorch.
- **Algorithms**:
    - **PPO (Proximal Policy Optimization)**: Stochastic policy optimization with clipped surrogate loss for stable warehouse and logistics navigation.
    - **TD3 (Twin Delayed DDPG)**: Deterministic policy optimization with twin critics for high-precision tactical defense operations.
- **Architecture**: 24-input LiDAR state space, dual dense hidden layers (256 units), and continuous velocity control outputs.

### 3. Operational Orchestrator
- **Engine**: FastAPI / Python 3.10.
- **Communication**: Low-latency WebSocket telemetry streaming at 10Hz.
- **Process Management**: Automated WSLg display routing, ROS2 daemon management, and algorithmic process lifecycle control.

### 4. High-Wired Interface (HWI)
- **Frontend**: React 19 / Vite.
- **Visuals**: Framer Motion for tactical animations and Recharts for neural performance curves.
- **Telemetry HUD**: Real-time RadarView (LiDAR), Neural Network Architecture Diagram, and Policy/Critic HUDs.

## System Orchestration

The platform features a proprietary "One-Click Ignition" sequence, managed via the `launch_system.sh` script.

### Automated Sequence
1. Initialization of the ROS2 Galactic/Humble environment within the WSL2 container.
2. Spawning of the Gazebo world and the robotic agent.
3. Dispatch of the selected DRL engine (PPO or TD3).
4. Establishment of the FastAPI telemetry bridge and WebSocket uplink.
5. Deployment of the React HWI for real-time operation.

## Installation and Deployment

### 1. Environment Requirements
- Windows 10/11 with WSL2 (Ubuntu 22.04).
- ROS2 Humble Desktop installed within the WSL2 distribution.
- NVIDIA drivers configured for WSLg support if GPU acceleration is required.

### 2. Backend Setup
1. Navigate to the `backend/` directory.
2. Install the Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Source the ROS2 environment:
   ```bash
   source /opt/ros/humble/setup.bash
   ```

### 3. Frontend Setup
1. Navigate to the `frontend/` directory.
2. Install the Node.js dependencies:
   ```bash
   npm install
   ```

### 4. Execution
Run the unified launch script from the project root:
```bash
./launch_system.sh ppo  # For PPO Warehouse Logistics
./launch_system.sh td3  # For TD3 Tactical Defense
```

## Team and Contributions

The Neural Pathfinder project is the result of a collaborative development effort by the following engineers:

- **Pavan Hosatti**: Lead Developer for Warehouse Logistics and Intelligent Traffic DRL systems.
- **Abhay**: Lead Developer for Tactical Defense Systems and TD3 algorithm integration.
- **Rishita**: Specialist in Environment Synthesis and simulation world modeling.
- **Sreejith Nair**: Lead Architect for Control Systems, System Integration, and HWI Dashboard.

## Integrated Research Documentation

The following research and deployment artifacts are integrated into the platform's ecosystem:

- **Warehouse Simulation (GitHub)**: [Pavan-Hosatti/Warehouse-simulation](https://github.com/Pavan-Hosatti/Warehouse-simulation)
- **Logistics Demo (Docker)**: [pavaninsights/warehouse-demo](https://hub.docker.com/r/pavaninsights/warehouse-demo)
- **Tactical Defense (GitHub)**: [Abhay-aps001/drl_nav_project-Abhay](https://github.com/Abhay-aps001/drl_nav_project-Abhay)
- **Defense Robot (Docker)**: [abhaydocx001/drl_nav_robot](https://hub.docker.com/r/abhaydocx001/drl_nav_robot)
- **Traffic Optimization (Docker)**: [pavaninsights/traffic-drl](https://hub.docker.com/r/pavaninsights/traffic-drl)

## License

This project is licensed under the MIT License. All rights reserved by the DSAI Society, IIIT Dharwad.
