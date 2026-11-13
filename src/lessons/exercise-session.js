/**
 * File:        src/lessons/exercise-session.js
 * What it is:  The live state of ONE exercise (or of the intro practice matrix).
 * What it does:
 *   Holds the matrix, the cursor, the start cell, the things kept in cells and
 *   the answer step, and decides if an answer is right, using the checkers.
 *   No DOM, no sound: ui/screen-lesson.js turns the results into screen
 *   updates and audio.
 *
 *   const s = createExerciseSession(exercise)       or createExploreSession(rows, cols)
 *   s.matrix            null | { rows, cols, … }
 *   s.speaking          'all' | Set("row,col")       which cells speak
 *   s.start             start cell (Lessons 4/5: fixed or random)
 *   s.answerStage       null | 'number' | 'rows' | 'columns'   (what the answer box asks)
 *   s.asksForStart      true if rows/columns mean "the cell you started in" (find-own-position),
 *                       false if they mean the matrix size (matrix-size)
 *   s.answerOnMatrix    true if Enter on the matrix gives the answer
 *   s.options           null | [{en,bn}]             answer options (choice exercises)
 *   s.hasContents       true if some cells hold things (then Space = "what is here")
 *   s.allowWhereAmI     Space may say the position (only where every cell speaks)
 *   s.diagonalMoves     true if diagonal steps are allowed here
 *   s.move(dir)         -> { moved, row, col }, plus blocked:true for a diagonal
 *                          step where diagonals are not allowed
 *   s.position()        -> { row, col }
 *   s.contentAt(r, c)   -> { en, bn } | null
 *   s.submitCell()      -> { correct }                          (find-cell, relative-move)
 *   s.submitChoice(i)   -> { correct }                          (choice; i counts from 0)
 *   s.submitNumber(txt) -> { status:'invalid'|'next'|'correct'|'wrong' }
 *                          number-answer: one number
 *                          matrix-size, find-own-position: rows, then columns
 *   Wrong answers keep the student on the same exercise.
 * Depends on:  matrix/matrix-model.js, matrix/matrix-cursor.js, lessons/lesson-schema.js,
 *              lessons/checkers/*, i18n/numbers.js
 */

import { createMatrix, isDiagonal } from '../matrix/matrix-model.js';
import { createMatrixCursor } from '../matrix/matrix-cursor.js';
import { exerciseMatrixSize, resolveSpeakingCells } from './lesson-schema.js';
import { checkNumberAnswer } from './checkers/number-answer.js';
import { checkChoice } from './checkers/choice.js';
import { checkFindCell } from './checkers/find-cell.js';
import { checkMatrixSize } from './checkers/matrix-size.js';
import { pickStart, checkRelativeMove } from './checkers/relative-move.js';
import { pickHiddenStart, checkOwnPosition } from './checkers/find-own-position.js';
import { parseNumber } from '../i18n/numbers.js';

/**
 * A move that refuses diagonal steps unless they are allowed.
 * @returns {(dir:string) => {moved:boolean, row:number, col:number, blocked?:boolean}}
 */
function guardedMove(cursor, diagonalMoves) {
  return (dir) => {
    if (isDiagonal(dir) && !diagonalMoves) return { ...cursor.position(), moved: false, blocked: true };
    return cursor.move(dir);
  };
}

/**
 * Practice matrix for an introduction: every cell speaks, nothing to answer.
 * @param {{diagonalMoves?: boolean}} [opts]
 */
export function createExploreSession(rows, cols, { diagonalMoves = false } = {}) {
  const matrix = createMatrix(rows, cols);
  const cursor = createMatrixCursor(matrix, { row: 1, col: 1 });
  return {
    diagonalMoves,
    matrix,
    speaking: 'all',
    start: { row: 1, col: 1 },
    answerStage: null,
    answerOnMatrix: false,
    asksForStart: false,
    options: null,
    hasContents: false,
    allowWhereAmI: true,
    move: guardedMove(cursor, diagonalMoves),
    position: () => cursor.position(),
    contentAt: () => null,
    submitCell: () => ({ correct: false }),
    submitChoice: () => ({ correct: false }),
    submitNumber: () => ({ status: 'invalid' }),
  };
}

function startFor(exercise, rng) {
  if (exercise.type === 'relative-move') return pickStart(exercise, rng);
  if (exercise.type === 'find-own-position') return pickHiddenStart(exercise, rng);
  return { row: 1, col: 1 };
}

/** Types answered by typing rows, then columns (decision C3 of iteration 1). */
const TWO_STEP = new Set(['matrix-size', 'find-own-position']);

/**
 * @param {object} exercise  an exercise object (see lessons/lesson-schema.js)
 * @param {() => number} [rng] random source, for random starts
 */
export function createExerciseSession(exercise, rng = Math.random) {
  const size = exerciseMatrixSize(exercise);
  const matrix = size ? createMatrix(size.rows, size.cols) : null;
  const start = startFor(exercise, rng);
  const cursor = matrix ? createMatrixCursor(matrix, start) : null;
  const speaking = matrix ? resolveSpeakingCells(exercise) : new Set();
  const contents = new Map((matrix ? exercise.contents ?? [] : []).map((c) => [`${c.row},${c.col}`, c.item]));

  let answerStage = exercise.type === 'number-answer' ? 'number' : TWO_STEP.has(exercise.type) ? 'rows' : null;
  let typedRows = null;

  /** Second number of a rows → columns answer. */
  function checkTwoStep(rows, cols) {
    if (exercise.type === 'matrix-size') return checkMatrixSize(exercise, rows, cols);
    return checkOwnPosition(start, rows, cols);
  }

  return {
    matrix,
    speaking,
    start,
    get answerStage() {
      return answerStage;
    },
    answerOnMatrix: exercise.type === 'find-cell' || exercise.type === 'relative-move',
    asksForStart: exercise.type === 'find-own-position',
    options: exercise.type === 'choice' ? exercise.options : null,
    hasContents: contents.size > 0,
    allowWhereAmI: speaking === 'all',
    diagonalMoves: !!exercise.diagonalMoves,

    move: cursor ? guardedMove(cursor, !!exercise.diagonalMoves) : () => null,
    position: () => cursor.position(),
    contentAt: (row, col) => contents.get(`${row},${col}`) ?? null,

    submitCell() {
      const pos = cursor.position();
      if (exercise.type === 'find-cell') return { correct: checkFindCell(exercise, pos) };
      if (exercise.type === 'relative-move') return { correct: checkRelativeMove(start, exercise.moves, pos) };
      return { correct: false };
    },

    submitChoice(index) {
      if (exercise.type !== 'choice') return { correct: false };
      return { correct: checkChoice(exercise, index) };
    },

    submitNumber(typed) {
      if (exercise.type === 'number-answer') {
        const r = checkNumberAnswer(exercise, typed);
        if (!r.valid) return { status: 'invalid' };
        return { status: r.correct ? 'correct' : 'wrong' };
      }
      if (TWO_STEP.has(exercise.type)) {
        const value = parseNumber(typed);
        if (Number.isNaN(value)) return { status: 'invalid' };
        if (answerStage === 'rows') {
          typedRows = value;
          answerStage = 'columns';
          return { status: 'next' };
        }
        const correct = checkTwoStep(typedRows, value);
        answerStage = 'rows'; // wrong: start again with rows; right: the exercise ends anyway
        typedRows = null;
        return { status: correct ? 'correct' : 'wrong' };
      }
      return { status: 'invalid' };
    },
  };
}
