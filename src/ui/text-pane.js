/**
 * File:        src/ui/text-pane.js
 * What it is:  The text area of a lesson screen (intro text or the question).
 * What it does:
 *   const pane = createTextPane(parent, ariaLabel);
 *   pane.setBlocks([{ text, lang, clipKey }])   shows text (one block per paragraph)
 *   pane.handle(commandName) -> true if handled  (NEXT_UNIT, PREV_UNIT,
 *                                                NEXT_SENTENCE, PREV_SENTENCE, and
 *                                                SELECT in audio word mode)
 *   pane.focus()
 *   Talk-back starts only when the student moves (requirement): nothing is
 *   spoken when text appears. → / ← read the next / previous letter, word or
 *   sentence (app-state 'textUnit'). In audio word mode (app-state
 *   'transcriptMode') the recording is played word by word instead.
 *   The current unit is highlighted with <mark> for sighted helpers.
 *   An edge bump plays at the start / end of the text.
 * Depends on:  text-navigation/text-cursor.js, transcript/transcript-navigator.js,
 *              audio/speech-service.js, audio/sound-effects.js, i18n/speech-text.js,
 *              core/app-state.js, core/event-bus.js
 */

import { createTextCursor } from '../text-navigation/text-cursor.js';
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
  let cursor = null;
  let transcript = null;

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

  function speakSegment(seg) {
    const lang = langAt(seg.start);
    const said = cursor.unit === 'letter' ? letterName(seg.text, lang) : seg.text;
    speech.speak([{ text: said, lang }]);
  }

  const offUnit = on('state:changed', ({ key, value }) => {
    if (key === 'textUnit' && cursor) cursor.setUnit(value);
    if (key === 'transcriptMode') {
      transcript?.reset();
      render(cursor?.current() ?? null);
    }
  });

  return {
    element: el,

    async setBlocks(newBlocks) {
      let offset = 0;
      blocks = newBlocks.map((b) => {
        const withOffset = { ...b, offset };
        offset += b.text.length + BLOCK_SEPARATOR.length;
        return withOffset;
      });
      text = blocks.map((b) => b.text).join(BLOCK_SEPARATOR);
      cursor = createTextCursor(text, blocks[0]?.lang ?? 'en', getState('textUnit'));
      render(null);
      transcript = null;
      const forText = text;
      const made = await createTranscript(blocks, (range) => render(range));
      if (forText === text) transcript = made; // ignore if the text changed meanwhile
    },

    handle(command) {
      if (!cursor) return false;
      const audioWords = getState('transcriptMode') && transcript;

      if (audioWords) {
        const moves = {
          NEXT_UNIT: () => transcript.next(),
          PREV_UNIT: () => transcript.prev(),
          NEXT_SENTENCE: () => transcript.nextSentence(),
          PREV_SENTENCE: () => transcript.prevSentence(),
        };
        if (command === 'SELECT') {
          transcript.playFromHere();
          return true;
        }
        if (!moves[command]) return false;
        if (!moves[command]()) sfx.edge();
        return true;
      }

      if (command === 'NEXT_UNIT' || command === 'PREV_UNIT') {
        const seg = command === 'NEXT_UNIT' ? cursor.next() : cursor.prev();
        if (!seg) {
          speech.stop();
          sfx.edge();
          return true;
        }
        render(seg);
        speakSegment(seg);
        return true;
      }
      return false;
    },

    focus() {
      el.focus();
    },

    destroy() {
      offUnit();
      el.remove();
    },
  };
}
