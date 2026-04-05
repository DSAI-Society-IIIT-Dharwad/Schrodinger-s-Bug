# Neural Pathfinder Backend: System Orchestration and DRL Control

The Neural Pathfinder backend is a specialized middleware designed to bridge high-level Deep Reinforcement Learning (DRL) policies with physical and simulated robotic control interfaces. It utilizes FastAPI for asynchronous communication and ROS2 for real-time robotic state management.

## System Overview

The core responsibility of the backend is to manage the lifecycle of DRL training agents, capture high-frequency telemetry from the robotic sensors, and broadcast processed state information to the frontend dashboard via WebSockets.

## Architecture and Components

The system is composed of several discrete layers:

- **FastAPI Engine**: Serves as the primary API bridge, handling mission dispatching, algorithm selection, and WebSocket multiplexing.
- **DRL Agent Layer**: Dedicated modules for PPO (Proximal Policy Optimization) and TD3 (Twin Delayed DDPG) implementation using PyTorch.
- **ROS2 Training Node**: A high-performance robotic node that executes the control-reward loop, manages the simulation environment, and performs sensor fusion (LiDAR, Odom).
- **Process Orchestrator**: Manages the multi-process execution required to synchronize Gazebo, ROS2, and the neural inference engines.

## Key Features

- **Multi-Algorithm Support**: Native implementation of both stochastic (PPO) and deterministic (TD3) policy gradients.
- **Asynchronous Telemetry**: Real-time sensor data broadcasting at 10Hz with minimal jitter.
- **Automated Lifecycle Management**: Handles the graceful startup and shutdown of Gazebo and ROS2 processes.
- **Integrated Metrics Capture**: Persistent logging of cumulative rewards, success rates, and collision statistics.

## Technical Specifications

- **Language**: Python 3.10
- **Framework**: FastAPI
- **Robotics Middleware**: ROS2 Humble Hawksbill
- **Neural Engine**: PyTorch
- **Communication Protocol**: WebSocket (JSON Payload)

## Installation and Deployment

### 1. Prerequisite Environment
- Ubuntu 22.04 LTS (Native or WSL2)
- ROS2 Humble Desktop
- Python 3.10 or higher

### 2. Dependency Installation
Initialize your virtual environment and install the required packages:
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Execution
Launch the backend server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```
Note: Use the root `launch_system.sh` script for full system orchestration.

## API Specification

- **POST /launch-system**: Dispatches the simulation and training engine for a specific mission.
- **POST /stop-system**: Terminates all active ROS2 and DRL processes.
- **GET /compare**: Retrieves historical metrics for cross-algorithm performance analysis.
- **GET /ws/{algo}**: High-frequency WebSocket stream for PPO or TD3 telemetry.

## Team and Acknowledgments

- **Lead Developers**: Pavan Hosatti, Abhay, Rishita, Sreejith Nair.
- **Governance**: DSAI Society, IIIT Dharwad.
- **Technologies**: Powered by Open Robotics (ROS2) and Meta AI (PyTorch).

## License

This project is licensed under the MIT License.
