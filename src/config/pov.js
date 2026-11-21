/**
 * File:        src/config/pov.js
 * What it is:  The two ways of looking at a matrix (iteration 6, Alt+P).
 * What it does:
 *   'reader' (default, decision C2): row 1 at the TOP, like a page in a book.
 *            ↓ = row number grows. Words: down / up, top / bottom.
 *   'screen' (iteration 1, decision C1): row 1 at the BOTTOM, near you.
 *            ↑ = row number grows. Words: forward / back, near / far.
 *   Column 1 is on the left in both views.
 *
 *   The matrix model never changes: 'forward' always means row + 1 inside the
 *   code and in lesson files. Only keys, words and the drawing follow the view.
 *
 *   moveFor(screenDir, pov)  'up' | 'down' | 'up-right' … -> model direction
 *   Words for each view live in i18n/strings: reader versions end in "_reader"
 *   (see viewKey() in i18n/language.js).
 *   rowOneAtTop(pov)         true in the reader view (used by matrix-view.js)
 *   loadPov() / setPov() / togglePov()   remembered on this device
 * Depends on:  core/app-state.js
 */

import { getState, setState } from '../core/app-state.js';

export const POVS = ['reader', 'screen'];
export const DEFAULT_POV = 'reader';
const STORAGE_KEY = '6dots.pov';

/** Key direction on the screen -> model direction, per view. */
const MOVES = {
  screen: {
    up: 'forward', down: 'back', left: 'left', right: 'right',
    'up-right': 'forward-right', 'up-left': 'forward-left',
    'down-right': 'back-right', 'down-left': 'back-left',
  },
  reader: {
    up: 'back', down: 'forward', left: 'left', right: 'right',
    'up-right': 'back-right', 'up-left': 'back-left',
    'down-right': 'forward-right', 'down-left': 'forward-left',
  },
};

export function currentPov() {
  return getState('pov');
}

/** @param {string} screenDir direction of the key on the keyboard / screen */
export function moveFor(screenDir, pov = currentPov()) {
  return MOVES[pov][screenDir];
}

export function rowOneAtTop(pov = currentPov()) {
  return pov === 'reader';
}

/** Read the saved view. Call once at start. */
export function loadPov() {
  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch { /* storage blocked: use default */ }
  setState('pov', POVS.includes(saved) ? saved : DEFAULT_POV);
}

export function setPov(pov) {
  if (!POVS.includes(pov)) return;
  setState('pov', pov);
  try {
    localStorage.setItem(STORAGE_KEY, pov);
  } catch { /* ignore */ }
}

/** Switch to the other view and return it. */
export function togglePov() {
  const next = currentPov() === 'reader' ? 'screen' : 'reader';
  setPov(next);
  return next;
}
