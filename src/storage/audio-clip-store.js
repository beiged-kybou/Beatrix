/**
 * File:        src/storage/audio-clip-store.js
 * What it is:  Saves and loads tutor recordings (audio blobs) on this device.
 * What it does:
 *   saveClip(clipKey, lang, blob)   store or replace one recording
 *   getClip(clipKey, lang)          -> { blob, mime } | undefined
 *   deleteClip(clipKey, lang)
 *   listClipsForLesson(lessonId)    every recording that belongs to a lesson
 *   deleteClipsForLesson(lessonId)
 *   clipSource(clipKey, lang)       -> blob URL or null; registered with
 *                                      audio/speech-service.js so recordings
 *                                      play automatically instead of TTS
 *   Clip keys follow the same rule as built-in audio (lesson-schema.js),
 *   e.g. 'c4f9k2m1.e8d0a1b2.prompt'; the part before the first dot is the lesson id.
 * Depends on:  storage/db.js
 */

import { request } from './db.js';

const recordId = (clipKey, lang) => `${lang}:${clipKey}`;
const lessonIdOf = (clipKey) => clipKey.split('.')[0];

/** Blob URLs handed out, so they can be reused and released. */
const urlCache = new Map();

function forget(id) {
  const url = urlCache.get(id);
  if (url) URL.revokeObjectURL(url);
  urlCache.delete(id);
}

export function saveClip(clipKey, lang, blob) {
  const id = recordId(clipKey, lang);
  forget(id);
  return request('clips', 'readwrite', (s) =>
    s.put({ id, clipKey, lang, lessonId: lessonIdOf(clipKey), mime: blob.type, blob, savedAt: new Date().toISOString() }),
  );
}

export function getClip(clipKey, lang) {
  return request('clips', 'readonly', (s) => s.get(recordId(clipKey, lang)));
}

export function deleteClip(clipKey, lang) {
  forget(recordId(clipKey, lang));
  return request('clips', 'readwrite', (s) => s.delete(recordId(clipKey, lang)));
}

export async function listClipsForLesson(lessonId) {
  return (await request('clips', 'readonly', (s) => s.index('byLesson').getAll(lessonId))) ?? [];
}

export async function deleteClipsForLesson(lessonId) {
  for (const clip of await listClipsForLesson(lessonId)) await deleteClip(clip.clipKey, clip.lang);
}

/** Clip source for the speech service: a blob URL if a recording exists. */
export async function clipSource(clipKey, lang) {
  // Tutors only record clips for custom lessons (ids start with 'c'), so skip
  // the database for ui.*, num.* and built-in keys. Keeps cell speech fast.
  if (!/^c[a-z0-9]+$/.test(lessonIdOf(clipKey))) return null;
  const id = recordId(clipKey, lang);
  if (urlCache.has(id)) return urlCache.get(id);
  try {
    const rec = await getClip(clipKey, lang);
    if (!rec) return null;
    const url = URL.createObjectURL(rec.blob);
    urlCache.set(id, url);
    return url;
  } catch {
    return null; // database not available (e.g. private window)
  }
}
