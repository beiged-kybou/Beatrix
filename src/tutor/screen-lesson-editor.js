/**
 * File:        src/tutor/screen-lesson-editor.js
 * What it is:  The tutor's lesson editor (for sighted teachers, decision C8).
 * What it does:
 *   Edits one lesson using the same template as the built-in lessons:
 *     - title (+ voice)
 *     - introduction paragraphs (+ voice), optional practice matrix
 *     - exercises: add / remove / move up / move down; each opens the editor
 *       form for its type (tutor/exercise-editors/*)
 *   Save checks the lesson with lessons/lesson-validator.js and lists any
 *   problems; nothing invalid is saved. "Preview" runs the lesson exactly as a
 *   student would see it. The editor works on a copy until Save is pressed.
 *   Voice recordings are saved as soon as they are made (not undone by Cancel).
 * Mount:       mountLessonEditor(root, { lesson, isNew, onDone, onPreview })
 * Depends on:  lessons/lesson-schema.js, lessons/lesson-validator.js,
 *              storage/custom-lesson-store.js, storage/audio-clip-store.js,
 *              tutor/field-builders.js, tutor/audio-recorder.js, tutor/exercise-editors/*
 */

import {
  EXERCISE_TYPES, EXERCISE_TYPE_LABELS, LIMITS,
  createEmptyExercise, createEmptyParagraph, clipKeyForTitle, clipKeyForParagraph,
} from '../lessons/lesson-schema.js';
import { validateLesson } from '../lessons/lesson-validator.js';
import { saveLesson } from '../storage/custom-lesson-store.js';
import { deleteClipsForLesson } from '../storage/audio-clip-store.js';
import { el, button, group, bilingualField, numberField, selectField, checkboxField } from './field-builders.js';
import { recorderPair } from './audio-recorder.js';
import { diagonalField } from './exercise-editors/common-fields.js';
import { renderNumberAnswerEditor } from './exercise-editors/number-answer-editor.js';
import { renderFindCellEditor } from './exercise-editors/find-cell-editor.js';
import { renderMatrixSizeEditor } from './exercise-editors/matrix-size-editor.js';
import { renderRelativeMoveEditor } from './exercise-editors/relative-move-editor.js';
import { renderChoiceEditor } from './exercise-editors/choice-editor.js';
import { renderFindOwnPositionEditor } from './exercise-editors/find-own-position-editor.js';

const EDITORS = {
  'number-answer': renderNumberAnswerEditor,
  choice: renderChoiceEditor,
  'find-cell': renderFindCellEditor,
  'matrix-size': renderMatrixSizeEditor,
  'relative-move': renderRelativeMoveEditor,
  'find-own-position': renderFindOwnPositionEditor,
};

const text = (bi) => bi?.en?.trim() || bi?.bn?.trim() || '';

/** One-line description of an exercise for its header. */
function summaryOf(ex) {
  switch (ex.type) {
    case 'number-answer':
      return `${text(ex.prompt) || '(no question yet)'} → ${ex.answer}`;
    case 'choice':
      return `${text(ex.prompt) || '(no question yet)'} → option ${ex.answer + 1}`;
    case 'find-cell':
      return `${ex.rows} × ${ex.cols}, find "${text(ex.item) || text(ex.prompt) || '?'}" at (${ex.target.row}, ${ex.target.col})`;
    case 'find-own-position':
      return `${ex.rows} × ${ex.cols}, start ${ex.start === 'random' ? 'random' : `(${ex.start.row}, ${ex.start.col})`}`;
    case 'matrix-size':
      return `${ex.rows} × ${ex.cols}`;
    case 'relative-move':
      return `${ex.rows} × ${ex.cols}, start ${ex.start === 'random' ? 'random' : `(${ex.start.row}, ${ex.start.col})`}, ${ex.moves.map((m) => `${m.dir} ${m.steps}`).join(', ')}`;
    default:
      return ex.type;
  }
}

/**
 * @param {HTMLElement} root
 * @param {{ lesson:object, isNew:boolean, onDone:() => void, onPreview:(draft:object) => void }} p
 */
