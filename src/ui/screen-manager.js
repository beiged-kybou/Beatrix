/**
 * File:        src/ui/screen-manager.js
 * What it is:  Swaps the screen shown inside <main id="app">.
 * What it does:
 *   showScreen(mountFn, params)
 *     - calls the cleanup function of the previous screen
 *     - empties the app root
 *     - calls mountFn(root, params); a screen's mount function may return a
 *       cleanup function (or a Promise of one)
 *   Every screen file exports one mount function, so screens can be added or
 *   redesigned without touching each other.
 * Depends on:  audio/speech-service.js
 */

import * as speech from '../audio/speech-service.js';

let root = null;
let cleanup = null;
let generation = 0;

export function initScreenManager(rootEl) {
  root = rootEl;
}

export async function showScreen(mountFn, params = {}) {
  const my = ++generation;
  speech.stop();
  try {
    await cleanup?.();
  } catch (err) {
    console.error('[screen-manager] cleanup failed', err);
  }
  cleanup = null;
  root.replaceChildren();
  const result = await mountFn(root, params);
  if (my === generation) cleanup = typeof result === 'function' ? result : null;
  else if (typeof result === 'function') result(); // a newer screen was requested meanwhile
}
