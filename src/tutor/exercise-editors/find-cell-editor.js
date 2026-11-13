/**
 * File:        src/tutor/exercise-editors/find-cell-editor.js
 * What it is:  Editor form for a 'find-cell' exercise (Lessons 2, 6 and 9 style).
 * What it does:
 *   Matrix size, the item to find (e.g. apple / আপেল), the target cell,
 *   which cells speak (default: only (1,1)), things kept in cells (optional;
 *   the student presses Space to hear them, Lesson 9 style), and an optional
 *   own question text. If the question is left empty it is generated:
 *   "Find the apple. It is in the cell at row 2, column 2. Move to it and press Enter."
 * Render:      renderFindCellEditor(container, lesson, exercise)
 * Depends on:  tutor/field-builders.js, tutor/exercise-editors/common-fields.js,
 *              lessons/lesson-schema.js
 */

import { bilingualField, cellField } from '../field-builders.js';
import { promptFields, sizeFields, speakingCellsField, contentsField, diagonalField } from './common-fields.js';
import { LIMITS } from '../../lessons/lesson-schema.js';

export function renderFindCellEditor(container, lesson, exercise) {
  container.append(
    sizeFields(exercise),
    bilingualField({ label: 'Item to find', value: exercise.item, onChange: (v) => (exercise.item = v) }),
    cellField({ label: 'Target cell', value: exercise.target, max: LIMITS.maxSize, onChange: (v) => (exercise.target = v) }),
    diagonalField(exercise),
    speakingCellsField(exercise),
    contentsField(exercise),
    promptFields(lesson, exercise, {
      hint: 'Optional if you named the item. Leave empty to use: "Find the <item>. It is in the cell at row R, column C. Move to it and press Enter." Write your own for landmark questions ("Go to the far-right corner…") or hidden items ("Find the cat. Press Space to hear what is in each cell.").',
    }),
  );
}
