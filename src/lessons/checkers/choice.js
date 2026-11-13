/**
 * File:        src/lessons/checkers/choice.js
 * What it is:  Checks answers for 'choice' exercises (Lesson 8 style).
 * What it does:
 *   checkChoice(exercise, 1) -> true if option index 1 (counting from 0)
 *   is the right one. The student picks with ↑ ↓ + Enter, or the keys 1–4.
 * Depends on:  nothing.
 */

/**
 * @param {{answer:number, options:object[]}} exercise
 * @param {number} index option index, counting from 0
 */
export function checkChoice(exercise, index) {
  return index === exercise.answer;
}
