/**
 * File:        src/matrix/matrix-model.js
 * What it is:  The shape of a matrix: rows × columns, nothing else.
 * What it does:
 *   createMatrix(5, 5) -> { rows:5, cols:5, isInside(r,c), cellCount }
 *   Rows and columns are numbered from 1, like in maths: (1,1) is the first cell.
 *   Direction words (decision C1, the student's own point of view):
 *     forward = row number + 1    back = row number - 1
 *     right   = column number + 1 left = column number - 1
 *   Diagonal directions (iteration 3) change both at once:
 *     forward-right = (+1, +1)    forward-left = (+1, -1)
 *     back-right    = (-1, +1)    back-left    = (-1, -1)
 *   Pure logic, no DOM: unit tested in tests/matrix-model.test.js.
 * Depends on:  nothing.
 */

/** How each direction changes (row, column). */
export const DIRECTION_DELTAS = {
  forward: { dr: 1, dc: 0 },
  back: { dr: -1, dc: 0 },
  right: { dr: 0, dc: 1 },
  left: { dr: 0, dc: -1 },
  'forward-right': { dr: 1, dc: 1 },
  'forward-left': { dr: 1, dc: -1 },
  'back-right': { dr: -1, dc: 1 },
  'back-left': { dr: -1, dc: -1 },
};

export const DIRECTIONS = Object.keys(DIRECTION_DELTAS);

/** True for the four diagonal directions. */
export function isDiagonal(direction) {
  const d = DIRECTION_DELTAS[direction];
  return !!d && d.dr !== 0 && d.dc !== 0;
}

/**
 * @param {number} rows
 * @param {number} cols
 */
export function createMatrix(rows, cols) {
  if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || cols < 1) {
    throw new Error(`[matrix-model] bad size ${rows} × ${cols}`);
  }
  return {
    rows,
    cols,
    cellCount: rows * cols,
    isInside: (r, c) => r >= 1 && r <= rows && c >= 1 && c <= cols,
  };
}
