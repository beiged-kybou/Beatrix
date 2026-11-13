/**
 * File:        src/lessons/checkers/matrix-size.js
 * What it is:  Checks answers for 'matrix-size' exercises (Lesson 3 style).
 * What it does:
 *   checkMatrixSize(exercise, 3, 4) -> true if the matrix really is 3 × 4.
 *   The two-step input (rows → Enter → columns → Enter, decision C3) is
 *   handled by lessons/exercise-session.js; this file only compares numbers.
 * Depends on:  nothing.
 */

/**
 * @param {{rows:number, cols:number}} exercise
 * @param {number} rows
 * @param {number} cols
 */
export function checkMatrixSize(exercise, rows, cols) {
  return rows === exercise.rows && cols === exercise.cols;
}
