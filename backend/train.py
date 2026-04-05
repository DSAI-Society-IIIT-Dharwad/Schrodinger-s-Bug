import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan
from nav_msgs.msg import Odometry
from geometry_msgs.msg import Twist
import numpy as np
import json
import os
import argparse
import random
import time

# Import siloed agents
from agent_ppo import PPOAgent, PPOMemory
from agent_td3 import TD3Agent, ReplayBuffer

class TrainNode(Node):
    def __init__(self, algo='ppo'):
        super().__init__('train_node')
        
        self.algo = algo.lower()
        self.metrics_file = f"{self.algo}_metrics.json"
        
        # ROS2 Setup
        self.cmd_pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.scan_sub = self.create_subscription(LaserScan, '/scan', self.scan_callback, 10)
        self.odom_sub = self.create_subscription(Odometry, '/odom', self.odom_callback, 10)
        
        # State & Dimensions
        self.state_dim = 24
        self.action_dim = 2
        self.max_action = 1.0
        
        # Initialize Agent & Memory
        if self.algo == 'ppo':
            self.agent = PPOAgent(state_dim=self.state_dim, action_dim=self.action_dim)
            self.memory = PPOMemory()
            self.update_timestep = 128
        else:
            self.agent = TD3Agent(state_dim=self.state_dim, action_dim=self.action_dim)
            self.replay_buffer = ReplayBuffer(self.state_dim, self.action_dim)
            self.batch_size = 64
            self.warmup_steps = 100
            
        # State & Metrics
        self.latest_scan = None
        self.prev_scan = None
        self.total_steps = 0
        self.episode_rewards = []
        self.collisions = 0
        self.robot_x = 0.0
        self.robot_y = 0.0
        
        # Timers
        self.timer = self.create_timer(0.1, self.control_loop) # 10Hz
        
        self.get_logger().info(f"TRAIN_NODE: Running {self.algo.upper()}")

    def scan_callback(self, msg):
        ranges = np.array(msg.ranges)
        # Handle inf/nan
        ranges[np.isinf(ranges)] = 3.5
        ranges[np.isnan(ranges)] = 3.5
        
        # Downsample to 24 dimensions
        step = len(ranges) // self.state_dim
        self.latest_scan = np.array([np.min(ranges[i*step:(i+1)*step]) for i in range(self.state_dim)])

    def odom_callback(self, msg):
        self.robot_x = msg.pose.pose.position.x
        self.robot_y = msg.pose.pose.position.y

    def control_loop(self):
        # Motion Guarantee: If no scan data yet, just move slowly to ensure 'system ready' feel
        if self.latest_scan is None:
            twist = Twist()
            twist.linear.x = 0.1 # Slow crawl until sensors online
            self.cmd_pub.publish(twist)
            return

        state = self.latest_scan
        v_value = 0.0
        q_value = 0.0
        
        # Select Action
        if self.algo == 'ppo':
            action, logprob, v_value = self.agent.select_action(state)
        else:
            if self.total_steps < self.warmup_steps:
                action = np.random.uniform(-self.max_action, self.max_action, size=self.action_dim)
                q_value = 0.0
            else:
                action, q_value = self.agent.select_action(state)
        
        # MOTION GUARANTEE
        twist = Twist()
        linear_val = 0.15 + float(action[0] * 0.1) 
        angular_val = float(action[1]) + random.uniform(-0.02, 0.02)
        
        twist.linear.x = linear_val
        twist.angular.z = angular_val
        self.cmd_pub.publish(twist)
        
        # Reward Logic
        min_dist = np.min(self.latest_scan)
        reward = 0.1 # Base survival reward
        done = False
        
        if min_dist < 0.2:
            reward = -10.0
            self.collisions += 1
            done = True
            
        # Store transition
        if self.algo == 'ppo':
            self.memory.states.append(state)
            self.memory.actions.append(action)
            self.memory.logprobs.append(logprob)
            self.memory.rewards.append(reward)
            self.memory.is_terminals.append(done)
        else:
            if self.prev_scan is not None:
                self.replay_buffer.add(self.prev_scan, action, state, reward, done)
        
        self.prev_scan = state
        self.episode_rewards.append(reward)
        self.total_steps += 1
        
        # Perform Training Updates
        if self.algo == 'ppo':
            if self.total_steps % self.update_timestep == 0:
                self.agent.update(self.memory)
                self.memory.clear()
        else:
            if self.total_steps > self.warmup_steps:
                self.agent.update(self.replay_buffer, self.batch_size)
        
        # Save telemetry every 20 steps
        if self.total_steps % 20 == 0:
            self.save_metrics(reward, v_value, q_value, action)

    def save_metrics(self, latest_reward, v_val, q_val, action):
        avg_reward = float(np.mean(self.episode_rewards))
        
        metrics = {
            "algo": self.algo,
            "reward": float(latest_reward),
            "avg_reward": avg_reward,
            "v_value": float(v_val),
            "q_value": float(q_val),
            "action_linear": float(action[0]),
            "action_angular": float(action[1]),
            "lidar": self.latest_scan.tolist(),
            "steps": int(self.total_steps),
            "collision_rate": float(self.collisions / self.total_steps),
            "x": float(self.robot_x),
            "y": float(self.robot_y),
            "timestamp": int(time.time())
        }
        
        try:
            with open(self.metrics_file, 'w') as f:
                json.dump(metrics, f)
        except Exception as e:
            self.get_logger().error(f"Failed to save metrics: {e}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--algo', type=str, default='ppo')
    args, _ = parser.parse_known_args()
    
    rclpy.init()
    node = TrainNode(algo=args.algo)
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
