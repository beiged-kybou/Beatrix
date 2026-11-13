/**
 * File:        src/tutor/exercise-editors/choice-editor.js
 * What it is:  Editor form for a 'choice' exercise (Lesson 8 style).
 * What it does:
 *   Question text (required) + voice, 2–4 answer options (English / Bangla),
 *   which option is correct, and an optional practice matrix with its speaking
 *   cells and things kept in cells (Lesson 9 style "What is at (2, 3)?").
 *   The student hears the options with ↑ ↓ and picks with Enter or 1–4.
 * Render:      renderChoiceEditor(container, lesson, exercise)
 * Depends on:  tutor/field-builders.js, tutor/exercise-editors/common-fields.js,
 *              lessons/lesson-schema.js
 */

import { el, button, bilingualField, selectField } from '../field-builders.js';
import { promptFields, exploreFields } from './common-fields.js';
import { LIMITS } from '../../lessons/lesson-schema.js';

export function renderChoiceEditor(container, lesson, exercise) {
  const optionsBox = el('div', 'options');

  const draw = () => {
    optionsBox.replaceChildren(el('h4', '', 'Answer options'));
    exercise.options.forEach((o, i) => {
      const row = el('div', 'row-of-fields option-row');
      const remove = button('Remove', () => {
        exercise.options.splice(i, 1);
        if (exercise.answer >= exercise.options.length) exercise.answer = 0;
        draw();
      }, 'small');
      remove.disabled = exercise.options.length <= LIMITS.minOptions;
      row.append(bilingualField({ label: `Option ${i + 1}`, value: o, onChange: (v) => (exercise.options[i] = v) }), remove);
      optionsBox.append(row);
    });
    if (exercise.options.length < LIMITS.maxOptions) {
      optionsBox.append(button('+ Add option', () => {
        exercise.options.push({ en: '', bn: '' });
        draw();
      }, 'small'));
    }
    optionsBox.append(
      selectField({
        label: 'Correct option',
        value: String(exercise.answer),
        options: exercise.options.map((_, i) => [String(i), `Option ${i + 1}`]),
        onChange: (v) => (exercise.answer = Number(v)),
      }),
    );
  };

  container.append(
    promptFields(lesson, exercise, { required: true, hint: 'Example: "Are (3, 2) and (3, 5) in the same row?" The options are read after the question.' }),
    optionsBox,
    exploreFields(exercise),
  );
  draw();
}
