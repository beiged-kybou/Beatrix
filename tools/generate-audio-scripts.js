/**
 * File:        tools/generate-audio-scripts.js
 * What it is:  A Node.js tool that writes the recording scripts.
 * What it does:
 *   Reads the UI phrases (src/i18n/strings/*.json) and the built-in lessons
 *   (content/lessons/*.json) and writes, for each language:
 *     audio-scripts/en.script.csv
 *     audio-scripts/bn.script.csv
 *   Each row is ONE file to record: key, file path, the exact text to read.
 *   Run it again whenever lesson text or phrases change:
 *     node tools/generate-audio-scripts.js
 *   It uses the same prompt builder as the app, so the script always matches
 *   what the app would say with TTS.
 *   Lesson texts are listed for the screen view first, then the reader's view
 *   versions that differ (keys ending in "r" / "_reader", see lesson-schema.js).
 * Depends on:  src/i18n/language.js, src/lessons/prompt-builder.js,
 *              src/lessons/lesson-schema.js, src/audio/audio-manifest.js
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { registerStrings, LANGUAGES, pickTextInfo } from '../src/i18n/language.js';
import { setState } from '../src/core/app-state.js';
import { povText } from '../src/lessons/lesson-schema.js';
import { promptText, optionParts } from '../src/lessons/prompt-builder.js';
import { clipKeyForTitle, clipKeyForParagraph, clipKeyForPrompt, clipKeyForItem, clipKeyForSection } from '../src/lessons/lesson-schema.js';
import { clipPath } from '../src/audio/audio-manifest.js';
import { formatNumber } from '../src/i18n/numbers.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

/** Numbers that can be spoken in "row R, column C" (1 .. max matrix size, with spare). */
const NUMBER_MAX = 20;

const strings = {};
for (const lang of LANGUAGES) {
  strings[lang] = readJson(`src/i18n/strings/${lang}.json`);
  registerStrings(lang, strings[lang]);
}
const sections = readJson('content/lessons/index.json').sections;
const lessons = sections.flatMap((s) => s.lessons).map((f) => readJson(`content/lessons/${f}`));

const csvCell = (s) => `"${String(s).replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;

for (const lang of LANGUAGES) {
  const rows = [];
  const added = new Set();
  // Each key is recorded once, even if several lessons use it (e.g. num.7 as a number and as a cell value).
  const add = (key, text, note = '') => {
    if (added.has(key)) return;
    added.add(key);
    rows.push([key, `assets/audio/${clipPath(key, lang)}`, text, note]);
  };

  for (const [name, text] of Object.entries(strings[lang].spoken)) add(`ui.${name}`, text, 'UI phrase');
  for (let n = 1; n <= NUMBER_MAX; n++) add(`num.${n}`, formatNumber(n, lang), 'number, said on its own');

  // Things kept in cells (Lesson 9 style), said on their own when Space is pressed.
  const items = new Map();
  for (const lesson of lessons) {
    for (const ex of lesson.exercises) {
      for (const c of ex.contents ?? []) {
        const key = clipKeyForItem(c.item);
        if (key && !items.has(key)) items.set(key, pickTextInfo(c.item, lang).text);
      }
    }
  }
  for (const [key, text] of items) add(key, text, 'thing or number in a cell, said when Space is pressed');

  for (const s of sections) add(clipKeyForSection(s), pickTextInfo(s.title, lang).text, 'section name in the lesson list');

  // Screen view first (the keys recorded so far), then the reader's view versions.
  for (const pov of ['screen', 'reader']) for (const lesson of lessons) {
    setState('pov', pov);
    const view = pov === 'reader' ? ", reader's view" : '';
    add(clipKeyForTitle(lesson), pickTextInfo(lesson.title, lang).text, 'lesson title');
    for (const p of lesson.intro.paragraphs) add(clipKeyForParagraph(lesson, p), pickTextInfo(povText(p, 'text'), lang).text, `introduction paragraph${view}`);
    for (const ex of lesson.exercises) {
      const note = ex.type === 'relative-move' ? 'question (the start cell sentence is joined from ui/num clips)' : 'question';
      // For choice questions the options are separate clips, so the question clip is only the first line.
      add(clipKeyForPrompt(lesson, ex), promptText(lesson, ex, null, lang).split('\n')[0], `${note}${view}`);
      (ex.options ?? []).forEach((_, i) => {
        const [part] = optionParts(lesson, ex, i + 1, lang);
        add(part.key, part.text, 'answer option (read with its number)');
      });
    }
  }

  const csv = ['key,file,text_to_read,note', ...rows.map((r) => r.map(csvCell).join(','))].join('\r\n');
  // The BOM makes Excel open the Bangla text correctly.
  writeFileSync(join(ROOT, `audio-scripts/${lang}.script.csv`), `﻿${csv}\r\n`, 'utf8');
  console.log(`audio-scripts/${lang}.script.csv: ${rows.length} clips`);
}
