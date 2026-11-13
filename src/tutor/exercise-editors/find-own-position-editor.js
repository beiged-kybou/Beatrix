/**
 * File:        src/tutor/exercise-editors/find-own-position-editor.js
 * What it is:  Editor form for a 'find-own-position' exercise (Lesson 5 style).
 * What it does:
 *   Matrix size, the hidden start cell (random or fixed), which cells speak
 *   (default: none), and an optional own question text. The student walks to
 *   the edges, counts, and types the row and column of the start cell.
 * Render:      renderFindOwnPositionEditor(container, lesson, exercise)
 * Depends on:  tutor/field-builders.js, tutor/exercise-editors/common-fields.js,
 *              lessons/lesson-schema.js
 */

import { el, selectField, cellField } from '../field-builders.js';
import { promptFields, sizeFields, speakingCellsField, diagonalField } from './common-fields.js';
import { LIMITS } from '../../lessons/lesson-schema.js';

export function renderFindOwnPositionEditor(container, lesson, exercise) {
  const fixedBox = el('div');
  const drawFixed = () => {
    fixedBox.replaceChildren();
    if (exercise.start === 'random') return;
    fixedBox.append(cellField({ label: 'Start cell', value: exercise.start, max: LIMITS.maxSize, onChange: (v) => (exercise.start = v) }));
  };

  container.append(
    sizeFields(exercise),
    selectField({
      label: 'Hidden start cell',
      value: exercise.start === 'random' ? 'random' : 'fixed',
      options: [['random', 'Random (different each time, never (1, 1))'], ['fixed', 'Fixed cell']],
      onChange: (v) => {
        exercise.start = v === 'random' ? 'random' : { row: 2, col: 2 };
        drawFixed();
      },
    }),
    fixedBox,
    diagonalField(exercise),
    speakingCellsField(exercise),
    promptFields(lesson, exercise, { hint: 'Optional. Leave empty to use the standard "You are somewhere in a … matrix. Find the cell where you started." question.' }),
  );
  drawFixed();
}
