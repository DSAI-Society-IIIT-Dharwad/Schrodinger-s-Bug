#!/bin/bash
set -e

# Configuration
ALGO=${1:-ppo}
WS_DIR=$(pwd)
BACKEND_DIR="$WS_DIR/backend"
FRONTEND_DIR="$WS_DIR/frontend"

echo "🚀 IGNITING DRL ROBOTIC PIPELINE [Algo: $ALGO]"

# 1. KILL ORPHAN PROCESSES
echo "🧹 Cleaning environment..."
pkill -f gzserver || true
pkill -f gzclient || true
pkill -f train.py || true
pkill -f "python3 main.py" || true
pkill -f vite || true
sleep 2

# 2. SETUP ROS2 & DISPLAY
echo "🌐 Configuring ROS2 & WSLg Display..."
# WSLg uses :0 usually. We attempt to set it if not present.
export DISPLAY=${DISPLAY:-:0}
export LIBGL_ALWAYS_SOFTWARE=1
export TURTLEBOT3_MODEL=burger

# Source ROS2
if [ -f "/opt/ros/humble/setup.bash" ]; then
    source /opt/ros/humble/setup.bash
else
    echo "❌ ERROR: ROS2 Humble not found at /opt/ros/humble/setup.bash"
    exit 1
fi

# 3. RESTART DAEMON
echo "🔄 Restarting ROS2 Daemon..."
ros2 daemon stop || true
ros2 daemon start

# 4. LAUNCH GAZEBO WORLD
echo "🌍 Launching Gazebo (TurtleBot3 World)..."
# We run this in the background
ros2 launch turtlebot3_gazebo turtlebot3_world.launch.py &
GZ_PID=$!

# 5. WAIT FOR READINESS
echo "⏳ Waiting for robot to spawn (15s)..."
sleep 15

# Check if topics are active
if ros2 topic list | grep -q "/scan"; then
    echo "✅ Robot detected on /scan topic."
else
    echo "⚠️ Warning: /scan topic not detected. Retrying spawn check..."
    sleep 5
fi

# 6. START TRAINING NODE
echo "🧠 Training Node starting ($ALGO)..."
python3 "$BACKEND_DIR/train.py" --algo "$ALGO" &
TRAIN_PID=$!

# 7. START BACKEND
echo "📡 Telemetry Backend starting..."
cd "$BACKEND_DIR" && python3 main.py &
BACKEND_PID=$!
cd "$WS_DIR"

# 8. START FRONTEND
echo "💻 HWI Dashboard starting (pnpm)..."
cd "$FRONTEND_DIR"
if command -v pnpm &> /dev/null; then
    pnpm run dev --host &
else
    echo "⚠️ pnpm not found, falling back to npm..."
    npm run dev -- --host &
fi
FRONTEND_PID=$!
cd "$WS_DIR"

echo "--------------------------------------------------"
echo "✅ SYSTEM OPERATIONAL"
echo "Algorithm:  $ALGO"
echo "Backend:    http://localhost:8000"
echo "Dashboard:  http://localhost:5173"
echo "--------------------------------------------------"

# Cleanup trap
trap "echo '🛑 Shutting down system...'; kill $GZ_PID $TRAIN_PID $BACKEND_PID $FRONTEND_PID; exit" INT TERM EXIT

# Wait for processes
wait
