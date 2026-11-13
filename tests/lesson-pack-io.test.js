/**
 * File:        tests/lesson-pack-io.test.js
 * What it is:  Unit tests for the lesson pack file format (src/storage/lesson-pack-format.js).
 * Run:         npm test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPack, parsePack, renameLesson } from '../src/storage/lesson-pack-format.js';
import { createEmptyLesson, createEmptyExercise, clipKeyForItem } from '../src/lessons/lesson-schema.js';

function sampleLesson() {
  const lesson = createEmptyLesson();
  lesson.id = 'cold1';
  lesson.title.en = 'Sample';
  const ex = createEmptyExercise('matrix-size');
  ex.id = 'e1';
  lesson.exercises.push(ex);
  return lesson;
}

test('a pack survives a round trip through JSON', () => {
  const pack = buildPack(sampleLesson(), [{ clipKey: 'cold1.e1.prompt', lang: 'bn', mime: 'audio/webm', data: 'AAAA' }]);
  const back = parsePack(JSON.stringify(pack));
  assert.equal(back.lesson.title.en, 'Sample');
  assert.equal(back.clips.length, 1);
});

test('non-packs and broken lessons are rejected with a readable message', () => {
  assert.throws(() => parsePack('not json'), /not a 6DotsLab lesson pack/);
  assert.throws(() => parsePack('{"format":"other"}'), /not a 6DotsLab lesson pack/);
  const bad = buildPack({ ...sampleLesson(), exercises: [] }, []);
  assert.throws(() => parsePack(bad), /at least one exercise/);
});

test('renaming a lesson renames its clip keys too', () => {
  const pack = buildPack(sampleLesson(), [{ clipKey: 'cold1.e1.prompt', lang: 'en', mime: 'audio/webm', data: 'AAAA' }]);
  const renamed = renameLesson(parsePack(pack), 'cnew2');
  assert.equal(renamed.lesson.id, 'cnew2');
  assert.equal(renamed.clips[0].clipKey, 'cnew2.e1.prompt');
});

test('numbers in cells reuse the number clips; other things get item clips', () => {
  assert.equal(clipKeyForItem({ en: '12', bn: '১২' }), 'num.12');
  assert.equal(clipKeyForItem({ en: 'Mango', bn: 'আম' }), 'item.mango');
  assert.equal(clipKeyForItem({ en: '', bn: 'আম' }), null);
});
