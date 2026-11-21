/**
 * File:        src/lessons/lesson-validator.js
 * What it is:  Checks that a lesson follows the template in lessons/lesson-schema.js.
 * What it does:
 *   validateLesson(lesson) -> [] when the lesson is fine, otherwise a list of
 *   plain-English error messages for the tutor, such as
 *   "Exercise 3 (Find the cell): the target (6, 2) is outside the 5 × 5 matrix."
 *   Used before saving in the tutor editor, when importing a lesson pack, and
 *   when built-in lessons are loaded (errors go to the console).
 *   Pure logic: unit tested in tests/lesson-validator.test.js.
 * Depends on:  lessons/lesson-schema.js, matrix/matrix-model.js,
 *              lessons/checkers/relative-move.js
 */

import { EXERCISE_TYPES, EXERCISE_TYPE_LABELS, LIMITS, exerciseMatrixSize } from './lesson-schema.js';
import { DIRECTIONS, isDiagonal } from '../matrix/matrix-model.js';
import { startRange, isPathInside } from './checkers/relative-move.js';

const hasText = (bi) => !!bi && typeof bi === 'object' && (!!bi.en?.trim() || !!bi.bn?.trim());
const isInt = (n) => Number.isInteger(n);

function sizeError(rows, cols) {
  const ok = (n) => isInt(n) && n >= LIMITS.minSize && n <= LIMITS.maxSize;
  if (ok(rows) && ok(cols)) return null;
  return `the matrix size must be between ${LIMITS.minSize} and ${LIMITS.maxSize} rows and columns`;
}

function inside(cell, rows, cols) {
  return cell && isInt(cell.row) && isInt(cell.col) && cell.row >= 1 && cell.row <= rows && cell.col >= 1 && cell.col <= cols;
}

/**
 * Reader's view text is optional, but when it is there it must have every
 * language the normal text has, or one language would show the wrong view.
 * @returns {string|null} 'English' / 'Bangla' when that one is missing
 */
function readerGap(text, reader) {
  if (!hasText(reader)) return null;
  if (text?.en?.trim() && !reader.en?.trim()) return 'English';
  if (text?.bn?.trim() && !reader.bn?.trim()) return 'Bangla';
  return null;
}

/** @returns {string[]} */
export function validateLesson(lesson) {
  const errors = [];
  if (!lesson || typeof lesson !== 'object') return ['This is not a lesson.'];
  if (typeof lesson.id !== 'string' || !lesson.id) errors.push('The lesson has no id.');
  if (!hasText(lesson.title)) errors.push('Give the lesson a title (English or Bangla).');

  const paragraphs = lesson.intro?.paragraphs;
  if (!Array.isArray(paragraphs)) {
    errors.push('The introduction is missing.');
  } else {
    paragraphs.forEach((p, i) => {
      if (!p?.id) errors.push(`Introduction paragraph ${i + 1} has no id.`);
      if (!hasText(p?.text)) errors.push(`Introduction paragraph ${i + 1} is empty. Write it or remove it.`);
      const missing = readerGap(p?.text, p?.textReader);
      if (missing) errors.push(`Introduction paragraph ${i + 1}: the reader's view text has no ${missing} version.`);
    });
  }
  const explore = lesson.intro?.explore;
  if (explore) {
    const e = sizeError(explore.rows, explore.cols);
    if (e) errors.push(`Introduction practice matrix: ${e}.`);
  }

  if (!Array.isArray(lesson.exercises) || lesson.exercises.length === 0) {
    errors.push('Add at least one exercise.');
    return errors;
  }

  const seen = new Set();
  lesson.exercises.forEach((ex, i) => {
    const where = `Exercise ${i + 1}${EXERCISE_TYPE_LABELS[ex?.type] ? ` (${EXERCISE_TYPE_LABELS[ex.type]})` : ''}`;
    if (!ex?.id) errors.push(`${where}: has no id.`);
    else if (seen.has(ex.id)) errors.push(`${where}: id "${ex.id}" is used twice.`);
    seen.add(ex?.id);
    if (!EXERCISE_TYPES.includes(ex?.type)) {
      errors.push(`${where}: unknown type "${ex?.type}".`);
      return;
    }
    for (const msg of exerciseErrors(ex)) errors.push(`${where}: ${msg}.`);
    const missing = readerGap(ex.prompt, ex.promptReader);
    if (missing) errors.push(`${where}: the reader's view question has no ${missing} version.`);
  });
  return errors;
}

