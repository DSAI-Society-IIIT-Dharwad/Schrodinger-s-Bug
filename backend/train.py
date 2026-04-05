import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan
from nav_msgs.msg import Odometry
from geometry_msgs.msg import Twist
import numpy as np
import os
import json
import torch
import math
import random
from agent import PPO, Memory

class TrainNode(Node):
    def __init__(self):
        super().__init__('train_node')
        
        # ROS2 Setup
        self.create_subscription(LaserScan, '/scan', self.scan_callback, 10)
        self.create_subscription(Odometry, '/odom', self.odom_callback, 10)
        self.cmd_pub = self.create_publisher(Twist, '/cmd_vel', 10)
        
        # Timer for the training loop (0.1 sec = 10Hz)
        self.timer = self.create_timer(0.1, self.loop)
        
        # DRL Setup (PPO)
        self.state_dim = 38 # 36 lidar scans + 2 goal info (dist, angle)
        self.action_dim = 2 # linear velocity, angular velocity
        self.agent = PPO(state_dim=self.state_dim, action_dim=self.action_dim)
        self.memory = Memory()
        
        # Goal Configuration (Vocabai Challenge)
        self.goal_x = 2.0
        self.goal_y = 2.0
        self.prev_distance = 0.0
        
        # State/Telemetry
        self.scan_data = None
        self.odom_data = None
        self.robot_x = 0.0
        self.robot_y = 0.0
        self.robot_yaw = 0.0
        
        self.total_steps = 0
        self.rewards_history = []
        self.collisions = 0
        self.successes = 0
        
        self.log_dir = "logs"
        os.makedirs(self.log_dir, exist_ok=True)
        
        self.get_logger().info("🔥 Vocabai DRL Trainer: Navigation Goal (2.0, 2.0)")

    def scan_callback(self, msg):
        ranges = np.array(msg.ranges)
        ranges[np.isinf(ranges)] = 3.5
        ranges[np.isnan(ranges)] = 3.5
        self.scan_data = ranges[::10][:36]

    def odom_callback(self, msg):
        self.odom_data = msg
        self.robot_x = msg.pose.pose.position.x
        self.robot_y = msg.pose.pose.position.y
        
        # Quaternion to Euler (Yaw)
        q = msg.pose.pose.orientation
        siny_cosp = 2 * (q.w * q.z + q.x * q.y)
        cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z)
        self.robot_yaw = math.atan2(siny_cosp, cosy_cosp)

    def loop(self):
        if self.scan_data is None or self.odom_data is None:
            return

        # 1. Goal Calculations
        distance = math.sqrt((self.goal_x - self.robot_x)**2 + (self.goal_y - self.robot_y)**2)
        skew_x = self.goal_x - self.robot_x
        skew_y = self.goal_y - self.robot_y
        dot = skew_x * math.cos(self.robot_yaw) + skew_y * math.sin(self.robot_yaw)
        mag1 = math.sqrt(skew_x**2 + skew_y**2)
        mag2 = 1.0 # robot orientation vector length
        beta = math.acos(max(-1.0, min(1.0, dot / (mag1 * mag2))))
        
        # Cross product to determine sign of angle
        if (skew_x * math.sin(self.robot_yaw) - skew_y * math.cos(self.robot_yaw)) > 0:
            beta = -beta

        # 2. State construction (36 scan + 2 navigation)
        state = np.append(self.scan_data, [distance, beta])
        
        # 3. Select action
        action, action_logprob = self.agent.select_action(state)
        
        # 4. Apply action
        twist = Twist()
        # Requirement: twist.linear.x = 0.15 + action[0] (clipped)
        linear_v = 0.15 + (float(action[0]) * 0.1) 
        angular_v = float(action[1]) + (random.uniform(-0.05, 0.05))
        
        twist.linear.x = float(np.clip(linear_v, 0.05, 0.22))
        twist.angular.z = float(np.clip(angular_v, -1.8, 1.8))
        self.cmd_pub.publish(twist)
        
        # 5. Reward Function (Vocabai Optimization)
        reward = 0.0
        done = False
        
        # Collision Penalty
        min_scan = np.min(self.scan_data)
        if min_scan < 0.2:
            reward = -500.0
            done = True
            self.collisions += 1
            self.get_logger().warn("💥 COLLISION DETECTED")
        
        # Goal Success Reward
        elif distance < 0.3:
            reward = 1000.0
            done = True
            self.successes += 1
            self.get_logger().info("🎯 GOAL REACHED!")
        
        # Navigation Progress Reward
        else:
            # Positive reward for moving closer (Vocabai requirement)
            reward = (self.prev_distance - distance) * 200.0
            # Small time penalty
            reward -= 0.1
            # Heading reward (facing the goal)
            reward += math.cos(beta) * 0.2

        self.prev_distance = distance
        
        # 6. Memory & Update
        self.memory.states.append(state)
        self.memory.actions.append(action)
        self.memory.logprobs.append(action_logprob)
        self.memory.rewards.append(reward)
        self.memory.is_terminals.append(done)
        self.rewards_history.append(reward)
        self.total_steps += 1
        
        if self.total_steps % 128 == 0:
            self.agent.update(self.memory)
            self.memory.clear()
            
        # 7. Telemetry & Data Logs
        if self.total_steps % 25 == 0:
            self.save_telemetry(reward, distance)

    def save_telemetry(self, latest_reward, distance):
        last_100_rewards = self.rewards_history[-100:]
        avg_reward = np.mean(last_100_rewards) if last_100_rewards else 0
        collision_rate = self.collisions / max(1, self.total_steps)
        
        metrics = {
            "reward": round(float(latest_reward), 4),
            "avg_reward": round(float(avg_reward), 4),
            "reward_history": [round(float(r), 4) for r in last_100_rewards],
            "steps": int(self.total_steps),
            "distance_to_goal": round(float(distance), 4),
            "collision_rate": round(float(collision_rate), 4),
            "success_rate": round(float(self.successes / max(1, self.total_steps)), 4),
            "algorithm": "PPO",
            "phase": "Avoiding" if np.min(self.scan_data) < 0.5 else "Navigating"
        }
        
        with open("metrics.json", "w") as f:
            json.dump(metrics, f)
        
        np.save("rewards.npy", np.array(self.rewards_history))
        self.get_logger().info(f"📊 Dist: {distance:.2f} | AvgR: {avg_reward:.2f}")

def main():
    rclpy.init()
    node = TrainNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.cmd_pub.publish(Twist())
        rclpy.shutdown()

if __name__ == '__main__':
    main()
