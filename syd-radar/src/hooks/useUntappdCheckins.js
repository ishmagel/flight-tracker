import { useState, useEffect, useRef } from 'react';

// Check-ins come from the Worker REST endpoint (handles Untappd auth + caching) and are
// re-polled; the Worker caches upstream and sends max-age=60, so polling more often is pointless.
const wsUrl = import.meta.env.VITE_UNTAPPD_WS_URL;
const POLL_MS = 60_000;

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

  useEffect(() => {
    if (!CHECKINS_URL) { setLoading(false); return; }

    let destroyed = false;
    let timer = null;

    async function poll() {
      try {
        const r = await fetch(CHECKINS_URL);
        if (!r.ok) throw new Error(r.status);
        const items = await r.json();
        if (!destroyed && Array.isArray(items)) {
          addCheckins(items.map(normalizeCheckin));
          setError(null);
        }
      } catch (_) {
        if (!destroyed) setError('FETCH ERROR');
      } finally {
        if (!destroyed) {
          setLoading(false);
          timer = setTimeout(poll, POLL_MS);
        }
      }
    }

    poll();
    return () => { destroyed = true; clearTimeout(timer); };
  }, []);

  return { checkins, lastUpdate, lastSuccess, loading, error, isMock: false };
}
