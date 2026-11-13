/**
 * File:        src/tutor/exercise-editors/matrix-size-editor.js
 * What it is:  Editor form for a 'matrix-size' exercise (Lesson 3 style).
 * What it does:
 *   Matrix size, which cells speak (default: start, end of row 1, end of
 *   column 1), and an optional own question text.
 * Render:      renderMatrixSizeEditor(container, lesson, exercise)
 * Depends on:  tutor/exercise-editors/common-fields.js
 */

import { promptFields, sizeFields, speakingCellsField, diagonalField } from './common-fields.js';

export function renderMatrixSizeEditor(container, lesson, exercise) {
  container.append(
    sizeFields(exercise),
    diagonalField(exercise),
    speakingCellsField(exercise),
    promptFields(lesson, exercise, { hint: 'Optional. Leave empty to use the standard "How big is this matrix?" question.' }),
  );
}
