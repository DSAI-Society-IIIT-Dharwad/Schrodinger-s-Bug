import asyncio
import json
import os
import subprocess
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List

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

# Metrics history storage for the comparison page
history = {
    "ppo": [],
    "td3": []
}

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
            except Exception as e:
                logger.error(f"Broadcast error: {e}")

ppo_manager = ConnectionManager()
td3_manager = ConnectionManager()

def read_metrics_file(filename: str):
    if os.path.exists(filename):
        try:
            with open(filename, 'r') as f:
                data = json.load(f)
                return data
        except Exception as e:
            logger.error(f"Error reading {filename}: {e}")
            return None
    return None

@app.get("/compare")
async def get_compare():
    ppo_latest = read_metrics_file("ppo_metrics.json")
    td3_latest = read_metrics_file("td3_metrics.json")
    
    return {
        "ppo": ppo_latest,
        "td3": td3_latest,
        "history": history
    }

@app.post("/launch-system")
async def launch_system(req: LaunchRequest):
    algo = req.algo.lower()
    if algo not in ["ppo", "td3"]:
        return {"status": "error", "message": "Invalid algorithm"}
    
    # We call the launch_system.sh script with the selected algo
    # Using 'bash' explicitly for WSL compatibility if needed, 
    # but the script itself is in the parent dir.
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    launch_script = os.path.join(base_dir, "launch_system.sh")
    
    try:
        # We run the orchestrator as a background process
        # This allows the backend to remain responsive
        cmd = f"bash {launch_script} {algo}"
        subprocess.Popen(["bash", "-c", cmd], preexec_fn=os.setpgrp)
        return {"status": "success", "message": f"Orchestrator ignited with {algo}"}
    except Exception as e:
        logger.error(f"Launch failed: {e}")
        return {"status": "error", "message": str(e)}

async def telemetry_loop():
    while True:
        # PPO Telemetry
        data_ppo = read_metrics_file("ppo_metrics.json")
        if data_ppo:
            await ppo_manager.broadcast({"type": "telemetry", "data": data_ppo})
            # Track history (keep last 100 points)
            history["ppo"].append(data_ppo)
            history["ppo"] = history["ppo"][-100:]
            
        # TD3 Telemetry
        data_td3 = read_metrics_file("td3_metrics.json")
        if data_td3:
            await td3_manager.broadcast({"type": "telemetry", "data": data_td3})
            # Track history
            history["td3"].append(data_td3)
            history["td3"] = history["td3"][-100:]
            
        await asyncio.sleep(1.0)

@app.on_event("startup")
async def startup():
    asyncio.create_task(telemetry_loop())

@app.websocket("/ws/ppo")
async def ppo_websocket(websocket: WebSocket):
    await ppo_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ppo_manager.disconnect(websocket)

@app.websocket("/ws/td3")
async def td3_websocket(websocket: WebSocket):
    await td3_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        td3_manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
