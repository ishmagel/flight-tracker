// Singleton AudioContext — shared across all board instances
let _ctx = null;
// Callbacks fired once when AudioContext is first unlocked (first user gesture).
// SplitFlapChar subscribes so it can replay its animation with sound.
const _unlockListeners = new Set();

function playClick(ctx, t) {
  const size = Math.floor(ctx.sampleRate * 0.055);
  const buf = ctx.createBuffer(1, size, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < size; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (size * 0.22));
  }

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const bpf = ctx.createBiquadFilter();
  bpf.type = 'bandpass';
  bpf.frequency.value = 1800 + Math.random() * 1200;
  bpf.Q.value = 1.5;

  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.value = 500;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.09, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);

  src.connect(hpf);
  hpf.connect(bpf);
  bpf.connect(gain);
  gain.connect(ctx.destination);
  src.start(t);
  src.stop(t + 0.06);
}

function doPlayBoard(ctx, numChars, durationSecs) {
  const base = ctx.currentTime + 0.02;
  for (let i = 0; i < numChars; i++) {
    playClick(ctx, base + Math.random() * durationSecs);
  }
}

// Subscribe to the one-time audio unlock event. Returns an unsubscribe fn.
export function subscribeAudioUnlock(cb) {
  _unlockListeners.add(cb);
  return () => _unlockListeners.delete(cb);
}

import { useCallback, useEffect } from 'react';

export function useFlipSound() {
  useEffect(() => {
    const unlock = () => {
      if (!_ctx) {
        try {
          _ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (_) { return; }
      }
      const ready = _ctx.state === 'suspended' ? _ctx.resume() : Promise.resolve();
      ready.then(() => {
        // Notify all SplitFlapChar instances so they replay with sound
        _unlockListeners.forEach(cb => cb());
        _unlockListeners.clear();
      }).catch(() => {});
    };
    document.addEventListener('click',      unlock, { once: true, capture: true });
    document.addEventListener('keydown',    unlock, { once: true, capture: true });
    document.addEventListener('touchstart', unlock, { once: true, passive: true, capture: true });
    return () => {
      document.removeEventListener('click',      unlock, { capture: true });
      document.removeEventListener('keydown',    unlock, { capture: true });
      document.removeEventListener('touchstart', unlock, { capture: true });
    };
  }, []);

  const playBoardUpdate = useCallback((numChars = 14, durationSecs = 0.35) => {
    try {
      if (!_ctx || _ctx.state !== 'running') return;
      doPlayBoard(_ctx, numChars, durationSecs);
    } catch (_) {}
  }, []);

  const playTick = useCallback(() => {
    try {
      if (!_ctx || _ctx.state !== 'running') return;
      playClick(_ctx, _ctx.currentTime + 0.005);
    } catch (_) {}
  }, []);

  return { playBoardUpdate, playTick };
}
