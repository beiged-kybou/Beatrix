/**
 * File:        src/tutor/audio-recorder.js
 * What it is:  A small "record your voice" control for ONE clip in ONE language.
 * What it does:
 *   createAudioRecorder({ clipKey, lang, label }) -> element with:
 *     Record / Stop   uses the microphone (MediaRecorder), saved as Opus/WebM (B9-a)
 *     Upload          pick an mp3 / wav / ogg / webm file instead
 *     Play            listen to what is saved
 *     Delete          remove it (the app falls back to TTS)
 *   Recordings are saved straight away in storage/audio-clip-store.js under the
 *   clip key, so the speech service plays them automatically.
 * Depends on:  storage/audio-clip-store.js, audio/clip-player.js, tutor/field-builders.js
 */

import { saveClip, getClip, deleteClip } from '../storage/audio-clip-store.js';
import * as clipPlayer from '../audio/clip-player.js';
import { el, button } from './field-builders.js';

function preferredMime() {
  const options = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm'];
  return options.find((m) => window.MediaRecorder?.isTypeSupported?.(m)) ?? '';
}

export function createAudioRecorder({ clipKey, lang, label }) {
  const wrap = el('div', 'recorder');
  wrap.lang = lang;
  const name = el('span', 'recorder-label', label);
  const status = el('span', 'recorder-status', '…');
  status.setAttribute('role', 'status');

  let recorder = null;
  let chunks = [];

  const recordBtn = button('● Record', toggleRecording, 'small');
  const playBtn = button('▶ Play', play, 'small');
  const deleteBtn = button('✕ Delete', remove, 'small');
  const fileInput = el('input');
  fileInput.type = 'file';
  fileInput.accept = 'audio/*';
  fileInput.hidden = true;
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    await saveClip(clipKey, lang, file);
    fileInput.value = '';
    refresh('Uploaded ✓');
  });
  const uploadBtn = button('⤒ Upload', () => fileInput.click(), 'small');

  wrap.append(name, recordBtn, uploadBtn, playBtn, deleteBtn, status, fileInput);

  async function refresh(message) {
    const has = !!(await getClip(clipKey, lang).catch(() => null));
    playBtn.disabled = !has;
    deleteBtn.disabled = !has;
    status.textContent = message ?? (has ? 'Recorded' : 'No recording (TTS will be used)');
  }

  async function toggleRecording() {
    if (recorder?.state === 'recording') {
      recorder.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = preferredMime();
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunks = [];
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        recordBtn.textContent = '● Record';
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        await saveClip(clipKey, lang, blob);
        refresh('Saved ✓');
      };
      recorder.start();
      recordBtn.textContent = '■ Stop';
      status.textContent = 'Recording… press Stop when done';
    } catch (err) {
      console.warn('[audio-recorder] microphone unavailable', err);
      status.textContent = 'Microphone not available. Use Upload instead.';
    }
  }

  async function play() {
    const rec = await getClip(clipKey, lang);
    if (!rec) return;
    const url = URL.createObjectURL(rec.blob);
    await clipPlayer.play(url);
    URL.revokeObjectURL(url);
  }

  async function remove() {
    await deleteClip(clipKey, lang);
    refresh('Deleted');
  }

  refresh();
  return wrap;
}

/** Recorders for both languages, side by side. */
export function recorderPair(clipKey, what) {
  const wrap = el('div', 'recorder-pair');
  wrap.append(
    createAudioRecorder({ clipKey, lang: 'en', label: `${what} (English) voice:` }),
    createAudioRecorder({ clipKey, lang: 'bn', label: `${what} (বাংলা) voice:` }),
  );
  return wrap;
}
