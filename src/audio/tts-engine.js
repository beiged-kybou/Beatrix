/**
 * File:        src/audio/tts-engine.js
 * What it is:  A thin wrapper around the browser's text-to-speech (Web Speech API).
 * What it does:
 *   - speak(text, lang)   speaks with the best voice for 'en' or 'bn';
 *                         returns a Promise that resolves when speech ends
 *   - cancel()            stops speaking
 *   - hasVoice(lang)      true if this computer has a voice for the language
 *   - whenVoicesReady()   voices load late in Chrome; await this before hasVoice()
 * Known limits: many Windows PCs have no Bangla voice (plan item B2). Then
 *   Bangla text may be silent or read by an English voice. Recorded clips fix this.
 * Used by:     audio/speech-service.js, ui/screen-home.js (no-voice warning)
 * Depends on:  config/settings.js
 */

import { SETTINGS } from '../config/settings.js';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
const LANG_TAGS = { en: ['en-US', 'en-GB', 'en-IN', 'en'], bn: ['bn-BD', 'bn-IN', 'bn'] };

let voicesReady = null;

/** Resolves once the browser has listed its voices (or after 1.5 s). */
export function whenVoicesReady() {
  if (!synth) return Promise.resolve();
  if (!voicesReady) {
    voicesReady = new Promise((resolve) => {
      if (synth.getVoices().length) return resolve();
      synth.addEventListener('voiceschanged', () => resolve(), { once: true });
      setTimeout(resolve, 1500);
    });
  }
  return voicesReady;
}

/** Best voice for 'en' or 'bn', preferring the order in LANG_TAGS. */
function pickVoice(lang) {
  const voices = synth?.getVoices() ?? [];
  for (const tag of LANG_TAGS[lang] ?? []) {
    const v = voices.find((voice) => voice.lang.replace('_', '-').toLowerCase().startsWith(tag.toLowerCase()));
    if (v) return v;
  }
  return null;
}

export function hasVoice(lang) {
  return pickVoice(lang) !== null;
}

export function cancel() {
  synth?.cancel();
}

/**
 * Speak text. Resolves when finished, cancelled, or after a safety timeout
 * (Chrome sometimes never fires 'end').
 */
export function speak(text, lang) {
  if (!synth || !text.trim()) return Promise.resolve();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice(lang);
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? LANG_TAGS[lang]?.[0] ?? lang;
    u.rate = SETTINGS.speechRate;
    u.volume = SETTINGS.volume;
    const safety = setTimeout(resolve, 2000 + text.length * 150);
    const finish = () => {
      clearTimeout(safety);
      resolve();
    };
    u.onend = finish;
    u.onerror = finish;
    synth.speak(u);
  });
}
