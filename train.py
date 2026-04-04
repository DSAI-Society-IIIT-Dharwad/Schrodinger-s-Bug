import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan
from nav_msgs.msg import Odometry
from geometry_msgs.msg import Twist
import numpy as np
import json
import time
import os
import sys
from agent import DRLAgent

class DRLNode(Node):
    """
    ROS2 Node for DRL-based robot navigation
    Handles topics, movement, and training
    """
    
    def __init__(self):
        super().__init__('drl_node')
        
        # State variables
        self.scan_data = None
        self.rewards = []
        self.total_steps = 0
        self.success = 0
        self.episode = 0
        self.steps = 0
        
        # Initialize DRL Agent (separate from ROS)
        self.agent = DRLAgent(state_dim=36, action_dim=2)
        
        # ROS2 subscriptions and publishers
        self.create_subscription(LaserScan, '/scan', self.scan_cb, 10)
        self.create_subscription(Odometry, '/odom', self.odom_cb, 10)
        self.cmd_pub = self.create_publisher(Twist, '/cmd_vel', 10)
        
        # Internal state
        self.odom_data = {'x': 0.0, 'y': 0.0}
        self.goal = [np.random.uniform(-3, 3), np.random.uniform(-3, 3)]
        
        # Ensure log directory exists
        os.makedirs("/home/sree/ros2_ws/logs", exist_ok=True)
        
        # Control loop at 5Hz (0.2s interval)
        self.timer = self.create_timer(0.2, self.loop)
        
        self.get_logger().info("DRL Node initialized - Ready for navigation")
    
    def scan_cb(self, msg):
        """LiDAR scan callback - MANDATORY"""
        self.scan_data = np.array(msg.ranges)
    
    def odom_cb(self, msg):
        """Odometry callback"""
        self.odom_data['x'] = msg.pose.pose.position.x
        self.odom_data['y'] = msg.pose.pose.position.y
    
    def process_lidar(self, scan):
        """
        Process LiDAR data into state vector
        Returns: state array with shape (36,)
        """
        # Downsample to 24 readings
        indices = np.linspace(0, len(scan)-1, 24, dtype=int)
        lidar_readings = scan[indices]
        
        # Replace inf values with max range (3.5m)
        lidar_readings[np.isinf(lidar_readings)] = 3.5
        
        # Calculate distance and angle to goal
        current_x = self.odom_data['x']
        current_y = self.odom_data['y']
        dist_to_goal = np.sqrt((self.goal[0] - current_x)**2 + (self.goal[1] - current_y)**2)
        angle_to_goal = np.arctan2(self.goal[1] - current_y, self.goal[0] - current_x)
        
        # Normalize
        dist_normalized = min(dist_to_goal / 10.0, 1.0)
        angle_normalized = angle_to_goal / np.pi
        
        # Combine into state vector
        state = np.concatenate([lidar_readings, [dist_normalized, angle_normalized]])
        
        return state
    
    def compute_reward(self, dist_to_goal, min_obstacle, collision):
        """
        Compute reward based on current state
        """
        reward = -dist_to_goal * 0.5
        
        # Proximity penalty
        if min_obstacle < 0.5:
            reward -= 2.0
        
        # Collision penalty
        if collision:
            reward -= 200.0
        
        # Goal reached reward
        if dist_to_goal < 0.2:
            reward += 200.0
        
        return reward
    
    def loop(self):
        """Main control loop - MOVEMENT + TRAINING"""
        # Check if we have scan data
        if self.scan_data is None:
            return
        
        # Process LiDAR into state
        state = self.process_lidar(self.scan_data)
        
        # Get action from DRL agent
        linear, angular = self.agent.predict(state)
        
        # FORCE EXPLORATION (critical)
        linear += 0.15
        angular += np.random.uniform(-0.3, 0.3)
        
        # Safety override
        min_dist = np.min(self.scan_data)
        if min_dist < 0.22:
            linear = 0.0
            angular = 0.0
        elif min_dist < 0.45:
            linear = 0.05
            angular = 0.3
        
        # Publish velocity command
        cmd = Twist()
        cmd.linear.x = float(np.clip(linear, 0.0, 0.22))
        cmd.angular.z = float(np.clip(angular, -1.5, 1.5))
        self.cmd_pub.publish(cmd)
        
        # Compute reward
        current_x = self.odom_data['x']
        current_y = self.odom_data['y']
        dist_to_goal = np.sqrt((self.goal[0] - current_x)**2 + (self.goal[1] - current_y)**2)
        collision = np.min(self.scan_data) < 0.15
        
        reward = self.compute_reward(dist_to_goal, min_dist, collision)
        self.rewards.append(reward)
        
        # Training metrics
        self.total_steps += 1
        progress = min(100, self.total_steps * 0.1)
        accuracy = self.success / max(1, self.total_steps)
        
        # Print telemetry in required format
        print(f"[TEL] reward={reward:.2f} progress={progress:.1f} accuracy={accuracy:.2f}")
        sys.stdout.flush()
        
        # Save data periodically
        if len(self.rewards) % 10 == 0:
            try:
                np.save("/home/sree/ros2_ws/logs/rewards.npy", self.rewards)
            except Exception as e:
                self.get_logger().warn(f"Failed to save rewards: {e}")
        
        # Check episode termination
        if collision or dist_to_goal < 0.2 or self.steps > 500:
            if dist_to_goal < 0.2:
                self.success += 1
            
            self.episode += 1
            self.steps = 0
            self.goal = [np.random.uniform(-3, 3), np.random.uniform(-3, 3)]
        
        self.steps += 1


def main():
    rclpy.init()
    node = DRLNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        # Save final rewards
        try:
            np.save("/home/sree/ros2_ws/logs/rewards.npy", node.rewards)
        except:
            pass
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
