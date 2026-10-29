// Pure helpers shared by the data hooks (kept free of React so they are unit-testable).

// Exponential backoff: base * 2^attempt, capped at max.
export function backoffDelay(attempt, base = 2000, max = 30_000) {
  const n = Math.max(0, Number.isFinite(attempt) ? attempt : 0);
  return Math.min(base * 2 ** n, max);
}

// Next poll delay: normal interval when healthy, backing off (bounded) while failing.
export function pollDelay(failures, intervalMs, maxMs = 60_000) {
  if (!failures) return intervalMs;
  return Math.min(intervalMs * 2 ** Math.min(failures, 10), maxMs);
}

// True when the last success is older than thresholdMs (or never happened after startedAt).
export function isStale(lastSuccess, now, thresholdMs) {
  if (!lastSuccess) return false;
  return now - lastSuccess > thresholdMs;
}

// Merge incoming flights (any shape) into the accumulated list: drops entries without
// an id, dedupes by id against `seen`, newest first, capped. Returns { list, added }.
export function mergeFlights(existing, incoming, seen, nowMs = Date.now(), cap = 100) {
  if (!Array.isArray(incoming)) return { list: existing, added: 0 };
  const fresh = [];
  for (const f of incoming) {
    if (!f || typeof f !== 'object' || f.id == null || seen.has(f.id)) continue;
    seen.add(f.id);
    fresh.push({ ...f, _timeMs: (f.time ?? Math.floor(nowMs / 1000)) * 1000 });
  }
  if (!fresh.length) return { list: existing, added: 0 };
  return { list: [...fresh, ...existing].slice(0, cap), added: fresh.length };
}
