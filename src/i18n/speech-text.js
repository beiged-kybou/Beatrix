/**
 * File:        src/i18n/speech-text.js
 * What it is:  Text clean-up done right before text is spoken by TTS.
 * What it does:
 *   prepareForSpeech('3 × 4', 'en') -> '3  by  4'   (uses the 'speech' table in strings)
 *   letterName(' ', 'bn')           -> 'ফাঁকা'        (uses the 'symbols' table in strings)
 * Used by:     audio/speech-service.js, ui/text-pane.js
 * Depends on:  i18n/language.js
 */

import { getStrings } from './language.js';

/** Replace symbols that TTS reads badly (e.g. × becomes "by"). */
export function prepareForSpeech(text, lang) {
  const table = getStrings(lang)?.speech ?? {};
  let out = String(text);
  for (const [symbol, spoken] of Object.entries(table)) {
    out = out.split(symbol).join(spoken);
  }
  return out;
}

/** What to say for one letter (grapheme) in letter mode. */
export function letterName(grapheme, lang) {
  const symbols = getStrings(lang)?.symbols ?? {};
  if (grapheme in symbols) return symbols[grapheme];
  if (/^\s+$/.test(grapheme)) return symbols[' '] ?? grapheme;
  return grapheme;
}
