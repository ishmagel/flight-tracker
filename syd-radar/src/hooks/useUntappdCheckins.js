import { useState, useEffect, useRef } from 'react';
import { parseCheckinMessage } from '../utils/checkinMessage';
import { backoffDelay } from '../utils/feedLogic';

// Check-ins stream from the untappd-venue-fetcher Worker over a websocket (no credentials):
// recent check-ins on connect, then new ones as they arrive.
const wsUrl = import.meta.env.VITE_UNTAPPD_WS_URL;

export function useUntappdCheckins() {
  const [checkins,    setCheckins]    = useState([]);
  const [lastUpdate,  setLastUpdate]  = useState(0);
  const [lastSuccess, setLastSuccess] = useState(0);
  const [loading,     setLoading]     = useState(!!wsUrl);
  const [error,       setError]       = useState(null);

  const allRef  = useRef([]);
  const seenRef = useRef(new Set());

  function addCheckins(incoming) {
    const fresh = incoming.filter(c => !seenRef.current.has(c.checkin_id));
    if (!fresh.length) return;
    fresh.forEach(c => seenRef.current.add(c.checkin_id));
    allRef.current = [...allRef.current, ...fresh]
      .sort((a, b) => b.time - a.time)
      .slice(0, 100);
    setCheckins([...allRef.current]);
    const ts = Date.now();
    setLastUpdate(ts);
    setLastSuccess(ts);
  }

  useEffect(() => {
    if (!wsUrl) { setLoading(false); return; }

    let destroyed  = false;
    let retryTimer = null;
    let retries    = 0;

    function connect() {
      if (destroyed) return;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => { retries = 0; setError(null); setLoading(false); };
      ws.onmessage = evt => {
        const checkin = parseCheckinMessage(evt.data);
        if (checkin) addCheckins([checkin]);
      };
      ws.onerror = () => setError('FETCH ERROR');
      ws.onclose = () => {
        if (destroyed) return;
        setLoading(false);
        const delay = backoffDelay(retries);
        retries++;
        retryTimer = setTimeout(connect, delay);
      };
    }

    connect();
    return () => { destroyed = true; clearTimeout(retryTimer); };
  }, []);

  return { checkins, lastUpdate, lastSuccess, loading, error, isMock: false };
}
