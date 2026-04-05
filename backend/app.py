import asyncio
import json
import logging
import os
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from process_manager import ProcessManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("neural-pathfinder")

app = FastAPI(title="Neural Pathfinder Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pm = ProcessManager()

class TeleopRequest(BaseModel):
    linear: float
    angular: float

class AlgoRequest(BaseModel):
    algo: str

class ScenarioRequest(BaseModel):
    scenario: str

@app.on_event("startup")
async def startup_event():
    # Start the periodic status/heartbeat loop
    asyncio.create_task(pm.telemetry_loop())

@app.post("/launch-ros")
async def launch_ros():
    success, msg = await pm.start_ros()
    if not success: raise HTTPException(status_code=400, detail=msg)
    return {"status": "success", "message": msg}

@app.post("/launch-sim")
async def launch_sim():
    success, msg = await pm.start_simulation()
    if not success: raise HTTPException(status_code=400, detail=msg)
    return {"status": "success", "message": msg}

@app.post("/set-algorithm")
async def set_algorithm(req: AlgoRequest):
    pm.set_algorithm(req.algo)
    return {"status": "success", "algo": pm.algo}

@app.post("/set-scenario")
async def set_scenario(req: ScenarioRequest):
    pm.set_scenario(req.scenario)
    return {"status": "success", "scenario": pm.scenario}

@app.post("/start-training")
async def start_training():
    success, msg = await pm.start_training()
    if not success: raise HTTPException(status_code=400, detail=msg)
    return {"status": "success", "message": msg}

@app.post("/start-testing")
async def start_testing():
    success, msg = await pm.start_testing()
    if not success: raise HTTPException(status_code=400, detail=msg)
    return {"status": "success", "message": msg}

@app.post("/teleop")
async def teleop(req: TeleopRequest):
    success = await pm.send_teleop(req.linear, req.angular)
    if not success: raise HTTPException(status_code=500, detail="Teleop command failed")
    return {"status": "success"}

@app.post("/stop-all")
async def stop_all():
    await pm.stop_all()
    return {"status": "success"}

@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()
    pm.add_client(websocket)
    logger.info("New UI client connected to WebSocket")
    
    # Send initial state
    await websocket.send_json({"type": "status", "data": pm.get_status()})
    await websocket.send_json({"type": "telemetry", "data": pm.telemetry})
    
    try:
        while True:
            await asyncio.sleep(10) # Keepalive
    except WebSocketDisconnect:
        pm.remove_client(websocket)
        logger.info("UI client disconnected")
    except Exception as e:
        pm.remove_client(websocket)
        logger.error(f"WS Exception: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
