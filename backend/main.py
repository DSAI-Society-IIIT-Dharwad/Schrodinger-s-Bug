import asyncio
import json
import os
import subprocess
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backend")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LaunchRequest(BaseModel):
    algo: str = "ppo"

class RoboticSystem:
    def __init__(self):
        self.is_running = False
        self.algo = "ppo"
        self.gazebo_proc = None
        self.train_proc = None
        self.metrics_file = ""

    def get_status(self):
        # Refresh status based on process health
        if self.train_proc and self.train_proc.poll() is not None:
             logger.warning("Training process detected as CRASHED or STOPPED.")
             self.is_running = False
        return {"running": self.is_running, "algo": self.algo}

    async def launch(self, algo: str):
        if self.is_running:
            return {"status": "error", "message": "System already running."}
        
        self.algo = algo.lower()
        self.is_running = True
        self.metrics_file = f"{self.algo}_metrics.json"

        # Cleanup metrics for a fresh run
        if os.path.exists(self.metrics_file):
            os.remove(self.metrics_file)

        # Path Translation for WSL
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(backend_dir)
        launch_script = os.path.join(root_dir, "launch_system.sh")
        wsl_launch_script = launch_script.replace('\\', '/').replace('C:', '/mnt/c').replace('c:', '/mnt/c')

        try:
            # 1. Start Gazebo
            logger.info(f"Launching Gazebo via WSL...")
            # We use a detached process group to ensure we can kill it later
            gz_cmd = ["wsl", "bash", "-c", f"export DISPLAY=:0 && source /opt/ros/humble/setup.bash && ros2 launch turtlebot3_gazebo turtlebot3_world.launch.py use_sim_time:=true"]
            self.gazebo_proc = subprocess.Popen(gz_cmd, creationflags=subprocess.CREATE_NEW_PROCESS_GROUP)
            
            # 2. Spawn Wait (8-10s)
            logger.info("Waiting for robot to spawn...")
            await asyncio.sleep(10)

            # 3. Start DRL Agent
            logger.info(f"Starting DRL Agent: {self.algo}")
            train_script = os.path.join(backend_dir, "train.py")
            wsl_train_script = train_script.replace('\\', '/').replace('C:', '/mnt/c').replace('c:', '/mnt/c')
            
            tr_cmd = ["wsl", "bash", "-c", f"source /opt/ros/humble/setup.bash && python3 '{wsl_train_script}' --algo {self.algo}"]
            self.train_proc = subprocess.Popen(tr_cmd, creationflags=subprocess.CREATE_NEW_PROCESS_GROUP)
            
            return {"status": "started", "algo": self.algo}
        except Exception as e:
            self.is_running = False
            logger.error(f"Launch failed: {e}")
            return {"status": "error", "message": str(e)}

    def abort(self):
        logger.info("ABORT SEQUENCE INITIATED")
        
        # Kill DRL Agent
        if self.train_proc:
            try:
                subprocess.run(["taskkill", "/F", "/T", "/PID", str(self.train_proc.pid)], capture_output=True)
                self.train_proc = None
            except: pass

        # Kill Gazebo
        if self.gazebo_proc:
            try:
                subprocess.run(["taskkill", "/F", "/T", "/PID", str(self.gazebo_proc.pid)], capture_output=True)
                self.gazebo_proc = None
            except: pass

        # Clean ROS2 environment
        try:
            subprocess.run(["wsl", "bash", "-c", "source /opt/ros/humble/setup.bash && ros2 daemon stop && pkill -f gzserver && pkill -f gzclient"], capture_output=True)
        except: pass

        self.is_running = False
        return {"status": "stopped"}

system = RoboticSystem()

@app.get("/status")
async def get_status():
    return system.get_status()

@app.post("/launch")
async def launch(req: LaunchRequest):
    return await system.launch(req.algo)

@app.post("/abort")
async def abort():
    return system.abort()

def read_metrics_file(filename: str):
    if os.path.exists(filename):
        try:
            with open(filename, 'r') as f:
                return json.load(f)
        except: return None
    return None

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except: pass

manager = ConnectionManager()

async def telemetry_loop():
    while True:
        if system.is_running:
            data = read_metrics_file(system.metrics_file)
            if data:
                await manager.broadcast({"type": "telemetry", "data": data})
        else:
            # Broadcast "IDLE" or "RESET" signifier if needed
            pass
        await asyncio.sleep(1.0)

@app.on_event("startup")
async def startup():
    asyncio.create_task(telemetry_loop())

@app.websocket("/ws")
async def combined_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
