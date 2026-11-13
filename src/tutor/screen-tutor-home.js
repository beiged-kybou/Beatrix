/**
 * File:        src/tutor/screen-tutor-home.js
 * What it is:  The tutor mode home screen.
 * What it does:
 *   - Lists the teacher's lessons on this device, with Edit / Preview /
 *     Duplicate / Export / Delete for each
 *   - New lesson, Import a lesson pack (.6dots.json)
 *   - Duplicate a built-in lesson into an editable copy (built-ins stay read-only, B8-a)
 *   - "Back to student mode"
 * Mount:       mountTutorHome(root, { onEdit(lesson, isNew), onPreview(lesson) })
 * Depends on:  lessons/lesson-loader.js, lessons/lesson-schema.js,
 *              storage/custom-lesson-store.js, storage/audio-clip-store.js,
 *              storage/lesson-pack-io.js, storage/lesson-pack-format.js,
 *              tutor/field-builders.js, core/event-bus.js
 */

import { loadBuiltInLessons } from '../lessons/lesson-loader.js';
import { createEmptyLesson, newId } from '../lessons/lesson-schema.js';
import { listLessons, saveLesson, deleteLesson } from '../storage/custom-lesson-store.js';
import { listClipsForLesson, saveClip, deleteClipsForLesson } from '../storage/audio-clip-store.js';
import { exportLesson, importLessonFile } from '../storage/lesson-pack-io.js';
import { renameLesson } from '../storage/lesson-pack-format.js';
import { el, button, selectField } from './field-builders.js';
import { emit } from '../core/event-bus.js';

const titleOf = (lesson) => [lesson.title.en, lesson.title.bn].filter((s) => s?.trim()).join(' / ') || '(untitled)';

export async function mountTutorHome(root, { onEdit, onPreview }) {
  const screen = el('section', 'screen tutor tutor-home');
  root.append(screen);
  const builtIns = await loadBuiltInLessons();
  const status = el('p', 'status-message');
  status.setAttribute('role', 'status');

  async function render(message = '') {
    let lessons = [];
    try {
      lessons = await listLessons();
    } catch {
      message = 'This browser is blocking storage (private window?). Lessons cannot be saved here.';
    }
    screen.replaceChildren();

    const head = el('div', 'tutor-head');
    head.append(
      el('h1', '', 'Tutor mode'),
      button('← Back to student mode', () => emit('mode:request', { mode: 'student' })),
    );
    status.textContent = message;
    screen.append(head, status);

    // Create / import / duplicate built-in
    const tools = el('div', 'tools');
    let builtInId = builtIns[0]?.id ?? '';
    const fileInput = el('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';
    fileInput.hidden = true;
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      fileInput.value = '';
      if (!file) return;
      try {
        const lesson = await importLessonFile(file);
        render(`Imported "${titleOf(lesson)}".`);
      } catch (err) {
        render(`Import failed: ${err.message}`);
      }
    });
    tools.append(
      button('+ New lesson', () => onEdit(createEmptyLesson(), true), 'primary'),
      button('⤓ Import lesson pack', () => fileInput.click()),
      fileInput,
      selectField({
        label: 'Built-in lesson',
        value: builtInId,
        options: builtIns.map((l) => [l.id, titleOf(l)]),
        onChange: (v) => (builtInId = v),
      }),
      button('Duplicate to edit', async () => {
        const source = builtIns.find((l) => l.id === builtInId);
        if (!source) return;
        const copy = renameLesson({ lesson: source, clips: [] }, newId('c')).lesson;
        copy.title = { en: source.title.en ? `Copy of ${source.title.en}` : '', bn: source.title.bn ? `${source.title.bn} (কপি)` : '' };
        copy.createdAt = new Date().toISOString();
        await saveLesson(copy);
        render(`Made an editable copy of "${titleOf(source)}". Recorded voice files of built-in lessons are not copied.`);
      }),
    );
    screen.append(tools);

    // Teacher's lessons
    screen.append(el('h2', '', "Teacher's lessons on this device"));
    if (!lessons.length) {
      screen.append(el('p', 'empty', 'No lessons yet. Press "New lesson" or duplicate a built-in lesson.'));
      return;
    }
    const table = el('table', 'lesson-table');
    const headRow = el('tr');
    for (const h of ['Title', 'Exercises', 'Last changed', 'Actions']) headRow.append(el('th', '', h));
    table.append(headRow);
    for (const lesson of lessons) {
      const tr = el('tr');
      const actions = el('td', 'row-actions');
      actions.append(
        button('Edit', () => onEdit(structuredClone(lesson), false), 'small'),
        button('Preview', () => onPreview(lesson), 'small'),
        button('Duplicate', () => duplicate(lesson), 'small'),
        button('Export', async () => {
          await exportLesson(lesson.id);
          render(`Exported "${titleOf(lesson)}". Send the downloaded .6dots.json file to the other device and use Import there.`);
        }, 'small'),
        button('Delete', async () => {
          if (!confirm(`Delete "${titleOf(lesson)}" and its recordings from this device? This cannot be undone.`)) return;
          await deleteLesson(lesson.id);
          await deleteClipsForLesson(lesson.id);
          render(`Deleted "${titleOf(lesson)}".`);
        }, 'small danger'),
      );
      tr.append(
        el('td', '', titleOf(lesson)),
        el('td', '', String(lesson.exercises.length)),
        el('td', '', new Date(lesson.updatedAt).toLocaleString()),
        actions,
      );
      table.append(tr);
    }
    screen.append(table);
  }

  async function duplicate(lesson) {
    const clips = await listClipsForLesson(lesson.id);
    const renamed = renameLesson({ lesson, clips }, newId('c'));
    renamed.lesson.title = { en: lesson.title.en ? `Copy of ${lesson.title.en}` : '', bn: lesson.title.bn ? `${lesson.title.bn} (কপি)` : '' };
    renamed.lesson.createdAt = new Date().toISOString();
    await saveLesson(renamed.lesson);
    for (const c of renamed.clips) await saveClip(c.clipKey, c.lang, c.blob);
    render(`Duplicated "${titleOf(lesson)}".`);
  }

  await render();
}
