// Major airports with coordinates for nearest-airport detection
export const AIRPORTS = [
  // Australia
  { icao: 'YSSY', name: 'Sydney Kingsford Smith', city: 'Sydney',        lat: -33.9461,  lon:  151.1772 },
  { icao: 'YMML', name: 'Melbourne Tullamarine',  city: 'Melbourne',     lat: -37.6733,  lon:  144.8433 },
  { icao: 'YBBN', name: 'Brisbane Airport',       city: 'Brisbane',      lat: -27.3842,  lon:  153.1175 },
  { icao: 'YPPH', name: 'Perth Airport',          city: 'Perth',         lat: -31.9403,  lon:  115.9667 },
  { icao: 'YPAD', name: 'Adelaide Airport',       city: 'Adelaide',      lat: -34.9450,  lon:  138.5311 },
  { icao: 'YBCS', name: 'Cairns Airport',         city: 'Cairns',        lat: -16.8858,  lon:  145.7553 },
  // New Zealand
  { icao: 'NZAA', name: 'Auckland Airport',       city: 'Auckland',      lat: -37.0082,  lon:  174.7850 },
  { icao: 'NZCH', name: 'Christchurch Airport',   city: 'Christchurch',  lat: -43.4894,  lon:  172.5322 },
  { icao: 'NZWN', name: 'Wellington Airport',     city: 'Wellington',    lat: -41.3272,  lon:  174.8050 },
  // Asia – South East
  { icao: 'WSSS', name: 'Changi Airport',             city: 'Singapore',     lat:   1.3644,  lon:  103.9915 },
  { icao: 'WMKK', name: 'Kuala Lumpur International', city: 'Kuala Lumpur',  lat:   2.7456,  lon:  101.7072 },
  { icao: 'VTBS', name: 'Suvarnabhumi Airport',       city: 'Bangkok',       lat:  13.6811,  lon:  100.7472 },
  { icao: 'VVTS', name: 'Tan Son Nhat International', city: 'Ho Chi Minh',   lat:  10.8188,  lon:  106.6520 },
  { icao: 'RPLL', name: 'Ninoy Aquino International', city: 'Manila',        lat:  14.5086,  lon:  121.0197 },
  { icao: 'WADD', name: 'Ngurah Rai International',   city: 'Bali',          lat:  -8.7482,  lon:  115.1672 },
  { icao: 'WIII', name: 'Soekarno–Hatta International', city: 'Jakarta',     lat:  -6.1256,  lon:  106.6559 },
  // Asia – North East
  { icao: 'VHHH', name: 'Hong Kong International',    city: 'Hong Kong',     lat:  22.3080,  lon:  113.9185 },
  { icao: 'RJTT', name: 'Tokyo Haneda',               city: 'Tokyo',         lat:  35.5494,  lon:  139.7798 },
  { icao: 'RJAA', name: 'Tokyo Narita',               city: 'Tokyo',         lat:  35.7720,  lon:  140.3929 },
  { icao: 'RKSI', name: 'Incheon International',      city: 'Seoul',         lat:  37.4601,  lon:  126.4407 },
  { icao: 'ZBAA', name: 'Beijing Capital',             city: 'Beijing',       lat:  40.0799,  lon:  116.6031 },
  { icao: 'ZSPD', name: 'Shanghai Pudong',             city: 'Shanghai',      lat:  31.1979,  lon:  121.3332 },
  { icao: 'ZGGG', name: 'Guangzhou Baiyun',            city: 'Guangzhou',     lat:  23.3924,  lon:  113.2990 },
  // Asia – South
  { icao: 'VIDP', name: 'Indira Gandhi International', city: 'Delhi',         lat:  28.5665,  lon:   77.1031 },
  { icao: 'VABB', name: 'Chhatrapati Shivaji Maharaj', city: 'Mumbai',        lat:  19.0896,  lon:   72.8656 },
  // Middle East
  { icao: 'OMDB', name: 'Dubai International',         city: 'Dubai',         lat:  25.2528,  lon:   55.3644 },
  { icao: 'OMAA', name: 'Abu Dhabi International',     city: 'Abu Dhabi',     lat:  24.4330,  lon:   54.6511 },
  { icao: 'OTHH', name: 'Hamad International',         city: 'Doha',          lat:  25.2731,  lon:   51.6081 },
  // Europe
  { icao: 'EGLL', name: 'Heathrow Airport',            city: 'London',        lat:  51.4775,  lon:   -0.4614 },
  { icao: 'EGKK', name: 'Gatwick Airport',             city: 'London',        lat:  51.1481,  lon:   -0.1903 },
  { icao: 'EHAM', name: 'Amsterdam Schiphol',          city: 'Amsterdam',     lat:  52.3086,  lon:    4.7639 },
  { icao: 'EDDF', name: 'Frankfurt Airport',           city: 'Frankfurt',     lat:  50.0264,  lon:    8.5431 },
  { icao: 'EDDM', name: 'Munich Airport',              city: 'Munich',        lat:  48.3538,  lon:   11.7861 },
  { icao: 'LFPG', name: 'Charles de Gaulle',           city: 'Paris',         lat:  49.0097,  lon:    2.5479 },
  { icao: 'LEMD', name: 'Adolfo Suárez Madrid-Barajas', city: 'Madrid',       lat:  40.4936,  lon:   -3.5668 },
  { icao: 'LEBL', name: 'Barcelona El Prat',           city: 'Barcelona',     lat:  41.2971,  lon:    2.0785 },
  { icao: 'LIRF', name: 'Leonardo da Vinci-Fiumicino', city: 'Rome',          lat:  41.8003,  lon:   12.2389 },
  { icao: 'LSZH', name: 'Zurich Airport',              city: 'Zurich',        lat:  47.4647,  lon:    8.5492 },
  { icao: 'LOWW', name: 'Vienna International',        city: 'Vienna',        lat:  48.1103,  lon:   16.5697 },
  // North America
  { icao: 'KLAX', name: 'Los Angeles International',   city: 'Los Angeles',   lat:  33.9425,  lon: -118.4081 },
  { icao: 'KJFK', name: 'John F. Kennedy International', city: 'New York',    lat:  40.6413,  lon:  -73.7781 },
  { icao: 'KEWR', name: 'Newark Liberty International', city: 'New York',     lat:  40.6895,  lon:  -74.1745 },
  { icao: 'KSFO', name: 'San Francisco International', city: 'San Francisco', lat:  37.6213,  lon: -122.3790 },
  { icao: 'KORD', name: "O'Hare International",        city: 'Chicago',       lat:  41.9742,  lon:  -87.9073 },
  { icao: 'KDFW', name: 'Dallas/Fort Worth International', city: 'Dallas',    lat:  32.8998,  lon:  -97.0403 },
  { icao: 'KMIA', name: 'Miami International',         city: 'Miami',         lat:  25.7959,  lon:  -80.2870 },
  { icao: 'CYVR', name: 'Vancouver International',     city: 'Vancouver',     lat:  49.1967,  lon: -123.1815 },
  { icao: 'CYYZ', name: 'Toronto Pearson',             city: 'Toronto',       lat:  43.6777,  lon:  -79.6248 },
  // South America
  { icao: 'SBGR', name: 'Guarulhos International',     city: 'São Paulo',     lat: -23.4356,  lon:  -46.4731 },
  { icao: 'SCEL', name: 'Arturo Merino Benítez',       city: 'Santiago',      lat: -33.3929,  lon:  -70.7858 },
  // Africa
  { icao: 'FAOR', name: 'O.R. Tambo International',   city: 'Johannesburg',  lat: -26.1392,  lon:   28.2460 },
  { icao: 'FACT', name: 'Cape Town International',     city: 'Cape Town',     lat: -33.9649,  lon:   18.6017 },
];

export const DEFAULT_AIRPORT = AIRPORTS[0]; // Sydney

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestAirport(lat, lon) {
  let nearest = DEFAULT_AIRPORT;
  let minDist = Infinity;
  for (const ap of AIRPORTS) {
    const d = haversineKm(lat, lon, ap.lat, ap.lon);
    if (d < minDist) { minDist = d; nearest = ap; }
  }
  return nearest;
}
