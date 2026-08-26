/* ============================= AUDIO ============================= */
import { profile } from './storage.js';

export const Audio1 = (function () {
  let ctx = null;
  function ensure() { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return ctx; }
  function tone(freq, dur, type, gain, delay) {
    if (!profile.sound) return;
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const osc = c.createOscillator(); const g = c.createGain();
    osc.type = type || 'sine'; osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.18, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(c.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }
  return {
    place() { tone(320, 0.11, 'triangle', 0.16); },
    perfect(combo) { const base = 680 + Math.min(combo, 8) * 40; tone(base, 0.09, 'square', 0.12); tone(base * 1.5, 0.14, 'sine', 0.1, 0.03); },
    fall() { tone(140, 0.35, 'sawtooth', 0.12); },
    levelup() { tone(523, 0.12, 'sine', 0.15); tone(659, 0.12, 'sine', 0.15, 0.09); tone(784, 0.22, 'sine', 0.16, 0.18); },
    unlock() { tone(440, 0.1, 'sine', 0.14); tone(660, 0.18, 'sine', 0.14, 0.08); },
    click() { tone(300, 0.05, 'square', 0.06); }
  };
})();
