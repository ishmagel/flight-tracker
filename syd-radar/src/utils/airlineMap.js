// ICAO 3-letter callsign prefix → IATA 2-letter code
export const ICAO_TO_IATA = {
  // Australian
  QFA: 'QF', QQK: 'QF', QNK: 'QF',
  VOZ: 'VA',
  JST: 'JQ',
  REX: 'ZL',
  AWH: 'WP',
  NWH: 'NQ',
  // Asian
  SIA: 'SQ',
  CPA: 'CX',
  MAS: 'MH',
  KAL: 'KE',
  AAR: 'OZ',
  JAL: 'JL',
  ANA: 'NH',
  CCA: 'CA',
  CSN: 'CZ',
  CHH: 'HU',
  CXA: 'MF',
  CSZ: 'SZ',
  AXM: 'AK',
  TGW: 'TG',
  PAC: 'PX',
  FJI: 'FJ',
  ANZ: 'NZ',
  AIL: 'AI',
  // Middle East
  UAE: 'EK',
  ETD: 'EY',
  QTR: 'QR',
  SVA: 'SV',
  // European
  BAW: 'BA',
  AFR: 'AF',
  DLH: 'LH',
  KLM: 'KL',
  // American
  UAL: 'UA',
  DAL: 'DL',
  AAL: 'AA',
};

// IATA 2-letter code → short display name
export const AIRLINE_NAMES = {
  QF: 'QANTAS',
  VA: 'VIRGIN AU',
  JQ: 'JETSTAR',
  ZL: 'REX',
  SQ: 'SINGAPORE',
  CX: 'CATHAY',
  MH: 'MALAYSIA',
  KE: 'KOREAN AIR',
  OZ: 'ASIANA',
  JL: 'JAPAN AIR',
  NH: 'ANA',
  CA: 'AIR CHINA',
  CZ: 'CHINA SOUTH',
  HU: 'HAINAN',
  PX: 'AIR NIUGINI',
  FJ: 'FIJI AIRWY',
  NZ: 'AIR NZ',
  AI: 'AIR INDIA',
  EK: 'EMIRATES',
  EY: 'ETIHAD',
  QR: 'QATAR',
  SV: 'SAUDI ARBN',
  BA: 'BRIT AIRWY',
  AF: 'AIR FRANCE',
  LH: 'LUFTHANSA',
  KL: 'KLM',
  UA: 'UNITED',
  DL: 'DELTA',
  AA: 'AMERICAN',
  TG: 'THAI AIRWY',
};

export function getIataCode(callsign) {
  if (!callsign) return null;
  const s = callsign.trim().toUpperCase();
  return ICAO_TO_IATA[s.slice(0, 3)] ?? ICAO_TO_IATA[s.slice(0, 2)] ?? null;
}

// ICAO airport code → display city name (max 12 chars)
export const ICAO_AIRPORTS = {
  // Australia
  YMML: 'MELBOURNE',
  YBBN: 'BRISBANE',
  YPPH: 'PERTH',
  YPAD: 'ADELAIDE',
  YHBA: 'HERVEY BAY',
  YBCS: 'CAIRNS',
  YAYE: 'AYRES ROCK',
  YDNQ: 'TOWNSVILLE',
  YHID: 'HORN ISLAND',
  // New Zealand
  NZAA: 'AUCKLAND',
  NZCH: 'CHRISTCHURCH',
  NZWN: 'WELLINGTON',
  NZQN: 'QUEENSTOWN',
  // Pacific
  NFFN: 'FIJI',
  NVVV: 'VANUATU',
  AYPY: 'PORT MORESBY',
  AGGH: 'HONIARA',
  // Asia – South East
  WSSS: 'SINGAPORE',
  WMKK: 'KUALA LUMPUR',
  VTBS: 'BANGKOK',
  VVTS: 'HO CHI MINH',
  VVNB: 'HANOI',
  RPLL: 'MANILA',
  WADD: 'BALI',
  WIII: 'JAKARTA',
  // Asia – North East
  VHHH: 'HONG KONG',
  RJTT: 'TOKYO',
  RJAA: 'TOKYO NARITA',
  RKSI: 'SEOUL',
  ZBAA: 'BEIJING',
  ZSPD: 'SHANGHAI',
  ZGGG: 'GUANGZHOU',
  ZUCK: 'CHONGQING',
  ZUUU: 'CHENGDU',
  ZLXY: "XI'AN",
  ZUGY: 'GUIYANG',
  ZSHC: 'HANGZHOU',
  // Asia – South
  VIDP: 'DELHI',
  VABB: 'MUMBAI',
  VOMM: 'CHENNAI',
  VOBL: 'BENGALURU',
  VECC: 'KOLKATA',
  // Middle East
  OMDB: 'DUBAI',
  OMAA: 'ABU DHABI',
  OTHH: 'DOHA',
  OEJN: 'JEDDAH',
  OERK: 'RIYADH',
  OIMM: 'MASHHAD',
  // Africa
  FAOR: 'JOHANNESBURG',
  FACT: 'CAPE TOWN',
  HECA: 'CAIRO',
  // Europe
  EGLL: 'LONDON',
  EGKK: 'LONDON GATW',
  EHAM: 'AMSTERDAM',
  EDDM: 'MUNICH',
  EDDF: 'FRANKFURT',
  LFPG: 'PARIS',
  LIRF: 'ROME',
  LEMD: 'MADRID',
  LEBL: 'BARCELONA',
  LSZH: 'ZURICH',
  LOWW: 'VIENNA',
  LKPR: 'PRAGUE',
  EPWA: 'WARSAW',
  UUEE: 'MOSCOW',
  // North America
  KLAX: 'LOS ANGELES',
  KJFK: 'NEW YORK',
  KSFO: 'SAN FRANCISCO',
  KORD: 'CHICAGO',
  KDFW: 'DALLAS',
  CYVR: 'VANCOUVER',
  CYYZ: 'TORONTO',
  // South America
  SCEL: 'SANTIAGO',
  SBGR: 'SAO PAULO',
  SAEZ: 'BUENOS AIRES',
};

export function getAirportCity(icao) {
  if (!icao) return null;
  return ICAO_AIRPORTS[icao.toUpperCase()] ?? null;
}
