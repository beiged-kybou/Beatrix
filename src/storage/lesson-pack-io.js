/**
 * File:        src/storage/lesson-pack-io.js
 * What it is:  Export and import of custom lessons as files.
 * What it does:
 *   exportLesson(lessonId)  downloads "<title>.6dots.json" with the lesson and
 *                           all its recordings inside (send it by USB, WhatsApp, email)
 *   importLessonFile(file)  reads such a file, checks it, saves it on this device.
 *                           It is always saved as a NEW lesson (new id), so an import
 *                           never overwrites an existing lesson.
 *   The file format itself is defined in storage/lesson-pack-format.js.
 * Depends on:  storage/lesson-pack-format.js, storage/custom-lesson-store.js,
 *              storage/audio-clip-store.js, lessons/lesson-schema.js
 */

import { buildPack, parsePack, renameLesson } from './lesson-pack-format.js';
import { getLesson, saveLesson } from './custom-lesson-store.js';
import { listClipsForLesson, saveClip } from './audio-clip-store.js';
import { newId } from '../lessons/lesson-schema.js';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(data, mime) {
  const bytes = Uint8Array.from(atob(data), (ch) => ch.charCodeAt(0));
  return new Blob([bytes], { type: mime || 'audio/webm' });
}

function safeFileName(text) {
  return (text || 'lesson').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 60) || 'lesson';
}

export async function exportLesson(lessonId) {
  const lesson = await getLesson(lessonId);
  if (!lesson) throw new Error('Lesson not found.');
  const clips = [];
  for (const c of await listClipsForLesson(lessonId)) {
    clips.push({ clipKey: c.clipKey, lang: c.lang, mime: c.mime, data: await blobToBase64(c.blob) });
  }
  const pack = buildPack(lesson, clips);
  const blob = new Blob([JSON.stringify(pack)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${safeFileName(lesson.title.en || lesson.title.bn)}.6dots.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/** @returns {Promise<object>} the saved lesson */
export async function importLessonFile(file) {
  const parsed = parsePack(await file.text());
  const { lesson, clips } = renameLesson(parsed, newId('c'));
  lesson.createdAt = new Date().toISOString();
  await saveLesson(lesson);
  for (const c of clips) await saveClip(c.clipKey, c.lang, base64ToBlob(c.data, c.mime));
  return lesson;
}
