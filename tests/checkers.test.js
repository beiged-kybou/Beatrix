/**
 * File:        tests/checkers.test.js
 * What it is:  Unit tests for the answer checkers and the exercise session.
 * Run:         npm test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkNumberAnswer } from '../src/lessons/checkers/number-answer.js';
import { checkFindCell } from '../src/lessons/checkers/find-cell.js';
import { checkMatrixSize } from '../src/lessons/checkers/matrix-size.js';
import { startRange, pickStart, targetOf, checkRelativeMove, isPathInside } from '../src/lessons/checkers/relative-move.js';
import { createExerciseSession } from '../src/lessons/exercise-session.js';
import { resolveSpeakingCells } from '../src/lessons/lesson-schema.js';
import { pickHiddenStart, checkOwnPosition } from '../src/lessons/checkers/find-own-position.js';
import { checkChoice } from '../src/lessons/checkers/choice.js';

test('number answers accept English and Bangla digits', () => {
  assert.deepEqual(checkNumberAnswer({ answer: 9 }, '9'), { valid: true, correct: true });
  assert.deepEqual(checkNumberAnswer({ answer: 9 }, '৯'), { valid: true, correct: true });
  assert.deepEqual(checkNumberAnswer({ answer: 12 }, '১২'), { valid: true, correct: true });
  assert.deepEqual(checkNumberAnswer({ answer: 9 }, '8'), { valid: true, correct: false });
  assert.equal(checkNumberAnswer({ answer: 9 }, 'abc').valid, false);
});

test('find-cell and matrix-size', () => {
  assert.ok(checkFindCell({ target: { row: 2, col: 2 } }, { row: 2, col: 2 }));
  assert.ok(!checkFindCell({ target: { row: 2, col: 2 } }, { row: 2, col: 3 }));
  assert.ok(checkMatrixSize({ rows: 3, cols: 4 }, 3, 4));
  assert.ok(!checkMatrixSize({ rows: 3, cols: 4 }, 4, 3));
});

test('relative move: 2 right then 3 forward', () => {
  const moves = [{ dir: 'right', steps: 2 }, { dir: 'forward', steps: 3 }];
  assert.deepEqual(targetOf({ row: 4, col: 7 }, moves), { row: 7, col: 9 });
  assert.ok(checkRelativeMove({ row: 4, col: 7 }, moves, { row: 7, col: 9 }));
});

test('random starts always keep the whole path inside', () => {
  const ex = { rows: 10, cols: 10, start: 'random', moves: [{ dir: 'right', steps: 4 }, { dir: 'forward', steps: 2 }, { dir: 'left', steps: 1 }] };
  assert.deepEqual(startRange(ex), { rowMin: 1, rowMax: 8, colMin: 1, colMax: 6 });
  for (const r of [0, 0.25, 0.5, 0.999]) assert.ok(isPathInside(ex, pickStart(ex, () => r)));
});

test('impossible moves have no start range', () => {
  assert.equal(startRange({ rows: 3, cols: 3, moves: [{ dir: 'right', steps: 5 }] }), null);
});

test('matrix-size session asks rows, then columns; wrong goes back to rows', () => {
  const s = createExerciseSession({ id: 'e', type: 'matrix-size', rows: 3, cols: 4, speakingCells: 'default' });
  assert.equal(s.answerStage, 'rows');
  assert.equal(s.submitNumber('3').status, 'next');
  assert.equal(s.answerStage, 'columns');
  assert.equal(s.submitNumber('5').status, 'wrong');
  assert.equal(s.answerStage, 'rows');
  s.submitNumber('3');
  assert.equal(s.submitNumber('৪').status, 'correct');
});

test('default speaking cells match the lesson descriptions', () => {
  assert.deepEqual([...resolveSpeakingCells({ type: 'find-cell', rows: 5, cols: 5, speakingCells: 'default' })], ['1,1']);
  assert.deepEqual(
    [...resolveSpeakingCells({ type: 'matrix-size', rows: 3, cols: 6, speakingCells: 'default' })],
    ['1,1', '1,6', '3,1'],
  );
  assert.equal(resolveSpeakingCells({ type: 'relative-move', rows: 10, cols: 10, speakingCells: 'default' }).size, 0);
});

test('a random hidden start is never (1,1) and always inside', () => {
  const ex = { rows: 3, cols: 4, start: 'random' };
  for (const r of [0, 0.1, 0.5, 0.9, 0.9999]) {
    const s = pickHiddenStart(ex, () => r);
    assert.ok(!(s.row === 1 && s.col === 1));
    assert.ok(s.row >= 1 && s.row <= 3 && s.col >= 1 && s.col <= 4);
  }
  assert.deepEqual(pickHiddenStart(ex, () => 0.9999), { row: 3, col: 4 });
  assert.ok(checkOwnPosition({ row: 2, col: 3 }, 2, 3));
  assert.ok(!checkOwnPosition({ row: 2, col: 3 }, 3, 2));
});

test('find-own-position session: answer is the START cell, not where you walked', () => {
  const s = createExerciseSession({ id: 'e', type: 'find-own-position', rows: 5, cols: 5, start: { row: 3, col: 4 }, speakingCells: 'default' });
  assert.equal(s.speaking.size, 0);
  s.move('back');
  s.move('back');
  assert.equal(s.submitNumber('3').status, 'next');
  assert.equal(s.submitNumber('4').status, 'correct');
});

test('choice session and cell contents', () => {
  const s = createExerciseSession({
    id: 'e', type: 'choice', prompt: { en: 'What is at (1,2)?' }, answer: 1,
    options: [{ en: 'cat' }, { en: 'mango' }], explore: { rows: 2, cols: 2 }, speakingCells: 'default',
    contents: [{ row: 1, col: 2, item: { en: 'mango', bn: 'আম' } }],
  });
  assert.ok(s.hasContents);
  assert.equal(s.speaking, 'all');
  assert.deepEqual(s.contentAt(1, 2), { en: 'mango', bn: 'আম' });
  assert.equal(s.contentAt(2, 2), null);
  assert.equal(s.submitChoice(0).correct, false);
  assert.equal(s.submitChoice(1).correct, true);
  assert.ok(checkChoice({ answer: 0 }, 0));
});

test('diagonal steps are blocked unless the exercise allows them', () => {
  const off = createExerciseSession({ id: 'e', type: 'find-cell', rows: 3, cols: 3, item: { en: 'x' }, target: { row: 2, col: 2 }, speakingCells: 'default' });
  assert.deepEqual(off.move('forward-right'), { row: 1, col: 1, moved: false, blocked: true });
  const on = createExerciseSession({ id: 'e', type: 'find-cell', rows: 3, cols: 3, item: { en: 'x' }, target: { row: 2, col: 2 }, speakingCells: 'default', diagonalMoves: true });
  assert.deepEqual(on.move('forward-right'), { moved: true, row: 2, col: 2 });
  assert.ok(on.submitCell().correct);
});

test('relative moves with diagonals', () => {
  const moves = [{ dir: 'forward-right', steps: 2 }, { dir: 'back-right', steps: 2 }, { dir: 'left', steps: 1 }];
  assert.deepEqual(targetOf({ row: 5, col: 2 }, moves), { row: 5, col: 5 });
  assert.deepEqual(startRange({ rows: 10, cols: 10, moves }), { rowMin: 1, rowMax: 8, colMin: 1, colMax: 6 });
});
