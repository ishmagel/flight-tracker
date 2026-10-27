import { useState, useEffect, useRef, useCallback } from 'react';
import { useAnimSettings } from '../context/AnimSettings';
import { subscribeAudioUnlock } from '../hooks/useFlipSound';
import './SplitFlapChar.css';

const CHARSET  = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:/→°-';
const SCRAMBLE = 2;

export default function SplitFlapChar({ char = ' ', delay = 0, onFlip }) {
  const target   = (char || ' ').toUpperCase();
  const { flipMs } = useAnimSettings();
  // Use a ref so runSequence closure always reads current value
  const flipRef  = useRef(flipMs);
  flipRef.current = flipMs;

  const [shown,   setShown]   = useState(' ');
  const [phase,   setPhase]   = useState('idle');
  const timersRef = useRef([]);
  const shownRef  = useRef(' ');
  const busyRef   = useRef(false);
  const queueRef  = useRef(null);

  const clear = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const runSequence = useCallback((seq) => {
    busyRef.current  = true;
    queueRef.current = null;
    const ms = flipRef.current;

    seq.forEach((c, i) => {
      const isLast = i === seq.length - 1;
      const t = setTimeout(() => {
        setPhase(isLast ? 'landing' : 'flipping');
        setShown(c);
        shownRef.current = c;
        if (onFlip) onFlip();

        if (isLast) {
          const t2 = setTimeout(() => {
            setPhase('idle');
            busyRef.current = false;
            if (queueRef.current) runSequence(queueRef.current);
          }, flipRef.current);
          timersRef.current.push(t2);
        }
      }, delay + i * ms);
      timersRef.current.push(t);
    });
  }, [delay, onFlip]);

  useEffect(() => {
    if (target === shownRef.current) return;
    clear();
    const seq = [];
    for (let i = 0; i < SCRAMBLE; i++) {
      seq.push(CHARSET[Math.floor(Math.random() * CHARSET.length)]);
    }
    seq.push(target);

    if (busyRef.current) {
      queueRef.current = seq;
    } else {
      runSequence(seq);
    }
    return clear;
  }, [target, clear, runSequence]);

  // On first user gesture, AudioContext unlocks — replay the flip so sound + animation are in sync
  useEffect(() => {
    if (target === ' ') return;
    return subscribeAudioUnlock(() => {
      clear();
      busyRef.current = false;
      queueRef.current = null;
      const seq = [];
      for (let i = 0; i < SCRAMBLE; i++) {
        seq.push(CHARSET[Math.floor(Math.random() * CHARSET.length)]);
      }
      seq.push(target);
      runSequence(seq);
    });
  }, [target, clear, runSequence]);

  return (
    <div
      className={`sf-cell${phase === 'flipping' ? ' sf-flipping' : phase === 'landing' ? ' sf-landing' : ''}`}
      style={{ '--flip-dur': `${flipMs}ms` }}
    >
      <div className="sf-top"><span>{shown}</span></div>
      <div className="sf-gap" />
      <div className="sf-bottom"><span>{shown}</span></div>
    </div>
  );
}
