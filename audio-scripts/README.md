# Recording your own voice

The app speaks with the computer's text-to-speech (TTS) voice by default.
Recordings **replace** TTS one phrase at a time, so you can record a few phrases or all of them.
Recordings matter most for **Bangla**, because many Windows computers have no Bangla voice.

## 1. What to record

| File | What it contains |
|---|---|
| `en.script.csv` | Every English phrase: key, where to save the file, the exact text to read |
| `bn.script.csv` | The same for Bangla |

Open the CSV in Excel or Google Sheets. **Each row is one audio file.**

The scripts are generated from the app's own text. After changing lesson text or phrases, regenerate them:

```bash
node tools/generate-audio-scripts.js
```

## 2. Naming and folders

The file name is always **`<key>.mp3`**. The key is the same in both languages; only the language folder changes.

| Key starts with | Folder | Example |
|---|---|---|
| `ui.` | `assets/audio/<lang>/ui/` | `assets/audio/bn/ui/ui.row.mp3` ("সারি") |
| `num.` | `assets/audio/<lang>/numbers/` | `assets/audio/bn/numbers/num.4.mp3` ("৪"). Also used when Space reads a number in a cell (Lessons 15–17 go up to 100) |
| `item.` | `assets/audio/<lang>/items/` | `assets/audio/bn/items/item.mango.mp3` ("আম"): said when Space is pressed on a cell |
| `section.` | `assets/audio/<lang>/sections/` | `assets/audio/bn/sections/section.numbers.mp3` ("ম্যাট্রিক্সে সংখ্যা"): section names in the lesson list |
| `l01.` … `l19.` | `assets/audio/<lang>/lessons/` | `assets/audio/en/lessons/l02.ex03.prompt.mp3` |
| sound effects | `assets/audio/sfx/` | `dot.mp3`, `edge.mp3`, `correct.mp3`, `wrong.mp3`, `mode.mp3`, `new.mp3` |

Lesson keys mean: `l02.ex03.prompt` = lesson 2, exercise 3, the question. `l08.ex06.opt2` = lesson 8, exercise 6, answer option 2 (read with its number: "2. (5, 2)"). `l01.intro.p04` = lesson 1, introduction paragraph 4. `l01.title` = lesson 1's title.

## 3. Turn a recording on

A recording is only used once its key is listed in **`assets/audio/manifest.json`**:

```json
{
  "en": ["ui.row", "ui.column", "num.1", "num.2"],
  "bn": ["ui.row", "ui.column", "l02.ex01.prompt"],
  "alignments": { "en": [], "bn": [] },
  "sfx": ["correct"]
}
```

Anything not listed keeps using TTS, so a half-finished set of recordings is fine.

## 4. Recording tips

- **Format:** mp3, mono, 44.1 kHz, 96–128 kbps.
- **Room:** quiet room, phone or mic about 20 cm from your mouth, no music or fan.
- **Silence:** leave less than 0.2 s at the start and end. The `ui.*` and `num.*` clips are joined together ("row" + "4" + "column" + "7"), so long silences sound broken.
- **Voice:** speak clearly and a little slower than normal. Use a friendly voice; the listeners are children.
- **Keep the same voice and distance** for all clips, so joined phrases sound like one sentence.
- Free tools: Audacity (desktop), or any phone voice recorder app, then convert to mp3.

## 5. Audio word mode (Alt+T, then A): alignment files

Audio word mode plays the recording **one word at a time**. For that, the app needs to know when each word starts and ends. This is a small JSON file next to the clip:

```
assets/audio/en/lessons/l01.intro.p01.mp3
assets/audio/en/lessons/l01.intro.p01.align.json
```

```json
[
  { "w": "A",      "start": 0.10, "end": 0.18 },
  { "w": "matrix", "start": 0.20, "end": 0.71 }
]
```

The words must be in the same order as in the text. Then add the key to `"alignments"` in the manifest.

**Making alignment files automatically.** A *forced aligner* does it from the audio and the text:

- **WhisperX** (English and Bangla): `whisperx l01.intro.p01.mp3 --language bn --output_format json`, then copy each word's `word`, `start` and `end` into the format above.
- **Meta MMS forced aligner** (`torchaudio.pipelines.MMS_FA`) also supports Bangla.

Without an alignment file, audio word mode still works: it reads word by word with TTS.

## 6. Recordings made in tutor mode

Teachers can also record or upload voice clips **inside the app** (tutor mode, for their own lessons). Those are saved in the browser on that device, not in these folders. They travel with the lesson when it is exported.
