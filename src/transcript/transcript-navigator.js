/**
 * File:        src/transcript/transcript-navigator.js
 * What it is:  Audio word mode (Alt+T, then A): an "interactive transcript".
 * What it does:
 *   Walks through the words of the text pane and plays each word FROM THE
 *   RECORDING, using the alignment file (word start/end times).
 *     next() / prev()                one word forward / back, plays it
 *     nextSentence() / prevSentence()  jump to the next / previous sentence start
 *     playFromHere()                 plays the recording from the current word,
 *                                    moving the highlight along with the voice
 *   Blocks without a recording or alignment fall back to TTS, word by word.
 *   onHighlight({ start, end }) is called with character offsets into the text
 *   pane, so the current word can be highlighted for sighted helpers.
 * Depends on:  transcript/alignment-loader.js, audio/audio-manifest.js,
 *              audio/clip-player.js, audio/speech-service.js,
 *              text-navigation/segmenter.js
 */

import { loadAlignment } from './alignment-loader.js';
import { builtInClipUrl } from '../audio/audio-manifest.js';
import * as clipPlayer from '../audio/clip-player.js';
import * as speech from '../audio/speech-service.js';
import { segment } from '../text-navigation/segmenter.js';

const SENTENCE_END = /[.!?।]$/u;

/**
 * @param {{text:string, lang:string, clipKey?:string, offset:number}[]} blocks
 *        offset = where this block starts in the text pane's combined text
 * @param {(range:{start:number, end:number}|null) => void} onHighlight
 */
export async function createTranscript(blocks, onHighlight) {
  /** @type {{text:string, lang:string, start:number, end:number, url:string|null, t0?:number, t1?:number, block:number}[]} */
  const entries = [];

  for (let b = 0; b < blocks.length; b++) {
    const block = blocks[b];
    const words = segment(block.text, 'word', block.lang);
    const url = block.clipKey ? builtInClipUrl(block.clipKey, block.lang) : null;
    const timing = url ? await loadAlignment(block.clipKey, block.lang) : null;
    words.forEach((w, i) => {
      const at = timing?.[i];
      entries.push({
        text: w.text,
        lang: block.lang,
        start: block.offset + w.start,
        end: block.offset + w.end,
        url: at ? url : null,
        t0: at?.start,
        t1: at?.end,
        block: b,
      });
    });
  }

  let index = -1;

  const highlight = () => onHighlight(entries[index] ? { start: entries[index].start, end: entries[index].end } : null);

  function playEntry(e) {
    speech.stop();
    if (e.url) clipPlayer.play(e.url, { start: e.t0, end: e.t1 });
    else speech.speak([{ text: e.text, lang: e.lang }]);
  }

  function go(newIndex) {
    if (newIndex < 0 || newIndex >= entries.length) return false;
    index = newIndex;
    highlight();
    playEntry(entries[index]);
    return true;
  }

  return {
    hasAudio: entries.some((e) => e.url),
    next: () => go(index + 1),
    prev: () => (index <= 0 ? false : go(index - 1)),

    nextSentence() {
      for (let i = Math.max(index, 0); i < entries.length - 1; i++) {
        if (SENTENCE_END.test(entries[i].text) || entries[i + 1].block !== entries[i].block) return go(i + 1);
      }
      return false;
    },

    prevSentence() {
      // Find the start of the current sentence, then the one before it.
      const startOf = (i) => {
        let j = i;
        while (j > 0 && !SENTENCE_END.test(entries[j - 1].text) && entries[j - 1].block === entries[j].block) j--;
        return j;
      };
      if (index <= 0) return false;
      const here = startOf(index);
      return go(here === index ? startOf(index - 1) : here);
    },

    /** Play on from the current word to the end of its block, following the highlight. */
    playFromHere() {
      if (index < 0) index = 0;
      const e = entries[index];
      if (!e) return;
      if (!e.url) {
        // No recording: read the rest of the block with TTS.
        const rest = entries.filter((x, i) => i >= index && x.block === e.block).map((x) => x.text).join(' ');
        speech.speak([{ text: rest, lang: e.lang }]);
        return;
      }
      const blockEntries = entries.map((x, i) => ({ x, i })).filter(({ x }) => x.block === e.block && x.url);
      const last = blockEntries.at(-1).x;
      speech.stop();
      clipPlayer.play(e.url, {
        start: e.t0,
        end: last.t1,
        onTime: (t) => {
          const found = blockEntries.filter(({ x, i }) => i >= index && x.t0 <= t).at(-1);
          if (found && found.i !== index) {
            index = found.i;
            highlight();
          }
        },
      });
    },

    reset() {
      index = -1;
      onHighlight(null);
    },
  };
}
