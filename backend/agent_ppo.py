import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.distributions import Normal
import numpy as np

class Actor(nn.Module):
    def __init__(self, state_dim, action_dim, max_action):
        super(Actor, self).__init__()
        self.fc1 = nn.Linear(state_dim, 256)
        self.fc2 = nn.Linear(256, 256)
        self.mu_head = nn.Linear(256, action_dim)
        self.sigma_head = nn.Linear(256, action_dim)
        self.max_action = max_action

    def forward(self, state):
        x = F.relu(self.fc1(state))
        x = F.relu(self.fc2(x))
        # Mu is strictly bounded by tanh
        mu = self.max_action * torch.tanh(self.mu_head(x))
        # Sigma must be strictly positive
        sigma = F.softplus(self.sigma_head(x)) + 1e-5
        return mu, sigma

class Critic(nn.Module):
    def __init__(self, state_dim):
        super(Critic, self).__init__()
        self.fc1 = nn.Linear(state_dim, 256)
        self.fc2 = nn.Linear(256, 256)
        self.value_head = nn.Linear(256, 1)

    def forward(self, state):
        x = F.relu(self.fc1(state))
        x = F.relu(self.fc2(x))
        return self.value_head(x)

class PPOAgent:
    def __init__(self, state_dim=24, action_dim=2, max_action=1.0):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.actor = Actor(state_dim, action_dim, max_action).to(self.device)
        self.critic = Critic(state_dim).to(self.device)
        self.max_action = max_action
        
        self.actor_optimizer = torch.optim.Adam(self.actor.parameters(), lr=1e-4) # Balanced for stability
        self.critic_optimizer = torch.optim.Adam(self.critic.parameters(), lr=3e-4)
        
        self.gamma = 0.99
        self.lmbda = 0.95
        self.eps_clip = 0.2
        self.K_epochs = 10
        
    def select_action(self, state):
        with torch.no_grad():
            state = torch.FloatTensor(state).unsqueeze(0).to(self.device)
            mu, sigma = self.actor(state)
            v_value = self.critic(state)
            
            dist = Normal(mu, sigma)
            action = dist.sample()
            action_logprob = dist.log_prob(action).sum(dim=-1)
            action = torch.clamp(action, -self.max_action, self.max_action)
            return action.cpu().numpy().flatten(), action_logprob.cpu().item(), v_value.cpu().item()

    def update(self, memory):
        # Sample memory
        states = torch.FloatTensor(memory.states).to(self.device)
        actions = torch.FloatTensor(memory.actions).to(self.device)
        old_logprobs = torch.FloatTensor(memory.logprobs).to(self.device)
        rewards = torch.FloatTensor(memory.rewards).to(self.device)
        is_terminals = torch.FloatTensor(memory.is_terminals).to(self.device)
        
        # Calculate rewards and GAE
        discounted_reward = 0
        rewards_to_go = []
        for reward, is_terminal in zip(reversed(memory.rewards), reversed(memory.is_terminals)):
            if is_terminal:
                discounted_reward = 0
            discounted_reward = reward + (self.gamma * discounted_reward)
            rewards_to_go.insert(0, discounted_reward)
            
        rewards_to_go = torch.tensor(rewards_to_go, dtype=torch.float32).to(self.device)
        rewards_to_go = (rewards_to_go - rewards_to_go.mean()) / (rewards_to_go.std() + 1e-7)
        
        # Optimize policy for K epochs:
        for _ in range(self.K_epochs):
            # Evaluating old actions and values
            mu, sigma = self.actor(states)
            dist = Normal(mu, sigma)
            logprobs = dist.log_prob(actions).sum(dim=-1)
            dist_entropy = dist.entropy().sum(dim=-1)
            state_values = self.critic(states).squeeze()
            
            # Finding the ratio (pi_theta / pi_theta__old)
            ratios = torch.exp(logprobs - old_logprobs.detach())
            
            # Finding Surrogate Loss
            advantages = (rewards_to_go - state_values.detach())
            surr1 = ratios * advantages
            surr2 = torch.clamp(ratios, 1-self.eps_clip, 1+self.eps_clip) * advantages
            
            # Final loss of clipped objective PPO
            loss = -torch.min(surr1, surr2) + 0.5 * F.mse_loss(state_values, rewards_to_go) - 0.01 * dist_entropy
            
            # Take gradient step
            self.actor_optimizer.zero_grad()
            self.critic_optimizer.zero_grad()
            loss.mean().backward()
            self.actor_optimizer.step()
            self.critic_optimizer.step()
            
class PPOMemory:
    def __init__(self):
        self.states = []
        self.actions = []
        self.logprobs = []
        self.rewards = []
        self.is_terminals = []
        
    def clear(self):
        del self.states[:]
        del self.actions[:]
        del self.logprobs[:]
        del self.rewards[:]
        del self.is_terminals[:]
