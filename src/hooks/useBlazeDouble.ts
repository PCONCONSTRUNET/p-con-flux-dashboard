import { useState, useEffect, useRef, useCallback } from 'react';

export interface BlazeResult {
  id: string;
  colorId: number;     // 0=white, 1=red, 2=black
  color: 'white' | 'red' | 'black';
  roll: number;        // número 0-14
  createdAt: string;
}

interface BlazeDoubleState {
  results: BlazeResult[];
  lastUpdate: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const POLL_INTERVAL = 3000; // 3 segundos

export function useBlazeDouble() {
  const [state, setState] = useState<BlazeDoubleState>({
    results: [],
    lastUpdate: null,
    isConnected: false,
    isLoading: true,
    error: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connectSSE = () => {
      const url = `${API_URL}/api/double/stream`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        setState(prev => ({ ...prev, isConnected: true, isLoading: false, error: null }));
      };

      es.onmessage = (event) => {
        try {
            // Heartbeat check (": heartbeat")
            if (event.data === '') return;

            const data = JSON.parse(event.data);
            if (data.success && Array.isArray(data.data)) {
                setState(prev => ({
                    ...prev,
                    results: data.data,
                    lastUpdate: data.lastUpdate ?? new Date().toISOString()
                }));
            }
        } catch (err) {
            console.error('SSE Message Error:', err);
        }
      };

      es.onerror = () => {
        setState(prev => ({ ...prev, isConnected: false, isLoading: false, error: 'Reconectando à API local...' }));
        es.close();
        reconnectTimeout = setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    return () => {
      clearTimeout(reconnectTimeout);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return state;
}
