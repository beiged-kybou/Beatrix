/**
 * File:        tests/sentence-audio.test.js
 * What it is:  Unit tests verifying sentence extraction and audio clip key mapping
 *              for dari-to-dari standalone sentence playback.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { segment } from '../src/text-navigation/segmenter.js';

test('Lesson 3 paragraphs segment into exact dari-to-dari sentences', () => {
  const lessonPath = path.resolve('content/lessons/lesson-03.json');
  const lesson = JSON.parse(fs.readFileSync(lessonPath, 'utf8'));

  const paragraphs = lesson.intro.paragraphs;
  assert.equal(paragraphs.length, 4);

  const sentences = [];
  for (const p of paragraphs) {
    const sents = segment(p.text.bn, 'sentence', 'bn');
    for (let i = 0; i < sents.length; i++) {
      sentences.push({
        key: `${lesson.id}.intro.${p.id}.s${String(i + 1).padStart(2, '0')}`,
        text: sents[i].text,
      });
    }
  }

  assert.equal(sentences.length, 11);
  assert.equal(sentences[0].key, 'l03.intro.p01.s01');
  assert.equal(sentences[0].text, 'এবার তুমি নিজেই একটি ম্যাট্রিক্সের আকার বের করবে।');
  assert.equal(sentences[1].key, 'l03.intro.p02.s01');
  assert.equal(sentences[2].key, 'l03.intro.p02.s02');
  assert.equal(sentences[10].key, 'l03.intro.p04.s04');
  assert.equal(sentences[10].text, 'শুরু করতে অল্ট এন চাপো।');
});

test('All Lesson 3 sentence audio clips exist and are registered in manifest.json', () => {
  const manifestPath = path.resolve('assets/audio/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const bnClips = new Set(manifest.bn);

  const expectedKeys = [
    'l03.intro.p01.s01',
    'l03.intro.p02.s01',
    'l03.intro.p02.s02',
    'l03.intro.p03.s01',
    'l03.intro.p03.s02',
    'l03.intro.p03.s03',
    'l03.intro.p03.s04',
    'l03.intro.p04.s01',
    'l03.intro.p04.s02',
    'l03.intro.p04.s03',
    'l03.intro.p04.s04',
  ];

  for (const key of expectedKeys) {
    assert.ok(bnClips.has(key), `Key ${key} should be in manifest.json["bn"]`);
    const mp3Path = path.resolve(`assets/audio/bn/lessons/${key}.mp3`);
    assert.ok(fs.existsSync(mp3Path), `Audio file ${mp3Path} must exist`);
    const stats = fs.statSync(mp3Path);
    assert.ok(stats.size > 1000, `Audio file ${mp3Path} must not be empty`);
  }
});

