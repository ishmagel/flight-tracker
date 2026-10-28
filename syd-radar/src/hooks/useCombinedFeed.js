import { useMemo } from 'react';
import { useHAFlights, FLIGHTS_POLL_MS } from './useHAFlights';
import { useUntappdCheckins }   from './useUntappdCheckins';

export const CHECKINS_POLL_MS = 90_000; // matches Worker FEED_POLL_MS

export function useCombinedFeed(icao) {
  const flights  = useHAFlights();
  const checkins = useUntappdCheckins();

  const items = useMemo(() => {
    const flightItems = flights.flights.map(f => ({
      ...f,
      _type:   'flight',
      _timeMs: f.time * 1000,
    }));
    const checkinItems = checkins.checkins.map(c => ({
      ...c,
      _type:   'checkin',
      _timeMs: c.time,
    }));
    return [...flightItems, ...checkinItems].sort((a, b) => b._timeMs - a._timeMs);
  }, [flights.flights, checkins.checkins]);

  return {
    items,
    lastUpdate:         Math.max(flights.lastUpdate  || 0, checkins.lastUpdate  || 0),
    flightsLastSuccess: flights.lastSuccess,
    flightsLastUpdate:  flights.lastUpdate,
    flightsError:       flights.error,
    flightsMock:        flights.isMock,
    checkinsLastSuccess: checkins.lastSuccess,
    checkinsLastUpdate:  checkins.lastUpdate,
    checkinsError:       checkins.error,
    checkinsMock:        checkins.isMock,
    loading:            flights.loading && checkins.loading,
    error:              flights.error || checkins.error,
    isMock:             flights.isMock || checkins.isMock,
  };
}
