# Schrödinger's Bug - DRL Robotics System

A complete Deep Reinforcement Learning robotics system with real-time monitoring, training, and analytics dashboard.

## Project Structure

```
Schrodinger-s-Bug/
├── backend/          # FastAPI + ROS2 + TD3 DRL System
├── frontend/         # React + Vite Dashboard Application
└── README.md         # This file
```

## Quick Start

### Backend (DRL Robotics System)

The backend handles robot control, DRL training, and telemetry streaming.

**Location**: `backend/`

**Technologies**:
- Python 3.8+
- FastAPI
- ROS2 (Humble/Iron)
- PyTorch (TD3 Algorithm)
- WebSocket

**Setup**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Run**:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

See [backend/README.md](backend/README.md) for detailed documentation.

---

### Frontend (Dashboard Application)

The frontend provides a modern React-based dashboard for monitoring and controlling the robot.

**Location**: `frontend/`

**Technologies**:
- React 19
- Vite
- Tailwind CSS
- Recharts
- WebSocket

**Setup**:
```bash
cd frontend
npm install
```

**Run**:
```bash
npm run dev
```

See [frontend/README.md](frontend/README.md) for detailed documentation.

---

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Gazebo    │────────▶│  ROS2 Nodes  │────────▶│   FastAPI   │
│ Simulation  │         │  (train.py)  │         │   Backend   │
└─────────────┘         └──────────────┘         └──────┬──────┘
                                                        │
                                                   WebSocket
                                                        │
                                                        ▼
                                               ┌──────────────┐
                                               │   React      │
                                               │  Frontend    │
                                               └──────────────┘
```

## Features

### Backend
- TD3-based deep reinforcement learning
- Real-time robot control via ROS2
- LiDAR and odometry data processing
- Training metrics collection
- WebSocket telemetry streaming
- Process lifecycle management

### Frontend
- Real-time dashboard with live metrics
- Training progress visualization
- Robot trajectory replay
- Neural network architecture view
- System logs monitoring
- Analytics and performance charts

## Development

### Prerequisites

- **Backend**:
  - Python 3.8+
  - ROS2 Humble/Iron
  - WSL2 with Ubuntu 22.04 (Windows)
  
- **Frontend**:
  - Node.js 18+
  - npm or yarn

### Running Locally

1. **Start Backend**:
   ```bash
   cd backend
   uvicorn app:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access Dashboard**:
   Open `http://localhost:5173` in your browser

## Repository Information

- **Main Branch**: `main`
- **Backend Folder**: Contains all Python/ROS2 code
- **Frontend Folder**: Contains all React/Vite code
- **Separation**: Clean separation between backend and frontend concerns

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- DSAI Society, IIIT Dharwad
- ROS2 Community
- React and Vite Teams
- PyTorch Team
