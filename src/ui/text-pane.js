/**
 * File:        src/ui/text-pane.js
 * What it is:  The text area of a lesson screen (intro text or the question).
 * What it does:
 *   const pane = createTextPane(parent, ariaLabel);
 *   pane.setBlocks([{ text, lang, clipKey }])   shows text (one block per paragraph)
 *   pane.handle(commandName) -> true if handled
 *   pane.focus() / pane.destroy()
 *   Reading (decision B1-a of iteration 6: keep both ways):
 *     - Space plays everything sentence by sentence (recordings first), and
 *       pauses / resumes. Works in every unit.
 *     - → / ← move by the unit in app-state 'textUnit':
 *         'sentence' (default): plays the sentence's recording, or TTS
 *         'letter' / 'word':    TTS reads the letter or word (Alt+L / Alt+W)
 *     - In audio word mode (app-state 'transcriptMode', Alt+T then A) → / ←
 *       play the recording word by word, and Enter plays from here.
 *   Nothing is spoken when text appears. The current unit is highlighted with
 *   <mark> for sighted helpers. An edge bump plays at the start / end.
 * Depends on:  text-navigation/text-cursor.js, text-navigation/sentence-player.js,
 *              transcript/transcript-navigator.js, audio/speech-service.js,
 *              audio/sound-effects.js, i18n/speech-text.js, core/app-state.js,
 *              core/event-bus.js
 */

import { createTextCursor } from '../text-navigation/text-cursor.js';
import { createSentencePlayer } from '../text-navigation/sentence-player.js';
import { createTranscript } from '../transcript/transcript-navigator.js';
import * as speech from '../audio/speech-service.js';
import * as sfx from '../audio/sound-effects.js';
import { letterName } from '../i18n/speech-text.js';
import { getState } from '../core/app-state.js';
import { on } from '../core/event-bus.js';

const BLOCK_SEPARATOR = '\n\n';

export function createTextPane(parent, ariaLabel) {
  const el = document.createElement('div');
  el.className = 'text-pane';
  el.tabIndex = 0;
  el.setAttribute('role', 'application');
  el.setAttribute('aria-label', ariaLabel);
  el.dataset.navContext = 'text';
  parent.append(el);

  let text = '';
  let blocks = []; // with offsets
  let cursor = null; // letter / word reading
  let transcript = null; // audio word mode
  const sentences = createSentencePlayer((range) => render(range));

  function render(range) {
    if (!range) {
      el.textContent = text;
      return;
    }
    el.textContent = '';
    const mark = document.createElement('mark');
    mark.textContent = text.slice(range.start, range.end);
    el.append(text.slice(0, range.start), mark, text.slice(range.end));
    mark.scrollIntoView?.({ block: 'nearest' });
  }

  /** Language of the block that contains this character offset. */
  function langAt(offset) {
    return [...blocks].reverse().find((b) => b.offset <= offset)?.lang ?? blocks[0]?.lang;
  }

  function stopAll() {
    sentences.stop();
    speech.stop();
  }

  /** → / ← by letter or word (TTS). */
  function moveCursor(command) {
    sentences.stop();
    const seg = command === 'NEXT_UNIT' ? cursor.next() : cursor.prev();
    if (!seg) {
      speech.stop();
      sfx.edge();
      return;
    }
    render(seg);
    const lang = langAt(seg.start);
    const said = cursor.unit === 'letter' ? letterName(seg.text, lang) : seg.text;
    speech.speak([{ text: said, lang }]);
  }

  /** → / ← / Ctrl+→ / Ctrl+← / Enter in audio word mode. */
  function moveTranscript(command) {
    sentences.stop();
    if (command === 'SELECT') {
      transcript.playFromHere();
      return true;
    }
    const moves = {
      NEXT_UNIT: () => transcript.next(),
      PREV_UNIT: () => transcript.prev(),
      NEXT_SENTENCE: () => transcript.nextSentence(),
      PREV_SENTENCE: () => transcript.prevSentence(),
    };
    if (!moves[command]) return false;
    if (!moves[command]()) sfx.edge();
    return true;
  }

  const offState = on('state:changed', ({ key, value }) => {
    if (key === 'textUnit' && cursor) cursor.setUnit(value === 'sentence' ? 'word' : value);
    if (key === 'textUnit' || key === 'transcriptMode') {
      stopAll();
      transcript?.reset?.();
      render(null);
    }
  });

  return {
    element: el,

    async setBlocks(newBlocks) {
      stopAll();
      let offset = 0;
      blocks = newBlocks.map((b) => {
        const withOffset = { ...b, offset };
        offset += b.text.length + BLOCK_SEPARATOR.length;
        return withOffset;
      });
      text = blocks.map((b) => b.text).join(BLOCK_SEPARATOR);
      const unit = getState('textUnit');
      cursor = createTextCursor(text, blocks[0]?.lang ?? 'en', unit === 'sentence' ? 'word' : unit);
      sentences.setBlocks(blocks);
      render(null);
      transcript = null;
      const forText = text;
      const made = await createTranscript(blocks, (range) => render(range));
      if (forText === text) transcript = made; // ignore if the text changed meanwhile
    },

    handle(command) {
      if (!text) return false;
      if (command === 'STOP') {
        stopAll();
        return true;
      }
      if (command === 'TOGGLE_PLAY') {
        speech.stop();
        sentences.togglePlay();
        return true;
      }
      if (getState('transcriptMode') && transcript) return moveTranscript(command);

      if (command === 'SELECT') {
        stopAll();
        return false; // the lesson screen moves on to the task
      }
      const unit = getState('textUnit');
      if (command === 'NEXT_SENTENCE' || (unit === 'sentence' && command === 'NEXT_UNIT')) {
        sentences.next();
        return true;
      }
      if (command === 'PREV_SENTENCE' || (unit === 'sentence' && command === 'PREV_UNIT')) {
        sentences.prev();
        return true;
      }
      if (command === 'NEXT_UNIT' || command === 'PREV_UNIT') {
        moveCursor(command);
        return true;
      }
      return false;
    },

    focus() {
      el.focus();
    },

    destroy() {
      offState();
      stopAll();
      el.remove();
    },
  };
}
