import asyncio
import json
import logging
import os
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
        self.algo = "td3" # Default training algorithm
        self.scenario = "logistics" # healthcare, defense, logistics
        self.telemetry = {
            "reward": 0.0,
            "collision": False,
            "x": 0.0,
            "y": 0.0,
            "v": 0.0,
            "w": 0.0,
            "episode": 0,
            "latency": 0,
            "lidar": [] # LiDAR cloud for RadarView
        }
        self.history = []
        self.trajectories = []
        # targeting the specific distro found in wsl --list
        self.wsl_distro = "Ubuntu-22.04"

    def add_client(self, client: WebSocket):
        self.clients.add(client)

    def remove_client(self, client: WebSocket):
        if client in self.clients:
            self.clients.remove(client)

    async def broadcast(self, message: dict):
        if not self.clients:
            return
        disconnected = set()
        for client in self.clients:
            try: await client.send_json(message)
            except: disconnected.add(client)
        for client in disconnected:
            if client in self.clients: self.clients.remove(client)

    def get_status(self):
        return {
            "ros": "running" if self.processes["ros"] and self.processes["ros"].returncode is None else "stopped",
            "sim": "running" if self.processes["sim"] and self.processes["sim"].returncode is None else "stopped",
            "train": "running" if self.processes["train"] and self.processes["train"].returncode is None else "stopped",
            "simulation_running": self.processes["sim"] and self.processes["sim"].returncode is None,
            "training_running": self.processes["train"] and self.processes["train"].returncode is None,
            "algo": self.algo,
            "scenario": self.scenario
        }

    def set_algorithm(self, algo):
        self.algo = algo.lower()
        logger.info(f"DRL Algorithm switched to: {self.algo}")

    def set_scenario(self, scenario):
        self.scenario = scenario.lower()
        logger.info(f"Operational Scenario set to: {self.scenario}")

    async def send_teleop(self, linear, angular):
        source_cmd = "for d in /opt/ros/*; do [ -f $d/setup.bash ] && . $d/setup.bash && break; done"
        pub_cmd = f"ros2 topic pub --once /cmd_vel geometry_msgs/msg/Twist '{{linear: {{x: {linear}}}, angular: {{z: {angular}}}}}'"
        # Ensure model is exported for teleop too
        cmd = f'wsl -d {self.wsl_distro} bash -c "export TURTLEBOT3_MODEL=burger && {source_cmd} && {pub_cmd}"'
        try:
            await asyncio.create_subprocess_shell(cmd, stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL)
            return True
        except: return False

    async def _capture_logs(self, process, prefix):
        while True:
            line = await process.stdout.readline()
            if not line: break
            msg = line.decode().strip()
            if msg:
                if msg.startswith("[TEL]"):
                    try:
                        parts = msg[len("[TEL]"):].strip().split()
                        data = {}
                        for p in parts:
                            if '=' in p:
                                k, v = p.split('=')
                                try: data[k] = float(v)
                                except: data[k] = v
                        self.telemetry.update(data)
                        await self.broadcast({"type": "telemetry", "data": self.telemetry})
                    except: pass
                else:
                    formatted_log = f"[{prefix}] {msg}"
                    self.logs.append(formatted_log)
                    await self.broadcast({"type": "log", "data": formatted_log})
        await process.wait()
        await self.broadcast({"type": "status", "data": self.get_status()})

    async def _capture_telemetry(self, process):
        while True:
            line = await process.stdout.readline()
            if not line: break
            try:
                data = json.loads(line.decode().strip())
                self.telemetry.update(data)
                self.trajectories.append({"x": data.get("x",0), "y": data.get("y",0)})
                if len(self.trajectories) > 2000: self.trajectories.pop(0)
                await self.broadcast({"type": "telemetry", "data": self.telemetry})
            except: pass

    async def start_ros(self):
        if self.processes["ros"] and self.processes["ros"].returncode is None:
            return False, "Already Active"
        source_cmd = "for d in /opt/ros/*; do [ -f $d/setup.bash ] && . $d/setup.bash && break; done"
        cmd = f'wsl -d {self.wsl_distro} bash -c "{source_cmd} && ros2 daemon start"'
        try:
            self.processes["ros"] = await asyncio.create_subprocess_shell(
                cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT
            )
            asyncio.create_task(self._capture_logs(self.processes["ros"], "ROS2"))
            return True, "ROS2 Daemon Online"
        except Exception as e: return False, str(e)

    async def start_simulation(self):
        if self.processes["sim"] and self.processes["sim"].returncode is None:
            return False, "Active"
        
        worlds = {
            "logistics": "turtlebot3_world.launch.py",
            "healthcare": "turtlebot3_house.launch.py",
            "defense": "turtlebot3_stage_4.launch.py"
        }
        launch_file = worlds.get(self.scenario, "turtlebot3_world.launch.py")
        
        # ── MEGA-ROBUST IGNITION STRATEGY ──
        source_cmd = "for d in /opt/ros/*; do [ -f $d/setup.bash ] && . $d/setup.bash && break; done"
        # Try WSLg first, fall back to Resolver IP for Win10, then localhost
        display_cmd = "if [ -z \"$DISPLAY\" ]; then export DISPLAY=:0; if ! xset q &>/dev/null; then export DISPLAY=$(grep nameserver /etc/resolv.conf | awk '{print $2}'):0.0; fi; fi"
        # Compatibility flags for Windows/GWSL/Xming
        render_cmd = "export QT_X11_NO_MITSHM=1 && export LIBGL_ALWAYS_INDIRECT=0 && export TURTLEBOT3_MODEL=burger"
        # Clean up hung processes
        kill_cmd = "killall -9 gzserver gzclient python3 ros2 2>/dev/null || true"
        launch_cmd = f"ros2 launch turtlebot3_gazebo {launch_file} --verbose"
        
        full_wsl_cmd = f"{kill_cmd} && {source_cmd} && {display_cmd} && {render_cmd} && {launch_cmd}"
        cmd = f'wsl -d {self.wsl_distro} bash -c "{full_wsl_cmd}"'
        
        try:
            self.processes["sim"] = await asyncio.create_subprocess_shell(
                cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT
            )
            asyncio.create_task(self._capture_logs(self.processes["sim"], "GAZEBO"))
            
            # Start Telemetry Bridge
            win_path = "c/2026proj/DRL\\ ROBOT/backend/telemetry_node.py"
            tel_cmd = f'wsl -d {self.wsl_distro} bash -c "{source_cmd} && python3 /mnt/{win_path}"'
            self.processes["telemetry"] = await asyncio.create_subprocess_shell(
                tel_cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT
            )
            asyncio.create_task(self._capture_telemetry(self.processes["telemetry"]))
            return True, f"Environment [{self.scenario.upper()}] Dispatched"
        except Exception as e: return False, str(e)

    async def start_training(self):
        if self.processes["train"] and self.processes["train"].returncode is None:
            return False, "Active"
        source_cmd = "for d in /opt/ros/*; do [ -f $d/setup.bash ] && . $d/setup.bash && break; done"
        win_path = "c/2026proj/DRL\\ ROBOT/backend/train.py"
        # Ensure current working directory is backend for weight saving
        cmd = f'wsl -d {self.wsl_distro} bash -c "{source_cmd} && cd /mnt/c/2026proj/DRL\\ ROBOT/backend && export TURTLEBOT3_MODEL=burger && python3 /mnt/{win_path} --algo {self.algo} --mode train"'
        try:
            self.processes["train"] = await asyncio.create_subprocess_shell(
                cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT
            )
            asyncio.create_task(self._capture_logs(self.processes["train"], "DRL-TRAIN"))
            return True, f"Training Agent [{self.algo.upper()}] Dispatched"
        except Exception as e: return False, str(e)

    async def start_testing(self):
        if self.processes["train"] and self.processes["train"].returncode is None:
            return False, "Active"
        source_cmd = "for d in /opt/ros/*; do [ -f $d/setup.bash ] && . $d/setup.bash && break; done"
        win_path = "c/2026proj/DRL\\ ROBOT/backend/train.py"
        cmd = f'wsl -d {self.wsl_distro} bash -c "{source_cmd} && cd /mnt/c/2026proj/DRL\\ ROBOT/backend && export TURTLEBOT3_MODEL=burger && python3 /mnt/{win_path} --algo {self.algo} --mode test"'
        try:
            self.processes["train"] = await asyncio.create_subprocess_shell(
                cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT
            )
            asyncio.create_task(self._capture_logs(self.processes["train"], "DRL-TEST"))
            return True, f"Inference Module [{self.algo.upper()}] Loaded"
        except Exception as e: return False, str(e)

    async def stop_all(self):
        # Kill command via wsl to ensure all background processes die
        import subprocess
        subprocess.run(f'wsl -d {self.wsl_distro} bash -c "killall -9 gzserver gzclient python3 ros2 2>/dev/null || true"', shell=True)
        for key in self.processes:
            if self.processes[key]:
                try: self.processes[key].terminate()
                except: pass
                self.processes[key] = None
        await self.broadcast({"type": "status", "data": self.get_status()})

    async def telemetry_loop(self):
        while True:
            await asyncio.sleep(2)
            await self.broadcast({"type": "heartbeat", "status": self.get_status()})
