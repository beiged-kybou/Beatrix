/**
 * File:        src/transcript/alignment-loader.js
 * What it is:  Loads word-timing ("alignment") files for recorded clips.
 * What it does:
 *   loadAlignment(clipKey, lang) -> [{ w, start, end }] or null
 *   An alignment file sits next to its clip, e.g.
 *     assets/audio/en/lessons/l01.intro.p01.mp3
 *     assets/audio/en/lessons/l01.intro.p01.align.json
 *   and lists every spoken word with its start and end time in seconds:
 *     [ { "w": "A", "start": 0.12, "end": 0.20 }, { "w": "matrix", "start": 0.21, "end": 0.70 } ]
 *   ({ "words": [ … ] } is accepted too.) audio-scripts/README.md explains how
 *   to make these files automatically with a forced aligner.
 * Depends on:  audio/audio-manifest.js
 */

import { alignmentUrl } from '../audio/audio-manifest.js';

const cache = new Map();

export async function loadAlignment(clipKey, lang) {
  const url = clipKey ? alignmentUrl(clipKey, lang) : null;
  if (!url) return null;
  if (cache.has(url)) return cache.get(url);
  try {
    const data = await (await fetch(url)).json();
    const words = (Array.isArray(data) ? data : data.words ?? [])
      .filter((x) => typeof x?.start === 'number' && typeof x?.end === 'number')
      .map((x) => ({ w: String(x.w ?? x.word ?? ''), start: x.start, end: x.end }));
    cache.set(url, words);
    return words;
  } catch (err) {
    console.warn('[alignment-loader] bad alignment file', url, err);
    return null;
  }
}
