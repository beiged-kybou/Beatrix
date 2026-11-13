/**
 * File:        src/lessons/lesson-schema.js
 * What it is:  ★ THE single definition of the lesson template.
 *              Built-in lessons (content/lessons/*.json) and tutor-made lessons
 *              use exactly this shape, so the student side treats them the same.
 * What it does:
 *   - Lists the exercise types, their labels and limits
 *   - Makes empty lessons / paragraphs / exercises for the tutor editor
 *   - Works out which cells speak in an exercise, and the matrix it shows
 *   - Builds the clip keys that link recordings to text
 *
 * LESSON SHAPE
 * {
 *   id:        'l01' (built-in) | 'c…' (custom)
 *   source:    'builtin' | 'custom'
 *   version:   1
 *   title:     { en, bn }                       one language is enough
 *   intro: {
 *     paragraphs: [ { id:'p01', text:{ en, bn } } ],
 *     explore:    null | { rows, cols, diagonalMoves? }   a practice matrix where every cell speaks
 *   },
 *   exercises: [ EXERCISE ],
 *   createdAt, updatedAt                          ISO date strings (custom lessons)
 * }
 *
 * EXERCISE SHAPES (all have id, type, prompt?: { en, bn })
 *   number-answer      { answer, explore: null | {rows,cols}, speakingCells?, contents? }   prompt required
 *   choice             { options:[{en,bn}] (2–4), answer: option index from 0,
 *                        explore: null | {rows,cols}, speakingCells?, contents? }        prompt required
 *   find-cell          { rows, cols, item:{en,bn}, target:{row,col}, speakingCells, contents? }
 *   matrix-size        { rows, cols, speakingCells }
 *   relative-move      { rows, cols, start: 'random' | {row,col}, moves:[{dir, steps}], speakingCells }
 *   find-own-position  { rows, cols, start: 'random' | {row,col}, speakingCells }
 *
 *   speakingCells: 'default' | 'all' | 'none' | [ {row,col}, … ]
 *   contents:      [ { row, col, item:{en,bn} } ]   things kept in cells; Space says what is here
 *   diagonalMoves: true | false (default false)     may the student take diagonal steps here?
 *                  Any exercise with a matrix can have it; a relative-move whose
 *                  moves include a diagonal must have it.
 *   dir:           'forward' | 'back' | 'left' | 'right' |
 *                  'forward-right' | 'forward-left' | 'back-right' | 'back-left'
 *                  (see matrix/matrix-model.js)
 *   When prompt is empty, the question text is generated from templates
 *   (see lessons/prompt-builder.js).
 *
 * Adding a new exercise type later: add it to EXERCISE_TYPES + createEmptyExercise,
 * then add a checker (lessons/checkers/), a validator rule and an editor form.
 * Depends on:  config/settings.js
 */

import { SETTINGS } from '../config/settings.js';

export const SCHEMA_VERSION = 1;

export const EXERCISE_TYPES = ['number-answer', 'choice', 'find-cell', 'matrix-size', 'relative-move', 'find-own-position'];

/** Labels for the tutor editor. */
export const EXERCISE_TYPE_LABELS = {
  'number-answer': 'Number answer (like Lessons 1 and 7)',
  choice: 'Choose an answer (like Lesson 8)',
  'find-cell': 'Find the cell (like Lessons 2 and 6)',
  'matrix-size': 'How big is the matrix? (like Lesson 3)',
  'relative-move': 'Where am I after moving? (like Lesson 4)',
  'find-own-position': 'Find your own address (like Lesson 5)',
};

/** Types whose matrix is optional (an "explore" practice matrix). */
const EXPLORE_TYPES = new Set(['number-answer', 'choice']);

export const LIMITS = {
  minSize: 1,
  maxSize: SETTINGS.maxMatrixSize,
  maxAnswer: 9999,
  maxMoves: 6,
  minOptions: 2,
  maxOptions: 4,
};

export const SPEAKING_CHOICES = {
  default: 'Default for this exercise type',
  all: 'Every cell speaks',
  none: 'No cell speaks (dots only)',
  custom: 'Only the cells I list',
};

/** Short random id with a prefix, e.g. newId('c') -> 'c4f9k2m1'. */
export function newId(prefix) {
  return prefix + Math.random().toString(36).slice(2, 10);
}

export function createEmptyParagraph() {
  return { id: newId('p'), text: { en: '', bn: '' } };
}

