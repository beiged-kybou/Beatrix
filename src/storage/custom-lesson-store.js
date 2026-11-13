/**
 * File:        src/storage/custom-lesson-store.js
 * What it is:  Saves and loads tutor-made lessons on this device.
 * What it does:
 *   saveLesson(lesson)   insert or replace (also sets updatedAt)
 *   getLesson(id)        one lesson, or undefined
 *   listLessons()        all custom lessons, oldest first
 *   deleteLesson(id)     removes the lesson (its recordings are removed by the caller)
 *   This is the only file that knows lessons live in IndexedDB. To move to a
 *   server later, replace this file and keep the same four functions.
 * Depends on:  storage/db.js
 */

import { request } from './db.js';

export function saveLesson(lesson) {
  const copy = structuredClone(lesson);
  copy.updatedAt = new Date().toISOString();
  return request('lessons', 'readwrite', (s) => s.put(copy));
}

export function getLesson(id) {
  return request('lessons', 'readonly', (s) => s.get(id));
}

export async function listLessons() {
  const all = (await request('lessons', 'readonly', (s) => s.getAll())) ?? [];
  return all.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

export function deleteLesson(id) {
  return request('lessons', 'readwrite', (s) => s.delete(id));
}
