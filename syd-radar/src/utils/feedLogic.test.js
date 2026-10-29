import { describe, it, expect } from 'vitest';
import { backoffDelay, pollDelay, isStale, mergeFlights } from './feedLogic.js';
import { parseCheckinMessage } from './checkinMessage.js';

describe('backoffDelay', () => {
  it('doubles then caps', () => {
    expect([0, 1, 2, 3, 4, 5].map(n => backoffDelay(n))).toEqual([2000, 4000, 8000, 16000, 30000, 30000]);
  });
  it('tolerates bad input', () => {
    expect(backoffDelay(-3)).toBe(2000);
    expect(backoffDelay(NaN)).toBe(2000);
  });
});

describe('pollDelay', () => {
  it('uses the normal interval when healthy', () => expect(pollDelay(0, 10_000)).toBe(10_000));
  it('backs off while failing and is bounded', () => {
    expect(pollDelay(1, 10_000)).toBe(20_000);
    expect(pollDelay(2, 10_000)).toBe(40_000);
    expect(pollDelay(3, 10_000)).toBe(60_000);
    expect(pollDelay(500, 10_000)).toBe(60_000);
  });
});

describe('isStale', () => {
  it('is false before any success and within threshold', () => {
    expect(isStale(0, 1e6, 1000)).toBe(false);
    expect(isStale(1e6 - 500, 1e6, 1000)).toBe(false);
  });
  it('is true past the threshold', () => expect(isStale(1e6 - 2000, 1e6, 1000)).toBe(true));
});

describe('mergeFlights', () => {
  it('ignores non-array payloads and malformed entries', () => {
    const seen = new Set();
    expect(mergeFlights([], { a: 1 }, seen).added).toBe(0);
    expect(mergeFlights([], [null, 5, 'x', {}, { id: null }], seen).added).toBe(0);
  });
  it('dedupes by id, newest first, stamps _timeMs', () => {
    const seen = new Set();
    const a = mergeFlights([], [{ id: 'a', time: 10 }], seen);
    const b = mergeFlights(a.list, [{ id: 'a', time: 99 }, { id: 'b', time: 20 }], seen);
    expect(b.added).toBe(1);
    expect(b.list.map(f => f.id)).toEqual(['b', 'a']);
    expect(b.list[0]._timeMs).toBe(20_000);
  });
  it('defaults time to now and caps the list', () => {
    const seen = new Set();
    const many = Array.from({ length: 150 }, (_, i) => ({ id: i }));
    const r = mergeFlights([], many, seen, 5_000);
    expect(r.list).toHaveLength(100);
    expect(r.list[0]._timeMs).toBe(5_000);
  });
});

describe('parseCheckinMessage extras', () => {
  it('ignores the friend_feed header line and numeric-only JSON', () => {
    expect(parseCheckinMessage('friend_feed')).toBeNull();
    expect(parseCheckinMessage('friend_feed: 12 checkins')).toBeNull();
    expect(parseCheckinMessage('42')).toBeNull();
    expect(parseCheckinMessage(undefined)).toBeNull();
  });
  it('falls back to now for an unparseable created_at', () => {
    const c = parseCheckinMessage(JSON.stringify({ checkin_id: 1, created_at: 'garbage' }));
    expect(c.checkin_id).toBe(1);
    expect(Number.isFinite(c.time)).toBe(true);
  });
});
