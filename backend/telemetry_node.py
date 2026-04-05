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
            "min_dist": 3.5
        }
        
        self.timer = self.create_timer(0.2, self.publish_telemetry)

    def scan_cb(self, msg):
        ranges = np.array(msg.ranges)
        ranges[np.isinf(ranges)] = 3.5
        self.data["min_dist"] = float(np.min(ranges))

    def odom_cb(self, msg):
        self.data["x"] = round(msg.pose.pose.position.x, 2)
        self.data["y"] = round(msg.pose.pose.position.y, 2)

    def cmd_cb(self, msg):
        self.data["v"] = round(msg.linear.x, 2)
        self.data["w"] = round(msg.angular.z, 2)

    def publish_telemetry(self):
        # Print JSON to stdout so backend can capture it via subprocess
        print(json.dumps(self.data), flush=True)

def main():
    rclpy.init()
    node = TelemetryNode()
    rclpy.spin(node)
    rclpy.shutdown()

if __name__ == '__main__':
    main()