export function createEmptyLesson() {
  const now = new Date().toISOString();
  return {
    id: newId('c'),
    source: 'custom',
    version: SCHEMA_VERSION,
    title: { en: '', bn: '' },
    intro: { paragraphs: [], explore: null },
    exercises: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** A new exercise of the given type, filled with sensible starting values. */
export function createEmptyExercise(type) {
  const base = { id: newId('e'), type, prompt: { en: '', bn: '' } };
  switch (type) {
    case 'number-answer':
      return { ...base, answer: 0, explore: null, speakingCells: 'default', contents: [] };
    case 'choice':
      return {
        ...base,
        options: [{ en: 'Yes', bn: 'হ্যাঁ' }, { en: 'No', bn: 'না' }],
        answer: 0,
        explore: null,
        speakingCells: 'default',
        contents: [],
      };
    case 'find-cell':
      return { ...base, rows: 5, cols: 5, item: { en: '', bn: '' }, target: { row: 1, col: 1 }, speakingCells: 'default', contents: [] };
    case 'matrix-size':
      return { ...base, rows: 3, cols: 3, speakingCells: 'default' };
    case 'relative-move':
      return { ...base, rows: 10, cols: 10, start: 'random', moves: [{ dir: 'right', steps: 1 }], speakingCells: 'default' };
    case 'find-own-position':
      return { ...base, rows: 5, cols: 5, start: 'random', speakingCells: 'default' };
    default:
      throw new Error(`[lesson-schema] unknown exercise type "${type}"`);
  }
}

/** True for types whose matrix is an optional practice matrix. */
export function hasOptionalMatrix(type) {
  return EXPLORE_TYPES.has(type);
}

/** The matrix an exercise shows, or null if it has none. */
export function exerciseMatrixSize(exercise) {
  if (EXPLORE_TYPES.has(exercise.type)) return exercise.explore ? { ...exercise.explore } : null;
  return { rows: exercise.rows, cols: exercise.cols };
}

/**
 * Which cells speak by default (as requested in the lesson descriptions):
 *   number-answer / choice practice matrix: every cell
 *   find-cell:          only (1,1)
 *   matrix-size:        start (1,1), end of row 1 (1,n), end of column 1 (m,1)
 *   relative-move:      none; the student already knows the start cell
 *   find-own-position:  none; the student must work it out by counting
 */
export function defaultSpeakingCells(exercise) {
  switch (exercise.type) {
    case 'number-answer':
    case 'choice':
      return 'all';
    case 'find-cell':
      return [{ row: 1, col: 1 }];
    case 'matrix-size':
      return [{ row: 1, col: 1 }, { row: 1, col: exercise.cols }, { row: exercise.rows, col: 1 }];
    default:
      return [];
  }
}

/**
 * Turn an exercise's speakingCells setting into what the announcer needs.
 * @returns {'all' | Set<string>} 'all' or a Set of "row,col"
 */
export function resolveSpeakingCells(exercise) {
  let choice = exercise.speakingCells ?? 'default';
  if (choice === 'default') choice = defaultSpeakingCells(exercise);
  if (choice === 'all') return 'all';
  if (choice === 'none') return new Set();
  return new Set(choice.map((c) => `${c.row},${c.col}`));
}

/* ---------- Clip keys: link recordings to text (see audio-scripts/README.md) ---------- */

export function clipKeyForTitle(lesson) {
  return `${lesson.id}.title`;
}

export function clipKeyForParagraph(lesson, paragraph) {
  return `${lesson.id}.intro.${paragraph.id}`;
}

export function clipKeyForPrompt(lesson, exercise) {
  return `${lesson.id}.${exercise.id}.prompt`;
}

/** Option n (counting from 1) of a choice exercise. */
export function clipKeyForOption(lesson, exercise, n) {
  return `${lesson.id}.${exercise.id}.opt${n}`;
}

/** A section of the lesson list ("Basics"…), from content/lessons/index.json. */
export function clipKeyForSection(section) {
  return `section.${section.id}`;
}

/**
 * A thing kept in a cell, keyed by its English name: { en:'mango' } -> 'item.mango'.
 * A plain number reuses the number clips: { en:'12' } -> 'num.12'. Null without English.
 */
export function clipKeyForItem(item) {
  const en = (item?.en ?? '').trim();
  if (/^\d+$/.test(en)) return `num.${Number(en)}`;
  const slug = (item?.en ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return slug ? `item.${slug}` : null;
}
