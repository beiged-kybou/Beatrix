/**
 * File:        src/storage/progress-store.js
 * What it is:  Remembers which lessons a student has finished, on this device only
 *              (decision C7: no accounts).
 * What it does:
 *   markFinished(lessonId)
 *   isFinished(lessonId) -> boolean
 *   Uses localStorage; if the browser blocks it, progress is simply not saved.
 * Depends on:  nothing.
 */

const KEY = '6dots.finishedLessons';

function read() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

export function markFinished(lessonId) {
  const set = read();
  set.add(lessonId);
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch { /* storage blocked: ignore */ }
}

export function isFinished(lessonId) {
  return read().has(lessonId);
}
