import { useState, useEffect } from 'react';

export function useReplay(flights, replayMs = 5000) {
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    if (!flights.length) return;
    setCursor(0);
    const id = setInterval(() => setCursor(c => (c + 1) % flights.length), replayMs);
    return () => clearInterval(id);
  }, [flights, replayMs]);

  if (!flights.length) return { visible: [], cursor: 0, total: 0 };

  const n  = flights.length;
  const i0 = cursor % n;
  const i1 = (cursor + 1) % n;

  return {
    visible: n === 1 ? [flights[0]] : [flights[i0], flights[i1]],
    cursor,
    total: n,
  };
}
