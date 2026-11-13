/**
 * File:        src/lessons/lesson-loader.js
 * What it is:  Loads the built-in lessons from content/lessons/.
 * What it does:
 *   loadBuiltInSections() reads content/lessons/index.json (sections of lesson
 *   files, in order), fetches each file, checks it with lesson-validator.js and
 *   returns [{ id, title:{en,bn}, lessons:[…] }].
 *   loadBuiltInLessons() returns the same lessons as one flat list.
 *   To add a built-in lesson: put the JSON file in content/lessons/ and add its
 *   name to a section in index.json. No code change needed.
 *   Invalid lessons are skipped, with the reasons printed in the console.
 * Depends on:  lessons/lesson-validator.js
 */

import { validateLesson } from './lesson-validator.js';

const CONTENT_ROOT = new URL('../../content/lessons/', import.meta.url);

let cache = null;

async function loadLesson(file) {
  try {
    const lesson = await (await fetch(new URL(file, CONTENT_ROOT))).json();
    const errors = validateLesson(lesson);
    if (errors.length) {
      console.error(`[lesson-loader] ${file} is invalid and was skipped:\n- ${errors.join('\n- ')}`);
      return null;
    }
    return lesson;
  } catch (err) {
    console.error(`[lesson-loader] could not load ${file}`, err);
    return null;
  }
}

/** @returns {Promise<{id:string, title:{en:string,bn:string}, lessons:object[]}[]>} */
export async function loadBuiltInSections() {
  if (cache) return cache;
  const index = await (await fetch(new URL('index.json', CONTENT_ROOT))).json();
  const sections = [];
  for (const section of index.sections) {
    const lessons = (await Promise.all(section.lessons.map(loadLesson))).filter(Boolean);
    sections.push({ id: section.id, title: section.title, lessons });
  }
  cache = sections;
  return sections;
}

/** @returns {Promise<object[]>} every built-in lesson, in order */
export async function loadBuiltInLessons() {
  return (await loadBuiltInSections()).flatMap((s) => s.lessons);
}
