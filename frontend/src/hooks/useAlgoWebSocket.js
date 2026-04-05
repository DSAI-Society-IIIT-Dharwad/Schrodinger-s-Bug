import { useState, useEffect, useRef } from 'react';

export const useAlgoWebSocket = (algo = 'ppo') => {
  const [metrics, setMetrics] = useState({ 
    reward: 0, avg_reward: 0, steps: 0, collision_rate: 0, x: 0, y: 0, timestamp: 0 
  });
  const [chartHistory, setChartHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      const wsUrl = `ws://localhost:8000/ws/${algo}`;
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
                v_value: data.v_value,
                q_value: data.q_value,
                a_linear: data.action_linear,
                a_angular: data.action_angular
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
        setTimeout(connect, 3000); // Reconnect loop
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [algo]);

  return { metrics, chartHistory, isConnected };
};
