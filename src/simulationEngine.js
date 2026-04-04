// Self-contained simulation engine — fallback when real ROS2/WSL backend is unavailable.
// When real backend IS running, DashboardPage uses real data instead.

const SCENARIO_LOGS = {
  healthcare: {
    nav: [
      '[NAV] Patient corridor detected — reducing velocity',
      '[NAV] Ward B entrance — obstacle-free path confirmed',
      '[NAV] Nurse station proximity — adjusting heading +12°',
      '[NAV] Elevator lobby clear — proceeding at 0.18 m/s',
    ],
    saf: [
      '[SAF] Human proximity alert — safety bubble active',
      '[SAF] Pedestrian detected at 1.4m — yielding',
      '[SAF] Medical cart in path — rerouting via corridor C',
      '[SAF] Emergency zone buffer enforced — 2m clearance',
    ],
    drl: [
      '[DRL] Navigating to medical station B-4',
      '[DRL] Reward signal: +2.1 (safe corridor traversal)',
      '[DRL] Policy update: gentler turns near patient rooms',
      '[DRL] Goal proximity reward: +5.0 (within 1m)',
    ],
  },
  defence: {
    nav: [
      '[NAV] Threat perimeter scan initiated',
      '[NAV] Sector 7 sweep complete — no hostiles',
      '[NAV] Perimeter waypoint alpha reached',
      '[NAV] Corridor breach detected — rerouting',
    ],
    saf: [
      '[SAF] Hostile zone detected — evasive maneuver',
      '[SAF] Threat level elevated — max velocity engaged',
      '[SAF] Restricted area boundary — hard stop',
      '[SAF] Surveillance mode: passive scan active',
    ],
    drl: [
      '[DRL] Perimeter patrol route optimized',
      '[DRL] Tactical advantage: flanking path selected',
      '[DRL] Reward: +3.8 (successful zone clearance)',
      '[DRL] Threat avoidance policy converging',
    ],
  },
  logistics: {
    nav: [
      '[NAV] Warehouse aisle 7 — cargo route active',
      '[NAV] Loading dock B approach — 3.2m to target',
      '[NAV] Pallet rack bypass — turning radius OK',
      '[NAV] Delivery waypoint 4/7 reached',
    ],
    saf: [
      '[SAF] Forklift proximity — yield protocol',
      '[SAF] Human worker at 2.1m — speed reduced to 0.1 m/s',
      '[SAF] Floor marking zone — staying in lane',
      '[SAF] Heavy load area — vibration dampening active',
    ],
    drl: [
      '[DRL] Optimal delivery path computed',
      '[DRL] Route efficiency: 94.2% — 12s saved',
      '[DRL] Reward: +4.1 (on-time delivery bonus)',
      '[DRL] Multi-stop optimization converging',
    ],
  },
};

export class SimulationEngine {
  constructor() {
    this.episode = 0;
    this.step = 0;
    this.episodeReward = 0;
    this.totalReward = 0;
    this.successes = 0;
    this.collisions = 0;
    this.phase = 'EXPLORATION';
    this.algorithm = 'TD3';
    this.scenario = 'logistics';
    this.running = false;
    this.listeners = {};
    this.timers = [];
    this.robotX = 0;
    this.robotY = 0;
    this.goalX = 3 + Math.random() * 2;
    this.goalY = 3 + Math.random() * 2;
    this.heading = 0;
    this.linearVel = 0;
    this.angularVel = 0;
    this.lidarData = new Array(16).fill(3.5);
    this.startTime = 0;
    this.manualV = 0;
    this.manualW = 0;

    // Convergence episodes per algorithm
    this.C = { DQN: 120, TD3: 60, PPO: 90 };
  }

