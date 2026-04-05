#!/bin/bash

# ==========================================
# 🛑 DEFINITIVE MULTI-SCENARIO LAUNCHER
# ==========================================

# 1. Directory Detection
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Parameters
SCENARIO=${1:-Defense}
ALGO=${2:-PPO}

# Map Scenario to World
if [[ "$SCENARIO" == "Warehouse" ]]; then
    WORLD="turtlebot3_house.launch.py"
else
    WORLD="turtlebot3_world.launch.py"
fi

# 2. Environment Fixes
source /opt/ros/humble/setup.bash
export TURTLEBOT3_MODEL=burger
export DISPLAY=$(grep nameserver /etc/resolv.conf | awk '{print $2}'):0
export LIBGL_ALWAYS_SOFTWARE=1
export GALLIUM_DRIVER=llvmpipe
export QT_X11_NO_MITSHM=1

# 3. Dependency Self-Heal
echo "🔍 Syncing Engine Dependencies..."
python3 -m pip install --user fastapi uvicorn websockets torch numpy 2>/dev/null

# 4. Clean ROS2 daemon
ros2 daemon stop && ros2 daemon start

echo "🚀 Launching Gazebo ($WORLD)..."
ros2 launch turtlebot3_gazebo "$WORLD" &
sleep 15

echo "🧠 Starting DRL Engine ($ALGO | $SCENARIO)..."
(cd "$SCRIPT_DIR/backend" && python3 train.py --algo "$ALGO" --scenario "$SCENARIO") &

sleep 2

echo "🌐 Starting FastAPI Relay..."
(cd "$SCRIPT_DIR/backend" && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000)
