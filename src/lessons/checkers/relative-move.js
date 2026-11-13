/**
 * File:        src/lessons/checkers/relative-move.js
 * What it is:  Logic and checking for 'relative-move' exercises (Lesson 4 style).
 * What it does:
 *   pathOffsets(moves)           every (dr, dc) offset along the path, starting at (0,0)
 *   startRange(exercise)         the start cells that keep the whole path inside, or null
 *   pickStart(exercise, rng)     the fixed start, or a random valid one
 *   isPathInside(exercise, s)    does every step from start s stay in the matrix?
 *   targetOf(start, moves)       the cell reached after all moves
 *   checkRelativeMove(start, moves, position)  true if the student is on the target
 *   Directions follow decision C1: forward = row + 1, right = column + 1.
 *   Pure logic: unit tested in tests/checkers.test.js.
 * Depends on:  matrix/matrix-model.js
 */

import { DIRECTION_DELTAS } from '../../matrix/matrix-model.js';

/** @param {{dir:string, steps:number}[]} moves */
export function pathOffsets(moves) {
  const out = [{ dr: 0, dc: 0 }];
  let dr = 0;
  let dc = 0;
  for (const m of moves) {
    const d = DIRECTION_DELTAS[m.dir];
    dr += d.dr * m.steps;
    dc += d.dc * m.steps;
    out.push({ dr, dc });
  }
  return out;
}

/**
 * Range of start cells for which the path never leaves the matrix.
 * @returns {{rowMin:number, rowMax:number, colMin:number, colMax:number} | null}
 */
export function startRange(exercise) {
  const offs = pathOffsets(exercise.moves);
  const minDr = Math.min(...offs.map((o) => o.dr));
  const maxDr = Math.max(...offs.map((o) => o.dr));
  const minDc = Math.min(...offs.map((o) => o.dc));
  const maxDc = Math.max(...offs.map((o) => o.dc));
  const range = {
    rowMin: 1 - minDr,
    rowMax: exercise.rows - maxDr,
    colMin: 1 - minDc,
    colMax: exercise.cols - maxDc,
  };
  return range.rowMin <= range.rowMax && range.colMin <= range.colMax ? range : null;
}

export function isPathInside(exercise, start) {
  return pathOffsets(exercise.moves).every(({ dr, dc }) => {
    const r = start.row + dr;
    const c = start.col + dc;
    return r >= 1 && r <= exercise.rows && c >= 1 && c <= exercise.cols;
  });
}

/**
 * The start cell for one attempt.
 * @param {() => number} [rng] random number 0..1 (pass a fixed one in tests)
 */
export function pickStart(exercise, rng = Math.random) {
  if (exercise.start !== 'random') return { ...exercise.start };
  const range = startRange(exercise);
  if (!range) throw new Error('[relative-move] no start cell keeps these moves inside the matrix');
  const pick = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
  return { row: pick(range.rowMin, range.rowMax), col: pick(range.colMin, range.colMax) };
}

export function targetOf(start, moves) {
  const last = pathOffsets(moves).at(-1);
  return { row: start.row + last.dr, col: start.col + last.dc };
}

export function checkRelativeMove(start, moves, position) {
  const target = targetOf(start, moves);
  return position.row === target.row && position.col === target.col;
}
