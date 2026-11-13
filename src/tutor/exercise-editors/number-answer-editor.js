/**
 * File:        src/tutor/exercise-editors/number-answer-editor.js
 * What it is:  Editor form for a 'number-answer' exercise (Lessons 1 and 7 style).
 * What it does:
 *   Question text (required) + voice, the correct number, and an optional
 *   practice matrix the student can explore, with its speaking cells
 *   (default: every cell) and things kept in cells (Lesson 9 style counting).
 * Render:      renderNumberAnswerEditor(container, lesson, exercise)
 * Depends on:  tutor/field-builders.js, tutor/exercise-editors/common-fields.js,
 *              lessons/lesson-schema.js
 */

import { numberField } from '../field-builders.js';
import { promptFields, exploreFields } from './common-fields.js';
import { LIMITS } from '../../lessons/lesson-schema.js';

export function renderNumberAnswerEditor(container, lesson, exercise) {
  container.append(
    promptFields(lesson, exercise, { required: true, hint: 'Example: "How many cells does a 3 × 3 matrix have? Type the number and press Enter."' }),
    numberField({ label: 'Correct answer', value: exercise.answer, min: 0, max: LIMITS.maxAnswer, onChange: (v) => (exercise.answer = v) }),
    exploreFields(exercise),
  );
}
