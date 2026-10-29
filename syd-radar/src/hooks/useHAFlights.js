import { useState, useEffect, useRef } from 'react';
import { mergeFlights, pollDelay } from '../utils/feedLogic';

// Flights come from the syd-radar-flights Worker, which reads the Home Assistant
// FlightRadar24 sensors server-side. The browser holds no credentials.
const FLIGHTS_API_URL = import.meta.env.VITE_FLIGHTS_API_URL;

export const FLIGHTS_POLL_MS = 10_000;

export function useHAFlights() {
  const [flights,     setFlights]     = useState([]);
  const [lastUpdate,  setLastUpdate]  = useState(0);
  const [lastSuccess, setLastSuccess] = useState(0);
  const [loading,     setLoading]     = useState(!!FLIGHTS_API_URL);
  const [error,       setError]       = useState(null);

  const allRef  = useRef([]);   // accumulated history (newest first)
  const seenRef = useRef(new Set());

  function addFlights(incoming) {
    const { list, added } = mergeFlights(allRef.current, incoming, seenRef.current);
    if (!added) return;
    allRef.current = list;
    setFlights([...list]);
    setLastUpdate(Date.now());
  }

  useEffect(() => {
    if (!FLIGHTS_API_URL) { setLoading(false); return; }

    let destroyed = false;
    let timer = null;
    let failures = 0;
    const url = `${FLIGHTS_API_URL.replace(/\/$/, '')}/flights`;

    async function poll() {
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error(r.status);
        const data = await r.json();
        if (destroyed) return;
        addFlights(data.flights ?? []);
        failures = 0;
        setLastSuccess(Date.now());
        setError(null);
      } catch (_) {
        failures++;
        if (!destroyed) setError('FLIGHT FEED ERROR');
      } finally {
        if (!destroyed) {
          setLoading(false);
          timer = setTimeout(poll, pollDelay(failures, FLIGHTS_POLL_MS));
        }
      }
    }

    poll();
    return () => { destroyed = true; clearTimeout(timer); };
  }, []);

  return { flights, lastUpdate, lastSuccess, loading, error, isMock: false };
}
