import { roverState } from './stateManager.js';
import { drlEngine } from './drlTelemetryEngine.js';

const WS_URL = 'ws://192.168.4.1:81/';

class WebSocketManager {
  constructor() {
    this.ws = null;
    this.reconnectTimer = null;
    this.sendInterval = null;
    this.drlSendInterval = null;
    this.isConnecting = false;
    this.drlUnsubscribe = null;
  }

  start() {
    roverState.addLog('Init ESP32 Connection...');
    this.connect();
    
    this.sendInterval = setInterval(() => {
      this.sendPayload();
    }, 50);
  }

  stop() {
    if (this.sendInterval) clearInterval(this.sendInterval);
    if (this.drlSendInterval) clearInterval(this.drlSendInterval);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.drlUnsubscribe) {
      this.drlUnsubscribe();
      this.drlUnsubscribe = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    roverState.setState({ status: 'DISCONNECTED' });
  }

  connect() {
    if (this.ws || this.isConnecting) return;
    this.isConnecting = true;
    roverState.setState({ status: 'CONNECTING' });

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        this.isConnecting = false;
        roverState.setState({ status: 'CONNECTED' });
        roverState.addLog('ESP32 WebSocket Connected.');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.ws = null;
        roverState.setState({ status: 'DISCONNECTED' });
        roverState.addLog('WS Drops. Reconnecting in 2s...');
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        // Will be caught by onclose
      };
      
    } catch (e) {
      this.isConnecting = false;
      this.ws = null;
      roverState.setState({ status: 'DISCONNECTED' });
      roverState.addLog('WS error: ' + e.message);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2000);
  }

  sendPayload() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    const { v, t } = roverState.getState();
    const payload = { v, t };
    const str = JSON.stringify(payload);
    
    try {
      this.ws.send(str);
      roverState.setState({ lastPacketStr: str });
    } catch (e) {
      console.warn("WS Send Error:", e);
    }
  }

  startDRLMode() {
    // Update state to indicate DRL is running
    roverState.updateDRLState({ isRunning: true });
    
    // Start the DRL engine
    drlEngine.start(
      // Telemetry update callback
      (telemetry) => {
        // Update state manager with telemetry data
        roverState.updateDRLState({
          episode: telemetry.episode,
          timestep: telemetry.timestep,
          distanceToGoal: telemetry.distance_to_goal,
          velocity: telemetry.velocity,
          angularVelocity: telemetry.angularVelocity,
          reward: telemetry.reward,
          cumulativeReward: telemetry.cumulative_reward,
          collisions: telemetry.collisions,
          successRate: telemetry.success_rate,
          policyStability: telemetry.policy_stability,
          phase: telemetry.phase,
          lidarRays: telemetry.lidarRays,
          posX: telemetry.posX,
          posY: telemetry.posY,
          linearV: telemetry.linearV,
          angularV: telemetry.angularV,
          steps: telemetry.steps,
          timeToGoal: telemetry.timeToGoal,
          policyLoss: telemetry.policyLoss,
          algorithm: telemetry.algorithm
        });
        
        // Send via WebSocket if connected
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          try {
            this.ws.send(JSON.stringify({
              type: 'drl_telemetry',
              data: telemetry
            }));
          } catch (e) {
            console.warn('DRL Telemetry WS Send Error:', e);
          }
        }
      },
      // Log message callback
      (message, type) => {
        roverState.addDRLLog(message, type);
      }
    );
  }

  stopDRLMode() {
    // Stop the DRL engine
    drlEngine.stop();
    
    // Update state
    roverState.updateDRLState({ isRunning: false });
  }
}

export const wsManager = new WebSocketManager();
