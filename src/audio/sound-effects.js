/**
 * File:        src/audio/sound-effects.js
 * What it is:  Short non-speech sounds ("earcons").
 * What it does:
 *   dot({ pan, pitch })  a soft blip for a silent cell. pan -1 (left) .. +1 (right),
 *                        pitch 0 (low) .. 1 (high). See plan item B4.
 *   edge()               a dull bump when the student tries to leave the matrix
 *   correct()            a short rising celebration
 *   wrong()              "oh-oh": two falling notes
 *   modeChange()         a tick when a mode is switched
 *   newExercise()        a gentle chime when a new exercise opens
 *   Each sound is made with the Web Audio API, so no files are needed.
 *   If assets/audio/sfx/<name>.mp3 is listed in the manifest, that file is played instead.
 * Depends on:  audio/audio-manifest.js, config/settings.js
 */

import { sfxUrl } from './audio-manifest.js';
import { SETTINGS } from '../config/settings.js';

let ctx = null;

/** The AudioContext, created on first use (browsers require a key press first). */
function audioContext() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Play a replacement file if one exists. Returns true if it did. */
function playFile(name, pan = 0) {
  const url = sfxUrl(name);
  if (!url) return false;
  const el = new Audio(url);
  el.volume = SETTINGS.volume;
  if (pan && SETTINGS.spatialPanning) {
    const c = audioContext();
    const src = c.createMediaElementSource(el);
    const panner = c.createStereoPanner();
    panner.pan.value = pan;
    src.connect(panner).connect(c.destination);
  }
  el.play().catch(() => {});
  return true;
}

/**
 * Play one synthesized note.
 * @param {{freq:number, start?:number, length:number, type?:OscillatorType, gain?:number, pan?:number}} n
 */
function tone({ freq, start = 0, length, type = 'sine', gain = 0.3, pan = 0 }) {
  const c = audioContext();
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const amp = c.createGain();
  const panner = c.createStereoPanner();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain * SETTINGS.volume, t0 + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
  panner.pan.value = SETTINGS.spatialPanning ? pan : 0;
  osc.connect(amp).connect(panner).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + length + 0.02);
}

export function dot({ pan = 0, pitch = 0.5 } = {}) {
  if (playFile('dot', pan)) return;
  // One octave range: 440 Hz (low) .. 880 Hz (high).
  const freq = SETTINGS.rowPitch ? 440 * 2 ** pitch : 660;
  tone({ freq, length: 0.09, gain: 0.25, pan });
}

export function edge() {
  if (playFile('edge')) return;
  tone({ freq: 110, length: 0.18, type: 'square', gain: 0.12 });
  tone({ freq: 82, start: 0.05, length: 0.2, type: 'square', gain: 0.1 });
}

export function correct() {
  if (playFile('correct')) return;
  [523, 659, 784, 1047].forEach((freq, i) => tone({ freq, start: i * 0.1, length: 0.25, type: 'triangle', gain: 0.25 }));
}

export function wrong() {
  if (playFile('wrong')) return;
  tone({ freq: 392, length: 0.22, type: 'triangle', gain: 0.3 });
  tone({ freq: 311, start: 0.26, length: 0.35, type: 'triangle', gain: 0.3 });
}

export function modeChange() {
  if (playFile('mode')) return;
  tone({ freq: 1200, length: 0.05, gain: 0.15 });
}

export function newExercise() {
  if (playFile('new')) return;
  tone({ freq: 880, length: 0.3, gain: 0.15 });
  tone({ freq: 1320, start: 0.08, length: 0.35, gain: 0.1 });
}
