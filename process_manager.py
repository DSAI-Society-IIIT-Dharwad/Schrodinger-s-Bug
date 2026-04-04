import asyncio
import json
import logging
from collections import deque
from fastapi import WebSocket

logger = logging.getLogger("neural-pathfinder")

class ProcessManager:
    def __init__(self):
        self.processes = {
            "ros": None,
            "sim": None,
            "train": None,
            "telemetry": None,
            "plot": None
        }
        self.logs = deque(maxlen=2000)
        self.clients = set()
        self.telemetry = {
            "reward": 0.0,
            "collision": False,
            "x": 0.0,
            "y": 0.0,
            "velocity": 0.0,
            "episode": 0,
            "latency": 0
        }
        self.history = [] # For Analytics graphs
        self.trajectories = [] # For Demo page (x, y) points
        self.wsl_distro = "Ubuntu-22.04"

    def add_client(self, client: WebSocket):
        self.clients.add(client)

    def remove_client(self, client: WebSocket):
        if client in self.clients:
            self.clients.remove(client)

    async def broadcast(self, message: dict):
        if not self.clients:
            return
        
        # Pruning disconnected clients
        disconnected = set()
        for client in self.clients:
            try:
                await client.send_json(message)
            except Exception:
                disconnected.add(client)
        
        for client in disconnected:
            self.clients.remove(client)

    def get_status(self):
        return {
            "ros": "running" if self.processes["ros"] and self.processes["ros"].returncode is None else "stopped",
            "sim": "running" if self.processes["sim"] and self.processes["sim"].returncode is None else "stopped",
            "train": "running" if self.processes["train"] and self.processes["train"].returncode is None else "stopped",
            "simulation_running": self.processes["sim"] and self.processes["sim"].returncode is None,
            "training_running": self.processes["train"] and self.processes["train"].returncode is None
        }

    def get_history(self):
        return self.history

    async def _capture_logs(self, process, prefix):
        import time
        while True:
            line = await process.stdout.readline()
            if not line:
                break
            msg = line.decode().strip()
            if msg:
                if msg.startswith("[TEL]"):
                    try:
                        json_str = msg[len("[TEL]"):].strip()
                        data = json.loads(json_str)
                        self.telemetry.update(data)
                        
                        # Add to history if new episode
                        if "episode" in data:
                            if len(self.history) == 0 or self.history[-1]["episode"] != data["episode"]:
                                self.history.append({
                                    "episode": data["episode"],
                                    "reward": data.get("reward", 0),
                                    "success_rate": data.get("success_rate", 0),
                                    "collision": data.get("collision", False),
                                    "timestamp": time.time()
                                })
                        await self.broadcast({"type": "telemetry", "data": self.telemetry})
                    except Exception as e:
                        pass
                else:
                    formatted_log = f"[{prefix}] {msg}"
                    self.logs.append(formatted_log)
                    await self.broadcast({"type": "log", "data": formatted_log})
        
        exit_code = await process.wait()
        log_msg = f"[{prefix}] Process exited with code {exit_code}"
        self.logs.append(log_msg)
        await self.broadcast({"type": "log", "data": log_msg})
        await self.broadcast({"type": "status", "data": self.get_status()})

    async def _capture_telemetry(self, process):
        import time
        while True:
            line = await process.stdout.readline()
            if not line:
                break
            try:
                data = json.loads(line.decode().strip())
                # Expected format: {reward, collision, x, y, velocity, episode}
                start_time = time.time()
                self.telemetry.update(data)
                self.telemetry["latency"] = int((time.time() - start_time) * 1000)
                
                # Update history every episode or at regular intervals
                if len(self.history) == 0 or self.history[-1]["episode"] != self.telemetry["episode"]:
                    self.history.append({
                        "episode": self.telemetry["episode"],
                        "reward": self.telemetry["reward"],
                        "collision": self.telemetry["collision"],
                        "success_rate": self.telemetry.get("success_rate", 0),
                        "timestamp": time.time()
                    })

                
                # Update trajectories (x, y) for Demo page
                self.trajectories.append({
                    "x": self.telemetry["x"],
                    "y": self.telemetry["y"],
                    "reward": self.telemetry["reward"],
                    "episode": self.telemetry["episode"]
                })
                if len(self.trajectories) > 5000: # Practical limit
                    self.trajectories.pop(0)

                await self.broadcast({"type": "telemetry", "data": self.telemetry})
            except Exception as e:
                # logger.error(f"Telemetry parse error: {e}")
                pass

    async def start_ros(self):
        """Start ROS2 daemon (NOT roscore - that's ROS1)"""
        if self.processes["ros"] and self.processes["ros"].returncode is None:
            return False, "ROS2 is already running"
        
        # ROS2 doesn't need roscore - just ensure the environment is sourced
        try:
            cmd = f'wsl -d {self.wsl_distro} bash -c "source /opt/ros/humble/setup.bash && ros2 daemon start"'
            self.processes["ros"] = await asyncio.create_subprocess_shell(
                cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT
            )
            asyncio.create_task(self._capture_logs(self.processes["ros"], "ROS2"))
            return True, "ROS2 Daemon initialized"
        except Exception as e:
            return False, str(e)

    async def start_simulation(self):
        if self.processes["sim"] and self.processes["sim"].returncode is None:
            return False, "Simulation is already running"
        
        # ROS2 launch command (NOT ros1)
        cmd = f'wsl -d {self.wsl_distro} bash -c "source /opt/ros/humble/setup.bash && export TURTLEBOT3_MODEL=burger && ros2 launch turtlebot3_gazebo turtlebot3_world.launch.py"'
        try:
            self.processes["sim"] = await asyncio.create_subprocess_shell(
                cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT
            )
            asyncio.create_task(self._capture_logs(self.processes["sim"], "GAZEBO"))
            
            # Start telemetry bridge node in WSL
            win_path = "c/2026proj/DRL\\ ROBOT/backend/telemetry_node.py"
            tel_cmd = f'wsl -d {self.wsl_distro} bash -c "source /opt/ros/humble/setup.bash && python3 /mnt/{win_path}"'
            
            self.processes["telemetry"] = await asyncio.create_subprocess_shell(
                tel_cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT
            )
            asyncio.create_task(self._capture_telemetry(self.processes["telemetry"]))
            
            return True, "Gazebo Simulation & Telemetry Node Started"
        except Exception as e:
            return False, str(e)

    async def start_training(self):
        if self.processes["train"] and self.processes["train"].returncode is None:
            return False, "Training is already running"
        
        win_path = "c/2026proj/DRL\\ ROBOT/backend/train.py"
        cmd = f'wsl -d {self.wsl_distro} bash -c "source /opt/ros/humble/setup.bash && cd /mnt/c/2026proj/DRL\\ ROBOT/backend && python3 /mnt/{win_path}"'
        try:
            self.processes["train"] = await asyncio.create_subprocess_shell(
                cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT
            )
            asyncio.create_task(self._capture_logs(self.processes["train"], "DRL"))
            
            # Start plot graph daemon on host Python
            plot_cmd = 'python -u "c:/2026proj/DRL ROBOT/backend/plot_graph.py"'
            self.processes["plot"] = await asyncio.create_subprocess_shell(
                plot_cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT
            )
            asyncio.create_task(self._capture_logs(self.processes["plot"], "GRAPH"))
            
            return True, "TD3 Training Agent & Graphing Initiated"
        except Exception as e:
            return False, str(e)


    async def stop_all(self):
        # Kill everything in WSL (ROS2 processes only - NO ROS1)
        import subprocess
        subprocess.run(f'wsl -d {self.wsl_distro} bash -c "killall -9 gzserver gzclient python3 ros2"', shell=True)
        
        for key in self.processes:
            if self.processes[key]:
                try:
                    self.processes[key].terminate()
                except:
                    pass
                self.processes[key] = None
        
        await self.broadcast({"type": "status", "data": self.get_status()})

    async def telemetry_loop(self):
        """Simulation of telemetry if ROS is not producing it (Fallover)"""
        # This is just in case the /telemetry topic echo fails, we can put mock logic here if needed
        # But per requirements "DO NOT FAKE DATA", so we omit this unless we want heartbeat.
        while True:
            await asyncio.sleep(1)
            # Maybe broadcast a heartbeat
            await self.broadcast({"type": "heartbeat", "time": asyncio.get_event_loop().time()})
