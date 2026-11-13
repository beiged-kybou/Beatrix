/**
 * File:        src/audio/audio-manifest.js
 * What it is:  Knows which built-in recordings exist in assets/audio/.
 * What it does:
 *   - loadManifest()          reads assets/audio/manifest.json once
 *   - builtInClipUrl(key, l)  URL of a recorded clip, or null if not recorded yet
 *   - alignmentUrl(key, l)    URL of the word-timing file for a clip, or null
 *   - sfxUrl(name)            URL of a replacement sound effect, or null
 *
 * Naming rule (see audio-scripts/README.md):
 *   key 'ui.row'          -> assets/audio/<lang>/ui/ui.row.mp3
 *   key 'num.4'           -> assets/audio/<lang>/numbers/num.4.mp3
 *   key 'item.mango'      -> assets/audio/<lang>/items/item.mango.mp3
 *   key 'section.basics'  -> assets/audio/<lang>/sections/section.basics.mp3
 *   key 'l02.ex03.prompt' -> assets/audio/<lang>/lessons/l02.ex03.prompt.mp3
 *   alignment             -> same path, ending .align.json instead of .mp3
 *   sound effect 'dot'    -> assets/audio/sfx/dot.mp3
 * A clip is only used if its key is listed in manifest.json, so the app never
 * requests files that don't exist.
 * Depends on:  nothing.
 */

const AUDIO_ROOT = new URL('../../assets/audio/', import.meta.url);

let manifest = { en: [], bn: [], alignments: { en: [], bn: [] }, sfx: [] };
let sets = buildSets(manifest);

function buildSets(m) {
  return {
    clips: { en: new Set(m.en ?? []), bn: new Set(m.bn ?? []) },
    align: { en: new Set(m.alignments?.en ?? []), bn: new Set(m.alignments?.bn ?? []) },
    sfx: new Set(m.sfx ?? []),
  };
}

/** Load assets/audio/manifest.json. A missing or broken file means "no recordings". */
export async function loadManifest() {
  try {
    const res = await fetch(new URL('manifest.json', AUDIO_ROOT));
    if (res.ok) manifest = await res.json();
  } catch (err) {
    console.warn('[audio-manifest] could not load manifest.json; using TTS only.', err);
  }
  sets = buildSets(manifest);
}

/** Folder for a key, decided by its first part. */
export function folderForKey(key) {
  const category = key.split('.')[0];
  if (category === 'ui') return 'ui';
  if (category === 'num') return 'numbers';
  if (category === 'item') return 'items';
  if (category === 'section') return 'sections';
  if (/^l\d+$/.test(category)) return 'lessons';
  return 'other';
}

/** Relative path of a clip inside assets/audio/ (also used by the script generator). */
export function clipPath(key, lang) {
  return `${lang}/${folderForKey(key)}/${key}.mp3`;
}

export function builtInClipUrl(key, lang) {
  if (!sets.clips[lang]?.has(key)) return null;
  return new URL(clipPath(key, lang), AUDIO_ROOT).href;
}

export function alignmentUrl(key, lang) {
  if (!sets.align[lang]?.has(key)) return null;
  return new URL(clipPath(key, lang).replace(/\.mp3$/, '.align.json'), AUDIO_ROOT).href;
}

export function sfxUrl(name) {
  if (!sets.sfx.has(name)) return null;
  return new URL(`sfx/${name}.mp3`, AUDIO_ROOT).href;
}
