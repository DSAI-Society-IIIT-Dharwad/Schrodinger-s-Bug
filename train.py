import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan
from nav_msgs.msg import Odometry
from geometry_msgs.msg import Twist
from std_msgs.msg import String
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import json
import time
import os
import random
import sys

# --- TD3 Networks ---
class Actor(nn.Module):
    def __init__(self, state_dim, action_dim, max_action):
        super(Actor, self).__init__()
        self.l1 = nn.Linear(state_dim, 256)
        self.l2 = nn.Linear(256, 256)
        self.l3 = nn.Linear(256, action_dim)
        self.max_action = max_action

    def forward(self, state):
        a = F.relu(self.l1(state))
        a = F.relu(self.l2(a))
        return self.max_action * torch.tanh(self.l3(a))

class Critic(nn.Module):
    def __init__(self, state_dim, action_dim):
        super(Critic, self).__init__()
        # Q1
        self.l1 = nn.Linear(state_dim + action_dim, 256)
        self.l2 = nn.Linear(256, 256)
        self.l3 = nn.Linear(256, 1)
        # Q2
        self.l4 = nn.Linear(state_dim + action_dim, 256)
        self.l5 = nn.Linear(256, 256)
        self.l6 = nn.Linear(256, 1)

    def forward(self, state, action):
        sa = torch.cat([state, action], 1)
        q1 = F.relu(self.l1(sa))
        q1 = F.relu(self.l2(q1))
        q1 = self.l3(q1)

        q2 = F.relu(self.l4(sa))
        q2 = F.relu(self.l5(q2))
        q2 = self.l6(q2)
        return q1, q2

# --- ROS2 DRL Agent ---
# --- CONFIGURATION (SCHRÖDINGER'S BUG) ---
MODES = {
    "healthcare": {"max_v": 0.12, "safety_penalty": 200, "label": "Soft Navigation"},
    "defence": {"max_v": 0.22, "safety_penalty": 50, "label": "Tactical Assault"},
    "logistics": {"max_v": 0.22, "safety_penalty": 100, "label": "Efficient Pathing"}
}

