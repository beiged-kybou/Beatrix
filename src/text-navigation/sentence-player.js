/**
 * File:        src/text-navigation/sentence-player.js
 * What it is:  Sentence-by-sentence reading of the text pane (the teammate's
 *              "dari to dari" playback, moved out of ui/text-pane.js).
 * What it does:
 *   const player = createSentencePlayer(onHighlight);
 *   player.setBlocks(blocks)   blocks = [{ text, lang, clipKey, offset }]
 *   player.togglePlay()        Space: play everything from the current sentence,
 *                              or pause (the sentence stays highlighted)
 *   player.next() / prev()     one sentence forward / back, played once
 *   player.stop()              stop the sound
 *   Each sentence plays its own recording "<clipKey>.sNN" when the manifest
 *   lists it (a one-sentence block may also use "<clipKey>"), otherwise TTS.
 *   onHighlight({ start, end }) or onHighlight(null) marks the current sentence.
 *   An edge bump plays at the start / end of the text.
 * Depends on:  text-navigation/segmenter.js, audio/audio-manifest.js,
 *              audio/clip-player.js, audio/speech-service.js, audio/sound-effects.js
 */

import { segment } from './segmenter.js';
import { builtInClipUrl } from '../audio/audio-manifest.js';
import * as clipPlayer from '../audio/clip-player.js';
import * as speech from '../audio/speech-service.js';
import * as sfx from '../audio/sound-effects.js';

/** Split blocks into sentences with character offsets and recording URLs. */
export function sentencesOf(blocks) {
  const out = [];
  for (const b of blocks) {
    const sents = segment(b.text, 'sentence', b.lang);
    sents.forEach((s, i) => {
      const sKey = b.clipKey ? `${b.clipKey}.s${String(i + 1).padStart(2, '0')}` : null;
      let url = sKey ? builtInClipUrl(sKey, b.lang) : null;
      if (!url && sents.length === 1 && b.clipKey) url = builtInClipUrl(b.clipKey, b.lang);
      out.push({ text: s.text, charStart: b.offset + s.start, charEnd: b.offset + s.end, url, lang: b.lang });
    });
  }
  return out;
}

export function createSentencePlayer(onHighlight) {
  let sentences = [];
  let index = -1;
  let playing = false;
  let token = 0;

  function stopAudio() {
    token++;
    clipPlayer.stop();
    speech.stop();
  }

  function play(i, continuous) {
    index = i;
    const s = sentences[i];
    onHighlight({ start: s.charStart, end: s.charEnd });
    stopAudio();
    const mine = token;
    const done = () => {
      if (mine !== token) return;
      if (continuous && playing && index + 1 < sentences.length) {
        play(index + 1, true);
      } else if (continuous && playing) {
        playing = false;
        index = -1;
        onHighlight(null);
      } else {
        playing = false;
      }
    };
    const p = s.url ? clipPlayer.play(s.url) : speech.speak([{ text: s.text, lang: s.lang }]);
    Promise.resolve(p).then(done, done);
  }

  return {
    get hasText() {
      return sentences.length > 0;
    },

    setBlocks(blocks) {
      stopAudio();
      playing = false;
      index = -1;
      sentences = sentencesOf(blocks);
    },

    togglePlay() {
      if (playing) {
        playing = false;
        stopAudio();
        return;
      }
      playing = true;
      if (index < 0 || index >= sentences.length) index = 0;
      play(index, true);
    },

    next() {
      playing = false;
      stopAudio();
      if (index + 1 >= sentences.length) sfx.edge();
      else play(index + 1, false);
    },

    prev() {
      playing = false;
      stopAudio();
      if (index <= 0) {
        index = 0;
        sfx.edge();
      } else {
        play(index - 1, false);
      }
    },

    stop() {
      playing = false;
      stopAudio();
    },
  };
}
