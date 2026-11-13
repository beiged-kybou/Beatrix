/**
 * File:        src/audio/clip-player.js
 * What it is:  Plays one recorded clip at a time (file URL or blob URL).
 * What it does:
 *   - play(url, { start, end, onTime })  plays a whole clip or just a part of it
 *       (start/end in seconds, used for word-level transcript navigation).
 *       Returns a Promise that resolves when the clip ends or is stopped.
 *   - stop()                             stops whatever is playing
 *   Only one clip plays at a time; starting a new one stops the old one.
 * Used by:     audio/speech-service.js, transcript/transcript-navigator.js,
 *              tutor/audio-recorder.js
 * Depends on:  config/settings.js
 */

import { SETTINGS } from '../config/settings.js';

const audio = new Audio();
let finishCurrent = null; // resolves the Promise of the clip that is playing
let frame = 0;

/** Stop the current clip (its Promise resolves). */
export function stop() {
  cancelAnimationFrame(frame);
  audio.pause();
  const done = finishCurrent;
  finishCurrent = null;
  done?.();
}

/**
 * @param {string} url
 * @param {{ start?: number, end?: number, onTime?: (seconds:number) => void }} [opts]
 * @returns {Promise<void>}
 */
export function play(url, opts = {}) {
  stop();
  const { start = 0, end = null, onTime = null } = opts;
  return new Promise((resolve) => {
    finishCurrent = resolve;
    audio.volume = SETTINGS.volume;
    audio.onended = () => stop();
    audio.onerror = () => {
      console.warn('[clip-player] could not play', url);
      stop();
    };

    const begin = () => {
      audio.currentTime = start;
      audio.play().catch(() => stop());
      // Watch the play position to stop at `end` and to report progress.
      const watch = () => {
        if (finishCurrent !== resolve) return;
        onTime?.(audio.currentTime);
        if (end !== null && audio.currentTime >= end) {
          stop();
          return;
        }
        frame = requestAnimationFrame(watch);
      };
      frame = requestAnimationFrame(watch);
    };

    if (audio.src === url && audio.readyState >= 1) {
      begin();
    } else {
      audio.src = url;
      audio.addEventListener('loadedmetadata', begin, { once: true });
      audio.load();
    }
  });
}
