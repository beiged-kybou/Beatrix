/**
 * File:        src/matrix/matrix-cursor.js
 * What it is:  The student's current cell inside a matrix.
 * What it does:
 *   const cur = createMatrixCursor(matrix, { row:1, col:1 });
 *   cur.move('forward') -> { moved:true,  row:2, col:1 }
 *   cur.move('back')    -> { moved:false, row:1, col:1 }  (hit the edge: stays put)
 *   cur.move('forward-right') -> diagonal; if either the row or the column would
 *                                leave the matrix, the cursor stays put (no sliding)
 *   cur.position()      -> { row, col }
 *   Pure logic, no DOM.
 * Depends on:  matrix/matrix-model.js
 */

import { DIRECTION_DELTAS } from './matrix-model.js';

/**
 * @param {{rows:number, cols:number, isInside:(r:number,c:number)=>boolean}} matrix
 * @param {{row:number, col:number}} start
 */
export function createMatrixCursor(matrix, start = { row: 1, col: 1 }) {
  if (!matrix.isInside(start.row, start.col)) throw new Error('[matrix-cursor] start is outside the matrix');
  let row = start.row;
  let col = start.col;

  return {
    position: () => ({ row, col }),

    /** @param {string} direction one of DIRECTIONS in matrix-model.js */
    move(direction) {
      const d = DIRECTION_DELTAS[direction];
      if (!d) throw new Error(`[matrix-cursor] unknown direction "${direction}"`);
      const r = row + d.dr;
      const c = col + d.dc;
      if (!matrix.isInside(r, c)) return { moved: false, row, col };
      row = r;
      col = c;
      return { moved: true, row, col };
    },
  };
}
