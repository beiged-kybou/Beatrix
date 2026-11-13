/**
 * File:        src/tutor/exercise-editors/common-fields.js
 * What it is:  Form parts shared by several exercise editors.
 * What it does:
 *   promptFields(lesson, exercise, { required, hint })  question text + voice recorders
 *   sizeFields(exercise, onChange)                      rows × columns (1..15)
 *   speakingCellsField(exercise, onChange)              which cells speak (decision C10)
 *   exploreFields(exercise)                             optional practice matrix, with its
 *                                                       speaking cells and things in cells
 *   contentsField(exercise)                             things kept in cells (Space says them)
 *   diagonalField(target)                               "Diagonal moves allowed" checkbox
 *                                                       (target = an exercise or intro.explore)
 *   Each function returns an element and writes changes straight into `exercise`.
 * Depends on:  tutor/field-builders.js, tutor/audio-recorder.js, lessons/lesson-schema.js
 */

import { el, button, bilingualField, numberField, selectField, checkboxField } from '../field-builders.js';
import { recorderPair } from '../audio-recorder.js';
import { LIMITS, SPEAKING_CHOICES, clipKeyForPrompt } from '../../lessons/lesson-schema.js';

export function promptFields(lesson, exercise, { required = false, hint = '' } = {}) {
  const wrap = el('div', 'prompt-fields');
  wrap.append(
    bilingualField({
      label: 'Question text',
      value: exercise.prompt,
      multiline: true,
      required,
      onChange: (v) => (exercise.prompt = v),
    }),
  );
  if (hint) wrap.append(el('p', 'help', hint));
  wrap.append(recorderPair(clipKeyForPrompt(lesson, exercise), 'Question'));
  return wrap;
}

export function sizeFields(exercise, onChange = () => {}) {
  const wrap = el('div', 'row-of-fields');
  wrap.append(
    numberField({ label: 'Rows (m)', value: exercise.rows, min: LIMITS.minSize, max: LIMITS.maxSize, onChange: (v) => { exercise.rows = v; onChange(); } }),
    numberField({ label: 'Columns (n)', value: exercise.cols, min: LIMITS.minSize, max: LIMITS.maxSize, onChange: (v) => { exercise.cols = v; onChange(); } }),
  );
  return wrap;
}

/** "2,3; 4,1" -> [{row:2,col:3},{row:4,col:1}] (ignores anything unreadable) */
function parseCellList(text) {
  return text
    .split(/[;\n]+/)
    .map((p) => p.match(/(\d+)\s*[, ]\s*(\d+)/))
    .filter(Boolean)
    .map((m) => ({ row: Number(m[1]), col: Number(m[2]) }));
}

/**
 * Things kept in cells: a list of (row, column, name in English / Bangla).
 * The student presses Space on a cell to hear what is there.
 */
export function contentsField(exercise) {
  if (!Array.isArray(exercise.contents)) exercise.contents = [];
  const wrap = el('div', 'contents-field');
  const draw = () => {
    wrap.replaceChildren(el('h4', '', 'Things in cells (the student presses Space to hear them)'));
    exercise.contents.forEach((c, i) => {
      const row = el('div', 'row-of-fields content-row');
      row.append(
        numberField({ label: 'Row', value: c.row, min: 1, max: LIMITS.maxSize, onChange: (v) => (c.row = v) }),
        numberField({ label: 'Column', value: c.col, min: 1, max: LIMITS.maxSize, onChange: (v) => (c.col = v) }),
        bilingualField({ label: 'Name', value: c.item, onChange: (v) => (c.item = v) }),
        button('Remove', () => {
          exercise.contents.splice(i, 1);
          draw();
        }, 'small'),
      );
      wrap.append(row);
    });
    wrap.append(button('+ Add a thing', () => {
      exercise.contents.push({ row: 1, col: 1, item: { en: '', bn: '' } });
      draw();
    }, 'small'));
  };
  draw();
  return wrap;
}

/** "Diagonal moves allowed" (E/Q/C/Z, numpad 9/7/3/1). Off by default. */
export function diagonalField(target, onChange = () => {}) {
  return checkboxField({
    label: 'Diagonal moves allowed (E Q C Z, or number pad 9 7 3 1)',
    checked: !!target.diagonalMoves,
    onChange: (on) => {
      target.diagonalMoves = on;
      onChange();
    },
  });
}

/** Optional practice matrix (number-answer, choice) with its speaking cells and contents. */
export function exploreFields(exercise) {
  const box = el('div');
  const draw = () => {
    box.replaceChildren();
    if (!exercise.explore) return;
    box.append(
      el('div', 'row-of-fields'),
      diagonalField(exercise),
      speakingCellsField(exercise),
      contentsField(exercise),
    );
    box.firstChild.append(
      numberField({ label: 'Practice rows', value: exercise.explore.rows, min: 1, max: LIMITS.maxSize, onChange: (v) => (exercise.explore.rows = v) }),
      numberField({ label: 'Practice columns', value: exercise.explore.cols, min: 1, max: LIMITS.maxSize, onChange: (v) => (exercise.explore.cols = v) }),
    );
  };
  const wrap = el('div');
  wrap.append(
    checkboxField({
      label: 'Show a practice matrix the student can explore',
      checked: !!exercise.explore,
      onChange: (on) => {
        exercise.explore = on ? { rows: 3, cols: 3 } : null;
        if (!on) exercise.contents = [];
        draw();
      },
    }),
    box,
  );
  draw();
  return wrap;
}

export function speakingCellsField(exercise) {
  const wrap = el('div', 'speaking-cells');
  const current = Array.isArray(exercise.speakingCells) ? 'custom' : exercise.speakingCells ?? 'default';

  const list = el('textarea');
  list.rows = 2;
  list.placeholder = 'e.g. 1,1; 3,4';
  list.value = Array.isArray(exercise.speakingCells) ? exercise.speakingCells.map((c) => `${c.row},${c.col}`).join('; ') : '';
  list.addEventListener('input', () => (exercise.speakingCells = parseCellList(list.value)));
  const listWrap = el('div', 'field');
  const listLabel = el('label', '', 'Speaking cells as row,column; separate cells with ;');
  list.id = `sc-${exercise.id}`;
  listLabel.htmlFor = list.id;
  listWrap.append(listLabel, list);
  listWrap.hidden = current !== 'custom';

  wrap.append(
    selectField({
      label: 'Which cells say their row and column?',
      value: current,
      options: Object.entries(SPEAKING_CHOICES),
      onChange: (v) => {
        listWrap.hidden = v !== 'custom';
        exercise.speakingCells = v === 'custom' ? parseCellList(list.value) : v;
      },
    }),
    listWrap,
  );
  return wrap;
}
