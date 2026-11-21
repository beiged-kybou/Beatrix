/**
 * File:        src/main.js
 * What it is:  The starting point of the app. Loaded by index.html.
 * What it does:
 *   1. Loads the language strings and the audio manifest.
 *   2. Plugs the recording sources into the speech service
 *      (tutor recordings first, then built-in files, then TTS as fallback).
 *   3. Starts the keyboard router, the status line, the tutor password gate
 *      and the mode manager.
 *   4. Defines the "routes" (which screen opens when) and shows the home screen.
 *   This is the only file that knows about every screen; the screens get
 *   callbacks instead of importing each other.
 * Depends on:  almost every module (by design: it wires them together)
 */

import { loadStrings, t } from './i18n/language.js';
import { loadPov } from './config/pov.js';
import { loadManifest, builtInClipUrl } from './audio/audio-manifest.js';
import { registerClipSource } from './audio/speech-service.js';
import { clipSource as tutorClipSource } from './storage/audio-clip-store.js';
import { getLesson } from './storage/custom-lesson-store.js';
import { startKeyboardRouter } from './input/keyboard-router.js';
import { startLiveRegion } from './ui/live-region.js';
import { startTutorGate } from './modes/tutor-gate.js';
import { initModeManager } from './modes/mode-manager.js';
import { initScreenManager, showScreen } from './ui/screen-manager.js';
import { mountHome } from './ui/screen-home.js';
import { mountLesson } from './ui/screen-lesson.js';
import { mountTutorHome } from './tutor/screen-tutor-home.js';
import { mountLessonEditor } from './tutor/screen-lesson-editor.js';
import { mountPreview } from './tutor/lesson-preview.js';
import { on } from './core/event-bus.js';

/* ---------- Routes ---------- */

function goHome() {
  showScreen(mountHome, { onOpenLesson: openLesson });
}

function openLesson(lesson) {
  showScreen(mountLesson, { lesson, onExit: goHome });
}

function goTutorHome() {
  showScreen(mountTutorHome, {
    onEdit: openEditor,
    onPreview: (lesson) => showScreen(mountPreview, { lesson, onBack: goTutorHome }),
  });
}

function openEditor(lesson, isNew) {
  showScreen(mountLessonEditor, {
    lesson,
    isNew,
    onDone: goTutorHome,
    onPreview: (draft) =>
      showScreen(mountPreview, {
        lesson: draft,
        onBack: async () => openEditor(draft, !(await getLesson(draft.id).catch(() => null))),
      }),
  });
}

/* ---------- Start ---------- */

function updateHeader() {
  document.getElementById('app-title').textContent = t('screen.app_title');
  document.title = t('screen.app_title');
  document.getElementById('status-label').textContent = t('screen.status');
}

async function start() {
  loadPov(); // matrix view: reader's (default) or screen, remembered on this device
  await Promise.all([loadStrings(), loadManifest()]);

  registerClipSource(tutorClipSource);
  registerClipSource(builtInClipUrl);

  startLiveRegion(document.getElementById('status'));
  startKeyboardRouter();
  startTutorGate();
  initModeManager({ onStudent: goHome, onTutor: goTutorHome });
  initScreenManager(document.getElementById('app'));

  updateHeader();
  on('state:changed', ({ key }) => key === 'language' && updateHeader());

  goHome();
}

start().catch((err) => {
  console.error('[main] the app could not start', err);
  document.getElementById('app').textContent =
    'The app could not start. Open it through a local web server (see README.md), not by double-clicking index.html.';
});
