/**
 * File:        src/ui/live-region.js
 * What it is:  The "last spoken" status line at the bottom of the page.
 * What it does:
 *   Shows the text of everything the app says (for sighted teachers).
 *   If SETTINGS.screenReaderOutput is on, the line is also an aria-live region,
 *   so screen readers and braille displays receive the same text.
 *   It listens to 'speech:spoken' events; nothing calls it directly.
 * Depends on:  core/event-bus.js, config/settings.js
 */

import { on } from '../core/event-bus.js';
import { SETTINGS } from '../config/settings.js';

/** @param {HTMLElement} statusEl */
export function startLiveRegion(statusEl) {
  statusEl.setAttribute('aria-live', SETTINGS.screenReaderOutput ? 'polite' : 'off');
  on('speech:spoken', ({ text, lang }) => {
    statusEl.lang = lang;
    statusEl.textContent = text;
  });
}
