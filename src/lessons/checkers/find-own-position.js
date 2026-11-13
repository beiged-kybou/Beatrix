/**
 * File:        src/lessons/checkers/find-own-position.js
 * What it is:  Logic and checking for 'find-own-position' exercises (Lesson 5 style).
 * What it does:
 *   pickHiddenStart(exercise, rng)   the fixed start, or a random cell.
 *                                    A random start is never (1,1) (that cell
 *                                    needs no counting), unless the matrix is 1 × 1.
 *   checkOwnPosition(start, row, col) true if the typed row and column are
 *                                    the cell where the student STARTED.
 *   The student finds it by walking to the edges and counting the steps.
 *   Pure logic: unit tested in tests/checkers.test.js.
 * Depends on:  nothing.
 */

/**
 * @param {{rows:number, cols:number, start:'random'|{row:number,col:number}}} exercise
 * @param {() => number} [rng]
 */
export function pickHiddenStart(exercise, rng = Math.random) {
  if (exercise.start !== 'random') return { ...exercise.start };
  const cells = exercise.rows * exercise.cols;
  if (cells === 1) return { row: 1, col: 1 };
  // Pick one of the cells 2..cells (cell 1 is (1,1)).
  const k = 1 + Math.floor(rng() * (cells - 1));
  return { row: Math.floor(k / exercise.cols) + 1, col: (k % exercise.cols) + 1 };
}

export function checkOwnPosition(start, row, col) {
  return row === start.row && col === start.col;
}
