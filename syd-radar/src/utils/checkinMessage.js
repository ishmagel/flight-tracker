// The untappd-venue-fetcher Worker pushes one JSON Untappd check-in per websocket message,
// interleaved with plain-text status/heartbeat lines. Returns a normalised check-in or null.
export function parseCheckinMessage(data) {
  let raw;
  try { raw = JSON.parse(data); } catch (_) { return null; }
  if (!raw || typeof raw !== 'object' || raw.checkin_id == null) return null;
  return {
    checkin_id:      raw.checkin_id,
    time:            new Date(raw.created_at).getTime() || Date.now(),
    rating_score:    raw.rating_score,
    checkin_comment: raw.checkin_comment,
    user:            raw.user,
    beer:            raw.beer,
    brewery:         raw.brewery,
    venue:           raw.venue,
  };
}
