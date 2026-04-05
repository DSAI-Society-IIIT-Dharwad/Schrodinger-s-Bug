import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
import numpy as np

# --- PPO Actor-Critic ---
class PPOActorCritic(nn.Module):
    def __init__(self, state_dim, action_dim):
        super(PPOActorCritic, self).__init__()
        self.affine = nn.Linear(state_dim, 256)
        self.action_mean = nn.Linear(256, action_dim)
        self.value_head = nn.Linear(256, 1)

    def forward(self, state):
        x = F.relu(self.affine(state))
        return torch.tanh(self.action_mean(x)), self.value_head(x)

# --- TD3 Actor & Critic ---
class TD3Actor(nn.Module):
    def __init__(self, state_dim, action_dim, max_action=1.0):
        super(TD3Actor, self).__init__()
        self.l1 = nn.Linear(state_dim, 256)
        self.l2 = nn.Linear(256, 256)
        self.l3 = nn.Linear(256, action_dim)
        self.max_action = max_action

    def forward(self, state):
        a = F.relu(self.l1(state))
        a = F.relu(self.l2(a))
        return self.max_action * torch.tanh(self.l3(a))

class TD3Critic(nn.Module):
    def __init__(self, state_dim, action_dim):
        super(TD3Critic, self).__init__()
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

class DRLAgent:
    """
    Unified DRL Agent - Supports PPO and TD3 for robotics navigation.
    """
    def __init__(self, algo='PPO', state_dim=36, action_dim=2):
        self.device = torch.device("cpu") # Force CPU for ROS2 stability in WSL
        self.algo = algo.upper()
        
        if self.algo == 'PPO':
            self.model = PPOActorCritic(state_dim, action_dim).to(self.device)
        else:
            self.actor = TD3Actor(state_dim, action_dim).to(self.device)
            self.critic = TD3Critic(state_dim, action_dim).to(self.device)

    def select_action(self, state):
        state = torch.FloatTensor(state).to(self.device).unsqueeze(0)
        with torch.no_grad():
            if self.algo == 'PPO':
                action, _ = self.model(state)
            else:
                action = self.actor(state)
        
        action = action.cpu().numpy().flatten()
        noise = np.random.normal(0, 0.1, size=2)
        return np.clip(action + noise, -1.0, 1.0)
