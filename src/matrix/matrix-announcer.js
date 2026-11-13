/**
 * File:        src/matrix/matrix-announcer.js
 * What it is:  Decides what the student HEARS when landing on a cell.
 * What it does:
 *   const announcer = createMatrixAnnouncer(matrix, speaking);
 *     speaking = 'all' or a Set of "row,col" strings (from lessons/lesson-schema.js)
 *   announcer.afterMove({ moved, row, col, blocked })
 *     - diagonal step where diagonals are off (blocked) -> "Diagonal steps are off here."
 *     - hit the edge         -> edge bump sound
 *     - a speaking cell      -> says "row R, column C"
 *     - any other cell       -> dot sound, panned by column, pitched by row (B4)
 *   announcer.whereAmI(row, col)  -> says "You are at row R, column C"
 *   announcer.whatIsHere(item)    -> says the thing kept in the cell ("mango"),
 *                                    or "empty" (Space in exercises with cell contents)
 * Depends on:  audio/speech-service.js, audio/sound-effects.js, audio/phrase-composer.js,
 *              i18n/language.js, lessons/lesson-schema.js
 */

import * as speech from '../audio/speech-service.js';
import * as sfx from '../audio/sound-effects.js';
import { cell, youAreAt, spoken } from '../audio/phrase-composer.js';
import { pickTextInfo } from '../i18n/language.js';
import { clipKeyForItem } from '../lessons/lesson-schema.js';

/**
 * @param {{rows:number, cols:number}} matrix
 * @param {'all' | Set<string>} speaking
 */
export function createMatrixAnnouncer(matrix, speaking) {
  const isSpeaking = (r, c) => speaking === 'all' || speaking.has(`${r},${c}`);

  return {
    isSpeakingCell: isSpeaking,

    /** Feedback after a move attempt. */
    afterMove({ moved, row, col, blocked }) {
      if (blocked) {
        speech.speak([spoken('diagonal_off')]);
        return;
      }
      if (!moved) {
        speech.stop();
        sfx.edge();
        return;
      }
      if (isSpeaking(row, col)) {
        speech.speak(cell(row, col));
        return;
      }
      speech.stop();
      sfx.dot({
        pan: matrix.cols === 1 ? 0 : -1 + (2 * (col - 1)) / (matrix.cols - 1),
        pitch: matrix.rows === 1 ? 0.5 : (row - 1) / (matrix.rows - 1),
      });
    },

    /** Say the current position aloud. */
    whereAmI(row, col) {
      speech.speak(youAreAt(row, col));
    },

    /** Say what is kept in the current cell. @param {{en,bn}|null} item */
    whatIsHere(item) {
      if (!item) {
        speech.speak([spoken('empty')]);
        return;
      }
      const info = pickTextInfo(item);
      speech.speak([{ key: clipKeyForItem(item), text: info.text, lang: info.lang }]);
    },
  };
}
