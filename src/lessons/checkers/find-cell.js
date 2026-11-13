/**
 * File:        src/lessons/checkers/find-cell.js
 * What it is:  Checks answers for 'find-cell' exercises (Lesson 2 style).
 * What it does:
 *   checkFindCell(exercise, { row:2, col:2 }) -> true if the student pressed
 *   Enter on the target cell.
 * Depends on:  nothing.
 */

/**
 * @param {{target:{row:number, col:number}}} exercise
 * @param {{row:number, col:number}} position
 */
export function checkFindCell(exercise, position) {
  return position.row === exercise.target.row && position.col === exercise.target.col;
}
