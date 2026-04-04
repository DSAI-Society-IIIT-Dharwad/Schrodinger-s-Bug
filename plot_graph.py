import numpy as np
import matplotlib.pyplot as plt
import time
import os

LOG_DIR = "c:/2026proj/DRL ROBOT/backend/logs"
REWARDS_FILE = os.path.join(LOG_DIR, "rewards.npy")
GRAPH_FILE = os.path.join(LOG_DIR, "graph.png")

print("Starting plot_graph.py daemon...", flush=True)
os.makedirs(LOG_DIR, exist_ok=True)

# Try to use non-interactive matplotlib backend if needed
import matplotlib
matplotlib.use('Agg')

while True:
    try:
        if os.path.exists(REWARDS_FILE):
            rewards = np.load(REWARDS_FILE)
            if len(rewards) > 0:
                plt.figure(figsize=(8, 4))
                plt.plot(rewards[-200:], color='#00d1ff', linewidth=2) # Dark theme blue/cyan
                
                # Aesthetic styling
                plt.title("Baymax Learning Curve", color='white')
                plt.xlabel("Steps", color='white')
                plt.ylabel("Reward", color='white')
                
                ax = plt.gca()
                ax.set_facecolor('#0f172a') # Tailwind slate-900
                fig = plt.gcf()
                fig.patch.set_facecolor('#0f172a')
                
                ax.spines['bottom'].set_color('#1e293b')
                ax.spines['top'].set_color('#1e293b') 
                ax.spines['right'].set_color('#1e293b')
                ax.spines['left'].set_color('#1e293b')
                ax.tick_params(axis='x', colors='white')
                ax.tick_params(axis='y', colors='white')
                ax.grid(color='#1e293b', linestyle='-', linewidth=0.5)

                plt.tight_layout()
                plt.savefig(GRAPH_FILE, dpi=100)
                plt.close()
    except Exception as e:
        print(f"Error drawing graph: {e}", flush=True)
    
    time.sleep(2.0)
