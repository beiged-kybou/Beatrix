/**
 * File:        src/audio/phrase-composer.js
 * What it is:  Builds spoken phrases out of small reusable pieces.
 * What it does:
 *   Recordings can't cover every possible number, so phrases such as
 *   "row 3, column 4" are joined from short clips (plan item B3):
 *     cell(3, 4) -> [ ui.row, num.3, ui.column, num.4 ]
 *   Each piece carries its TTS text too, so it still works with no recordings.
 *   The result is a parts list for audio/speech-service.js speak().
 * Depends on:  i18n/language.js, i18n/numbers.js
 */

import { getLang, t } from '../i18n/language.js';
import { formatNumber } from '../i18n/numbers.js';

/** A phrase from the 'spoken' strings section; clip key ui.<name>. */
export function spoken(name, lang = getLang()) {
  return { key: `ui.${name}`, text: t(`spoken.${name}`, {}, lang), lang };
}

/** A number; clip key num.<n>. */
export function number(n, lang = getLang()) {
  return { key: `num.${n}`, text: formatNumber(n, lang), lang };
}

/** "row R, column C" */
export function cell(row, col, lang = getLang()) {
  return [spoken('row', lang), number(row, lang), spoken('column', lang), number(col, lang)];
}

/** "You are at row R, column C" */
export function youAreAt(row, col, lang = getLang()) {
  return [spoken('you_are_at', lang), ...cell(row, col, lang)];
}
