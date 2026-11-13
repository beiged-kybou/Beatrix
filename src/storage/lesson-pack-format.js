/**
 * File:        src/storage/lesson-pack-format.js
 * What it is:  The file format used to share a custom lesson between devices.
 * What it does:
 *   buildPack(lesson, clips)   -> pack object (clips already base64 encoded)
 *   parsePack(json)            -> { lesson, clips } or throws a readable Error
 *   renameLesson(pack, newId)  -> same pack with a new lesson id, clip keys updated
 *   Pure logic, no browser APIs: unit tested in tests/lesson-pack-io.test.js.
 *   File reading/writing and base64 conversion live in storage/lesson-pack-io.js.
 *
 * PACK FORMAT (a .6dots.json file)
 * {
 *   format: '6dots-lesson-pack', formatVersion: 1, exportedAt,
 *   lesson: { …lesson as in lessons/lesson-schema.js… },
 *   clips:  [ { clipKey, lang, mime, data /* base64 *\/ } ]
 * }
 * Depends on:  lessons/lesson-validator.js
 */

import { validateLesson } from '../lessons/lesson-validator.js';

export const PACK_FORMAT = '6dots-lesson-pack';
export const PACK_VERSION = 1;

/**
 * @param {object} lesson
 * @param {{clipKey:string, lang:string, mime:string, data:string}[]} clips
 */
export function buildPack(lesson, clips) {
  return {
    format: PACK_FORMAT,
    formatVersion: PACK_VERSION,
    exportedAt: new Date().toISOString(),
    lesson,
    clips,
  };
}

/** Read and check a pack. Throws an Error with a tutor-friendly message. */
export function parsePack(json) {
  let pack;
  try {
    pack = typeof json === 'string' ? JSON.parse(json) : json;
  } catch {
    throw new Error('This file is not a 6DotsLab lesson pack (it is not valid JSON).');
  }
  if (pack?.format !== PACK_FORMAT) throw new Error('This file is not a 6DotsLab lesson pack.');
  if (pack.formatVersion > PACK_VERSION) throw new Error('This lesson pack was made by a newer version of 6DotsLab. Please update the app.');
  const errors = validateLesson(pack.lesson);
  if (errors.length) throw new Error(`The lesson in this pack has problems:\n- ${errors.join('\n- ')}`);
  const clips = Array.isArray(pack.clips) ? pack.clips.filter((c) => c?.clipKey && c?.lang && c?.data) : [];
  return { lesson: pack.lesson, clips };
}

/** Give the lesson a new id (e.g. when importing a copy) and fix every clip key to match. */
export function renameLesson({ lesson, clips }, newId) {
  const oldId = lesson.id;
  const fix = (key) => (key.startsWith(`${oldId}.`) ? newId + key.slice(oldId.length) : key);
  return {
    lesson: { ...structuredClone(lesson), id: newId, source: 'custom' },
    clips: clips.map((c) => ({ ...c, clipKey: fix(c.clipKey) })),
  };
}
