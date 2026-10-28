import { createContext, useContext, useState } from 'react';

const DEFAULTS    = { flipMs: 300, stagger: 140, replayMs: 5000, numRows: 2 };
const STORAGE_KEY = 'splitflap-anim-settings';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export const AnimSettings = createContext({ ...DEFAULTS, update: () => {} });

export function AnimProvider({ children }) {
  const [s, set] = useState(load);
  const update = (key, val) => set(prev => {
    const next = { ...prev, [key]: val };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    return next;
  });
  return (
    <AnimSettings.Provider value={{ ...s, update }}>
      {children}
    </AnimSettings.Provider>
  );
}

export const useAnimSettings = () => useContext(AnimSettings);
