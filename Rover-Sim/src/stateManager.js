class StateManager {
  constructor() {
    this.state = {
      v: 0,
      t: 0,
      status: 'DISCONNECTED',
      lastPacketStr: '{"v":0,"t":0}',
      logs: [],
      drlState: {
        isRunning: false,
        episode: 0,
        timestep: 0,
        distanceToGoal: 0,
        velocity: 0,
        angularVelocity: 0,
        reward: 0,
        cumulativeReward: 0,
        collisions: 0,
        successRate: 0,
        policyStability: 0,
        phase: 'EXPLORATION',
        logs: [],
        lidarRays: [],
        posX: 0,
        posY: 0,
        linearV: 0,
        angularV: 0,
        steps: 0,
        timeToGoal: 0,
        policyLoss: 0,
        algorithm: 'TD3'
      }
    };
    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  addLog(msg) {
    const time = new Date().toLocaleTimeString();
    this.state.logs = [{ time, msg }, ...this.state.logs].slice(0, 50);
    this.notify();
  }

  updateDRLState(updates) {
    this.state.drlState = { ...this.state.drlState, ...updates };
    this.notify();
  }

  addDRLLog(msg, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const logEntry = { time, msg, type };
    this.state.drlState.logs = [logEntry, ...this.state.drlState.logs].slice(0, 100);
    this.notify();
  }

  getDRLState() {
    return this.state.drlState;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export const roverState = new StateManager();
