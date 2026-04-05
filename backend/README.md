# Schrödinger's Bug - Backend

Backend system for the DRL (Deep Reinforcement Learning) Robot project, providing APIs and services for robot control, training, and telemetry.

## Overview

This backend serves as the control node for a robotics system that uses Deep Reinforcement Learning (TD3 algorithm) for autonomous navigation. It provides REST APIs and WebSocket connections for real-time robot control, training management, and telemetry data streaming.

## Architecture

The backend consists of several key components:

- **FastAPI Application**: Main web server handling HTTP requests and WebSocket connections
- **Process Manager**: Manages ROS2 nodes and training processes
- **Training Module**: TD3-based deep reinforcement learning implementation
- **Telemetry Node**: Real-time sensor data collection and broadcasting
- **Plot Utilities**: Graph generation for training metrics visualization

## Features

- Real-time robot control via WebSocket
- DRL model training and management
- Live telemetry data streaming (LiDAR, odometry, velocity commands)
- Training metrics visualization
- Process lifecycle management
- CORS-enabled API for frontend integration

## Technology Stack

- Python 3.8+
- FastAPI - Web framework
- PyTorch - Deep learning framework
- ROS2 (Humble/Iron) - Robot operating system
- TD3 Algorithm - Twin Delayed Deep Deterministic Policy Gradient
- WebSocket - Real-time communication

## Prerequisites

- Python 3.8 or higher
- ROS2 (Humble Hawksbill or Iron Irwini)
- WSL2 with Ubuntu 22.04 (for Windows users)
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/DSAI-Society-IIIT-Dharwad/Schrodinger-s-Bug.git
cd Schrodinger-s-Bug/backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Install ROS2 dependencies:
```bash
sudo apt install ros-humble-rclpy ros-humble-sensor-msgs ros-humble-nav-msgs ros-humble-geometry-msgs ros-humble-std-msgs
```

## Project Structure

```
backend/
├── app.py                 # Main FastAPI application with WebSocket support
├── main.py               # Alternative entry point with WSL integration
├── train.py              # TD3 training implementation (ROS2 node)
├── telemetry_node.py     # Telemetry data collection ROS2 node
├── plot_graph.py         # Training metrics visualization
├── process_manager.py    # Process lifecycle management
├── requirements.txt      # Python dependencies
├── utils/                # Utility modules
│   ├── __init__.py
│   └── process_manager.py
└── logs/                 # Log files directory
```

## Usage

### Starting the Server

Run the main application:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Or use the alternative entry point:
```bash
python main.py
```

### Training a Model

Start the training node:
```bash
ros2 run backend train
```

### Running Telemetry

Start the telemetry node:
```bash
ros2 run backend telemetry_node
```

### API Endpoints

- `GET /` - Health check
- `GET /status` - System status
- `POST /train/start` - Start training process
- `POST /train/stop` - Stop training process
- `GET /metrics` - Get training metrics
- `WebSocket /ws` - Real-time telemetry stream

### WebSocket Connection

Connect to the WebSocket endpoint for real-time data:
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Telemetry:', data);
};
```

## Configuration

Key configuration options in `main.py`:
- `WSL_DISTRO`: WSL distribution name (default: Ubuntu-22.04)
- CORS settings allow all origins (modify for production)

## Development

### Adding New Features

1. Create new ROS2 nodes in separate Python files
2. Register endpoints in `app.py` or `main.py`
3. Update process manager if new process types are added
4. Add dependencies to `requirements.txt`

### Logging

Logs are stored in the `logs/` directory. The application uses Python's logging module with INFO level by default.

## Testing

Run tests (if available):
```bash
pytest
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- DSAI Society, IIIT Dharwad
- ROS2 Community
- PyTorch Team