/** Type-specific rules, then the matrix extras. Returns messages without the "Exercise N" prefix. */
function exerciseErrors(ex) {
  const out = [];

  if (ex.type === 'number-answer' || ex.type === 'choice') {
    if (!hasText(ex.prompt)) out.push('write the question');
    if (ex.type === 'number-answer' && (!isInt(ex.answer) || ex.answer < 0 || ex.answer > LIMITS.maxAnswer)) {
      out.push(`the answer must be a whole number from 0 to ${LIMITS.maxAnswer}`);
    }
    if (ex.type === 'choice') out.push(...choiceErrors(ex));
    if (ex.explore) {
      const e = sizeError(ex.explore.rows, ex.explore.cols);
      if (e) return [...out, `practice matrix: ${e}`];
    } else if (Array.isArray(ex.contents) && ex.contents.length) {
      out.push('things in cells need a practice matrix; add one or remove the things');
      return out;
    }
  } else {
    const e = sizeError(ex.rows, ex.cols);
    if (e) return [e];
  }

  if (ex.type === 'find-cell') {
    if (!hasText(ex.item) && !hasText(ex.prompt)) out.push('name the item to find, or write the question');
    if (!inside(ex.target, ex.rows, ex.cols)) out.push(`the target (${ex.target?.row}, ${ex.target?.col}) is outside the ${ex.rows} × ${ex.cols} matrix`);
  }

  if (ex.type === 'find-own-position' && ex.start !== 'random' && !inside(ex.start, ex.rows, ex.cols)) {
    out.push('the start cell is outside the matrix');
  }

  if (ex.type === 'relative-move') out.push(...movesErrors(ex));

  const size = exerciseMatrixSize(ex);
  if (size) out.push(...speakingErrors(ex, size), ...contentsErrors(ex, size));
  if (ex.diagonalMoves !== undefined && typeof ex.diagonalMoves !== 'boolean') out.push('"diagonal moves" must be on or off');
  return out;
}

function choiceErrors(ex) {
  const out = [];
  if (!Array.isArray(ex.options) || ex.options.length < LIMITS.minOptions || ex.options.length > LIMITS.maxOptions) {
    return [`give ${LIMITS.minOptions} to ${LIMITS.maxOptions} answer options`];
  }
  ex.options.forEach((o, i) => {
    if (!hasText(o)) out.push(`option ${i + 1} is empty`);
  });
  if (!isInt(ex.answer) || ex.answer < 0 || ex.answer >= ex.options.length) out.push('choose which option is correct');
  return out;
}

function movesErrors(ex) {
  if (!Array.isArray(ex.moves) || ex.moves.length === 0) return ['add at least one move'];
  if (ex.moves.length > LIMITS.maxMoves) return [`use at most ${LIMITS.maxMoves} moves`];
  const badMove = ex.moves.findIndex((m) => !DIRECTIONS.includes(m?.dir) || !isInt(m?.steps) || m.steps < 1);
  if (badMove !== -1) return [`move ${badMove + 1} needs a direction and at least 1 step`];
  if (!ex.diagonalMoves && ex.moves.some((m) => isDiagonal(m.dir))) {
    return ['some moves are diagonal, so turn on "Diagonal moves allowed"'];
  }
  if (ex.start === 'random') {
    return startRange(ex) ? [] : [`these moves don't fit inside a ${ex.rows} × ${ex.cols} matrix from any start cell`];
  }
  if (!inside(ex.start, ex.rows, ex.cols)) return ['the start cell is outside the matrix'];
  if (!isPathInside(ex, ex.start)) return ['from this start cell the moves go outside the matrix'];
  return [];
}

function speakingErrors(ex, { rows, cols }) {
  const sc = ex.speakingCells ?? 'default';
  if (Array.isArray(sc)) {
    const bad = sc.find((c) => !inside(c, rows, cols));
    return bad ? [`speaking cell (${bad.row}, ${bad.col}) is outside the matrix`] : [];
  }
  return ['default', 'all', 'none'].includes(sc) ? [] : [`unknown speaking-cells setting "${sc}"`];
}

function contentsErrors(ex, { rows, cols }) {
  if (ex.contents === undefined) return [];
  if (!Array.isArray(ex.contents)) return ['the things in cells must be a list'];
  const out = [];
  const used = new Set();
  ex.contents.forEach((c, i) => {
    if (!inside(c, rows, cols)) out.push(`thing ${i + 1} is in cell (${c?.row}, ${c?.col}), outside the matrix`);
    else if (used.has(`${c.row},${c.col}`)) out.push(`two things are in cell (${c.row}, ${c.col}); use one per cell`);
    else used.add(`${c.row},${c.col}`);
    if (!hasText(c?.item)) out.push(`thing ${i + 1} has no name`);
  });
  return out;
}
