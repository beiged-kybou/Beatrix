/**
 * File:        src/modes/tutor-gate.js
 * What it is:  The way into tutor mode.
 * What it does:
 *   While in student mode, it remembers the last few letters/digits typed.
 *   When they spell SETTINGS.tutorPassword ('zxcvbnm1234'), it sends
 *   'mode:request' { mode: 'tutor' }. No PIN screen, no accounts (decision B7).
 *   Physical keys are read (event.code), so it works with a Bangla layout too.
 *   This only stops children from entering by accident. The password is
 *   visible in the page source, so it is not real security.
 * Depends on:  config/settings.js, input/key-signature.js, core/app-state.js,
 *              core/event-bus.js
 */

import { SETTINGS } from '../config/settings.js';
import { latinCharOf } from '../input/key-signature.js';
import { getState } from '../core/app-state.js';
import { emit } from '../core/event-bus.js';

export function startTutorGate() {
  const password = SETTINGS.tutorPassword.toLowerCase();
  let typed = '';

  document.addEventListener('keydown', (e) => {
    if (getState('mode') !== 'student' || e.ctrlKey || e.altKey || e.metaKey) return;
    // Physical key first (works with Bangla layouts); some on-screen keyboards
    // report no code, so fall back to the typed character.
    const ch = latinCharOf(e.code) ?? (/^[a-z0-9]$/i.test(e.key ?? '') ? e.key.toLowerCase() : null);
    if (!ch) return;
    typed = (typed + ch).slice(-password.length);
    if (typed === password) {
      typed = '';
      emit('mode:request', { mode: 'tutor' });
    }
  });
}
