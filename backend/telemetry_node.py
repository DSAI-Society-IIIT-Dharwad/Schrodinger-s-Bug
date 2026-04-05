import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan
from nav_msgs.msg import Odometry
from geometry_msgs.msg import Twist
import json
import numpy as np

class TelemetryNode(Node):
    def __init__(self):
        super().__init__('telemetry_bridge')
        self.create_subscription(LaserScan, '/scan', self.scan_cb, 10)
        self.create_subscription(Odometry, '/odom', self.odom_cb, 10)
        self.create_subscription(Twist, '/cmd_vel', self.cmd_cb, 10)
        
        self.data = {
            "v": 0.0,
            "w": 0.0,
            "x": 0.0,
            "y": 0.0,
            "min_dist": 3.5,
            "lidar": [] # Array for RadarView
        }
        
        # Broadcast frequency: 10Hz for smooth HUD
        self.timer = self.create_timer(0.1, self.publish_telemetry)

    def scan_cb(self, msg):
        # Process raw laser ranges
        ranges = np.array(msg.ranges)
        ranges[np.isinf(ranges)] = 3.5
        ranges[np.isnan(ranges)] = 3.5
        self.data["min_dist"] = float(np.min(ranges))
        
        # Downsample to 24 points for the RadarView to keep performance high
        # The frontend components like RadarView usually look for a small array
        points = 36
        n = len(ranges)
        step = max(1, n // points)
        self.data["lidar"] = [float(np.min(ranges[i:i+step])) for i in range(0, n, step)][:points]

    def odom_cb(self, msg):
        # Capture raw position for trajectory mapping
        self.data["x"] = float(round(msg.pose.pose.position.x, 3))
        self.data["y"] = float(round(msg.pose.pose.position.y, 3))

    def cmd_cb(self, msg):
        # Capture the current commanded velocities
        self.data["v"] = float(round(msg.linear.x, 2))
        self.data["w"] = float(round(msg.angular.z, 2))

    def publish_telemetry(self):
        # Print JSON to stdout so ProcessManager can capture and broadcast it
        print(json.dumps(self.data), flush=True)

def main():
    rclpy.init()
    node = TelemetryNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        rclpy.shutdown()

if __name__ == '__main__':
    main()
