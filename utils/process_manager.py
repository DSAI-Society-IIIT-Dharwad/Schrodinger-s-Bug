"""
Thread-safe Process Manager for WSL subprocess lifecycle and log capture.
"""
import os
import subprocess
import threading
import time
from collections import deque
from datetime import datetime


class ProcessManager:
    def __init__(self, max_log_lines=500):
        self._lock = threading.Lock()
        self._processes = {'simulation': None, 'training': None}
        self._log_buffer = deque(maxlen=max_log_lines)
        self._history = [] # Track (episode, reward, success_rate, loss)
        self._training_episode = 0
        self._training_start_time = None

    def add_log(self, message, level="INFO"):
        ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        with self._lock:
            self._log_buffer.append(f"[{ts}] [{level}] {message}")

    def add_history(self, reward, success_rate, loss):
        with self._lock:
            self._training_episode += 1
            self._history.append({
                "episode": self._training_episode,
                "reward": reward,
                "success_rate": success_rate,
                "loss": loss
            })
            return self._training_episode

    def get_history(self):
        with self._lock:
            return list(self._history)

    def get_logs(self, last_n=60):
        with self._lock:
            return list(self._log_buffer)[-last_n:]

    def clear_logs(self):
        with self._lock:
            self._log_buffer.clear()

    def is_running(self, name):
        with self._lock:
            proc = self._processes.get(name)
            return proc is not None and proc.poll() is None

    def set_process(self, name, proc):
        with self._lock:
            self._processes[name] = proc

    def get_process(self, name):
        with self._lock:
            return self._processes.get(name)

    def clear_process(self, name):
        with self._lock:
            self._processes[name] = None

    def increment_episode(self):
        with self._lock:
            self._training_episode += 1
            return self._training_episode

    def get_episode(self):
        with self._lock:
            return self._training_episode

    def reset_episode(self):
        with self._lock:
            self._training_episode = 0

    def set_training_start(self):
        self._training_start_time = time.time()

    def get_training_elapsed(self):
        if self._training_start_time:
            return round(time.time() - self._training_start_time, 1)
        return 0

    def launch_wsl_process(self, name, wsl_command, log_prefix):
        """Launch a WSL command, capture output in background thread."""
        cmd = ['wsl', 'bash', '-lc', wsl_command]
        try:
            process = subprocess.Popen(
                cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0,
            )
            self.set_process(name, process)
            t = threading.Thread(target=self._stream_output, args=(process, log_prefix), daemon=True)
            t.start()
            self.add_log(f"{log_prefix} Process launched (PID: {process.pid})")
            return process.pid
        except FileNotFoundError:
            self.add_log(f"{log_prefix} WSL not found", "ERROR")
            raise
        except Exception as e:
            self.add_log(f"{log_prefix} Launch failed: {e}", "ERROR")
            raise

    def kill_process(self, name, wsl_kill_cmds=None):
        """Kill a managed process + optional WSL-side cleanup."""
        if wsl_kill_cmds:
            for cmd in wsl_kill_cmds:
                try:
                    subprocess.run(['wsl', 'bash', '-lc', cmd], timeout=5, capture_output=True)
                except Exception:
                    pass
        proc = self.get_process(name)
        if proc:
            try:
                proc.terminate()
                proc.wait(timeout=3)
            except Exception:
                try:
                    proc.kill()
                except Exception:
                    pass
        self.clear_process(name)

    def _stream_output(self, process, prefix):
        try:
            for line in iter(process.stdout.readline, b''):
                decoded = line.decode('utf-8', errors='replace').strip()
                if decoded:
                    level = "ERROR" if "error" in decoded.lower() else \
                            "WARN" if "warn" in decoded.lower() else "INFO"
                    self.add_log(f"{prefix} {decoded}", level)
        except Exception:
            pass
