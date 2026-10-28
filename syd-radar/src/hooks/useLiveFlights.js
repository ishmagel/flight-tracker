import { useState, useEffect, useRef } from 'react';
import { AIRPORTS } from '../utils/airports';

// airplanes.live has open CORS — call directly from the browser, no proxy needed.
// adsbdb also has open CORS, called direct for route lookups.
const BASE = 'https://api.airplanes.live';

// Poll live ADS-B every 60s; animate/sound only on new aircraft entering area.
export const FLIGHTS_POLL_MS = 60_000;

// Module-level route cache (persists page lifetime; routes don't change day-to-day)
const routeCache = new Map();   // normalised callsign → flightroute | null
const pending    = new Map();   // callsign → Promise (prevents duplicate lookups)

function normaliseCallsign(raw) {
  // adsb.lol pads callsigns: "QFA001  " → "QFA1", "JST512  " → "JST512"
  return raw.trim().toUpperCase().replace(/([A-Z]+)0*([1-9]\d*)$/, '$1$2');
}

async function lookupRoute(cs) {
  if (routeCache.has(cs)) return routeCache.get(cs);
  if (pending.has(cs))    return pending.get(cs);
  const p = fetch(`https://api.adsbdb.com/v0/callsign/${cs}`)
    .then(r => r.json())
    .then(d => {
      const route = d?.response?.flightroute ?? null;
      routeCache.set(cs, route);
      pending.delete(cs);
      return route;
    })
    .catch(() => { routeCache.set(cs, null); pending.delete(cs); return null; });
  pending.set(cs, p);
  return p;
}

export function useLiveFlights(icao = 'YSSY') {
  const apt = AIRPORTS.find(a => a.icao === icao) ?? AIRPORTS[0];
  const { lat, lon } = apt;

  const [flights,     setFlights]     = useState([]);
  const [lastUpdate,  setLastUpdate]  = useState(0);
  const [lastSuccess, setLastSuccess] = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const seenRef  = useRef(new Set());   // icao24 hex seen so far (for cursor/sound)
  const timerRef = useRef(null);

  useEffect(() => {
    seenRef.current = new Set();

    async function fetchFlights() {
      if (seenRef.current.size === 0) setLoading(true);
      try {
        const res = await fetch(
          `${BASE}/v2/point/${lat}/${lon}/150`,
          { signal: AbortSignal.timeout(10_000) }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { ac = [] } = await res.json();

        // Only aircraft with a callsign
        const tagged = ac
          .filter(a => a.flight?.trim())
          .map(a => ({ ...a, cs: normaliseCallsign(a.flight) }));

        // Parallel route lookups (cache prevents duplicate fetches)
        const routes = await Promise.all(tagged.map(a => lookupRoute(a.cs)));

        const nowS = Date.now() / 1000;
        const list = tagged.flatMap((a, i) => {
          const route = routes[i];
          if (!route) return [];
          const isArr = route.destination?.icao_code === icao;
          const isDep = route.origin?.icao_code === icao;
          if (!isArr && !isDep) return [];

          // Estimate time: departure = now minus time already in air; arrival = ETA
          const gs = Math.max(a.gs ?? 0, 30); // knots, avoid div/0
          const transitHours = (a.dst ?? 0) / gs;
          const time = Math.round(isArr
            ? nowS + transitHours * 3600
            : nowS - transitHours * 3600);

          return [{
            icao24:   a.hex,
            callsign: a.cs,
            type:     isArr ? 'ARR' : 'DEP',
            airport:  isArr
              ? (route.origin?.icao_code      ?? null)
              : (route.destination?.icao_code ?? null),
            time,                       // unix seconds (for FlightRow formatTime)
            _dist: a.dst ?? 999,
          }];
        });

        // Sort: closest to "now" first (recent deps + imminent arrs at top)
        list.sort((a, b) => Math.abs(a.time - nowS) - Math.abs(b.time - nowS));

        // Only advance cursor (triggering sound) when new aircraft appear
        const isFirst    = seenRef.current.size === 0;
        const newEntries = list.filter(f => !seenRef.current.has(f.icao24));
        list.forEach(f => seenRef.current.add(f.icao24));

        setFlights(list);   // always update so ETAs refresh quietly
        setError(null);
        const ts = Date.now();
        if (isFirst || newEntries.length > 0) {
          setLastUpdate(ts);
          if (list.length) setLastSuccess(ts);
        } else if (list.length) {
          setLastSuccess(prev => prev || ts);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchFlights();
    timerRef.current = setInterval(fetchFlights, FLIGHTS_POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [icao, lat, lon]);

  return { flights, lastUpdate, lastSuccess, loading, error, isMock: false };
}
