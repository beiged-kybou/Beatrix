/**
 * File:        src/lessons/lesson-catalog.js
 * What it is:  The list of lessons a student can open.
 * What it does:
 *   getCatalog() -> { sections: [{ id, title, lessons }], custom: [...] }
 *   Built-in lessons come from content/lessons/ in their sections
 *   ("Basics", "Finding your way", …); custom lessons come from this device's
 *   tutor store and are shown as the last section, "Teacher's lessons".
 *   Custom lessons that fail validation are left out (with a console warning).
 * Depends on:  lessons/lesson-loader.js, storage/custom-lesson-store.js,
 *              lessons/lesson-validator.js
 */

import { loadBuiltInSections } from './lesson-loader.js';
import { listLessons } from '../storage/custom-lesson-store.js';
import { validateLesson } from './lesson-validator.js';

export async function getCatalog() {
  const sections = await loadBuiltInSections();
  let custom = [];
  try {
    custom = (await listLessons()).filter((lesson) => {
      const errors = validateLesson(lesson);
      if (errors.length) console.warn(`[lesson-catalog] custom lesson ${lesson.id} hidden:`, errors);
      return errors.length === 0;
    });
  } catch (err) {
    console.warn('[lesson-catalog] custom lessons unavailable (database blocked?)', err);
  }
  return { sections, custom };
}
