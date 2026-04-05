import torch
import torch.nn as nn
import torch.nn.functional as F

class PPO_ActorCritic(nn.Module):
    def __init__(self, state_dim=38, action_dim=2): # Updated state_dim to 38 (36 lidar + 2 goal info)
        super(PPO_ActorCritic, self).__init__()
        
        # Actor network: outputs continuous action means
        self.actor = nn.Sequential(
            nn.Linear(state_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 256),
            nn.ReLU(),
            nn.Linear(256, action_dim),
            nn.Tanh()
        )
        
        # Critic network: outputs state values
        self.critic = nn.Sequential(
            nn.Linear(state_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 256),
            nn.ReLU(),
            nn.Linear(256, 1)
        )
        
        # Action variance (standard deviation) - fixed value for exploration
        self.log_std = nn.Parameter(torch.zeros(action_dim))

    def act(self, state):
        action_mean = self.actor(state)
        std = torch.exp(self.log_std)
        dist = torch.distributions.Normal(action_mean, std)
        
        action = dist.sample()
        action_logprob = dist.log_prob(action).sum(dim=-1)
        return action.detach(), action_logprob.detach()

    def evaluate(self, state, action):
        action_mean = self.actor(state)
        std = torch.exp(self.log_std)
        dist = torch.distributions.Normal(action_mean, std)
        
        action_logprobs = dist.log_prob(action).sum(dim=-1)
        dist_entropy = dist.entropy().sum(dim=-1)
        state_values = self.critic(state)
        
        return action_logprobs, torch.squeeze(state_values), dist_entropy

class PPO:
    def __init__(self, state_dim=38, action_dim=2, lr=0.0003, gamma=0.99, K_epochs=4, eps_clip=0.2):
        self.gamma = gamma
        self.eps_clip = eps_clip
        self.K_epochs = K_epochs
        
        self.policy = PPO_ActorCritic(state_dim, action_dim)
        self.optimizer = torch.optim.Adam(self.policy.parameters(), lr=lr)
        
        self.policy_old = PPO_ActorCritic(state_dim, action_dim)
        self.policy_old.load_state_dict(self.policy.state_dict())
        
        self.MseLoss = nn.MSELoss()

    def select_action(self, state):
        with torch.no_grad():
            state = torch.FloatTensor(state).reshape(1, -1)
            action, action_logprob = self.policy_old.act(state)
        return action.numpy().flatten(), action_logprob.numpy().flatten()

    def update(self, memory):
        # Convert list to tensors
        states = torch.FloatTensor(memory.states)
        actions = torch.FloatTensor(memory.actions)
        old_logprobs = torch.FloatTensor(memory.logprobs)
        rewards = torch.FloatTensor(memory.rewards)
        is_terminals = torch.FloatTensor(memory.is_terminals)
        
        # Monte Carlo estimate of rewards
        returns = []
        discounted_reward = 0
        for reward, is_terminal in zip(reversed(rewards), reversed(is_terminals)):
            if is_terminal:
                discounted_reward = 0
            discounted_reward = reward + (self.gamma * discounted_reward)
            returns.insert(0, discounted_reward)
            
        returns = torch.tensor(returns)
        returns = (returns - returns.mean()) / (returns.std() + 1e-7)
        
        # Optimize policy for K epochs:
        for _ in range(self.K_epochs):
            # Evaluating old actions and values
            logprobs, state_values, dist_entropy = self.policy.evaluate(states, actions)
            
            # Finding the ratio (pi_theta / pi_theta__old):
            ratios = torch.exp(logprobs - old_logprobs.detach())
            
            # Finding Surrogate Loss:
            advantages = returns - state_values.detach()
            surr1 = ratios * advantages
            surr2 = torch.clamp(ratios, 1-self.eps_clip, 1+self.eps_clip) * advantages
            
            # Final loss of clipped objective PPO:
            loss = -torch.min(surr1, surr2) + 0.5 * self.MseLoss(state_values, returns) - 0.01 * dist_entropy
            
            # Take gradient step:
            self.optimizer.zero_grad()
            loss.mean().backward()
            self.optimizer.step()
            
        # Copy new weights into old policy:
        self.policy_old.load_state_dict(self.policy.state_dict())

class Memory:
    def __init__(self):
        self.actions = []
        self.states = []
        self.logprobs = []
        self.rewards = []
        self.is_terminals = []
    
    def clear(self):
        del self.actions[:]
        del self.states[:]
        del self.logprobs[:]
        del self.rewards[:]
        del self.is_terminals[:]
