/**
 * File:        tests/text-pane.test.js
 * What it is:  Unit tests verifying createTextPane discrete sentence playback,
 *              continuous play/pause/resume, and sentence navigation.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Minimal mock DOM for Node test environment
class MockElement {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.textContent = '';
    this.dataset = {};
    this.attributes = {};
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  append(...nodes) {
    for (const n of nodes) {
      if (typeof n === 'string') {
        this.textContent += n;
      } else {
        this.children.push(n);
        this.textContent += n.textContent || '';
      }
    }
  }
  remove() {}
  scrollIntoView() {}
}

const playedUrls = [];
let pendingAudioResolve = null;

class MockAudio {
  constructor() {
    this.volume = 1;
    this.src = '';
    this.currentTime = 0;
    this.readyState = 4;
  }
  play() {
    playedUrls.push(this.src);
    return new Promise((resolve) => {
      pendingAudioResolve = () => {
        this.onended?.();
        resolve();
      };
    });
  }
  pause() {}
  load() {}
  addEventListener(evt, cb) {
    if (evt === 'loadedmetadata') {
      setTimeout(cb, 0);
    }
  }
}

globalThis.document = {
  createElement(tag) {
    return new MockElement(tag);
  },
};
globalThis.Audio = MockAudio;
globalThis.cancelAnimationFrame = () => {};
globalThis.requestAnimationFrame = () => {};

// Mock fetch for manifest
const manifestData = JSON.parse(fs.readFileSync(path.resolve('assets/audio/manifest.json'), 'utf8'));
globalThis.fetch = async () => {
  return {
    ok: true,
    json: async () => manifestData,
  };
};

test('TextPane parses Lesson 3 paragraphs into discrete standalone sentence clips and navigates', async () => {
  const { loadManifest } = await import('../src/audio/audio-manifest.js');
  const { createTextPane } = await import('../src/ui/text-pane.js');

  await loadManifest();

  const lessonPath = path.resolve('content/lessons/lesson-03.json');
  const lesson = JSON.parse(fs.readFileSync(lessonPath, 'utf8'));

  const blocks = lesson.intro.paragraphs.map((p) => ({
    text: p.text.bn,
    lang: 'bn',
    clipKey: `${lesson.id}.intro.${p.id}`,
  }));

  const parent = document.createElement('div');
  const pane = createTextPane(parent, 'Text Area');

  await pane.setBlocks(blocks);

  // 1. Continuous playback: Space starts playing sentence 1
  playedUrls.length = 0;
  assert.equal(pane.handle('TOGGLE_PLAY'), true);
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(playedUrls.length, 1);
  assert.ok(playedUrls[0].includes('l03.intro.p01.s01.mp3'), `Expected s01, got ${playedUrls[0]}`);

  // 2. Sentence 1 finishes naturally -> auto-plays sentence 2
  const finishS1 = pendingAudioResolve;
  finishS1();
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(playedUrls.length, 2);
  assert.ok(playedUrls[1].includes('l03.intro.p02.s01.mp3'), `Expected p02.s01, got ${playedUrls[1]}`);

  // 3. Pause (Space)
  assert.equal(pane.handle('TOGGLE_PLAY'), true);
  const prevCount = playedUrls.length;
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(playedUrls.length, prevCount);

  // 4. Resume (Space) -> replays current paused sentence and continues
  assert.equal(pane.handle('TOGGLE_PLAY'), true);
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(playedUrls.length, prevCount + 1);
  assert.ok(playedUrls.at(-1).includes('l03.intro.p02.s01.mp3'));

  // 5. ArrowRight steps to next sentence (p02.s02) and stops continuous loop
  assert.equal(pane.handle('NEXT_UNIT'), true);
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(playedUrls.at(-1).includes('l03.intro.p02.s02.mp3'));

  // When p02.s02 finishes naturally, it should NOT auto-advance because ArrowRight was discrete
  const finishDiscrete = pendingAudioResolve;
  finishDiscrete();
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(playedUrls.at(-1).includes('l03.intro.p02.s02.mp3'), 'Should not auto-advance in discrete mode');

  // 6. ArrowLeft steps back to prev sentence (p02.s01)
  assert.equal(pane.handle('PREV_UNIT'), true);
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(playedUrls.at(-1).includes('l03.intro.p02.s01.mp3'));

  pane.destroy();
});
