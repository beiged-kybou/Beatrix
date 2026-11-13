/**
 * File:        src/lessons/checkers/number-answer.js
 * What it is:  Checks answers for 'number-answer' exercises (Lesson 1 style).
 * What it does:
 *   checkNumberAnswer(exercise, '৯') -> { valid:true, correct:true }
 *   Accepts English or Bangla digits. Text that is not a whole number gives
 *   { valid:false }, so the app can ask again without playing "oh-oh".
 * Depends on:  i18n/numbers.js
 */

import { parseNumber } from '../../i18n/numbers.js';

/**
 * @param {{answer:number}} exercise
 * @param {string} typed
 */
export function checkNumberAnswer(exercise, typed) {
  const value = parseNumber(typed);
  if (Number.isNaN(value)) return { valid: false, correct: false };
  return { valid: true, correct: value === exercise.answer };
}
