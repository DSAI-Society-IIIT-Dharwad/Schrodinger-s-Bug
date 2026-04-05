#!/bin/bash
set -e

# Configuration
ALGO=${1:-ppo}
# Resolve script directory to handle relative execution
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"

echo "🚀 IGNITING DRL ROBOTIC SIMULATION [Algo: $ALGO]"

# 1. CLEANUP PREVIOUS SESSIONS
echo "🧹 Cleaning previous simulation processes..."
pkill -f gzserver || true
pkill -f gzclient || true
pkill -f train.py || true
# We do NOT kill the backend/frontend if they are running on the Windows host

# 2. SETUP ROS2 & DISPLAY
echo "🌐 Configuring ROS2 & WSLg Display..."
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
# Force gzclient to start if it doesn't automatically
ros2 launch turtlebot3_gazebo turtlebot3_world.launch.py use_sim_time:=true &
GZ_PID=$!
sleep 5
gzclient &
GZC_PID=$!

# 5. WAIT FOR READINESS
echo "⏳ Waiting for robot to spawn (15s)..."
sleep 15

# 6. START TRAINING NODE
echo "🧠 Neural Agent Ignition ($ALGO)..."
# We run the training node which communicates with the simulation
python3 "$BACKEND_DIR/train.py" --algo "$ALGO" &
TRAIN_PID=$!

echo "--------------------------------------------------"
echo "✅ SIMULATION OPERATIONAL"
echo "Algorithm:  $ALGO"
echo "Status:     Bridged to HWI Dashboard"
echo "--------------------------------------------------"

# Cleanup trap
trap "echo '🛑 Shutting down simulation...'; kill $GZ_PID $TRAIN_PID; exit" INT TERM EXIT

# Wait for processes
wait
