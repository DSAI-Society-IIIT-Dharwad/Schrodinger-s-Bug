import { roverState } from './stateManager.js';

class ControlsHandler {
  constructor() {
    this.targetV = 0;
    this.targetT = 0;
    this.currentV = 0;
    this.currentT = 0;
    this.keys = {};
    this.isRunning = false;
    this.isManual = false;
    this.rAF = null;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.updateLoop = this.updateLoop.bind(this);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.lastTime = performance.now();
    
    if (this.rAF) cancelAnimationFrame(this.rAF);
    this.rAF = requestAnimationFrame(this.updateLoop);
  }

  stop() {
    this.isRunning = false;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    
    if (this.rAF) {
      cancelAnimationFrame(this.rAF);
      this.rAF = null;
    }
    
    roverState.setState({ v: 0, t: 0 });
    this.targetV = 0;
    this.targetT = 0;
    this.currentV = 0;
    this.currentT = 0;
  }

  setManualMode(isManual) {
    this.isManual = isManual;
    if (!isManual) {
      this.targetV = 0;
      this.targetT = 0;
    }
  }

  setKey(key, isPressed) {
    this.keys[key.toLowerCase()] = isPressed;
  }

  handleKeyDown(e) {
    const key = e.key.toLowerCase();
    this.keys[key] = true;
    
    if (key === ' ' || key === 'space') {
      this.targetV = 0;
      this.targetT = 0;
      this.currentV = 0;
      this.currentT = 0;
      roverState.setState({ v: 0, t: 0 });
    }
  }

  handleKeyUp(e) {
    this.keys[e.key.toLowerCase()] = false;
  }

  updateLoop(time) {
    if (!this.isRunning) return;

    if (this.isManual) {
      let v = 0;
      let t = 0;
      if (this.keys['w'] || this.keys['arrowup']) v = 30;
      else if (this.keys['s'] || this.keys['arrowdown']) v = -30;

      if (this.keys['a'] || this.keys['arrowleft']) t = -2.5;
      else if (this.keys['d'] || this.keys['arrowright']) t = 2.5;
      
      this.targetV = v;
      this.targetT = t;
    }

    const now = time || performance.now();
    let dt = (now - (this.lastTime || now)) / 1000;
    this.lastTime = now;
    
    // Fallback if browser throttles or on first frame mismatch
    if (isNaN(dt) || dt <= 0 || dt > 0.1) dt = 0.016;

    // Time to reach max: ~0.3s
    const accelV = 100; // 30 units in 0.3s
    const accelT = 8.3; // 2.5 units in 0.3s
    
    const moveTowards = (current, target, accel) => {
      const maxStep = accel * dt;
      if (current < target) return Math.min(current + maxStep, target);
      if (current > target) return Math.max(current - maxStep, target);
      return current;
    };

    this.currentV = moveTowards(this.currentV, this.targetV, accelV);
    this.currentT = moveTowards(this.currentT, this.targetT, accelT);

    // Round to 1 decimal place matching JSON string float precision expectations
    const newV = Math.round(this.currentV * 10) / 10;
    const newT = Math.round(this.currentT * 10) / 10;
    
    // Only update state manager if values changed
    const currentState = roverState.getState();
    if (currentState.v !== newV || currentState.t !== newT) {
      roverState.setState({ v: newV, t: newT });
    }

    this.rAF = requestAnimationFrame(this.updateLoop);
  }
}

export const controlsHandler = new ControlsHandler();