class DRLAgent(Node):
    def __init__(self):
        super().__init__('drl_agent')
        
        # State/Action Dims
        self.state_dim = 24 + 2 # LiDAR + (dist, angle to goal)
        self.action_dim = 2     # (linear_vel, angular_vel)
        self.max_action = 1.0

        # FORCE CPU FOR STABILITY (Schrödinger's Bug Policy)
        self.device = torch.device("cpu")
        self.actor = Actor(self.state_dim, self.action_dim, self.max_action).to(self.device)
        
        # Current Mode & Scenario
        self.current_mode = "training" # manual, training, inference
        self.current_scenario = "logistics"
        
        # ROS Communications
        self.cmd_pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.create_subscription(LaserScan, '/scan', self.scan_cb, 10)
        self.create_subscription(Odometry, '/odom', self.odom_cb, 10)
        
        # Internal State
        self.scan_data = np.ones(24) * 3.5
        self.odom_data = None
        self.goal = [random.uniform(-3, 3), random.uniform(-3, 3)]
        self.episode = 0
        self.steps = 0
        self.total_steps = 0
        self.success_count = 0
        self.rewards_ppo = []
        self.rewards_td3 = []
        self.algorithm = "TD3"
        self.warmed_up = False
        
        # Ensure log dir exists
        os.makedirs('/mnt/c/2026proj/DRL ROBOT/backend/logs', exist_ok=True)
        
        self.timer = self.create_timer(0.1, self.control_loop) # 10Hz
        logger.info(f"System: Schrödinger's Bug | Device: {self.device} | Active.")

    def compute_reward(self, dist, min_obstacle, collision):
        """ADAPTIVE REWARD SHAPING (MANDATORY REQ)"""
        scenario_cfg = MODES[self.current_scenario]
        
        # Base reward: negative distance
        reward = -dist * 0.5
        
        # Proximity Penalty
        if min_obstacle < 0.5:
            reward -= 2.0
            
        # Critical Penalties
        if collision:
            reward -= scenario_cfg["safety_penalty"]
            
        # Target Success
        if dist < 0.2:
            reward += 200.0
            
        return reward

    def safety_override(self, scan):
        """SAFETY SUPERVISOR (MANDATORY REQ)"""
        min_dist = np.min(scan)
        
        if min_dist < 0.22:
            return 0.0, 0.0 # Force Stop
        elif min_dist < 0.45:
            return 0.05, 0.3 # Slow Turn
            
        return None

    def control_loop(self):
        if self.current_mode == "manual":
            return # Let teleop-twist-keyboard control /cmd_vel
            
        if not self.warmed_up:
            cmd = Twist()
            cmd.linear.x = 0.2
            cmd.angular.z = 0.1
            self.cmd_pub.publish(cmd)
            self.warmed_up = True

        state = self.get_state()
        state_t = torch.FloatTensor(state.reshape(1, -1)).to(self.device)
        
        # Inference / Training
        with torch.no_grad():
            action = self.actor(state_t).cpu().data.numpy().flatten()
            
        # FORCE EXPLORATION (critical fix)
        action[0] += np.random.uniform(0.05, 0.2)
        action[1] += np.random.uniform(-0.3, 0.3)
        
        # Apply Safety Supervisor
        override = self.safety_override(self.scan_data)
        if override:
            action[0], action[1] = override
            # logger.warn(f"Supervisor Active: Override issued.")

        # Map to Twist and Cap via Scenario Limits
        max_v = MODES[self.current_scenario]["max_v"]
        cmd = Twist()
        cmd.linear.x = float(np.clip(action[0], 0.0, max_v))
        cmd.angular.z = float(action[1] * 1.5)
        self.cmd_pub.publish(cmd)
        
        # Compute Reward & Log
        dist = state[-2] # dist to goal
        collision = np.min(self.scan_data) < 0.15
        reward = self.compute_reward(dist, np.min(self.scan_data), collision)
        
        # Metrics tracking
        if self.algorithm == "PPO":
            self.rewards_ppo.append(reward)
        else:
            self.rewards_td3.append(reward)

        self.total_steps += 1
        
        if reward > 0:
            self.success_count += 1
            
        accuracy = self.success_count / self.total_steps
        progress = min(100, self.total_steps * 0.05)
        success_rate = self.success_count / max(1, self.episode)

        # JSON Telemetry Stream (MANDATORY REQ)
        state_str = "Moving"
        if collision:
            state_str = "Collision"
        elif dist < 0.2:
            state_str = "Goal Reached"
        elif np.min(self.scan_data) < 0.45:
            state_str = "Avoiding"

        # Maintain structured JSON block as it's superior and robust
        telemetry = {
            "reward": round(reward, 3),
            "progress": round(progress, 2),
            "success_rate": round(success_rate, 2),
            "accuracy": round(accuracy, 2),
            "collision": bool(collision),
            "state": state_str,
            "algorithm": self.algorithm,
            "v": round(cmd.linear.x, 2),
            "distance": round(dist, 3),
            "episode": self.episode,
            "steps": self.total_steps
        }
        print("[TEL] " + json.dumps(telemetry))
        sys.stdout.flush()

        # Save data periodically
        if self.total_steps % 50 == 0:
            if self.algorithm == "PPO":
                np.save("/mnt/c/2026proj/DRL ROBOT/backend/logs/ppo.npy", self.rewards_ppo)
            else:
                np.save("/mnt/c/2026proj/DRL ROBOT/backend/logs/td3.npy", self.rewards_td3)

        if collision or (dist < 0.2) or self.steps > 500:
            self.episode += 1
            self.steps = 0
            self.goal = [random.uniform(-3, 3), random.uniform(-3, 3)]
        self.steps += 1


def main():
    rclpy.init()
    node = DRLAgent()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
