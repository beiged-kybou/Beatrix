/**
 * File:        tests/segmenter.test.js
 * What it is:  Unit tests for src/text-navigation/segmenter.js and text-cursor.js.
 * Run:         npm test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { segment } from '../src/text-navigation/segmenter.js';
import { createTextCursor } from '../src/text-navigation/text-cursor.js';

const texts = (segs) => segs.map((s) => s.text);

test('Bangla letters are grapheme clusters, not code points', () => {
  assert.deepEqual(texts(segment('কিস্তি', 'letter', 'bn')), ['কি', 'স্তি']);
});

test('letters keep spaces (letter mode says "space")', () => {
  assert.deepEqual(texts(segment('a b', 'letter', 'en')), ['a', ' ', 'b']);
});

test('words drop plain punctuation but keep math symbols', () => {
  assert.deepEqual(texts(segment('A 3 × 4 matrix, yes.', 'word', 'en')), ['A', '3', '×', '4', 'matrix', 'yes']);
});

test('Bangla sentences end at the danda', () => {
  assert.deepEqual(texts(segment('এটি একটি ঘর। এটি সারি।', 'sentence', 'bn')), ['এটি একটি ঘর।', 'এটি সারি।']);
});

test('segment offsets point back into the text', () => {
  const text = 'Hello big world';
  for (const s of segment(text, 'word', 'en')) assert.equal(text.slice(s.start, s.end), s.text);
});

test('text cursor moves and keeps its place when the unit changes', () => {
  const cur = createTextCursor('One two. Three four.', 'en', 'word');
  assert.equal(cur.prev(), null); // nothing before the start
  assert.equal(cur.next().text, 'One');
  assert.equal(cur.next().text, 'two');
  cur.setUnit('sentence');
  assert.equal(cur.current().text, 'One two.');
  assert.equal(cur.next().text, 'Three four.');
  assert.equal(cur.next(), null); // end
  cur.setUnit('letter');
  assert.equal(cur.current().text, 'T');
});
