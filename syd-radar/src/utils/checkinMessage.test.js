import { describe, it, expect } from 'vitest';
import { parseCheckinMessage } from './checkinMessage.js';

describe('parseCheckinMessage', () => {
  it('normalises a check-in JSON message', () => {
    const c = parseCheckinMessage(JSON.stringify({
      checkin_id: 7, created_at: 'Tue, 27 Oct 2026 10:00:00 +0000', rating_score: 4,
      user: { user_name: 'u' }, beer: { beer_name: 'b' }, brewery: { brewery_name: 'br' }, venue: { venue_name: 'v' },
    }));
    expect(c).toMatchObject({ checkin_id: 7, rating_score: 4, user: { user_name: 'u' }, beer: { beer_name: 'b' } });
    expect(c.time).toBe(Date.parse('Tue, 27 Oct 2026 10:00:00 +0000'));
  });

  it('ignores heartbeat and status lines, non-check-in JSON and junk', () => {
    expect(parseCheckinMessage('Heartbeat: Tue Oct 27 2026')).toBeNull();
    expect(parseCheckinMessage(' 107565 - 0 - 1453714990')).toBeNull();
    expect(parseCheckinMessage('{"hello":1}')).toBeNull();
    expect(parseCheckinMessage('null')).toBeNull();
    expect(parseCheckinMessage('')).toBeNull();
  });
});
