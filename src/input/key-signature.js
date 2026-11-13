/**
 * File:        src/input/key-signature.js
 * What it is:  Converts a keyboard event into a short text "signature".
 * What it does:
 *   signatureOf({ code:'KeyL', altKey:true }) -> 'Alt+KeyL'
 *   The order is always Ctrl, Alt, Shift, then the physical key code.
 *   Pure function, so it can be unit tested without a browser.
 * Used by:     input/keyboard-router.js, modes/tutor-gate.js
 * Depends on:  nothing.
 */

/** Keys that are only modifiers; they never form a signature on their own. */
const MODIFIER_CODES = new Set([
  'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight',
  'ShiftLeft', 'ShiftRight', 'MetaLeft', 'MetaRight',
]);

/**
 * @param {{code:string, ctrlKey?:boolean, altKey?:boolean, shiftKey?:boolean}} e
 * @returns {string|null} null for a bare modifier press
 */
export function signatureOf(e) {
  if (MODIFIER_CODES.has(e.code)) return null;
  let sig = '';
  if (e.ctrlKey) sig += 'Ctrl+';
  if (e.altKey) sig += 'Alt+';
  if (e.shiftKey) sig += 'Shift+';
  return sig + e.code;
}

/**
 * The plain character a physical key stands for on a US layout
 * ('KeyZ' -> 'z', 'Digit1' -> '1'), or null for other keys.
 * Used to detect the tutor password even when a Bangla layout is active.
 * @param {string} code
 */
export function latinCharOf(code) {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
  if (/^(Digit|Numpad)[0-9]$/.test(code)) return code.slice(-1);
  return null;
}
