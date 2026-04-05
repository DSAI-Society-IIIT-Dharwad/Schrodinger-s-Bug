import { useState, useEffect, useRef } from 'react';
import { generateMockTelemetry, generateEpisodeData } from '../utils';

export const useAlgoWebSocket = (algo = 'ppo') => {
  // Pre-seed metrics and history to ensure graphs are ALIVE immediately
  const initialHistory = generateEpisodeData(40).map(d => ({
    time: d.episode,
    reward: d.reward,
    avg: d.avg_reward,
    success_rate: d.success_rate,
    collision_rate: d.collision_rate,
    v_value: 0, q_value: 0, a_linear: 0, a_angular: 0
  }));

  const [metrics, setMetrics] = useState({ 
    reward: 52.54, avg_reward: 48.2, steps: 100, collision_rate: 0.02, x: 0, y: 0, timestamp: Date.now()/1000, scan: Array(24).fill(2.5)
  });
  const [chartHistory, setChartHistory] = useState(initialHistory);
  const [isConnected, setIsConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const wsRef = useRef(null);
  const stepRef = useRef(100);

  useEffect(() => {
    let mockInterval = null;

    const pushToHistory = (data) => {
      setChartHistory(prev => {
        const newHistory = [...prev, { 
          time: data.steps, 
          reward: data.reward, 
          avg: data.avg_reward,
          success_rate: data.success_rate || 0,
          collision_rate: data.collision_rate || 0,
          v_value: data.v_value || 0,
          q_value: data.q_value || 0,
          a_linear: data.action_linear || 0,
          a_angular: data.action_angular || 0
        }];
        return newHistory.slice(-50); 
      });
    };

    const startMockMode = () => {
      setIsDemoMode(true);
      mockInterval = setInterval(() => {
        stepRef.current += 1;
        const mockMsg = generateMockTelemetry(stepRef.current, algo);
        setMetrics(mockMsg.data);
        pushToHistory(mockMsg.data);
      }, 1000); // 1Hz for demo stability
    };

    const stopMockMode = () => {
      setIsDemoMode(false);
      if (mockInterval) clearInterval(mockInterval);
    };

    const connect = () => {
      const wsUrl = `ws://localhost:8000/ws/${algo}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        stopMockMode();
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'telemetry') {
            const data = msg.data;
            setMetrics(data);
            pushToHistory(data);
          }
        } catch (err) {
          console.error("WS Message Error:", err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // If ignition was attempted or just starting up, use demo mode if real connection fails
        startMockMode();
        setTimeout(connect, 3000); 
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      if (wsRef.current) wsRef.current.close();
      stopMockMode();
    };
  }, [algo]);

  return { metrics, chartHistory, isConnected, isDemoMode };
};
