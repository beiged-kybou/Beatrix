/**
 * File:        src/tutor/lesson-preview.js
 * What it is:  Runs a lesson for the tutor exactly as a student would see it.
 * What it does:
 *   mountPreview(root, { lesson, onBack }) shows the normal student lesson
 *   screen with a "Back to editor" button. Progress is not recorded in preview.
 *   Alt+M (or finishing the lesson) also returns to the editor.
 * Depends on:  ui/screen-lesson.js
 */

import { mountLesson } from '../ui/screen-lesson.js';

export function mountPreview(root, { lesson, onBack }) {
  return mountLesson(root, { lesson, onExit: onBack, preview: true });
}
