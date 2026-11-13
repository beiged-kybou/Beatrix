/**
 * File:        src/ui/screen-home.js
 * What it is:  The student home screen: the list of lessons, in sections.
 * What it does:
 *   Shows the built-in sections ("Basics", "Finding your way", "Diagonals",
 *   "Numbers in the matrix") and then "Teacher's lessons" (custom lessons).
 *   ↑ / ↓ move between lessons and say the title (and "finished" if done);
 *   when moving into another section its name is said first.
 *   Page Down / Page Up jump to the first lesson of the next / previous section.
 *   Enter opens the lesson. Nothing is spoken until a key is pressed.
 *   Shows a warning for teachers if this computer has no voice for the language.
 * Mount:       mountHome(root, { onOpenLesson(lesson) }) -> cleanup function
 * Depends on:  lessons/lesson-catalog.js, lessons/lesson-schema.js, storage/progress-store.js,
 *              audio/*, i18n/language.js, core/event-bus.js
 */

import { getCatalog } from '../lessons/lesson-catalog.js';
import { clipKeyForTitle, clipKeyForSection } from '../lessons/lesson-schema.js';
import { isFinished } from '../storage/progress-store.js';
import * as speech from '../audio/speech-service.js';
import * as sfx from '../audio/sound-effects.js';
import { spoken } from '../audio/phrase-composer.js';
import { hasVoice, whenVoicesReady } from '../audio/tts-engine.js';
import { getLang, setLang, otherLang, t, pickTextInfo } from '../i18n/language.js';
import { on } from '../core/event-bus.js';

export async function mountHome(root, { onOpenLesson }) {
  const catalog = await getCatalog();
  const screen = document.createElement('section');
  screen.className = 'screen home';
  screen.dataset.navRoot = '';
  root.append(screen);

  /** Flat list of { lesson, section, button } in on-screen order. section = { id, speech() }. */
  let items = [];

  /** Sections as shown: built-in ones, then "Teacher's lessons". */
  function shownSections() {
    const builtIn = catalog.sections.map((s) => ({
      id: s.id,
      title: () => pickTextInfo(s.title).text,
      speech: () => {
        const info = pickTextInfo(s.title);
        return { key: clipKeyForSection(s), text: info.text, lang: info.lang };
      },
      lessons: s.lessons,
    }));
    const teachers = {
      id: 'teachers',
      title: () => t('spoken.teachers_lessons'),
      speech: () => spoken('teachers_lessons'),
      lessons: catalog.custom,
    };
    return [...builtIn, teachers];
  }

  function render() {
    screen.replaceChildren();
    items = [];

    const banner = document.createElement('p');
    banner.className = 'banner';
    banner.hidden = true;
    whenVoicesReady().then(() => {
      if (!hasVoice(getLang())) {
        banner.textContent = t('screen.no_voice', { language: t('spoken.language_name') });
        banner.hidden = false;
      }
    });

    const list = document.createElement('div');
    list.className = 'lesson-list';
    list.tabIndex = 0;
    list.setAttribute('role', 'application');
    list.setAttribute('aria-label', t('spoken.lessons'));
    list.dataset.navContext = 'list';

    for (const section of shownSections()) addSection(list, section);

    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = t('screen.home_hint');

    screen.append(banner, list, hint);
    list.focus();
  }

  function addSection(list, section) {
    const h = document.createElement('h2');
    h.textContent = section.title();
    list.append(h);
    if (!section.lessons.length) {
      const p = document.createElement('p');
      p.className = 'empty';
      p.textContent = t('spoken.no_teachers_lessons');
      list.append(p);
      return;
    }
    const ul = document.createElement('ul');
    for (const lesson of section.lessons) {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lesson-item';
      button.tabIndex = -1;
      button.textContent = pickTextInfo(lesson.title).text;
      if (isFinished(lesson.id)) {
        const done = document.createElement('span');
        done.className = 'done';
        done.textContent = ` ${t('screen.done_mark')}`;
        button.append(done);
      }
      button.addEventListener('click', () => onOpenLesson(lesson));
      li.append(button);
      ul.append(li);
      items.push({ lesson, section, button });
    }
    list.append(ul);
  }

  function focusedIndex() {
    return items.findIndex((it) => it.button === document.activeElement);
  }

  function moveTo(i, fromSectionId) {
    if (i < 0 || i >= items.length) {
      sfx.edge();
      return;
    }
    const item = items[i];
    item.button.focus();
    const title = pickTextInfo(item.lesson.title);
    const parts = [];
    if (item.section.id !== fromSectionId) parts.push(item.section.speech());
    parts.push({ key: clipKeyForTitle(item.lesson), text: title.text, lang: title.lang });
    if (isFinished(item.lesson.id)) parts.push(spoken('completed'));
    speech.speak(parts);
  }

  /** First lesson of the next (+1) or previous (-1) section that has lessons. */
  function sectionJump(i, delta) {
    const current = items[i]?.section.id ?? null;
    const starts = items
      .map((it, idx) => ({ id: it.section.id, idx }))
      .filter((s, idx, all) => idx === 0 || all[idx - 1].id !== s.id);
    const here = starts.findIndex((s) => s.id === current);
    if (here === -1) return delta > 0 ? 0 : -1; // nothing focused yet: Page Down goes to the first section
    const target = starts[here + delta];
    return target ? target.idx : -1;
  }

  const offCommand = on('command', ({ name }) => {
    const i = focusedIndex();
    const fromSection = items[i]?.section.id ?? null;
    switch (name) {
      case 'LIST_NEXT':
        moveTo(i + 1, fromSection);
        break;
      case 'LIST_PREV':
        moveTo(i === -1 ? 0 : i - 1, fromSection);
        break;
      case 'SECTION_NEXT':
        moveTo(sectionJump(i, 1), fromSection);
        break;
      case 'SECTION_PREV':
        moveTo(sectionJump(i, -1), fromSection);
        break;
      case 'SELECT':
        if (items[i]) onOpenLesson(items[i].lesson);
        break;
      case 'LANGUAGE_TOGGLE':
        setLang(otherLang());
        render();
        speech.speak([spoken('language_name')]);
        break;
      case 'HELP':
        speech.speak([spoken('help_list')]);
        break;
      case 'STOP':
        speech.stop();
        break;
      default:
        break;
    }
  });

  render();
  return () => offCommand();
}
