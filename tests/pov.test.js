/**
 * File:        tests/pov.test.js
 * What it is:  Unit tests for the matrix view switch (iteration 6, Alt+P):
 *              key directions, words, reader's view texts, clip keys,
 *              the Ctrl+↑/↓ area order, and that the Bangla recordings still
 *              match the screen-view text.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { moveFor, rowOneAtTop } from '../src/config/pov.js';
import { setState } from '../src/core/app-state.js';
import { registerStrings, t, viewKey } from '../src/i18n/language.js';
import { describeMoves, promptText } from '../src/lessons/prompt-builder.js';
import { povText, clipKeyForParagraph, clipKeyForPrompt } from '../src/lessons/lesson-schema.js';
import { validateLesson } from '../src/lessons/lesson-validator.js';
import { nextArea } from '../src/ui/area-cycle.js';
import { segment } from '../src/text-navigation/segmenter.js';
import { KEYBINDINGS } from '../src/config/keybindings.js';

const readJson = (p) => JSON.parse(fs.readFileSync(path.resolve(p), 'utf8'));
for (const lang of ['en', 'bn']) registerStrings(lang, readJson(`src/i18n/strings/${lang}.json`));
const lessonFiles = fs.readdirSync('content/lessons').filter((f) => /^lesson-\d+\.json$/.test(f));
const lessons = lessonFiles.map((f) => readJson(`content/lessons/${f}`));

test('arrow keys: ↓ grows the row in the reader view, ↑ in the screen view', () => {
  assert.equal(moveFor('down', 'reader'), 'forward');
  assert.equal(moveFor('up', 'reader'), 'back');
  assert.equal(moveFor('up', 'screen'), 'forward');
  assert.equal(moveFor('down', 'screen'), 'back');
  assert.equal(moveFor('right', 'reader'), 'right');
  assert.equal(moveFor('left', 'screen'), 'left');
});

test('diagonal keys keep the shape of the move on the screen', () => {
  // Numpad 3 / C sits bottom-right: row + 1, column + 1 in the reader view.
  assert.equal(moveFor('down-right', 'reader'), 'forward-right');
  assert.equal(moveFor('up-right', 'reader'), 'back-right');
  assert.equal(moveFor('down-left', 'reader'), 'forward-left');
  assert.equal(moveFor('up-left', 'reader'), 'back-left');
  assert.equal(moveFor('up-right', 'screen'), 'forward-right');
  assert.equal(moveFor('down-left', 'screen'), 'back-left');
});

test('row 1 is drawn at the top only in the reader view', () => {
  assert.equal(rowOneAtTop('reader'), true);
  assert.equal(rowOneAtTop('screen'), false);
});

test('generated move prompts say down / up in the reader view', () => {
  const moves = [{ dir: 'right', steps: 2 }, { dir: 'forward', steps: 3 }];
  assert.equal(describeMoves(moves, 'en', 'screen'), 'Move 2 steps right along the row, then move 3 steps forward along the column');
  assert.equal(describeMoves(moves, 'en', 'reader'), 'Move 2 steps right along the row, then move 3 steps down along the column');
  assert.match(describeMoves([{ dir: 'back-left', steps: 1 }], 'bn', 'reader'), /উপরে-বামে/);
});

test('every move template has a reader version in both languages', () => {
  for (const lang of ['en', 'bn']) {
    const tpl = readJson(`src/i18n/strings/${lang}.json`).templates;
    for (const dir of ['forward', 'back', 'forward_right', 'forward_left', 'back_right', 'back_left']) {
      for (const n of ['one', 'many']) assert.ok(tpl[`move_${dir}_${n}_reader`], `${lang}: move_${dir}_${n}_reader`);
    }
  }
});

test('viewKey falls back to the shared phrase when there is no reader version', () => {
  assert.equal(viewKey('screen.forward_hint', 'reader'), 'screen.forward_hint_reader');
  assert.equal(viewKey('screen.forward_hint', 'screen'), 'screen.forward_hint');
  assert.equal(viewKey('templates.move_right_one', 'reader'), 'templates.move_right_one');
  assert.equal(t(viewKey('screen.forward_hint', 'reader'), {}, 'en'), '↓ Down = row number grows');
});

test('reader text and clip keys: own version in the reader view, shared otherwise', () => {
  const l01 = lessons.find((l) => l.id === 'l01');
  const p03 = l01.intro.paragraphs.find((p) => p.id === 'p03');
  const p01 = l01.intro.paragraphs.find((p) => p.id === 'p01');
  assert.match(povText(p03, 'text', 'reader').en, /top to bottom/);
  assert.match(povText(p03, 'text', 'screen').en, /straight forward/);
  assert.equal(clipKeyForParagraph(l01, p03, 'reader'), 'l01.intro.p03r');
  assert.equal(clipKeyForParagraph(l01, p03, 'screen'), 'l01.intro.p03');
  assert.equal(clipKeyForParagraph(l01, p01, 'reader'), 'l01.intro.p01');

  const l06 = lessons.find((l) => l.id === 'l06');
  const ex01 = l06.exercises.find((e) => e.id === 'ex01');
  setState('pov', 'reader');
  assert.match(promptText(l06, ex01, null, 'en'), /top-right corner/);
  setState('pov', 'screen');
  assert.match(promptText(l06, ex01, null, 'en'), /near-right corner/);
  setState('pov', 'reader');
  assert.equal(clipKeyForPrompt(l06, ex01, 'reader'), 'l06.ex01.prompt_reader');
});

test('a generated relative-move prompt gets its own reader clip key', () => {
  const lesson = { id: 'l04' };
  const vertical = { id: 'ex01', type: 'relative-move', moves: [{ dir: 'forward', steps: 2 }] };
  const sideways = { id: 'ex02', type: 'relative-move', moves: [{ dir: 'right', steps: 2 }] };
  assert.equal(clipKeyForPrompt(lesson, vertical, 'reader'), 'l04.ex01.prompt_reader');
  assert.equal(clipKeyForPrompt(lesson, vertical, 'screen'), 'l04.ex01.prompt');
  assert.equal(clipKeyForPrompt(lesson, sideways, 'reader'), 'l04.ex02.prompt');
});

test('built-in lessons stay valid, and a reader text missing a language is caught', () => {
  for (const l of lessons) assert.deepEqual(validateLesson(l), [], l.id);
  const l07 = structuredClone(lessons.find((l) => l.id === 'l07'));
  l07.intro.paragraphs.find((p) => p.textReader).textReader.bn = '';
  assert.ok(validateLesson(l07).some((e) => /reader's view text has no Bangla/.test(e)));
});

test("every lesson paragraph with direction words has a reader's version", () => {
  const re = /\b(forward|back|near|far)\b|সামনে|পেছন|কাছের|দূরের/i;
  for (const l of lessons) {
    for (const p of l.intro.paragraphs) {
      const en = p.text.en.replace(/How far apart|so far/g, ''); // "far" that is not a direction
      if (!re.test(en)) continue;
      assert.ok(p.textReader, `${l.id} ${p.id}`);
    }
  }
});

test('Ctrl+↓ / Ctrl+↑ go round the parts of the step', () => {
  const areas = ['text', 'matrix', 'answer'];
  assert.equal(nextArea(areas, 'text', 1), 'matrix');
  assert.equal(nextArea(areas, 'answer', 1), 'text');
  assert.equal(nextArea(areas, 'text', -1), 'answer');
  assert.equal(nextArea(['text'], 'text', 1), 'text');
  assert.equal(nextArea(areas, 'none', 1), 'text');
  assert.equal(nextArea(areas, 'none', -1), 'answer');
});

test('Tab and Ctrl+↑/↓ only act inside lesson parts; no key is used twice in a context', () => {
  const tab = KEYBINDINGS.find((b) => b.keys.includes('Tab'));
  assert.equal(tab.command, 'AREA_NEXT');
  assert.ok(!tab.contexts.includes('global') && !tab.contexts.includes('list'));
  const seen = new Map();
  for (const b of KEYBINDINGS) {
    for (const k of b.keys) {
      for (const c of b.contexts) {
        const id = `${c} ${k}`;
        assert.ok(!seen.has(id), `${id}: ${seen.get(id)} and ${b.command}`);
        seen.set(id, b.command);
      }
    }
  }
});

test('every Bangla sentence recording still matches a screen-view sentence', () => {
  const manifest = readJson('assets/audio/manifest.json');
  for (const key of manifest.bn) {
    const m = /^(l\d\d)\.intro\.(p\d\d)(r?)\.s(\d\d)$/.exec(key);
    if (!m) continue;
    const lesson = lessons.find((l) => l.id === m[1]);
    const p = lesson?.intro.paragraphs.find((x) => x.id === m[2]);
    assert.ok(p, `${key}: paragraph is gone`);
    const text = m[3] ? p.textReader?.bn : p.text.bn;
    const count = segment(text ?? '', 'sentence', 'bn').length;
    assert.ok(Number(m[4]) <= count, `${key}: the paragraph has only ${count} sentences`);
  }
});
