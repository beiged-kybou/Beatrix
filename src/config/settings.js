/**
 * File:        src/config/settings.js
 * What it is:  All adjustable app settings in one place.
 * What it does:
 *   Exports default values. Change a value here to change app behaviour;
 *   no other file hard-codes these numbers.
 * Note on the tutor password:
 *   It lives in the page source, so anyone who reads the code can find it.
 *   It only stops children from entering tutor mode by accident.
 * Depends on:  nothing.
 */

export const SETTINGS = {
  /** Language used the very first time the app opens ('en' | 'bn'). Remembered after that. */
  defaultLanguage: 'en',

  /** Text-to-speech speed (0.5 = slow, 1 = normal). */
  speechRate: 0.9,

  /** Master volume for speech, clips and sound effects (0..1). */
  volume: 1,

  /** Dot sound moves from the left speaker (column 1) to the right (last column). */
  spatialPanning: true,

  /** Dot sound gets higher as the row number grows (further away = higher). */
  rowPitch: true,

  /** Show row / column numbers beside the grid (for sighted teachers). */
  showAxisNumbers: true,

  /**
   * Also send every spoken phrase to an aria-live region, so screen readers and
   * braille displays get it. Off by default: the app speaks for itself, and
   * doubling it with NVDA makes two voices talk over each other.
   */
  screenReaderOutput: false,

  /** Typing this anywhere in student mode opens tutor mode. */
  tutorPassword: 'zxcvbnm1234',

  /** How long (ms) the app waits for the second key of a two-key shortcut (Alt+T, then A). */
  chordTimeoutMs: 1500,

  /** Pause (ms) after a correct answer before the next exercise opens. */
  autoAdvanceDelayMs: 1400,

  /** Largest allowed matrix (rows and columns). */
  maxMatrixSize: 15,
};
