import { roverState } from './stateManager.js';

class DRLTelemetryEngine {
  constructor() {
    this.isRunning = false;
    this.timer = null;
    
    // Episode tracking
    this.episode = 0;
    this.timestep = 0;
    this.episodeLength = 0; // Will be randomized per episode
    
    // Algorithm selection: DQN, TD3, PPO
    this.algorithm = 'TD3';
    this.speedMultiplier = 1;
    this.learnMode = false;
    this.isPaused = false;
    
    // State variables
    this.distanceToGoal = 50;
    this.prevDistance = 50;
    this.velocity = 0;
    this.prevVelocity = 0;
    this.angularVelocity = 0;
    this.cumulativeReward = 0;
    this.collisions = 0;
    this.episodeCollisions = 0;
    this.episodeReward = 0;
    this.steps = 0;
    this.timeToGoal = 0;
    this.policyLoss = 0;
    
    // LiDAR data (24 rays)
    this.lidarRays = Array(24).fill(3.5);
    
    // Odometry
    this.posX = 0;
    this.posY = 0;
    this.linearV = 0;
    this.angularV = 0;
    
    // Historical data for rolling averages
    this.episodeSuccesses = []; // Array of booleans
    this.episodeRewards = []; // For chart
    this.maxHistoryLength = 20;
    
    // Domain randomization
    this.domainRandomizationActive = false;
    this.randomizationRecoveryCounter = 0;
    
    // Safety supervisor
    this.safetySupervisorThreshold = 1.5; // meters
    this.obstacleDistance = 100; // Simulated obstacle distance
    
    // Callbacks
    this.onTelemetryUpdate = null;
    this.onLogMessage = null;
  }
  
