/**
 * File:        src/i18n/language.js
 * What it is:  The language layer (English / Bangla).
 * What it does:
 *   - loadStrings()        fetches i18n/strings/en.json and bn.json once at start
 *   - registerStrings()    sets them directly (for Node tools and tests)
 *   - getLang()/setLang()  active language; remembered on this device
 *   - t('spoken.row', {n}) looks up a phrase in the active language and fills {placeholders}
 *   - pickText({en,bn})    picks the active language from a bilingual text,
 *                          falling back to the other language if it is empty (decision C9)
 *   Strings sections: 'spoken' (phrases the app says; each has a clip key ui.<name>),
 *   'screen' (visible labels only), 'templates' (sentences with {placeholders}),
 *   'symbols' (names of characters in letter mode), 'speech' (replacements before TTS).
 * Depends on:  core/app-state.js, config/settings.js
 */

import { getState, setState } from '../core/app-state.js';
import { SETTINGS } from '../config/settings.js';

export const LANGUAGES = ['en', 'bn'];
const STORAGE_KEY = '6dots.language';

const strings = { en: null, bn: null };

/** Fetch both string files. Call once before the first screen is shown. */
export async function loadStrings() {
  const base = new URL('./strings/', import.meta.url);
  for (const lang of LANGUAGES) {
    const res = await fetch(new URL(`${lang}.json`, base));
    registerStrings(lang, await res.json());
  }
  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch { /* storage blocked: use default */ }
  setState('language', LANGUAGES.includes(saved) ? saved : SETTINGS.defaultLanguage);
  document.documentElement.lang = getLang();
}

/** Set the strings for one language directly (used by loadStrings, tools and tests). */
export function registerStrings(lang, data) {
  strings[lang] = data;
}

export function getLang() {
  return getState('language');
}

/** Switch language and remember it on this device. */
export function setLang(lang) {
  if (!LANGUAGES.includes(lang)) return;
  setState('language', lang);
  document.documentElement.lang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch { /* ignore */ }
}

/** The other language ('en' <-> 'bn'). */
export function otherLang(lang = getLang()) {
  return lang === 'en' ? 'bn' : 'en';
}

/** The whole strings object for a language (used by pure modules that take strings as input). */
export function getStrings(lang = getLang()) {
  return strings[lang];
}

/**
 * Look up a phrase by dotted path, e.g. t('templates.exercise_heading', { n: 2, total: 5 }).
 * Missing phrases fall back to English, then to the path itself, so a typo is visible.
 */
export function t(path, vars = {}, lang = getLang()) {
  const lookup = (l) => path.split('.').reduce((obj, k) => obj?.[k], strings[l]);
  const raw = lookup(lang) ?? lookup('en') ?? path;
  return fillTemplate(raw, vars);
}

/** Replace {name} placeholders. */
export function fillTemplate(template, vars) {
  return String(template).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/**
 * Pick one language out of a bilingual text object { en, bn }.
 * Falls back to the other language if the wanted one is empty.
 */
export function pickText(bilingual, lang = getLang()) {
  return pickTextInfo(bilingual, lang).text;
}

/**
 * Like pickText, but also says which language the text really is in,
 * so speech can use the matching voice when a fallback happened.
 * @returns {{ text: string, lang: string }}
 */
export function pickTextInfo(bilingual, lang = getLang()) {
  const wanted = (bilingual?.[lang] ?? '').trim();
  if (wanted) return { text: wanted, lang };
  const other = otherLang(lang);
  return { text: (bilingual?.[other] ?? '').trim(), lang: other };
}
