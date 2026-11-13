/**
 * File:        src/input/keyboard-router.js
 * What it is:  The one place that listens to the keyboard for lesson screens.
 * What it does:
 *   1. Finds the context of the focused element (data-nav-context attribute).
 *   2. Builds the key signature and looks it up in config/keybindings.js.
 *   3. If it matches, stops the browser's default action and emits
 *      'command' { name, context } on the event bus.
 *   It only acts inside a screen marked with data-nav-root, so the tutor
 *   editor's normal form fields are never affected.
 *   Handles two-key chords such as Alt+T, then A.
 * Used by:     main.js (started once)
 * Depends on:  config/keybindings.js, config/settings.js, input/key-signature.js,
 *              core/event-bus.js
 */

import { KEYBINDINGS } from '../config/keybindings.js';
import { SETTINGS } from '../config/settings.js';
import { signatureOf } from './key-signature.js';
import { emit } from '../core/event-bus.js';

/** signature -> [{ command, contexts }] for single keys */
const singles = new Map();
/** first-key signature -> [{ second, command, contexts }] for chords */
const chords = new Map();

for (const binding of KEYBINDINGS) {
  for (const key of binding.keys) {
    const parts = key.split(' ');
    if (parts.length === 1) {
      if (!singles.has(key)) singles.set(key, []);
      singles.get(key).push(binding);
    } else {
      if (!chords.has(parts[0])) chords.set(parts[0], []);
      chords.get(parts[0]).push({ ...binding, second: parts[1] });
    }
  }
}

/** A chord's first key that is waiting for its second key. */
let pendingChord = null; // { candidates, expiresAt }

/** Is the binding allowed in this context? 'global' bindings work everywhere. */
function allowed(binding, context) {
  return binding.contexts.includes('global') || binding.contexts.includes(context);
}

function handleKeydown(e) {
  const root = e.target.closest?.('[data-nav-root]') ?? document.querySelector('[data-nav-root]');
  if (!root) return; // not on a student-style screen
  const contextEl = e.target.closest?.('[data-nav-context]');
  const context = contextEl?.dataset.navContext ?? 'none';

  const sig = signatureOf(e);
  if (!sig) return;

  // 1) Second key of a waiting chord? (Alt may still be held: compare codes only.)
  if (pendingChord && Date.now() < pendingChord.expiresAt) {
    const match = pendingChord.candidates.find((c) => c.second === e.code && allowed(c, context));
    pendingChord = null;
    if (match) {
      e.preventDefault();
      emit('command', { name: match.command, context });
      return;
    }
  }
  pendingChord = null;

  // 2) First key of a chord? Wait for the second key.
  const chordCandidates = chords.get(sig);
  if (chordCandidates) {
    e.preventDefault();
    pendingChord = { candidates: chordCandidates, expiresAt: Date.now() + SETTINGS.chordTimeoutMs };
    return;
  }

  // 3) Ordinary single-key shortcut.
  const binding = singles.get(sig)?.find((b) => allowed(b, context));
  if (!binding) return;
  e.preventDefault();
  emit('command', { name: binding.command, context });
}

/** Start listening. Call once at app start. */
export function startKeyboardRouter() {
  document.addEventListener('keydown', handleKeydown);
}