export function mountLessonEditor(root, { lesson, isNew, onDone, onPreview }) {
  const draft = lesson; // the caller passes a copy; Save stores it
  const openIds = new Set(); // which exercise panels are open

  const screen = el('section', 'screen tutor editor');
  root.append(screen);

  function render() {
    screen.replaceChildren();
    screen.append(el('h1', '', isNew ? 'New lesson' : 'Edit lesson'));

    // --- Title ---
    screen.append(
      group(
        'Title',
        bilingualField({ label: 'Lesson title', value: draft.title, required: true, onChange: (v) => (draft.title = v) }),
        recorderPair(clipKeyForTitle(draft), 'Title'),
      ),
    );

    // --- Introduction ---
    const intro = group('Introduction (read with the arrow keys before the exercises)');
    draft.intro.paragraphs.forEach((p, i) => {
      const box = el('div', 'item-box');
      box.append(
        el('h4', '', `Paragraph ${i + 1}`),
        bilingualField({ label: 'Text', value: p.text, multiline: true, onChange: (v) => (p.text = v) }),
        recorderPair(clipKeyForParagraph(draft, p), 'Paragraph'),
        itemButtons(draft.intro.paragraphs, i),
      );
      intro.append(box);
    });
    intro.append(button('+ Add paragraph', () => {
      draft.intro.paragraphs.push(createEmptyParagraph());
      render();
    }));
    const exploreBox = el('div', 'row-of-fields');
    if (draft.intro.explore) {
      exploreBox.append(
        numberField({ label: 'Practice rows', value: draft.intro.explore.rows, min: 1, max: LIMITS.maxSize, onChange: (v) => (draft.intro.explore.rows = v) }),
        numberField({ label: 'Practice columns', value: draft.intro.explore.cols, min: 1, max: LIMITS.maxSize, onChange: (v) => (draft.intro.explore.cols = v) }),
        diagonalField(draft.intro.explore),
      );
    }
    intro.append(
      checkboxField({
        label: 'Add a practice matrix to the introduction (every cell speaks)',
        checked: !!draft.intro.explore,
        onChange: (on) => {
          draft.intro.explore = on ? { rows: 3, cols: 3 } : null;
          render();
        },
      }),
      exploreBox,
    );
    screen.append(intro);

    // --- Exercises ---
    const exGroup = group('Exercises');
    draft.exercises.forEach((ex, i) => {
      const details = el('details', 'item-box exercise');
      details.open = openIds.has(ex.id);
      details.addEventListener('toggle', () => (details.open ? openIds.add(ex.id) : openIds.delete(ex.id)));
      const summary = el('summary', '', `${i + 1}. ${EXERCISE_TYPE_LABELS[ex.type]}: ${summaryOf(ex)}`);
      const body = el('div', 'exercise-body');
      EDITORS[ex.type](body, draft, ex);
      body.append(itemButtons(draft.exercises, i));
      details.append(summary, body);
      exGroup.append(details);
    });
    let newType = EXERCISE_TYPES[0];
    const addRow = el('div', 'row-of-fields add-exercise');
    addRow.append(
      selectField({ label: 'New exercise type', value: newType, options: EXERCISE_TYPES.map((tp) => [tp, EXERCISE_TYPE_LABELS[tp]]), onChange: (v) => (newType = v) }),
      button('+ Add exercise', () => {
        const ex = createEmptyExercise(newType);
        draft.exercises.push(ex);
        openIds.add(ex.id);
        render();
      }),
    );
    exGroup.append(addRow);
    screen.append(exGroup);

    // --- Errors and actions ---
    const errorsBox = el('div', 'errors');
    errorsBox.setAttribute('role', 'alert');
    const actions = el('div', 'actions');
    actions.append(
      button('Save', () => save(errorsBox, false), 'primary'),
      button('Save and preview', () => save(errorsBox, true)),
      button('Preview without saving', () => {
        const errors = validateLesson(draft);
        if (errors.length) showErrors(errorsBox, errors);
        else onPreview(draft);
      }),
      button('Cancel', cancel),
    );
    screen.append(errorsBox, actions);
  }

  /** Move up / move down / remove buttons for an item in a list. */
  function itemButtons(list, i) {
    const row = el('div', 'item-buttons');
    const up = button('↑ Move up', () => { [list[i - 1], list[i]] = [list[i], list[i - 1]]; render(); }, 'small');
    const down = button('↓ Move down', () => { [list[i + 1], list[i]] = [list[i], list[i + 1]]; render(); }, 'small');
    up.disabled = i === 0;
    down.disabled = i === list.length - 1;
    row.append(up, down, button('Remove', () => {
      if (confirm('Remove this item?')) {
        list.splice(i, 1);
        render();
      }
    }, 'small danger'));
    return row;
  }

  function showErrors(box, errors) {
    box.replaceChildren(el('p', '', 'Please fix these before saving:'));
    const ul = el('ul');
    for (const e of errors) ul.append(el('li', '', e));
    box.append(ul);
    box.scrollIntoView({ block: 'center' });
  }

  async function save(errorsBox, thenPreview) {
    const errors = validateLesson(draft);
    if (errors.length) {
      showErrors(errorsBox, errors);
      return;
    }
    await saveLesson(draft);
    isNew = false;
    if (thenPreview) onPreview(draft);
    else onDone();
  }

  async function cancel() {
    if (!confirm('Leave without saving? Unsaved changes are lost (voice recordings are kept).')) return;
    if (isNew) await deleteClipsForLesson(draft.id); // nothing saved: drop its recordings too
    onDone();
  }

  render();
}
