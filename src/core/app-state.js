/**
 * File:        src/core/app-state.js
 * What it is:  The single source of truth for app-wide state.
 * What it does:
 *   Holds a few global values and announces every change on the event bus
 *   as 'state:changed' { key, value }.
 * State keys:
 *   language        'en' | 'bn'                       active language
 *   mode            'student' | 'tutor'               which mode is on
 *   textUnit        'letter' | 'word' | 'sentence'    text navigation unit
 *   transcriptMode  boolean                           Alt+T, A toggles it
 *   pov             'reader' | 'screen'               matrix view (Alt+P), see config/pov.js
 * Not stored here: per-screen details (cursor position, current exercise).
 *   Those belong to the screen that owns them.
 * Depends on:  core/event-bus.js
 */

import { emit } from './event-bus.js';

const state = {
  language: 'en',
  mode: 'student',
  textUnit: 'sentence',
  transcriptMode: false,
  pov: 'reader',
};

/** Read one state value. */
export function getState(key) {
  return state[key];
}

/** Change one state value; emits 'state:changed' only if it really changed. */
export function setState(key, value) {
  if (!(key in state)) throw new Error(`[app-state] unknown key "${key}"`);
  if (state[key] === value) return;
  state[key] = value;
  emit('state:changed', { key, value });
}
