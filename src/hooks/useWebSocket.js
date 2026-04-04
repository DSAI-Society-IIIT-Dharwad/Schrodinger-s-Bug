import { useState, useEffect } from 'react';

export const useWebSocket = (url) => {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    const ws = new WebSocket(url);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      try { setData(JSON.parse(e.data)); } catch {}
    };
    return () => ws.close();
  }, [url]);
  
  return { data, connected };
};
