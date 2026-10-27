const DEFAULT_ICAO = 'YSSY';
// In production, requests go through the Worker proxy (no CORS issues, optional auth).
// Locally, fall back to direct OpenSky with optional basic auth.
const PROXY = import.meta.env.VITE_OPENSKY_PROXY;
const BASE  = PROXY ?? 'https://opensky-network.org/api';
const USER  = import.meta.env.VITE_OPENSKY_USER ?? '';
const PASS  = import.meta.env.VITE_OPENSKY_PASS ?? '';

function authHeaders() {
  if (PROXY || !USER || !PASS) return {};   // proxy handles auth server-side
  return { Authorization: 'Basic ' + btoa(`${USER}:${PASS}`) };
}

async function apiFetch(path) {
  const res = await fetch(BASE + path, {
    headers: authHeaders(),
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 401 || res.status === 403) throw new Error('AUTH');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function normalise(raw, type) {
  const callsign = (raw.callsign ?? '').trim();
  if (!callsign) return null;
  return {
    icao24:  raw.icao24,
    callsign,
    type,
    airport: type === 'ARR'
      ? (raw.estDepartureAirport ?? null)
      : (raw.estArrivalAirport   ?? null),
    time: type === 'ARR' ? raw.lastSeen : raw.firstSeen,
  };
}

import { useState, useEffect, useRef } from 'react';

// Poll every 5 minutes; cursor only advances when genuinely new flights appear.
// OpenSky free tier: ~12 API credits per call pair, 4000 credits/day with auth.
// 5-min interval = ~288 polls/day × 24 credits = ~6912 credits; use auth or
// fall back gracefully to 10-min if rate-limited.
export const FLIGHTS_POLL_MS = 5 * 60 * 1_000;

const flightKey = f => `${f.icao24}-${f.time}`;

export function useHistoricalFlights(icao = DEFAULT_ICAO) {
  const [flights,     setFlights]     = useState([]);
  const [lastUpdate,  setLastUpdate]  = useState(0);
  const [lastSuccess, setLastSuccess] = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const timerRef = useRef(null);
  const knownRef = useRef(new Set());  // tracks flight IDs we've already shown

  useEffect(() => {
    knownRef.current = new Set();  // reset when airport changes

    async function fetchFlights() {
      setLoading(prev => knownRef.current.size === 0 ? true : prev);
      const now   = Math.floor(Date.now() / 1000);
      const begin = now - 86_400;
      const q     = `airport=${icao}&begin=${begin}&end=${now}`;

      try {
        const [arr, dep] = await Promise.all([
          apiFetch(`/flights/arrival?${q}`),
          apiFetch(`/flights/departure?${q}`),
        ]);

        const list = [
          ...arr.map(f => normalise(f, 'ARR')),
          ...dep.map(f => normalise(f, 'DEP')),
        ]
          .filter(Boolean)
          .sort((a, b) => b.time - a.time);

        const isFirst    = knownRef.current.size === 0;
        const newFlights = list.filter(f => !knownRef.current.has(flightKey(f)));
        list.forEach(f => knownRef.current.add(flightKey(f)));

        // Only advance the cursor (triggering board animation) on actual new data
        if (isFirst || newFlights.length > 0) {
          setFlights(list);
          const ts = Date.now();
          setLastUpdate(ts);
          if (list.length) setLastSuccess(ts);
        } else if (list.length) {
          // Silent refresh: data unchanged, just note the check succeeded
          setLastSuccess(ts => ts || Date.now());
        }
        setError(null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchFlights();
    timerRef.current = setInterval(fetchFlights, FLIGHTS_POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [icao]);

  return { flights, lastUpdate, lastSuccess, loading, error, isMock: false };
}
