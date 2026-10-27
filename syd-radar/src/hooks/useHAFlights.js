import { useState, useEffect, useRef } from 'react';

// HA WebSocket push source — no polling, event-driven.
// Subscribes to sensor.outside_flightradar24_entered_area and current_in_area.
const HA_WS_URL = import.meta.env.VITE_HA_WS_URL;   // wss://host:port/api/websocket
const HA_TOKEN  = import.meta.env.VITE_HA_TOKEN;     // long-lived access token
const HA_REST   = HA_WS_URL?.replace('wss://', 'https://').replace('ws://', 'http://').replace('/api/websocket', '');

const ENTITIES = [
  'sensor.outside_flightradar24_entered_area',
  'sensor.outside_flightradar24_current_in_area',
];

export const FLIGHTS_POLL_MS = 0; // push-based

function normaliseFlight(raw) {
  if (!raw?.id) return null;

  // Determine direction: DEP if origin is YSSY, ARR otherwise
  const isDep = raw.airport_origin_code_icao === 'YSSY';
  const otherCity  = isDep ? raw.airport_destination_city  : raw.airport_origin_city;
  const otherIcao  = isDep ? raw.airport_destination_code_icao : raw.airport_origin_code_icao;
  const otherIata  = isDep ? raw.airport_destination_code_iata : raw.airport_origin_code_iata;

  // Best available time: estimated, then real, then scheduled
  const timeS = isDep
    ? (raw.time_real_departure      ?? raw.time_scheduled_departure)
    : (raw.time_estimated_arrival   ?? raw.time_scheduled_arrival);

  return {
    id:           raw.id,
    icao24:       (raw.aircraft_icao_24bit ?? '').toLowerCase(),
    callsign:     raw.callsign   ?? raw.flight_number ?? raw.id,
    flight_num:   raw.flight_number,
    airline_iata: raw.airline_iata,
    airline_icao: raw.airline_icao,
    type:         isDep ? 'DEP' : 'ARR',
    airport:      otherIcao,
    city:         otherCity ?? otherIata,   // used directly in display
    time:         timeS,                    // unix seconds
    _timeMs:      (timeS ?? Math.floor(Date.now() / 1000)) * 1000,
    altitude:     raw.altitude,
    distance:     raw.distance,
    photo:        raw.aircraft_photo_small,
  };
}

function flightsFrom(state) {
  return (state?.attributes?.flights ?? []).map(normaliseFlight).filter(Boolean);
}

export function useHAFlights() {
  const [flights,     setFlights]     = useState([]);
  const [lastUpdate,  setLastUpdate]  = useState(0);
  const [lastSuccess, setLastSuccess] = useState(0);
  const [loading,     setLoading]     = useState(!!HA_WS_URL);
  const [error,       setError]       = useState(null);

  const allRef  = useRef([]);   // accumulated history (newest first)
  const seenRef = useRef(new Set());

  function addFlights(incoming) {
    const fresh = incoming.filter(f => !seenRef.current.has(f.id));
    if (!fresh.length) return false;
    fresh.forEach(f => seenRef.current.add(f.id));
    allRef.current = [...fresh, ...allRef.current].slice(0, 100);
    setFlights([...allRef.current]);
    const ts = Date.now();
    setLastUpdate(ts);
    setLastSuccess(ts);
    return true;
  }

  useEffect(() => {
    if (!HA_WS_URL || !HA_TOKEN) {
      setLoading(false);
      return;
    }

    let destroyed  = false;
    let retryTimer = null;
    let retries    = 0;

    // Fetch initial entity states via REST (one-shot, avoids parsing the full get_states payload)
    async function fetchInitial() {
      try {
        const results = await Promise.all(
          ENTITIES.map(id =>
            fetch(`${HA_REST}/api/states/${id}`, {
              headers: { Authorization: `Bearer ${HA_TOKEN}` },
            }).then(r => r.json())
          )
        );
        const initial = results.flatMap(flightsFrom);
        if (initial.length) addFlights(initial);
      } catch (_) {}
    }

    function connect() {
      if (destroyed) return;
      const ws = new WebSocket(HA_WS_URL);

      ws.onmessage = evt => {
        try {
          const msg = JSON.parse(evt.data);

          if (msg.type === 'auth_required') {
            ws.send(JSON.stringify({ type: 'auth', access_token: HA_TOKEN }));
            return;
          }

          if (msg.type === 'auth_ok') {
            retries = 0;
            fetchInitial().then(() => setLoading(false));
            // Subscribe to state changes for just the FR24 entities
            ws.send(JSON.stringify({
              id: 1,
              type: 'subscribe_trigger',
              trigger: { platform: 'state', entity_id: ENTITIES },
            }));
            return;
          }

          if (msg.type === 'auth_invalid') {
            setError('HA AUTH FAILED');
            setLoading(false);
            ws.close();
            return;
          }

          // State change trigger fired
          if (msg.type === 'event') {
            const newState = msg.event?.variables?.trigger?.to_state;
            addFlights(flightsFrom(newState));
          }
        } catch (_) {}
      };

      ws.onerror = () => setError('HA CONN ERROR');
      ws.onclose = () => {
        if (!destroyed) {
          const delay = Math.min(2000 * 2 ** retries, 30_000);
          retries++;
          retryTimer = setTimeout(connect, delay);
        }
      };
    }

    connect();
    return () => {
      destroyed = true;
      clearTimeout(retryTimer);
    };
  }, []);

  return { flights, lastUpdate, lastSuccess, loading, error, isMock: false };
}
