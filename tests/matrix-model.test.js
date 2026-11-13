/**
 * File:        tests/matrix-model.test.js
 * What it is:  Unit tests for src/matrix/matrix-model.js and matrix-cursor.js.
 * Run:         npm test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMatrix } from '../src/matrix/matrix-model.js';
import { createMatrixCursor } from '../src/matrix/matrix-cursor.js';

test('matrix size and bounds', () => {
  const m = createMatrix(3, 4);
  assert.equal(m.cellCount, 12);
  assert.ok(m.isInside(1, 1));
  assert.ok(m.isInside(3, 4));
  assert.ok(!m.isInside(0, 1));
  assert.ok(!m.isInside(4, 1));
  assert.ok(!m.isInside(1, 5));
});

test('bad sizes are rejected', () => {
  assert.throws(() => createMatrix(0, 3));
  assert.throws(() => createMatrix(2.5, 3));
});

test('forward grows the row number, right grows the column number (decision C1)', () => {
  const cur = createMatrixCursor(createMatrix(5, 5), { row: 1, col: 1 });
  assert.deepEqual(cur.move('forward'), { moved: true, row: 2, col: 1 });
  assert.deepEqual(cur.move('right'), { moved: true, row: 2, col: 2 });
  assert.deepEqual(cur.move('back'), { moved: true, row: 1, col: 2 });
  assert.deepEqual(cur.move('left'), { moved: true, row: 1, col: 1 });
});

test('the cursor stays put at the edge', () => {
  const cur = createMatrixCursor(createMatrix(2, 2), { row: 1, col: 1 });
  assert.deepEqual(cur.move('back'), { moved: false, row: 1, col: 1 });
  assert.deepEqual(cur.move('left'), { moved: false, row: 1, col: 1 });
});

test('diagonal steps change row and column together, and never slide along a wall', () => {
  const cur = createMatrixCursor(createMatrix(3, 3), { row: 1, col: 1 });
  assert.deepEqual(cur.move('forward-right'), { moved: true, row: 2, col: 2 });
  assert.deepEqual(cur.move('forward-left'), { moved: true, row: 3, col: 1 });
  assert.deepEqual(cur.move('forward-right'), { moved: false, row: 3, col: 1 }); // row 4 is outside
  assert.deepEqual(cur.move('back-right'), { moved: true, row: 2, col: 2 });
  assert.deepEqual(cur.move('back-left'), { moved: true, row: 1, col: 1 });
});
