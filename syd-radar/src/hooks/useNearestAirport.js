import { useState, useEffect } from 'react';
import { DEFAULT_AIRPORT, findNearestAirport } from '../utils/airports';

export function useNearestAirport() {
  const [airport,  setAirport]  = useState(DEFAULT_AIRPORT);
  const [locating, setLocating] = useState(true);

  useEffect(() => {
    if (!navigator?.geolocation) {
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const nearest = findNearestAirport(pos.coords.latitude, pos.coords.longitude);
        setAirport(nearest);
        setLocating(false);
      },
      () => {
        // Permission denied or timeout — stay on default
        setLocating(false);
      },
      { timeout: 8000, maximumAge: 3_600_000 }, // cache position for 1hr
    );
  }, []);

  return { airport, locating };
}
