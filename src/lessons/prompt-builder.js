/**
 * File:        src/lessons/prompt-builder.js
 * What it is:  Makes the question for an exercise, as text and as speech.
 * What it does:
 *   promptText(lesson, exercise, start)    -> text shown in the text pane
 *   promptSpeech(lesson, exercise, start)  -> parts for audio/speech-service.js
 *   optionParts(lesson, exercise, n)       -> speech for one answer option (choice)
 *   If the exercise has its own prompt, that is used. Otherwise the question is
 *   generated from the templates in i18n/strings (e.g. "Find the apple. It is in…").
 *   The main question has clip key <lesson>.<exercise>.prompt, so a recording
 *   replaces the whole question. Extra pieces:
 *     relative-move: the start sentence ("You are at row 4, column 7") comes
 *                    first, joined from small clips (a random start can't be recorded)
 *     choice:        the options follow ("1. Yes. 2. No."), clip keys <…>.opt1, opt2…
 * Depends on:  i18n/language.js, i18n/numbers.js, lessons/lesson-schema.js,
 *              audio/phrase-composer.js
 */

import { getLang, t, pickTextInfo } from '../i18n/language.js';
import { formatNumber } from '../i18n/numbers.js';
import { clipKeyForPrompt, clipKeyForOption } from './lesson-schema.js';
import { youAreAt } from '../audio/phrase-composer.js';

/** The main question (without start sentence or options). @returns {{text:string, lang:string}} */
function mainQuestion(exercise, lang) {
  const own = pickTextInfo(exercise.prompt, lang);
  if (own.text) return own;
  const n = (v) => formatNumber(v, lang);

  switch (exercise.type) {
    case 'find-cell': {
      const item = pickTextInfo(exercise.item, lang).text;
      return { text: t('templates.find_cell_prompt', { item, row: n(exercise.target.row), col: n(exercise.target.col) }, lang), lang };
    }
    case 'matrix-size':
      return { text: t('templates.matrix_size_prompt', {}, lang), lang };
    case 'relative-move':
      return { text: t('templates.relative_move_prompt', { moves: describeMoves(exercise.moves, lang) }, lang), lang };
    case 'find-own-position':
      return { text: t('templates.find_own_prompt', { rows: n(exercise.rows), cols: n(exercise.cols) }, lang), lang };
    default:
      return { text: '', lang };
  }
}

/** "Move 2 steps right along the row, then 3 steps forward along the column" */
export function describeMoves(moves, lang = getLang()) {
  const phrases = moves.map((m) => {
    const dir = m.dir.replace('-', '_'); // 'forward-right' -> template key 'move_forward_right_…'
    const key = m.steps === 1 ? `templates.move_${dir}_one` : `templates.move_${dir}_many`;
    return t(key, { n: formatNumber(m.steps, lang) }, lang);
  });
  const joined = phrases.join(t('templates.move_join', {}, lang));
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

/** "1. Yes" for option n (counting from 1). */
function optionText(exercise, n, lang) {
  const info = pickTextInfo(exercise.options[n - 1], lang);
  return { text: t('templates.option', { n: formatNumber(n, lang), text: info.text }, lang), lang: info.lang };
}

/** Speech for one answer option (n counts from 1). */
export function optionParts(lesson, exercise, n, lang = getLang()) {
  const o = optionText(exercise, n, lang);
  return [{ key: clipKeyForOption(lesson, exercise, n), text: o.text, lang: o.lang }];
}

/** Text for the text pane. */
export function promptText(lesson, exercise, start = null, lang = getLang()) {
  const main = mainQuestion(exercise, lang).text;
  if (exercise.type === 'relative-move' && start) {
    const startText = t('templates.start_at', { row: formatNumber(start.row, lang), col: formatNumber(start.col, lang) }, lang);
    return `${startText} ${main}`;
  }
  if (exercise.type === 'choice') {
    const lines = exercise.options.map((_, i) => optionText(exercise, i + 1, lang).text);
    return [main, ...lines].join('\n');
  }
  return main;
}

/** Speech parts for the R key. */
export function promptSpeech(lesson, exercise, start = null, lang = getLang()) {
  const main = mainQuestion(exercise, lang);
  const parts = [];
  if (exercise.type === 'relative-move' && start) parts.push(...youAreAt(start.row, start.col, lang));
  parts.push({ key: clipKeyForPrompt(lesson, exercise), text: main.text, lang: main.lang });
  if (exercise.type === 'choice') exercise.options.forEach((_, i) => parts.push(...optionParts(lesson, exercise, i + 1, lang)));
  return parts;
}
