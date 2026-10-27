import { useState, useEffect, useRef } from 'react';

// Initial batch: Worker REST endpoint (handles Untappd auth + caching)
// Push updates:  HA WebSocket events fired by Node-RED on new check-ins
const wsUrl     = import.meta.env.VITE_UNTAPPD_WS_URL;
const HA_WS_URL = import.meta.env.VITE_HA_WS_URL;
const HA_TOKEN  = import.meta.env.VITE_HA_TOKEN;

const CHECKINS_URL = wsUrl
  ? wsUrl.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://') + '/checkins'
  : null;

// Raw Untappd API item (initial REST load)
function normalizeCheckin(raw) {
  return {
    checkin_id:      raw.checkin_id,
    time:            new Date(raw.created_at).getTime(),
    rating_score:    raw.rating_score,
    checkin_comment: raw.checkin_comment,
    user:            raw.user,
    beer:            raw.beer,
    brewery:         raw.brewery,
    venue:           raw.venue,
  };
}

// Flat payload fired by Node-RED via ha.fire_event
function normalizeFromEvent(d) {
  return {
    checkin_id:      d.checkin_id,
    time:            new Date(d.created_at).getTime() || Date.now(),
    rating_score:    d.rating,
    checkin_comment: d.comment,
    user:    { first_name: d.first_name, user_name: d.user_name, user_avatar: d.user_avatar },
    beer:    { beer_name: d.beer_name, beer_style: d.beer_style, beer_label: d.beer_label },
    brewery: { brewery_name: d.brewery_name, brewery_label: d.brewery_label, country_name: d.country_name },
    venue:   d.venue_name ? { venue_name: d.venue_name } : null,
  };
}

export function useUntappdCheckins() {
  const [checkins,    setCheckins]    = useState([]);
  const [lastUpdate,  setLastUpdate]  = useState(0);
  const [lastSuccess, setLastSuccess] = useState(0);
  const [loading,     setLoading]     = useState(!!CHECKINS_URL);
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

  // ── Initial load from Worker REST ────────────────────────────────────────────
  useEffect(() => {
    if (!CHECKINS_URL) { setLoading(false); return; }
    fetch(CHECKINS_URL)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(items => { if (Array.isArray(items)) addCheckins(items.map(normalizeCheckin)); })
      .catch(() => setError('FETCH ERROR'))
      .finally(() => setLoading(false));
  }, []);

  // ── HA WebSocket: subscribe to untappd_new_checkin events ───────────────────
  useEffect(() => {
    if (!HA_WS_URL || !HA_TOKEN) return;

    let destroyed  = false;
    let retryTimer = null;
    let retries    = 0;

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
            ws.send(JSON.stringify({ id: 1, type: 'subscribe_events', event_type: 'untappd_new_checkin' }));
            return;
          }

          if (msg.type === 'event' && msg.event?.event_type === 'untappd_new_checkin') {
            addCheckins([normalizeFromEvent(msg.event.data)]);
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
    return () => { destroyed = true; clearTimeout(retryTimer); };
  }, []);

  return { checkins, lastUpdate, lastSuccess, loading, error, isMock: false };
}