  start(onTelemetryUpdate, onLogMessage) {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.onTelemetryUpdate = onTelemetryUpdate;
    this.onLogMessage = onLogMessage;
    
    // Reset state
    this.resetEpisode();
    this.episode = 0;
    this.episodeSuccesses = [];
    
    this.addLog('DRL TRAINING ENGINE INITIALIZED', 'info');
    this.startEpisode();
    
    // Start simulation loop at 0.5s intervals (2Hz)
    this.timer = setInterval(() => this.simulationStep(), 500);
  }
  
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    this.addLog('DRL TRAINING ENGINE STOPPED', 'info');
  }
  
  resetEpisode() {
    this.timestep = 0;
    this.episodeCollisions = 0;
    this.episodeReward = 0;
    
    // Randomize episode length between 60-120 seconds (120-240 timesteps at 0.5s)
    this.episodeLength = Math.floor(120 + Math.random() * 120);
    
    // Reset distance with domain randomization
    const baseDistance = 40 + Math.random() * 20;
    this.distanceToGoal = baseDistance;
    this.prevDistance = baseDistance;
    
    // Reset velocity
    this.velocity = 0;
    this.prevVelocity = 0;
    
    // Reset obstacle distance
    this.obstacleDistance = 100;
  }
  
  startEpisode() {
    this.episode++;
    this.resetEpisode();
    
    const phase = this.getCurrentPhase();
    this.addLog(`EPISODE ${this.episode} STARTED - Phase: ${phase}`, 'episode');
    this.addLog(`Initial distance to goal: ${this.distanceToGoal.toFixed(1)}m`, 'info');
    
    // Check for domain randomization
    if (this.episode > 1 && this.episode % 10 === 0) {
      this.triggerDomainRandomization();
    }
  }
  
  simulationStep() {
    if (!this.isRunning) return;
    
    this.timestep++;
    
    // Update phase-based parameters
    const phase = this.getCurrentPhase();
    const explorationFactor = this.getExplorationFactor();
    const policyStability = this.getPolicyStability();
    const collisionProb = this.getCollisionProbability();
    
    // Generate target velocity based on phase and stability
    this.generateVelocity(phase, explorationFactor, policyStability);
    
    // Apply safety supervisor check
    const safetyIntervention = this.checkSafetySupervisor();
    
    // Update distance
    this.updateDistance();
    
    // Check for collisions
    const collision = this.checkCollision(collisionProb);
    
    // Calculate reward
    const reward = this.calculateReward(collision, safetyIntervention);
    
    // Update cumulative metrics
    this.episodeReward += reward;
    this.cumulativeReward += reward;
    
    // Emit telemetry
    const successRate = this.getSuccessRate();
    this.policyLoss = Math.max(0.001, 0.8 * Math.exp(-this.episode / 40) + (Math.random() - 0.5) * 0.02);
    this.timeToGoal = Math.max(5, 30 * Math.exp(-this.episode / 60) + (Math.random() - 0.5) * 4);
    
    const telemetry = {
      timestamp: Date.now() / 1000,
      episode: this.episode,
      timestep: this.timestep,
      distance_to_goal: parseFloat(this.distanceToGoal.toFixed(2)),
      velocity: parseFloat(this.velocity.toFixed(2)),
      angularVelocity: parseFloat(this.angularVelocity.toFixed(2)),
      reward: parseFloat(reward.toFixed(2)),
      cumulative_reward: parseFloat(this.cumulativeReward.toFixed(2)),
      collisions: this.episodeCollisions,
      success_rate: parseFloat(successRate.toFixed(2)),
      policy_stability: parseFloat(policyStability.toFixed(2)),
      phase: phase,
      lidarRays: this.lidarRays.map(r => parseFloat(r.toFixed(2))),
      posX: parseFloat(this.posX.toFixed(3)),
      posY: parseFloat(this.posY.toFixed(3)),
      linearV: parseFloat(this.linearV.toFixed(2)),
      angularV: parseFloat(this.angularV.toFixed(2)),
      steps: this.steps,
      timeToGoal: parseFloat(this.timeToGoal.toFixed(1)),
      policyLoss: parseFloat(this.policyLoss.toFixed(4)),
      algorithm: this.algorithm
    };
    
    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate(telemetry);
    }
    
    // Log significant events (throttled to avoid spam)
    if (this.timestep === 1 || this.timestep % 10 === 0) {
      this.addLog(`Distance: ${this.distanceToGoal.toFixed(1)}m | Velocity: ${this.velocity.toFixed(1)} m/s | Reward: ${reward.toFixed(1)}`, 'telemetry');
    }
    
    // Check if episode is complete
    if (this.timestep >= this.episodeLength || this.distanceToGoal <= 2) {
      this.endEpisode();
    }
  }
  
  generateVelocity(phase, explorationFactor, policyStability) {
    let targetVelocity;
    const noise = (Math.random() - 0.5) * 2;
    
    switch(phase) {
      case 'EXPLORATION':
        // Erratic velocity with high variance
        targetVelocity = (Math.random() * 8 - 2) + noise * 3;
        break;
      case 'LEARNING':
        // More controlled but still variable
        const learningBase = 3 + (this.episode - 20) * 0.1;
        targetVelocity = learningBase + noise * (2 - policyStability);
        break;
      case 'CONVERGENCE':
        // Smooth, near-optimal velocity
        const optimalVelocity = 5;
        targetVelocity = optimalVelocity + noise * (0.5 * (1 - policyStability));
        break;
      default:
        targetVelocity = 0;
    }
    
    // Apply domain randomization effect
    if (this.domainRandomizationActive) {
      targetVelocity *= (0.7 + Math.random() * 0.6); // ±30% variation
    }
    
    // Smooth velocity transitions based on policy stability
    const smoothingFactor = 0.3 + (policyStability * 0.5);
    this.prevVelocity = this.velocity;
    this.velocity = this.velocity + (targetVelocity - this.velocity) * smoothingFactor;
    
    // Cap velocity for safety
    this.velocity = Math.max(-2, Math.min(8, this.velocity));
  }
  
  updateDistance() {
    const dt = 0.5; // 0.5 seconds per timestep
    
    // Distance decreases based on velocity
    let distanceChange = this.velocity * dt;
    
    // Add sensor noise
    const sensorNoise = (Math.random() - 0.5) * 0.5;
    distanceChange += sensorNoise;
    
    this.prevDistance = this.distanceToGoal;
    this.distanceToGoal = Math.max(0, this.distanceToGoal - distanceChange);
    
    // Update odometry
    this.steps++;
    this.posX += Math.sin(this.episode * 0.1) * this.velocity * dt * 0.3;
    this.posY += Math.cos(this.episode * 0.1) * this.velocity * dt * 0.3;
    this.linearV = Math.abs(this.velocity);
    this.angularV = Math.abs(this.angularVelocity);
    
    // Update LiDAR rays (24 rays around rover)
    this.updateLidarRays();
  }
  
  updateLidarRays() {
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      
      // Base distance with some variation
      let rayDistance = 2.5 + Math.random() * 1.5;
      
      // Check if ray hits obstacle (simulated)
      const obstacleAngle = (this.episode * 0.3) % (Math.PI * 2);
      const angleDiff = Math.abs(angle - obstacleAngle);
      
      if (angleDiff < 0.5 || angleDiff > (Math.PI * 2 - 0.5)) {
        // Ray hits obstacle
        rayDistance = 0.5 + Math.random() * 1.0;
      }
      
      // Domain randomization affects LiDAR
      if (this.domainRandomizationActive) {
        rayDistance *= (0.7 + Math.random() * 0.6);
      }
      
      this.lidarRays[i] = Math.min(3.5, Math.max(0.3, rayDistance));
    }
  }
  
  checkCollision(collisionProb) {
    const collided = Math.random() < collisionProb;
    
    if (collided) {
      this.collisions++;
      this.episodeCollisions++;
      
      // Collision affects velocity
      this.velocity = 0;
      
      this.addLog(`⚠ COLLISION DETECTED - Penalty: -50 reward`, 'collision');
      this.addLog(`Safety supervisor activated - Emergency stop`, 'safety');
    }
    
    return collided;
  }
  
  checkSafetySupervisor() {
    // Simulate obstacle detection
    if (this.episode < 30) {
      // Early episodes: obstacles appear more frequently
      this.obstacleDistance = 3 + Math.random() * 15;
    } else if (this.episode < 60) {
      // Mid episodes: better avoidance
      this.obstacleDistance = 8 + Math.random() * 20;
    } else {
      // Late episodes: good obstacle avoidance
      this.obstacleDistance = 15 + Math.random() * 30;
    }
    
    // Apply domain randomization
    if (this.domainRandomizationActive) {
      this.obstacleDistance *= (0.5 + Math.random() * 0.5);
    }
    
    if (this.obstacleDistance < this.safetySupervisorThreshold) {
      this.velocity = 0;
      this.addLog(`🛡 SAFETY SUPERVISOR: Obstacle at ${this.obstacleDistance.toFixed(1)}m - Emergency stop`, 'safety');
      return true;
    }
    
    return false;
  }
  
  calculateReward(collision, safetyIntervention) {
    const distanceImprovement = this.prevDistance - this.distanceToGoal;
    
    let reward = distanceImprovement * 10;
    
    // Collision penalty
    if (collision) {
      reward -= 50;
    }
    
    // Safety intervention penalty
    if (safetyIntervention && !collision) {
      reward -= 25;
    }
    
    // Step penalty
    reward -= 0.1;
    
    // Goal bonus
    if (this.distanceToGoal <= 2) {
      reward += 100;
      this.addLog(`✓ GOAL REACHED | Reward: +${(this.episodeReward + reward).toFixed(1)} | Steps: ${this.steps}`, 'success');
    }
    
    // Domain randomization causes temporary reward reduction
    if (this.domainRandomizationActive) {
      reward *= 0.7;
    }
    
    return reward;
  }
  
  endEpisode() {
    const success = this.distanceToGoal <= 2;
    const successRate = this.getSuccessRate();
    
    // Record episode result
    this.episodeSuccesses.push(success);
    if (this.episodeSuccesses.length > this.maxHistoryLength) {
      this.episodeSuccesses.shift();
    }
    
    this.addLog(
      `Episode ${this.episode} complete - Success: ${success ? 'YES' : 'NO'} | ` +
      `Total reward: ${this.episodeReward.toFixed(1)} | ` +
      `Collisions: ${this.episodeCollisions}`,
      success ? 'success' : 'episode'
    );
    
    this.addLog(`Rolling success rate: ${(successRate * 100).toFixed(1)}% (${this.episodeSuccesses.filter(s => s).length}/${this.episodeSuccesses.length} episodes)`, 'info');
    
    // Start next episode after a brief pause
    setTimeout(() => {
      if (this.isRunning) {
        this.startEpisode();
      }
    }, 1000);
  }
  
  triggerDomainRandomization() {
    this.domainRandomizationActive = true;
    this.randomizationRecoveryCounter = 0;
    
    const goalShift = (Math.random() - 0.5) * 30;
    this.distanceToGoal = Math.max(20, this.distanceToGoal + Math.abs(goalShift));
    
    this.addLog(`🎲 DOMAIN RANDOMIZATION: Goal repositioned (${goalShift > 0 ? '+' : ''}${goalShift.toFixed(1)}m)`, 'randomization');
    this.addLog(`Obstacle density increased | Sensor noise injected (±5%)`, 'randomization');
    this.addLog(`Expected performance drop - Recovery in 2-3 episodes`, 'randomization');
    
    // Deactivate after 2-3 episodes
    const recoveryEpisodes = 2 + Math.floor(Math.random() * 2);
    const currentEpisode = this.episode;
    
    const checkRecovery = () => {
      if (!this.isRunning) return;
      
      if (this.episode >= currentEpisode + recoveryEpisodes) {
        this.domainRandomizationActive = false;
        this.addLog(`✓ Domain randomization effects cleared - Performance recovering`, 'randomization');
      } else {
        setTimeout(checkRecovery, 500);
      }
    };
    
    setTimeout(checkRecovery, 500);
  }
  
  getCurrentPhase() {
    if (this.episode <= 20) return 'EXPLORATION';
    if (this.episode <= 60) return 'LEARNING';
    return 'CONVERGENCE';
  }
  
  getExplorationFactor() {
    // Epsilon decay from 1.0 to 0.05
    return Math.max(0.05, 1.0 - (this.episode * 0.012));
  }
  
  getPolicyStability() {
    return Math.min(1.0, this.episode / 80);
  }
  
  getCollisionProbability() {
    // Algorithm-specific convergence constants
    const C = this.algorithm === 'DQN' ? 120 : this.algorithm === 'PPO' ? 90 : 60; // TD3=60
    
    // Exponentially decreasing collision probability
    const baseProb = Math.max(0.05, 0.5 * Math.exp(-this.episode / C));
    
    // Domain randomization increases collision probability temporarily
    if (this.domainRandomizationActive) {
      return Math.min(0.8, baseProb * 2);
    }
    
    return baseProb;
  }
  
  getSuccessRate() {
    if (this.episodeSuccesses.length === 0) return 0;
    const successes = this.episodeSuccesses.filter(s => s).length;
    return successes / this.episodeSuccesses.length;
  }
  
  addLog(message, type = 'info') {
    if (this.onLogMessage) {
      this.onLogMessage(message, type);
    }
  }
  
  setAlgorithm(algo) {
    this.algorithm = algo;
    this.addLog(`Algorithm switched to: ${algo}`, 'info');
  }
  
  setSpeedMultiplier(multiplier) {
    this.speedMultiplier = multiplier;
    // Adjust timer interval
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = setInterval(() => this.simulationStep(), 500 / multiplier);
    }
  }
  
  toggleLearnMode() {
    this.learnMode = !this.learnMode;
    this.addLog(`Learn Mode: ${this.learnMode ? 'ON' : 'OFF'}`, 'info');
  }
  
  pause() {
    this.isPaused = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.addLog('Simulation paused', 'info');
  }
  
  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.timer = setInterval(() => this.simulationStep(), 500 / this.speedMultiplier);
    this.addLog('Simulation resumed', 'info');
  }
  
  reset() {
    this.episode = 0;
    this.cumulativeReward = 0;
    this.collisions = 0;
    this.episodeSuccesses = [];
    this.resetEpisode();
    this.startEpisode();
    this.addLog('Simulation reset', 'info');
  }
  
  converge() {
    // Jump to convergence phase
    this.episode = 60;
    this.addLog('Fast-forwarded to convergence phase', 'info');
  }
}

export const drlEngine = new DRLTelemetryEngine();
