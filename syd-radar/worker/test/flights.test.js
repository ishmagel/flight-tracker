import { describe, it, expect } from 'vitest';
import { normaliseFlight, flightsFrom } from '../flights.js';

const dep = {
  id: 'abc1', aircraft_icao_24bit: '7C6B2D', callsign: 'QFA1', flight_number: 'QF1',
  airline_iata: 'QF', airline_icao: 'QFA',
  airport_origin_code_icao: 'YSSY', airport_destination_code_icao: 'EGLL',
  airport_destination_code_iata: 'LHR', airport_destination_city: 'London',
  time_scheduled_departure: 1000, time_real_departure: 1100, altitude: 5000, distance: 3.2,
  aircraft_photo_small: 'http://x/p.jpg',
};

describe('normaliseFlight', () => {
  it('maps a departure using the destination and real departure time', () => {
    expect(normaliseFlight(dep)).toMatchObject({
      id: 'abc1', icao24: '7c6b2d', type: 'DEP', airport: 'EGLL', city: 'London', time: 1100,
      callsign: 'QFA1', airline_iata: 'QF', altitude: 5000, photo: 'http://x/p.jpg',
    });
  });

  it('maps an arrival using the origin and estimated arrival time', () => {
    const arr = { id: 'x2', airport_origin_code_icao: 'NZAA', airport_origin_city: 'Auckland',
      time_scheduled_arrival: 10, time_estimated_arrival: 20 };
    expect(normaliseFlight(arr)).toMatchObject({ type: 'ARR', airport: 'NZAA', city: 'Auckland', time: 20 });
  });

  it('falls back to scheduled time, IATA code and flight number', () => {
    const f = normaliseFlight({ id: 'x3', flight_number: 'VA7', airport_origin_code_icao: 'YSSY',
      airport_destination_code_iata: 'MEL', time_scheduled_departure: 5 });
    expect(f).toMatchObject({ callsign: 'VA7', city: 'MEL', time: 5, icao24: '' });
  });

  it('drops entries without an id', () => {
    expect(normaliseFlight({ callsign: 'NOID' })).toBeNull();
    expect(normaliseFlight(undefined)).toBeNull();
  });

  it('exposes no fields beyond what the UI needs', () => {
    const out = normaliseFlight({ ...dep, registration: 'VH-ABC', secret_extra: 'x' });
    expect(out).not.toHaveProperty('secret_extra');
    expect(out).not.toHaveProperty('registration');
  });
});

describe('flightsFrom', () => {
  it('reads attributes.flights and tolerates missing or unavailable state', () => {
    expect(flightsFrom({ attributes: { flights: [dep, { nope: 1 }] } })).toHaveLength(1);
    expect(flightsFrom({ state: 'unavailable', attributes: {} })).toEqual([]);
    expect(flightsFrom(null)).toEqual([]);
  });
});
