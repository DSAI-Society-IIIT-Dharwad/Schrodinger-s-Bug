import asyncio
import json
import logging
import subprocess
from typing import Dict, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- Configuration ---
WSL_DISTRO = "Ubuntu-22.04"
WSL_BASE = ["wsl", "-d", WSL_DISTRO, "bash", "-c"]

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("schrödingers-bug")

app = FastAPI(title="Schrödinger's Bug - Robotics Control Node")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Process State ---
class SystemState:
    def __init__(self):
        self.active_processes: Dict[str, asyncio.subprocess.Process] = {}
        self.mode = "manual" # manual, training, inference
        self.scenario = "logistics" # healthcare, defence, logistics
        self.logs: List[str] = []
        self.telemetry = {
            "reward": 0.0,
            "collision": False,
            "distance": 0.0,
            "success": False,
            "v": 0.0,
            "w": 0.0
        }

state = SystemState()

# --- WebSocket Hub ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        # Create a copy of the list to avoid modifying it while iterating
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                if connection in self.active_connections:
                    self.active_connections.remove(connection)

manager = ConnectionManager()

# --- WSL Executor ---
async def run_wsl_persistent(name: str, cmd: str):
    full_cmd = " ".join(WSL_BASE + [f'"{cmd}"'])
    try:
        proc = await asyncio.create_subprocess_shell(
            full_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT
        )
        state.active_processes[name] = proc
        # Start a task to read logs and broadcast
        asyncio.create_task(log_reader(name, proc))
        return True
    except Exception as e:
        logger.error(f"Failed to run WSL cmd '{name}': {e}")
        return False

async def log_reader(name: str, proc: asyncio.subprocess.Process):
    while True:
        try:
            line = await proc.stdout.readline()
            if not line:
                break
            clean_line = line.decode('utf-8', errors='replace').strip()
            if clean_line:
                log_msg = f"[{name}] {clean_line}"
                state.logs.append(log_msg)
                
                # Check if line is telemetry JSON
                if clean_line.startswith("{") and clean_line.endswith("}"):
                    try:
                        tel_data = json.loads(clean_line)
                        state.telemetry.update(tel_data)
                        await manager.broadcast({"type": "telemetry", "data": state.telemetry})
                    except:
                        pass
                else:
                    await manager.broadcast({"type": "log", "data": log_msg})
                    
                if len(state.logs) > 500: state.logs.pop(0)
        except Exception as e:
            logger.error(f"Error reading log: {e}")
            break
            
    await proc.wait()
    if name in state.active_processes:
        del state.active_processes[name]
    await manager.broadcast({"type": "status", "data": {"process": name, "status": "exited"}})

# --- API Endpoints ---
@app.post("/start-system")
async def start_system():
    # Kill any existing processes
    subprocess.run(WSL_BASE + ["bash ~/stop_system.sh"], capture_output=True)
    state.active_processes.clear()
    
    success = await run_wsl_persistent("ENGINE", "bash ~/start_system.sh")
    if success:
        return {"status": "success", "message": "Schrödinger's Bug System Initialized"}
    raise HTTPException(status_code=500, detail="WSL Launch Failed")

@app.post("/stop-system")
async def stop_system():
    subprocess.run(WSL_BASE + ["bash ~/stop_system.sh"], capture_output=True)
    
    # Terminate tracked processes
    for name, proc in list(state.active_processes.items()):
        try:
            proc.terminate()
        except:
            pass
    state.active_processes.clear()
    return {"status": "success", "message": "System Halted Safe"}

class ModeRequest(BaseModel):
    mode: str

@app.post("/set-mode")
async def set_mode(req: ModeRequest):
    if req.mode not in ["manual", "training", "inference"]:
        raise HTTPException(status_code=400, detail="Invalid Mode")
    state.mode = req.mode
    logger.info(f"Mode switched to: {state.mode}")
    return {"status": "success", "mode": state.mode}

class ScenarioRequest(BaseModel):
    scenario: str

@app.post("/set-scenario")
async def set_scenario(req: ScenarioRequest):
    if req.scenario not in ["healthcare", "defence", "logistics"]:
        raise HTTPException(status_code=400, detail="Invalid Scenario")
    state.scenario = req.scenario
    logger.info(f"Scenario switched to: {state.scenario}")
    return {"status": "success", "scenario": state.scenario}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial state
        await websocket.send_json({"type": "init", "logs": state.logs, "telemetry": state.telemetry, "mode": state.mode})
        while True:
            data = await websocket.receive_text()
            # Handle incoming signals if needed
            pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
