#!/bin/bash

# Source ROS2 and TurtleBot3 environments
source /opt/ros/humble/setup.bash
export TURTLEBOT3_MODEL=burger

# Fix DISPLAY for Gazebo (WSL2 to Windows Host)
export DISPLAY=$(grep nameserver /etc/resolv.conf | awk '{print $2}'):0
export LIBGL_ALWAYS_INDIRECT=0

# Clean up ROS2 daemon
ros2 daemon stop
ros2 daemon start

echo "🚀 Launching Gazebo World..."
ros2 launch turtlebot3_gazebo turtlebot3_world.launch.py &

# Allow Gazebo to initialize
echo "Waiting for robot to spawn..."
sleep 15

echo "🧠 Starting DRL Training (PPO)..."
# Ensure we are using the correct python environment if needed
python3 train.py &

sleep 5

echo "🌐 Starting Backend (FastAPI)..."
# Assume main.py is in the backend/ directory or root as specified
if [ -f "backend/main.py" ]; then
    cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
    cd ..
else
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
fi

sleep 5

echo "💻 Starting Frontend (React)..."
if [ -d "frontend" ]; then
    cd frontend && pnpm dev
else
    pnpm dev
fi
