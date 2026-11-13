/**
 * File:        tests/lesson-validator.test.js
 * What it is:  Unit tests for src/lessons/lesson-validator.js, including a check
 *              that every built-in lesson follows the shared template.
 * Run:         npm test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateLesson } from '../src/lessons/lesson-validator.js';
import { createEmptyLesson, createEmptyExercise, EXERCISE_TYPES } from '../src/lessons/lesson-schema.js';

const read = (p) => JSON.parse(readFileSync(new URL(`../content/lessons/${p}`, import.meta.url), 'utf8'));

test('every built-in lesson is valid', () => {
  const files = read('index.json').sections.flatMap((s) => s.lessons);
  assert.equal(new Set(files).size, files.length, 'a lesson is listed twice in index.json');
  for (const file of files) {
    assert.deepEqual(validateLesson(read(file)), [], file);
  }
});

test('an empty new lesson lists what is missing', () => {
  const errors = validateLesson(createEmptyLesson());
  assert.ok(errors.some((e) => e.includes('title')));
  assert.ok(errors.some((e) => e.includes('at least one exercise')));
});

test('one language is enough (decision C9)', () => {
  const lesson = createEmptyLesson();
  lesson.title = { en: '', bn: 'আমার পাঠ' };
  const ex = createEmptyExercise('matrix-size');
  lesson.exercises.push(ex);
  assert.deepEqual(validateLesson(lesson), []);
});

test('fresh exercises of every type are valid once required text is filled', () => {
  for (const type of EXERCISE_TYPES) {
    const lesson = createEmptyLesson();
    lesson.title.en = 'T';
    const ex = createEmptyExercise(type);
    if (type === 'number-answer' || type === 'choice') ex.prompt.en = 'How many?';
    if (type === 'find-cell') ex.item.en = 'apple';
    lesson.exercises.push(ex);
    assert.deepEqual(validateLesson(lesson), [], type);
  }
});

test('targets outside the matrix and sizes over 15 are caught', () => {
  const lesson = createEmptyLesson();
  lesson.title.en = 'T';
  const ex = createEmptyExercise('find-cell');
  ex.item.en = 'apple';
  ex.target = { row: 6, col: 2 };
  lesson.exercises.push(ex);
  assert.match(validateLesson(lesson)[0], /outside the 5 × 5 matrix/);
  ex.rows = 16;
  assert.match(validateLesson(lesson)[0], /between 1 and 15/);
});

test('fixed starts whose moves leave the matrix are caught', () => {
  const lesson = createEmptyLesson();
  lesson.title.en = 'T';
  const ex = createEmptyExercise('relative-move');
  ex.start = { row: 10, col: 10 };
  ex.moves = [{ dir: 'forward', steps: 1 }];
  lesson.exercises.push(ex);
  assert.match(validateLesson(lesson)[0], /go outside/);
});

test('choice exercises need 2–4 options and a correct one', () => {
  const lesson = createEmptyLesson();
  lesson.title.en = 'T';
  const ex = createEmptyExercise('choice');
  ex.prompt.en = 'Same row?';
  lesson.exercises.push(ex);
  assert.deepEqual(validateLesson(lesson), []);
  ex.answer = 2;
  assert.match(validateLesson(lesson)[0], /which option is correct/);
  ex.answer = 0;
  ex.options = [{ en: 'Yes', bn: '' }];
  assert.match(validateLesson(lesson)[0], /2 to 4 answer options/);
});

test('things in cells must be inside the matrix, named, and one per cell', () => {
  const lesson = createEmptyLesson();
  lesson.title.en = 'T';
  const ex = createEmptyExercise('number-answer');
  ex.prompt.en = 'How many apples?';
  ex.contents = [{ row: 1, col: 1, item: { en: 'apple', bn: '' } }];
  lesson.exercises.push(ex);
  assert.match(validateLesson(lesson)[0], /need a practice matrix/);
  ex.explore = { rows: 3, cols: 3 };
  assert.deepEqual(validateLesson(lesson), []);
  ex.contents.push({ row: 1, col: 1, item: { en: 'mango', bn: '' } }, { row: 4, col: 1, item: { en: '', bn: '' } });
  const errors = validateLesson(lesson).join('\n');
  assert.match(errors, /two things are in cell \(1, 1\)/);
  assert.match(errors, /outside the matrix/);
  assert.match(errors, /has no name/);
});

test('diagonal moves in a relative-move need "diagonal moves allowed"', () => {
  const lesson = createEmptyLesson();
  lesson.title.en = 'T';
  const ex = createEmptyExercise('relative-move');
  ex.moves = [{ dir: 'forward-right', steps: 2 }];
  lesson.exercises.push(ex);
  assert.match(validateLesson(lesson)[0], /Diagonal moves allowed/);
  ex.diagonalMoves = true;
  assert.deepEqual(validateLesson(lesson), []);
});
