from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import os
import subprocess
import threading
from typing import List

app = FastAPI()

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global process tracker and log queue
active_processes = {}
connected_clients: List[WebSocket] = []

async def broadcast_ws(message: dict):
    """Auxiliary function to broadcast messages to all connected clients."""
    disconnected = []
    for client in connected_clients:
        try:
            await client.send_json(message)
        except:
            disconnected.append(client)
    for client in disconnected:
        if client in connected_clients:
            connected_clients.remove(client)

def log_reader(pipe, prefix):
    """Thread function to read process output and queue it for broadcasting."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    for line in iter(pipe.readline, b''):
        msg = line.decode().strip()
        if msg:
            formatted_msg = f"[{prefix}] {msg}"
            print(formatted_msg)
            # We use a separate loop or a thread-safe way to broadcast
            # For simplicity, we'll just print and rely on the WS loop for now, 
            # but a real implementation would use a queue.
            # Here we'll just inject it into a global logs list that the WS loop polls.
            global_logs.append(formatted_msg)
    pipe.close()

global_logs = []

# Helper function to execute WSL commands and capture logs
def run_wsl_cmd_with_logging(cmd: str, name: str):
    full_cmd = (
        f"export TURTLEBOT3_MODEL=burger; "
        f"export DISPLAY=$(grep nameserver /etc/resolv.conf | awk '{{print $2}}'):0; "
        f"export LIBGL_ALWAYS_INDIRECT=0; "
        f"export GALLIUM_DRIVER=llvmpipe; "
        f"export MESA_GL_VERSION_OVERRIDE=3.3; "
        f"source /opt/ros/humble/setup.bash; "
        f"{cmd}"
    )
    process = subprocess.Popen(
        ["wsl", "bash", "-c", full_cmd],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        preexec_fn=None
    )
    active_processes[name] = process
    # Start thread to read logs
    threading.Thread(target=log_reader, args=(process.stdout, name.upper()), daemon=True).start()
    return process

@app.get("/")
def read_root():
    return {"status": "BACKEND_ALIVE", "message": "Neural Pathfinder API v2"}

@app.post("/launch-ros")
async def launch_ros():
    run_wsl_cmd_with_logging("ros2 daemon stop; ros2 daemon start", "ros-core")
    return {"status": "success"}

@app.post("/launch-sim")
async def launch_sim():
    # Clean up lingering entities
    subprocess.run(["wsl", "bash", "-c", "pkill -f gzserver; pkill -f gzclient; pkill -f rclpy"])
    run_wsl_cmd_with_logging("ros2 launch turtlebot3_gazebo turtlebot3_world.launch.py", "gazebo")
    return {"status": "success"}

@app.post("/start-training")
async def start_training():
    run_wsl_cmd_with_logging("cd /mnt/c/2026proj/DRL\ ROBOT && python3 train.py", "drl-node")
    return {"status": "success"}

@app.post("/stop-all")
async def stop_all():
    subprocess.run(["wsl", "bash", "-c", "pkill -f gzserver; pkill -f gzclient; pkill -f rclpy; pkill -f python3; ros2 daemon stop"])
    active_processes.clear()
    return {"status": "success"}

@app.websocket("/ws")
@app.websocket("/ws/telemetry") # Unified alias
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    print(f"WS_CONNECT: {websocket.client}")
    
    try:
        while True:
            # 1. Broadcase Telemetry
            metrics_file = "../metrics.json" if os.path.exists("../metrics.json") else "metrics.json"
            if os.path.exists(metrics_file):
                try:
                    with open(metrics_file, "r") as f:
                        data = json.load(f)
                        await websocket.send_json({"type": "telemetry", "data": data})
                except: pass
            
            # 2. Broadcast Logs
            global global_logs
            if global_logs:
                for log in global_logs:
                    await websocket.send_json({"type": "log", "data": log})
                global_logs = [] # Clear logs after broadcasting
                
            await asyncio.sleep(0.5) # Higher frequency for responsiveness
            
    except WebSocketDisconnect:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
        print("WS_DISCONNECT")
    except Exception as e:
        print(f"WS_ERROR: {str(e)}")
        if websocket in connected_clients:
            connected_clients.remove(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
