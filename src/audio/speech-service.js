/**
 * File:        src/audio/speech-service.js
 * What it is:  The ONE function the rest of the app calls to say something.
 * What it does:
 *   speak(parts) takes a plain string, or a list of parts:
 *       { key?: 'ui.row', text: 'row', lang?: 'en' }
 *   For each part it looks for a recording of `key` in the registered clip
 *   sources (tutor recordings first, then built-in files). If there is one,
 *   it plays it; otherwise it speaks `text` with TTS. Neighbouring TTS parts
 *   are joined into one utterance so they sound natural.
 *   Every new speak() interrupts the previous one (a child moving fast hears
 *   only the latest cell). stop() silences everything.
 *   Emits 'speech:spoken' { text, lang } so the status line / live region can show it.
 * Clip sources are plugged in by main.js with registerClipSource(), so this
 *   file doesn't need to know about IndexedDB or the manifest.
 * Depends on:  audio/clip-player.js, audio/tts-engine.js, i18n/language.js,
 *              i18n/speech-text.js, core/event-bus.js
 */

import * as clipPlayer from './clip-player.js';
import * as tts from './tts-engine.js';
import { getLang } from '../i18n/language.js';
import { prepareForSpeech } from '../i18n/speech-text.js';
import { emit } from '../core/event-bus.js';

/** @type {Array<(key:string, lang:string) => Promise<string|null> | string | null>} */
const clipSources = [];
let token = 0;

/** Add a place to look for recordings. Earlier sources win. */
export function registerClipSource(source) {
  clipSources.push(source);
}

async function findClip(key, lang) {
  if (!key) return null;
  for (const source of clipSources) {
    const url = await source(key, lang);
    if (url) return url;
  }
  return null;
}

/** Stop all speech and clips right now. */
export function stop() {
  token++;
  clipPlayer.stop();
  tts.cancel();
}

/**
 * Say something. Interrupts whatever is being said.
 * @param {string | Array<{key?:string, text:string, lang?:string}>} parts
 * @returns {Promise<void>} resolves when finished or interrupted
 */
export async function speak(parts) {
  stop();
  const my = token;
  const list = (typeof parts === 'string' ? [{ text: parts }] : parts)
    .filter(Boolean)
    .map((p) => ({ ...p, lang: p.lang ?? getLang() }));
  if (!list.length) return;

  emit('speech:spoken', { text: list.map((p) => p.text).join(' '), lang: list[0].lang });

  let pending = { text: '', lang: null }; // TTS text waiting to be spoken
  const flush = async () => {
    if (!pending.text.trim()) return;
    const { text, lang } = pending;
    pending = { text: '', lang: null };
    await tts.speak(prepareForSpeech(text, lang), lang);
  };

  for (const part of list) {
    if (my !== token) return;
    const url = await findClip(part.key, part.lang);
    if (my !== token) return;
    if (url) {
      await flush();
      if (my !== token) return;
      await clipPlayer.play(url);
    } else {
      if (pending.lang && pending.lang !== part.lang) await flush();
      pending.lang = part.lang;
      pending.text += (pending.text ? ' ' : '') + part.text;
    }
  }
  if (my === token) await flush();
}