  on(event, cb) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }

  off(event, cb) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(f => f !== cb);
  }

  emit(event, data) {
    (this.listeners[event] || []).forEach(cb => cb(data));
  }

  getCollisionProb() {
    return Math.max(0.05, 0.5 * Math.exp(-this.episode / this.C[this.algorithm]));
  }

  getEpisodeReward() {
    const progress = Math.min(this.episode / this.C[this.algorithm], 1);
    const base = -200 + 500 * progress;
    const noise = (Math.random() - 0.5) * 40;
    return Math.round((base + noise) * 10) / 10;
  }

  getPhase() {
    const C = this.C[this.algorithm];
    if (this.episode < C * 0.3) return 'EXPLORATION';
    if (this.episode < C * 0.75) return 'LEARNING';
    return 'CONVERGENCE';
  }

  getSuccessRate() {
    if (this.episode === 0) return 0;
    return Math.round((this.successes / this.episode) * 1000) / 10;
  }

  formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    const frac = Math.floor((ms % 1000) / 100);
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${frac}`;
  }

  pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.startTime = Date.now();
    this.episode = 0;
    this.step = 0;
    this.successes = 0;
    this.collisions = 0;
    this.episodeReward = 0;
    this.robotX = 0;
    this.robotY = 0;
    this.heading = Math.random() * Math.PI * 2;
    this.newGoal();

    // Boot sequence logs
    const bootLogs = [
      { delay: 0,    text: '[SYS] Schrödinger simulation engine starting...' },
      { delay: 500,  text: '[ROS] ROS2 Humble node initialized' },
      { delay: 1000, text: '[GAZ] Gazebo world loaded — TurtleBot3 spawned at (0.00, 0.00)' },
      { delay: 1500, text: `[DRL] Neural network loaded — algorithm: ${this.algorithm}` },
      { delay: 2000, text: '[SIM] Episode 1 starting | Phase: EXPLORATION' },
    ];

    bootLogs.forEach(({ delay, text }) => {
      const t = setTimeout(() => {
        if (!this.running) return;
        const ts = this.formatTime(Date.now() - this.startTime);
        this.emit('log', { time: ts, text, tag: this.getTag(text) });
      }, delay);
      this.timers.push(t);
    });

    // Main tick — 100ms
    const tickTimer = setInterval(() => {
      if (!this.running) return;
      this.tick();
    }, 100);
    this.timers.push(tickTimer);

    // Velocity update — 500ms
    const velTimer = setInterval(() => {
      if (!this.running) return;
      this.updateVelocity();
    }, 500);
    this.timers.push(velTimer);

    // LiDAR update — 500ms
    const lidarTimer = setInterval(() => {
      if (!this.running) return;
      this.updateLidar();
    }, 500);
    this.timers.push(lidarTimer);

    // Log generation — 2-3s
    const logTimer = setInterval(() => {
      if (!this.running) return;
      this.generateLog();
    }, 2000 + Math.random() * 1000);
    this.timers.push(logTimer);
  }

  stop() {
    this.running = false;
    this.timers.forEach(t => clearInterval(t));
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
    this.emit('stopped', {});
  }

  newGoal() {
    this.goalX = (Math.random() - 0.5) * 8;
    this.goalY = (Math.random() - 0.5) * 8;
  }

  getTag(text) {
    if (text.includes('[SYS]')) return 'sys';
    if (text.includes('[ROS]')) return 'ros';
    if (text.includes('[GAZ]')) return 'gaz';
    if (text.includes('[DRL]')) return 'drl';
    if (text.includes('[NAV]')) return 'nav';
    if (text.includes('[SEN]')) return 'sen';
    if (text.includes('[COL]')) return 'col';
    if (text.includes('[SAF]')) return 'saf';
    if (text.includes('[EP]')) return 'ep';
    if (text.includes('[SIM]')) return 'sim';
    return 'info';
  }

  tick() {
    this.step++;

    // Move robot toward goal
    const dx = this.goalX - this.robotX;
    const dy = this.goalY - this.robotY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const targetAngle = Math.atan2(dy, dx);

    let angleDiff = targetAngle - this.heading;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    this.heading += angleDiff * 0.1 + (Math.random() - 0.5) * 0.05;
    const speed = 0.05 + Math.random() * 0.02;
    this.robotX += Math.cos(this.heading) * speed;
    this.robotY += Math.sin(this.heading) * speed;

    // Step reward
    const stepReward = dist < 0.5 ? 5.0 : (dist < 2 ? 0.5 : 0.1);
    this.episodeReward += stepReward;

    this.emit('tick', {
      step: this.step,
      episode: this.episode,
      x: this.robotX,
      y: this.robotY,
      heading: this.heading,
      distToGoal: dist,
    });

    // Episode end: every 200-300 steps or goal reached
    const episodeLen = 200 + Math.floor(Math.random() * 100);
    if (this.step >= episodeLen || dist < 0.5) {
      this.endEpisode(dist < 0.5);
    }
  }

  updateVelocity() {
    this.linearVel = 0.05 + Math.random() * 0.21;
    this.angularVel = (Math.random() - 0.5) * 2.4;
    this.emit('velocity', {
      v: Math.round(this.linearVel * 100) / 100,
      w: Math.round(this.angularVel * 100) / 100,
    });
  }

  updateLidar() {
    this.lidarData = Array.from({ length: 16 }, () => 0.5 + Math.random() * 3.0);
    // Simulate obstacle in some directions
    const obstDir = Math.floor(Math.random() * 16);
    this.lidarData[obstDir] = 0.3 + Math.random() * 0.7;
    this.emit('lidar', this.lidarData);
  }

  endEpisode(success) {
    this.episode++;
    this.step = 0;
    this.phase = this.getPhase();

    const collided = !success && Math.random() < this.getCollisionProb();
    if (success) this.successes++;
    if (collided) this.collisions++;

    const reward = this.getEpisodeReward();
    this.episodeReward = 0;
    this.totalReward += reward;

    // Reset robot
    this.robotX = 0;
    this.robotY = 0;
    this.heading = Math.random() * Math.PI * 2;
    this.newGoal();

    const ts = this.formatTime(Date.now() - this.startTime);

    if (collided) {
      this.emit('log', {
        time: ts,
        text: `⚠ [COL] COLLISION DETECTED — penalty: -50 applied`,
        tag: 'col',
      });
    }

    this.emit('log', {
      time: ts,
      text: `[EP] Episode ${this.episode} complete | Reward: ${reward} | Success: ${success ? 'YES' : 'NO'}`,
      tag: success ? 'ep-success' : 'ep-fail',
    });

    this.emit('log', {
      time: ts,
      text: `[SIM] Episode ${this.episode + 1} starting | Phase: ${this.phase}`,
      tag: 'sim',
    });

    this.emit('episodeEnd', {
      episode: this.episode,
      reward,
      success,
      collided,
      phase: this.phase,
      successRate: this.getSuccessRate(),
      collisions: this.collisions,
      successes: this.successes,
      algorithm: this.algorithm,
    });
  }

  generateLog() {
    const ts = this.formatTime(Date.now() - this.startTime);
    const scenarioLogs = SCENARIO_LOGS[this.scenario] || SCENARIO_LOGS.logistics;
    const categories = ['nav', 'saf', 'drl'];
    const cat = this.pickRandom(categories);
    const text = this.pickRandom(scenarioLogs[cat]);

    this.emit('log', { time: ts, text, tag: this.getTag(text) });

    // Also emit sensor logs sometimes
    if (Math.random() > 0.5) {
      const minRange = (0.3 + Math.random() * 2.5).toFixed(2);
      const bearing = Math.floor(Math.random() * 360);
      this.emit('log', {
        time: ts,
        text: `[SEN] LiDAR scan: min_range=${minRange}m at bearing ${bearing.toString().padStart(3, '0')}°`,
        tag: 'sen',
      });
    }
  }

  setAlgorithm(algo) {
    this.algorithm = algo;
  }

  setScenario(s) {
    this.scenario = s;
  }
}

// Singleton
let _instance = null;
export function getSimEngine() {
  if (!_instance) _instance = new SimulationEngine();
  return _instance;
}
