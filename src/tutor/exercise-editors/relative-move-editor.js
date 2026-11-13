/**
 * File:        src/tutor/exercise-editors/relative-move-editor.js
 * What it is:  Editor form for a 'relative-move' exercise (Lesson 4 style).
 * What it does:
 *   Matrix size, start cell (random or fixed), the list of moves
 *   (direction + steps, up to 6), which cells speak (default: none), and an
 *   optional own question text. A live check line tells the teacher which
 *   start cells are possible, or why the moves don't fit.
 *   The start sentence ("You are at row 4, column 7.") is always added before
 *   the question, because a random start can't be written in advance.
 * Render:      renderRelativeMoveEditor(container, lesson, exercise)
 * Depends on:  tutor/field-builders.js, tutor/exercise-editors/common-fields.js,
 *              lessons/lesson-schema.js, lessons/checkers/relative-move.js,
 *              matrix/matrix-model.js
 */

import { el, button, numberField, selectField, cellField } from '../field-builders.js';
import { promptFields, sizeFields, speakingCellsField, diagonalField } from './common-fields.js';
import { LIMITS } from '../../lessons/lesson-schema.js';
import { startRange, isPathInside, targetOf } from '../../lessons/checkers/relative-move.js';
import { isDiagonal } from '../../matrix/matrix-model.js';

const DIRECTION_LABELS = [
  ['forward', 'Forward (row number + )'],
  ['back', 'Back (row number − )'],
  ['right', 'Right (column number + )'],
  ['left', 'Left (column number − )'],
  ['forward-right', 'Forward-right, diagonal (row +, column +)'],
  ['forward-left', 'Forward-left, diagonal (row +, column −)'],
  ['back-right', 'Back-right, diagonal (row −, column +)'],
  ['back-left', 'Back-left, diagonal (row −, column −)'],
];

export function renderRelativeMoveEditor(container, lesson, exercise) {
  const check = el('p', 'help check-line');
  check.setAttribute('role', 'status');

  function updateCheck() {
    const sizeOk = [exercise.rows, exercise.cols].every((n) => Number.isInteger(n) && n >= 1 && n <= LIMITS.maxSize);
    const movesOk = exercise.moves.length && exercise.moves.every((m) => Number.isInteger(m.steps) && m.steps >= 1);
    if (!sizeOk || !movesOk) {
      check.textContent = 'Fill in the size and every move.';
      return;
    }
    if (!exercise.diagonalMoves && exercise.moves.some((m) => isDiagonal(m.dir))) {
      check.textContent = '⚠ Some moves are diagonal: tick "Diagonal moves allowed".';
      return;
    }
    if (exercise.start === 'random') {
      const r = startRange(exercise);
      check.textContent = r
        ? `OK: a random start is picked from rows ${r.rowMin}–${r.rowMax} and columns ${r.colMin}–${r.colMax}.`
        : '⚠ These moves do not fit in this matrix from any start cell.';
    } else {
      const s = exercise.start;
      const t = targetOf(s, exercise.moves);
      check.textContent = isPathInside(exercise, s)
        ? `OK: from (${s.row}, ${s.col}) the answer is (${t.row}, ${t.col}).`
        : '⚠ From this start cell the moves go outside the matrix.';
    }
  }

  // Start cell
  const fixedBox = el('div');
  const drawFixed = () => {
    fixedBox.replaceChildren();
    if (exercise.start === 'random') return;
    fixedBox.append(cellField({ label: 'Start cell', value: exercise.start, max: LIMITS.maxSize, onChange: (v) => { exercise.start = v; updateCheck(); } }));
  };

  // Moves list
  const movesBox = el('div', 'moves');
  const drawMoves = () => {
    movesBox.replaceChildren();
    exercise.moves.forEach((m, i) => {
      const row = el('div', 'row-of-fields move-row');
      row.append(
        el('span', 'move-number', `Move ${i + 1}`),
        selectField({ label: 'Direction', value: m.dir, options: DIRECTION_LABELS, onChange: (v) => { m.dir = v; updateCheck(); } }),
        numberField({ label: 'Steps', value: m.steps, min: 1, max: LIMITS.maxSize - 1, onChange: (v) => { m.steps = v; updateCheck(); } }),
        button('Remove', () => {
          exercise.moves.splice(i, 1);
          drawMoves();
          updateCheck();
        }, 'small'),
      );
      movesBox.append(row);
    });
    if (exercise.moves.length < LIMITS.maxMoves) {
      movesBox.append(button('+ Add move', () => {
        exercise.moves.push({ dir: 'right', steps: 1 });
        drawMoves();
        updateCheck();
      }, 'small'));
    }
  };

  container.append(
    sizeFields(exercise, updateCheck),
    selectField({
      label: 'Start cell',
      value: exercise.start === 'random' ? 'random' : 'fixed',
      options: [['random', 'Random (different each time)'], ['fixed', 'Fixed cell']],
      onChange: (v) => {
        exercise.start = v === 'random' ? 'random' : { row: 1, col: 1 };
        drawFixed();
        updateCheck();
      },
    }),
    fixedBox,
    el('h4', '', 'Moves'),
    movesBox,
    diagonalField(exercise, updateCheck),
    check,
    speakingCellsField(exercise),
    promptFields(lesson, exercise, {
      hint: 'Optional. Leave empty to describe the moves automatically, e.g. "Move 2 steps right along the row, then move 3 steps forward along the column. Where are you now?" The start cell sentence is always said first.',
    }),
  );
  drawFixed();
  drawMoves();
  updateCheck();
}
