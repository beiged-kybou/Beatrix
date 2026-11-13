/**
 * File:        src/modes/mode-manager.js
 * What it is:  Switches between student mode and tutor mode.
 * What it does:
 *   Listens for 'mode:request' { mode: 'student' | 'tutor' } on the event bus
 *   (sent by modes/tutor-gate.js and by the tutor screens), stores the mode in
 *   app-state, and calls the matching screen function given by main.js.
 *   Using an event instead of direct calls keeps the screens independent.
 * Depends on:  core/event-bus.js, core/app-state.js, audio/sound-effects.js
 */

import { on } from '../core/event-bus.js';
import { getState, setState } from '../core/app-state.js';
import * as sfx from '../audio/sound-effects.js';

/**
 * @param {{ onStudent: () => void, onTutor: () => void }} handlers
 */
export function initModeManager({ onStudent, onTutor }) {
  on('mode:request', ({ mode }) => {
    if (mode !== 'student' && mode !== 'tutor') return;
    const changed = getState('mode') !== mode;
    setState('mode', mode);
    document.body.dataset.mode = mode;
    if (changed) sfx.modeChange();
    if (mode === 'tutor') onTutor();
    else onStudent();
  });
  document.body.dataset.mode = getState('mode');
}
