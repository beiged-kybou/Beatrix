/**
 * File:        src/text-navigation/segmenter.js
 * What it is:  Splits text into letters, words, or sentences.
 * What it does:
 *   segment(text, 'letter' | 'word' | 'sentence', lang)
 *     -> [{ text, start, end }]   (start/end are character offsets into `text`)
 *   Uses Intl.Segmenter, which understands Bangla: 'কিস্তি' is two letters
 *   ('কি', 'স্তি'), not six code points, and '।' ends a sentence.
 *   Words keep math symbols such as × and =, but drop plain punctuation.
 *   Letters keep spaces, so letter mode can say "space".
 *   Has a simple fallback for old browsers without Intl.Segmenter.
 *   Pure function: unit tested in tests/segmenter.test.js.
 * Depends on:  nothing.
 */

export const UNITS = ['letter', 'word', 'sentence'];

/** Plain punctuation that is skipped in word mode. */
const PUNCTUATION_ONLY = /^[\s.,!?;:।"'‘’“”…]+$/u;

const hasSegmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl;

const GRANULARITY = { letter: 'grapheme', word: 'word', sentence: 'sentence' };

/**
 * @param {string} text
 * @param {'letter'|'word'|'sentence'} unit
 * @param {string} [lang] 'en' | 'bn'
 * @returns {{text:string, start:number, end:number}[]}
 */
export function segment(text, unit, lang = 'en') {
  const raw = hasSegmenter ? segmentWithIntl(text, unit, lang) : segmentFallback(text, unit);
  return raw
    .map(trimSegment)
    .filter((s) => {
      if (unit === 'letter') return s.text.length > 0 || s.original.length > 0;
      if (!s.text) return false;
      if (unit === 'word') return !PUNCTUATION_ONLY.test(s.text);
      return true;
    })
    .map(({ text: t, start, end }) => ({ text: t, start, end }));
}

function segmentWithIntl(text, unit, lang) {
  const seg = new Intl.Segmenter(lang, { granularity: GRANULARITY[unit] });
  return [...seg.segment(text)].map((s) => ({ text: s.segment, start: s.index, end: s.index + s.segment.length, unit }));
}

function segmentFallback(text, unit) {
  const out = [];
  const re = unit === 'letter' ? /[\s\S]/gu : unit === 'word' ? /\S+/gu : /[^.!?।]+[.!?।]*/gu;
  for (const m of text.matchAll(re)) out.push({ text: m[0], start: m.index, end: m.index + m[0].length, unit });
  return out;
}

/** Words and sentences lose surrounding spaces; letters stay as they are. */
function trimSegment(s) {
  if (s.unit === 'letter') return { ...s, original: s.text };
  const lead = s.text.length - s.text.trimStart().length;
  const trimmed = s.text.trim();
  return { text: trimmed, start: s.start + lead, end: s.start + lead + trimmed.length, original: s.text };
}
