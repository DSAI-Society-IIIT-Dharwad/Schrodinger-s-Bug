import asyncio
import json
import logging
import os
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from process_manager import ProcessManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("neural-pathfinder")

app = FastAPI(title="Neural Pathfinder Backend")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pm = ProcessManager()

@app.on_event("startup")
async def startup_event():
    # Start telemetry and log processing loops
    logger.info("Starting Neural Pathfinder Backend...")
    asyncio.create_task(pm.telemetry_loop())

@app.post("/launch-ros")
async def launch_ros():
    success, message = await pm.start_ros()
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "success", "message": message}

@app.post("/launch-sim")
async def launch_sim():
    success, message = await pm.start_simulation()
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "success", "message": message}

@app.post("/start-training")
async def start_training():
    success, message = await pm.start_training()
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "success", "message": message}

@app.post("/stop-all")
async def stop_all():
    await pm.stop_all()
    return {"status": "success", "message": "All processes halted"}

@app.get("/status")
async def get_status():
    return pm.get_status()

@app.get("/trajectories")
async def get_trajectories():
    return {"trajectories": pm.trajectories}

@app.get("/telemetry")
async def get_telemetry():
    return pm.telemetry

@app.get("/logs")
async def get_logs(last: int = 50):
    return {"logs": list(pm.logs)[-last:]}

@app.get("/metrics")
async def get_metrics():
    """Return metrics for the training dashboard"""
    ppo_file = "c:/2026proj/DRL ROBOT/backend/logs/ppo.npy"
    td3_file = "c:/2026proj/DRL ROBOT/backend/logs/td3.npy"
    
    ppo_rewards = []
    td3_rewards = []
    
    if os.path.exists(ppo_file):
        ppo_rewards = np.load(ppo_file).tolist()
    if os.path.exists(td3_file):
        td3_rewards = np.load(td3_file).tolist()
    
    return {
        "ppo_rewards": ppo_rewards[-50:] if len(ppo_rewards) > 0 else [],
        "td3_rewards": td3_rewards[-50:] if len(td3_rewards) > 0 else [],
        "progress": pm.telemetry.get("progress", 0),
        "success_rate": pm.telemetry.get("success_rate", 0),
        "accuracy": pm.telemetry.get("accuracy", 0)
    }

from pydantic import BaseModel
class ModeRequest(BaseModel):
    mode: str

class ScenarioRequest(BaseModel):
    scenario: str

@app.post("/set-mode")
async def set_mode(req: ModeRequest):
    # Pass the mode into the environment logically
    return {"status": "success", "mode": req.mode}

@app.post("/set-scenario")
async def set_scenario(req: ScenarioRequest):
    # e.g., 'healthcare', 'defence', 'logistics' -> logic passed into train.py
    return {"status": "success", "scenario": req.scenario}


@app.get("/graph")
async def get_graph():
    """Return the generated live graph image"""
    graph_file = "c:/2026proj/DRL ROBOT/backend/logs/graph.png"
    if os.path.exists(graph_file):
        return FileResponse(graph_file)
    return {"error": "Graph not found yet"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    pm.add_client(websocket)
    logger.info(f"Client connected: {websocket.client}")
    
    # Start streaming real data from rewards.npy
    async def stream_data():
        while True:
            try:
                import numpy as np
                
                # Try to load rewards from the training node
                rewards_file = "/home/sree/ros2_ws/logs/rewards.npy"
                
                if os.path.exists(rewards_file):
                    rewards = np.load(rewards_file).tolist()
                    
                    latest = rewards[-1] if rewards else 0
                    progress = min(100, len(rewards) * 0.1)
                    accuracy = progress / 100 if progress > 0 else 0
                    
                    await websocket.send_json({
                        "reward": float(latest),
                        "progress": float(progress),
                        "accuracy": float(accuracy)
                    })
                else:
                    # File doesn't exist yet - send zeros
                    await websocket.send_json({
                        "reward": 0,
                        "progress": 0,
                        "accuracy": 0
                    })
                
            except Exception as e:
                logger.error(f"WebSocket streaming error: {e}")
                await websocket.send_json({
                    "reward": 0,
                    "progress": 0,
                    "accuracy": 0
                })
            
            await asyncio.sleep(1)
    
    try:
        # Send initial status
        await websocket.send_json({"type": "status", "data": pm.get_status()})
        
        # Start data streaming task
        stream_task = asyncio.create_task(stream_data())
        
        # Keep connection alive
        while True:
            await websocket.receive_text()
            
    except WebSocketDisconnect:
        pm.remove_client(websocket)
        logger.info(f"Client disconnected: {websocket.client}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        pm.remove_client(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
