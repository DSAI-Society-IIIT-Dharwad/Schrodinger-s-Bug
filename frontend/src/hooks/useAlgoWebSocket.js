import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../utils';

export const useAlgoWebSocket = (algo = 'ppo') => {
  const [metrics, setMetrics] = useState({ 
    reward: 0, avg_reward: 0, steps: 0, collision_rate: 0, x: 0, y: 0, timestamp: 0, scan: Array(24).fill(0)
  });
  const [chartHistory, setChartHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSystemActive, setIsSystemActive] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    let statusInterval = null;

    const connect = () => {
      // Connect to the unified /ws endpoint
      const wsUrl = `ws://localhost:8000/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'telemetry') {
            const data = msg.data;
            setMetrics(data);
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
          }
        } catch (err) {
          console.error("WS Message Error:", err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Only reconnect if the system is still active
        if (isSystemActive) {
            setTimeout(connect, 3000);
        }
      };

      wsRef.current = ws;
    };

    const checkStatus = async () => {
       try {
           const res = await axios.get(`${BACKEND_URL}/status`);
           setIsSystemActive(res.data.running);
           
           if (!res.data.running) {
               // If system stopped, clear everything
               setChartHistory([]);
               setMetrics({ reward: 0, steps: 0, scan: Array(24).fill(0) });
               if (wsRef.current) wsRef.current.close();
           } else if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
               // If running but not connected, connect
               connect();
           }
       } catch (err) {
           setIsSystemActive(false);
       }
    };

    statusInterval = setInterval(checkStatus, 2000);
    checkStatus();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (statusInterval) clearInterval(statusInterval);
    };
  }, []); // Remove algo dependency as we poll backend for current active session

  return { metrics, chartHistory, isConnected, isSystemActive };
};
