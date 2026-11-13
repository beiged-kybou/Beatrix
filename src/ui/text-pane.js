/**
 * File:        src/ui/text-pane.js
 * What it is:  The text area of a lesson screen (intro text or the question).
 * What it does:
 *   - Continuous playback (Space): hear it all in one go, pause, and resume
 *     from where you left off.
 *   - Sentence-by-sentence navigation (→ / ←): reads one sentence at a time
 *     (one dari '।' to another dari) using pre-recorded audio.
 *   - Highlights the active sentence with <mark> for sighted helpers.
 *   - Edge bump (sfx.edge()) on reaching the start or end of the text.
 * Depends on:  text-navigation/segmenter.js, audio/audio-manifest.js,
 *              audio/clip-player.js, audio/speech-service.js, audio/sound-effects.js
 */

import { segment } from '../text-navigation/segmenter.js';
import { builtInClipUrl } from '../audio/audio-manifest.js';
import * as clipPlayer from '../audio/clip-player.js';
import * as speech from '../audio/speech-service.js';
import * as sfx from '../audio/sound-effects.js';

const BLOCK_SEPARATOR = '\n\n';

export function createTextPane(parent, ariaLabel) {
  const el = document.createElement('div');
  el.className = 'text-pane';
  el.tabIndex = 0;
  el.setAttribute('role', 'application');
  el.setAttribute('aria-label', ariaLabel);
  el.dataset.navContext = 'text';
  parent.append(el);

  let fullText = '';
  let allSentences = [];
  let sentenceIndex = -1;
  let isPlaying = false;
  let playToken = 0;

  function render(range) {
    if (!range) {
      el.textContent = fullText;
      return;
    }
    el.textContent = '';
    const mark = document.createElement('mark');
    mark.textContent = fullText.slice(range.start, range.end);
    el.append(fullText.slice(0, range.start), mark, fullText.slice(range.end));
    mark.scrollIntoView?.({ block: 'nearest' });
  }

  function stopAudio() {
    playToken++;
    clipPlayer.stop();
    speech.stop();
  }

  function playSentence(index, continuous = false) {
    if (index < 0 || index >= allSentences.length) {
      isPlaying = false;
      sentenceIndex = -1;
      render(null);
      sfx.edge();
      return false;
    }
    sentenceIndex = index;
    const s = allSentences[sentenceIndex];
    render({ start: s.charStart, end: s.charEnd });

    stopAudio();
    const myToken = playToken;

    const onDone = () => {
      if (myToken !== playToken) return;
      if (continuous && isPlaying) {
        const nextIdx = sentenceIndex + 1;
        if (nextIdx < allSentences.length) {
          playSentence(nextIdx, true);
        } else {
          isPlaying = false;
          sentenceIndex = -1;
          render(null);
        }
      } else {
        isPlaying = false;
      }
    };

    if (s.url) {
      clipPlayer.play(s.url).then(onDone).catch(onDone);
    } else {
      speech.speak([{ text: s.text, lang: s.lang }]).then(onDone).catch(onDone);
    }
    return true;
  }

  function togglePlay() {
    if (isPlaying) {
      // Pause: stop audio, keep current sentence highlighted
      isPlaying = false;
      stopAudio();
      return true;
    }

    // Resume / Start from current sentence or start
    isPlaying = true;
    if (sentenceIndex < 0 || sentenceIndex >= allSentences.length) {
      sentenceIndex = 0;
    }
    playSentence(sentenceIndex, true);
    return true;
  }

  function nextSentence() {
    isPlaying = false;
    stopAudio();
    const next = sentenceIndex + 1;
    if (next >= allSentences.length) {
      sfx.edge();
      return true;
    }
    playSentence(next, false);
    return true;
  }

  function prevSentence() {
    isPlaying = false;
    stopAudio();
    if (sentenceIndex <= 0) {
      sentenceIndex = 0;
      sfx.edge();
      return true;
    }
    playSentence(sentenceIndex - 1, false);
    return true;
  }

  return {
    element: el,

    setBlocks(newBlocks) {
      stopAudio();
      isPlaying = false;
      sentenceIndex = -1;

      let offset = 0;
      const blocks = newBlocks.map((b) => {
        const withOffset = { ...b, offset };
        offset += b.text.length + BLOCK_SEPARATOR.length;
        return withOffset;
      });
      fullText = blocks.map((b) => b.text).join(BLOCK_SEPARATOR);
      render(null);

      const parsedSentences = [];
      for (const b of blocks) {
        const sents = segment(b.text, 'sentence', b.lang);
        for (let i = 0; i < sents.length; i++) {
          const s = sents[i];
          const sKey = b.clipKey ? `${b.clipKey}.s${String(i + 1).padStart(2, '0')}` : null;
          let url = sKey ? builtInClipUrl(sKey, b.lang) : null;
          if (!url && sents.length === 1 && b.clipKey) {
            url = builtInClipUrl(b.clipKey, b.lang);
          }
          parsedSentences.push({
            text: s.text,
            charStart: b.offset + s.start,
            charEnd: b.offset + s.end,
            url,
            lang: b.lang,
          });
        }
      }
      allSentences = parsedSentences;
    },

    handle(command) {
      if (!allSentences.length) return false;
      if (command === 'TOGGLE_PLAY') return togglePlay();
      if (command === 'NEXT_UNIT' || command === 'NEXT_SENTENCE') return nextSentence();
      if (command === 'PREV_UNIT' || command === 'PREV_SENTENCE') return prevSentence();
      if (command === 'STOP') {
        isPlaying = false;
        stopAudio();
        return true;
      }
      if (command === 'SELECT') {
        // Move to the next interactive area
        isPlaying = false;
        stopAudio();
        return false;
      }
      return false;
    },

    focus() {
      el.focus();
    },

    destroy() {
      stopAudio();
      el.remove();
    },
  };
}
