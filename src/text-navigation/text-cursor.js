/**
 * File:        src/text-navigation/text-cursor.js
 * What it is:  A reading position inside a piece of text.
 * What it does:
 *   const cur = createTextCursor('A matrix is…', 'en', 'word');
 *   cur.next()  -> { text:'A', start:0, end:1 }   or null at the end
 *   cur.prev()  -> previous unit, or null at the start
 *   cur.setUnit('letter')  switches unit and keeps the reading place
 *   cur.current()          the unit under the cursor (null before the first move)
 *   The cursor starts *before* the first unit, so the first → reads unit 1.
 *   Pure logic, no DOM: the text pane (ui/text-pane.js) draws the highlight.
 * Depends on:  text-navigation/segmenter.js
 */

import { segment } from './segmenter.js';

/**
 * @param {string} text
 * @param {string} lang
 * @param {'letter'|'word'|'sentence'} unit
 */
export function createTextCursor(text, lang, unit) {
  let segments = segment(text, unit, lang);
  let index = -1;
  let currentUnit = unit;

  return {
    get unit() {
      return currentUnit;
    },

    current() {
      return segments[index] ?? null;
    },

    next() {
      if (index >= segments.length - 1) return null;
      index++;
      return segments[index];
    },

    prev() {
      if (index <= 0) {
        index = index === 0 ? 0 : -1;
        return null;
      }
      index--;
      return segments[index];
    },

    /** Change unit, keeping the cursor on the unit that contains the old position. */
    setUnit(newUnit) {
      if (newUnit === currentUnit) return;
      const offset = segments[index]?.start ?? -1;
      currentUnit = newUnit;
      segments = segment(text, newUnit, lang);
      if (offset < 0) {
        index = -1;
        return;
      }
      const found = segments.findIndex((s) => s.end > offset);
      index = found === -1 ? segments.length - 1 : found;
    },
  };
}
