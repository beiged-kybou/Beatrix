# Implementation — Iteration 1  (merged: base system + Lessons 1–4 + Tutor/Student modes)

| Field | Value |
|---|---|
| Status | **APPROVED (2026-11-04), implemented; see Part D** |
| Date | 2026-11-04 |
| Goal | Build the base system, the "Matrix Basics" module (Lessons 1–4), the Ctrl+T+A interactive transcript, and **Student / Tutor modes** where tutors create and edit custom lessons using the same template |
| History | The draft for iteration 2 (tutor/student modes) was merged into this file at your request. The next request will be iteration 2 |

> **How this file works (applies to every iteration)**
> 1. **Part A (Draft plan):** I write it, you edit it here (change, delete, or add things).
> 2. **Part B (Critique & alternatives):** what I think could go wrong and the other options. Pick one by writing ✅ next to it.
> 3. **Part C (Open questions):** please answer them inline.
> 4. After you approve, I implement and then fill in **Part D (Final implementation log)** with what was built, any differences from the plan, and how to run it.

---

## YOUR DECISIONS (2026-11-04). These override anything below.

| # | Decision |
|---|---|
| C1 | **Forward = row number goes up** (1 → 2 → 3, moving away). **Right = column number goes up.** ↑ = forward = next row. **The screen shows it the same way**: row 1 at the bottom, rows grow upward |
| C2 | An exercise speaks its question **only when R is pressed** |
| C3 | Lesson 3: type rows → Enter → columns → Enter |
| C4 | Lesson 4: the child starts at the given cell, moves freely, and presses Enter on the answer |
| C5 | Wrong answer: **retry until right, or skip** (Alt+N) |
| C6 | Not answered, so I'm going with **child-friendly standard Bangla (চলিত ভাষা)** using textbook terms: ম্যাট্রিক্স, সারি, কলাম, ঘর |
| C7 | No accounts. Progress (lessons finished) is remembered on the device only |
| C8 | Tutors are **sighted teachers** |
| C9 | One language is required, the other optional; missing text falls back to the filled one |
| C10 | My input: tutors pick which cells speak: **Default for this type / All / None / Custom list** |
| C11 | Max matrix size **15 × 15** |
| C12 | Custom lessons appear in a separate **"Teacher's lessons"** section |
| B1 | **B1-a**: Alt+L / Alt+W / Alt+S, Alt+T then A |
| B2 | **B2-a**: recorded clips first, TTS fallback |
| B7 | **No PIN, no tutor accounts.** Typing the password **`zxcvbnm1234`** anywhere in student mode opens tutor mode |
| B12 | Later |
| Rest | My recommendations: B3 joined clips, B4 edge bump + stereo panning + row pitch (each can be switched off), B6-a IndexedDB + export/import, B8-a read-only built-ins with Duplicate, B9-a Opus/WebM, B11 plain JS. **B5: build everything in one go** |

---

## PART A — DRAFT PLAN

### A1. Tech choices

| Area | Choice | Why |
|---|---|---|
| Language | Plain JavaScript (ES modules), HTML, CSS. **No framework, no build step** | Runs on any static host (GitHub Pages, Netlify, a school server). Easy to read and to change later |
| Running locally | `npx serve .` or `python -m http.server` | ES modules don't load over `file://`, so a tiny local server is needed |
| Speech (default) | Web Speech API (`speechSynthesis`) | Free, built into browsers, no files needed |
| Speech (custom) | Recorded clips that override TTS, one key at a time | Lets you record your own voice; also needed because Bangla TTS is often missing (see B2) |
| Sound effects | Generated with the Web Audio API by default, can be replaced with files | Works with zero audio files from day one |
| Text splitting | `Intl.Segmenter` (grapheme / word / sentence) | Splits Bangla correctly: কি is one letter, not two code points |
| Custom lesson storage | IndexedDB + export/import files | Offline, no server (see B6) |
| Tests | `node --test` on the pure-logic modules (matrix, tokenizer, checkers, validator) | No dependencies |
| Languages | English (`en`) and Bangla (`bn`) only | As requested |

### A2. Folder structure (one job per file)

```
6DotsLab2/
├── index.html                      Single page shell; loads src/main.js
├── README.md                       How to run, host, add audio, use tutor mode
├── internal_logs/
│   └── implementation_iterationX.md
│
├── styles/
│   ├── base.css                    Reset, fonts, high-contrast colors
│   ├── matrix.css                  Grid look only
│   └── tutor.css                   Editor-only styles
│
├── src/
│   ├── main.js                     Starts the app and wires the modules together
│   │
│   ├── core/
│   │   ├── event-bus.js            Tiny publish/subscribe so modules don't import each other
│   │   └── app-state.js            Current language, mode, lesson, cursor (one source of truth)
│   │
│   ├── config/
│   │   ├── keybindings.js          ALL keyboard shortcuts in one table (easy to change)
│   │   └── settings.js             Speech rate, volume, default language
│   │
│   ├── input/
│   │   └── keyboard-router.js      Turns key presses into named commands ("MOVE_RIGHT", "MODE_WORD"…)
│   │
│   ├── modes/
│   │   ├── mode-manager.js         Switches between student and tutor mode; tells other modules
│   │   └── tutor-gate.js           PIN prompt for entering tutor mode; set/change PIN
│   │
│   ├── i18n/
│   │   ├── language.js             Gets/sets the active language
│   │   └── strings/
│   │       ├── en.json             UI phrases ("row", "column", "correct"…)
│   │       └── bn.json
│   │
│   ├── audio/
│   │   ├── audio-manifest.js       Loads assets/audio/manifest.json: which built-in clip keys exist
│   │   ├── clip-player.js          Plays a recorded file or blob
│   │   ├── tts-engine.js           Wraps speechSynthesis (voice picked per language)
│   │   ├── speech-service.js       speak(key or text): tutor clip, then built-in clip, then TTS. Interrupts the previous sound
│   │   ├── phrase-composer.js      Builds sequences like ["row", 3, "column", 4] from clips
│   │   └── sound-effects.js        dot, correct, wrong, edge-bump, mode-change (synth or file)
│   │
│   ├── text-navigation/
│   │   ├── segmenter.js            Splits text into letters / words / sentences
│   │   └── text-cursor.js          Moves through segments; reports the current one
│   │
│   ├── transcript/
│   │   ├── alignment-loader.js     Loads the word timing JSON for a recorded clip
│   │   └── transcript-navigator.js Word-by-word jumping inside recorded audio (transcript mode)
│   │
│   ├── matrix/
│   │   ├── matrix-model.js         Size, cell contents, bounds checks (no DOM)
│   │   ├── matrix-cursor.js        Current (row, col); move up/down/left/right
│   │   ├── matrix-view.js          Draws the grid (ARIA grid roles) and highlights the cursor
│   │   └── matrix-announcer.js     What each cell "says": full talk-back, dot, or silence, depending on the exercise rules
│   │
│   ├── lessons/
│   │   ├── lesson-schema.js        ★ THE single definition of the lesson and exercise template (built-in AND custom)
│   │   ├── lesson-validator.js     Checks a lesson against the schema + bounds rules; returns readable errors
│   │   ├── lesson-loader.js        Loads built-in lesson JSON
│   │   ├── lesson-catalog.js       Merges built-in + custom lessons into one list for student mode
│   │   ├── lesson-runner.js        Steps: intro, then exercises, then summary
│   │   └── checkers/               One file per exercise type
│   │       ├── number-answer.js        "How many rows?" (Lesson 1)
│   │       ├── find-cell.js            Go to (r,c) and press Enter (Lesson 2)
│   │       ├── matrix-size.js          Find m × n (Lesson 3)
│   │       └── relative-move.js        Start + moves = target cell (Lesson 4)
│   │
│   ├── storage/
│   │   ├── db.js                   Opens IndexedDB (one place for DB name and version)
│   │   ├── custom-lesson-store.js  save / load / list / delete custom lessons
│   │   ├── audio-clip-store.js     save / load / delete tutor-recorded clips (blobs)
│   │   └── lesson-pack-io.js       Export a lesson + its clips to one file; import with validation
│   │
│   ├── tutor/
│   │   ├── screen-tutor-home.js    Custom lesson list + actions
│   │   ├── screen-lesson-editor.js Title, intro paragraphs, exercise list
│   │   ├── field-builders.js       Helpers that make labelled, accessible inputs (en/bn pairs, number, cell picker)
│   │   ├── audio-recorder.js       Microphone record / upload / playback for one clip
│   │   ├── lesson-preview.js       Runs the lesson in student view, then returns
│   │   └── exercise-editors/
│   │       ├── number-answer-editor.js
│   │       ├── find-cell-editor.js
│   │       ├── matrix-size-editor.js
│   │       └── relative-move-editor.js
│   │
│   └── ui/
│       ├── live-region.js          aria-live text for screen readers and braille displays
│       ├── screen-home.js          Lesson list (student mode)
│       └── screen-lesson.js        Lesson screen (text pane + matrix pane)
│
├── content/
│   └── lessons/
│       ├── lesson-01.json          Built-in lessons; must pass lesson-validator
│       ├── lesson-02.json
│       ├── lesson-03.json
│       └── lesson-04.json
│
├── assets/
│   └── audio/
│       ├── manifest.json           Lists every built-in clip that exists (missing clips fall back to TTS)
│       ├── sfx/                    dot.mp3, correct.mp3, wrong.mp3, edge.mp3 (optional)
│       ├── en/
│       │   ├── ui/                 ui.row.mp3, ui.column.mp3, ui.correct.mp3 …
│       │   ├── numbers/            num.1.mp3 … num.100.mp3
│       │   ├── items/              item.apple.mp3 …
│       │   └── lessons/            l01.intro.p01.mp3 …  (+ l01.intro.p01.align.json)
│       └── bn/                     (same layout as en/)
│
├── audio-scripts/
│   ├── README.md                   Naming rules, format (mp3, mono, 44.1 kHz), recording tips, how to make alignment files
│   ├── en.script.csv               key, file path, text to read aloud
│   └── bn.script.csv
│
└── tests/
    ├── matrix-model.test.js
    ├── segmenter.test.js
    ├── checkers.test.js
    ├── lesson-validator.test.js
    └── lesson-pack-io.test.js
```

**Audio naming rule:** `<category>.<id>[.<part>].mp3`, the same key in both languages.
Example: key `l02.ex03.prompt` → `assets/audio/bn/lessons/l02.ex03.prompt.mp3`.
Each row in the script CSV is one file to record. To add a recording, record it, drop it in, and add the key to `manifest.json`. No code changes.
Tutor-recorded clips use the same key rule (`custom-7f3a.ex03.prompt`), but are stored in IndexedDB instead of `assets/`.

### A3. Keyboard (draft; see B1 for why I suggest changing the requested keys)

| Action | Your requested key | Recommended key (B1-a) |
|---|---|---|
| Letter mode | Ctrl+L | Alt+L |
| Word mode | Ctrl+W | Alt+W |
| Sentence mode | Ctrl+S | Alt+S |
| Transcript (audio-word) mode | Ctrl+T+A | Alt+T, then A |
| Next / previous unit (text) | → / ← | same |
| Move in matrix | ↑ ↓ ← → | same |
| Answer / select | Enter | same |
| Repeat the current prompt | — | R |
| Where am I? (speaks row, column) | — | Space (off in exercises where position must stay hidden) |
| Switch language | — | Ctrl+Shift+B |
| Stop speaking | — | Esc |
| Switch focus: text pane ↔ matrix pane | — | Tab |
| Enter / leave tutor mode | — | Alt+Shift+M, then PIN |

**Talk-back rule (as requested):** nothing speaks on its own. Speech starts only when the student moves (a letter, word, sentence, or cell). One exception: a short "Lesson 2, exercise 3. Press R to hear the question" when an exercise opens. See C2.

### A4. Lesson content (draft; edit the wording freely)

#### Lesson 1: What is a matrix?
Intro text, read with letter/word/sentence navigation:
1. "A matrix is a set of boxes arranged in straight lines, like seats in a classroom."
2. "Each box is called a cell."
3. "A row goes from left to right. A column goes from front to back." *(wording depends on the C1 decision)*
4. "We write the size of a matrix as m × n, read as 'm by n'. m is the number of rows. n is the number of columns."
5. "A 3 × 4 matrix has 3 rows and 4 columns, so it has 3 × 4 = 12 cells."
6. Practice: explore a 3 × 3 matrix, where every cell says its row and column.

**Exercise 1.1** (answer by typing a number and pressing Enter):
| # | Question | Answer |
|---|---|---|
| 1 | How many rows does a 5 × 5 matrix have? | 5 |
| 2 | How many cells does a 3 × 3 matrix have? | 9 |
| 3 | How many columns does a 2 × 4 matrix have? | 4 |
| 4 | How many rows does a 4 × 6 matrix have? | 4 |
| 5 | How many cells does a 2 × 5 matrix have? | 10 |

#### Lesson 2: Naming a cell, (row, column). 10 exercises
Intro: "Every cell has an address (row, column). (2, 3) means row 2, column 3. Row comes first."
Rules: only (1,1) speaks ("row 1, column 1"). Every other cell plays a **dot** sound. Hitting the edge plays an **edge bump**. Enter on the right cell plays **celebration**, on the wrong cell plays **"oh-oh"** (then the student can try again).

| # | Matrix | Item | Target |
|---|---|---|---|
| 1 | 3×3 | apple | (2,2) |
| 2 | 3×3 | ball | (1,3) |
| 3 | 4×4 | mango | (3,2) |
| 4 | 4×4 | cat | (4,4) |
| 5 | 5×5 | apple | (2,2) |
| 6 | 5×5 | book | (5,1) |
| 7 | 5×5 | banana | (3,4) |
| 8 | 5×5 | pencil | (1,5) |
| 9 | 5×5 | fish | (4,3) |
| 10 | 5×5 | star | (5,5) |
*(I start smaller than 5×5 to build up. You can make them all 5×5 if you prefer.)*

#### Lesson 3: How big is this matrix? 10 exercises
Rules: only the start cell (1,1), the **last cell of row 1** (end of the columns), and the **last cell of column 1** (end of the rows) speak. Everything else plays a dot. The student explores, then answers rows, then columns (see C3).

Sizes: 2×3, 3×2, 3×3, 4×2, 2×5, 4×4, 5×3, 3×6, 6×4, 5×5

#### Lesson 4: Where am I after moving? 5 exercises, 10×10 matrix
The student is told their start cell (random, always picked so the moves stay inside the matrix). They hear two move instructions, work out the new cell, then answer (see C4).

| # | Moves |
|---|---|
| 1 | 2 right, then 3 forward |
| 2 | 1 left, then 2 back |
| 3 | 3 right, then 1 back |
| 4 | 2 left, then 4 forward |
| 5 | 4 right, 2 forward, 1 left *(3 steps, a challenge)* |

"Right/left" means along the row (column number changes). "Forward/back" means along the column (row number changes). The direction of forward depends on C1.

### A5. Transcript mode (Ctrl+T+A / Alt+T, A)
- Each recorded lesson clip can have `<key>.align.json`: `[{ "w": "matrix", "start": 0.42, "end": 0.91 }, …]`.
- In transcript mode, ←/→ jumps to the previous/next word in the **recorded audio** and plays only that word. Ctrl+←/→ jumps by sentence. Enter plays from that word onward.
- The visible text highlights the current word, for sighted teachers and low-vision students.
- Timing files can be made automatically with a forced aligner (WhisperX or the MMS aligner, both support Bangla). The steps go in `audio-scripts/README.md`.
- If a clip has no timing file, the app falls back to TTS word-by-word.

### A6. One lesson template for everyone
Built-in lessons and tutor-made lessons use **exactly the same JSON format**, defined in **one file** (`lesson-schema.js`).
- The student side doesn't know or care whether a lesson is built-in or custom.
- The editor forms are generated from the same definition, so the template can't drift apart.
- Adding a new exercise type later means adding one schema entry, one checker, and one editor form.

```json
{
  "id": "custom-7f3a",
  "source": "custom",            // "builtin" | "custom"
  "title":  { "en": "Fruits in a grid", "bn": "ছকে ফল" },
  "intro":  [ { "en": "…", "bn": "…", "audio": { "en": "clip-id", "bn": "clip-id" } } ],
  "exercises": [ /* see A7 */ ],
  "settings": { "onWrong": "retry" | "revealAfter2", "autoSpeakPrompt": true },
  "createdAt": "…", "updatedAt": "…", "version": 1
}
```

### A7. Exercise types (shared by built-in lessons and the tutor editor)

| Type | Tutor fills in | Checks done automatically |
|---|---|---|
| `number-answer` (Lesson 1 style) | Question text (en/bn), the correct number, an optional matrix size to explore | Answer is a whole number |
| `find-cell` (Lesson 2 style) | Matrix size m×n, item name (en/bn), target (r,c), which cells speak (default: only (1,1)) | Target is inside the matrix; m and n are 1–10 |
| `matrix-size` (Lesson 3 style) | Size m×n, which cells speak (default: start, end of row 1, end of column 1) | m, n are 1–10 |
| `relative-move` (Lesson 4 style) | Matrix size, start cell (**fixed** or **random**), a list of moves (direction + steps) | Every move stays inside the matrix; with a random start, at least one valid start must exist |

Every exercise can have an optional recorded or uploaded voice clip for its question, in each language. Without one, the app uses TTS.

### A8. Student mode and tutor mode

**Student mode (default when the app opens)**
- Lesson list = built-in lessons, then custom lessons, all navigable with the keyboard and spoken.
- Nothing editable. No editing shortcuts are active.

**Tutor mode**
- Entered with **Alt+Shift+M** plus a **4-digit PIN**. This keeps children from wandering in by accident. It is **not** real security (see B7).
- Tutor home screen: list of custom lessons with **New / Edit / Duplicate / Delete / Preview / Export / Import**.
- **Built-in lessons are read-only**, but can be **duplicated** into an editable custom copy (see B8).
- **Lesson editor:** title, intro paragraphs, and an exercise list (add, remove, move up/down). Each exercise opens the form for its type.
- **Preview** runs the lesson exactly as a student would, then returns to the editor.
- **Voice:** a **Record** button (microphone, MediaRecorder API) and an **Upload** button (mp3/wav/ogg), with play back, re-record, or delete per clip.
- The editor is a normal web form: labelled fields, error messages read aloud, works with NVDA.

### A9. Storage (no server yet)

| What | Where | Why |
|---|---|---|
| Custom lessons | Browser **IndexedDB** on that device | Survives restarts and holds much more than localStorage |
| Tutor audio clips | IndexedDB (as audio blobs) | Recordings stay with the lesson |
| Sharing to other devices | **Export as a lesson pack** (one `.6dots.json` file, audio embedded) → **Import** on the student's device | Works offline, can be sent by USB, WhatsApp, or email |
| Future hosting | The storage modules have one interface (`save / load / list / delete`), so a server version can replace them later without touching the UI | Ready for when you host it |

### A10. Build order inside this iteration
1. Core, config, keyboard router, i18n
2. Audio (TTS, clips, sound effects, phrase composer)
3. Text navigation (letter / word / sentence)
4. Matrix model, cursor, view, announcer
5. Lesson schema + validator → four built-in lessons → lesson runner + checkers → student screens
6. Transcript mode
7. Storage → tutor gate → tutor screens → exercise editors → preview → export/import
8. Audio recording scripts (en + bn CSV, README)
9. Tests, README, and the Part D log

---

## PART B — CRITIQUE & ALTERNATIVES  *(mark your pick with ✅)*

### B1. ⚠️ Biggest problem: the requested shortcuts clash with the browser
- **Ctrl+W closes the browser tab.** A blind child would lose the lesson with one key.
- **Ctrl+T opens a new tab.** Chrome does **not** let web pages block Ctrl+T, Ctrl+W, or Ctrl+N. So **Ctrl+T+A cannot work in a normal browser.**
- Ctrl+L jumps to the address bar. Ctrl+S opens "Save page". These *can* be blocked, but it's fragile.
- Screen readers (NVDA is the most common in Bangladesh, since it's free) take over many keys in "browse mode". The lesson area needs `role="application"` so the keys reach the app.

Options:
- **B1-a (recommended):** Use **Alt+L / Alt+W / Alt+S** for modes and **Alt+T, then A** for transcript mode. None are reserved by Chrome on Windows. All keys live in `keybindings.js`, so changing them later is a one-line edit.
- **B1-b:** Plain single keys inside the lesson (L, W, S, T). Easiest for children. **But** it clashes with future braille typing, which uses S D F J K L as the six dots. Not recommended.
- **B1-c:** Keep the Ctrl keys and ship the app as a desktop app (Electron or Tauri), which *can* capture Ctrl+W and Ctrl+T. Downside: an installer is needed, and it's no longer just a web page. Possible later; the modular code makes the switch easy.

### B2. Bangla text-to-speech is unreliable
Many Windows PCs have **no Bangla voice**. Chrome's online Google Bangla voice exists on some systems and needs internet. Android Chrome is usually better.
- **B2-a (recommended):** Recorded clips are the main path for all lesson and UI phrases. TTS is only a fallback. I'll generate the full recording script (both languages, about 150–250 short clips including numbers 1–100).
- **B2-b:** Use a cloud TTS (Google or Azure Bangla neural voices) to make the MP3s once and store them as files. Good quality, no recording effort, works offline afterward. Costs a little and needs an API key.
- **B2-c:** TTS only. Simplest, but Bangla may be silent on many machines.

### B3. Speech by joining clips (for example "row 3 column 4")
Recorded sentences can't say every possible number. I'll join short clips (`ui.row` + `num.3` + `ui.column` + `num.4`). This sounds slightly robotic but works for any matrix size. Alternative: record every (r,c) phrase for 10×10, which is 100 clips per language. Not worth it.

### B4. Better spatial cognition (optional, recommended)
- **Stereo panning:** the dot sound comes from the left speaker or headphone in column 1 and from the right in the last column.
- **Pitch by row:** higher pitch at the top row, lower at the bottom.
- **Edge bump:** a distinct sound when you hit a wall, so the child "feels" the boundary.
This gives a sense of position without any speech. It costs about 20 lines in `sound-effects.js` and can be turned off in settings. Edge bump: I strongly recommend it. Panning and pitch: your call ✅/❌.

### B5. Size of this merged iteration
This is now a large first delivery (about 60 files). To keep it reviewable, I'll build in the A10 order and note in Part D anything that turned out different from the plan. If you'd rather review halfway (after step 5, with the student side working), write ✅ here and I'll stop there before building tutor mode.

### B6. Where custom lessons live
- **B6-a (recommended):** IndexedDB on the device + export/import files. No server, free, offline. The catch: a lesson made on the tutor's laptop must be **imported** on each student device.
- **B6-b:** A small backend (for example Firebase or Supabase) so lessons sync to every device automatically. Needs internet, accounts, and some running cost. Better once the app is hosted for many schools.
- **B6-c:** The tutor exports, and you copy the files into `content/custom/` on the hosted site, so every student gets them. No backend, but a manual upload step.

### B7. The PIN is not real security
Anything stored in the browser can be read by someone determined. The PIN only stops children from entering tutor mode by mistake. Real tutor accounts need the backend from B6-b. For now: **B7-a** a PIN ✅ / **B7-b** no PIN, only the secret shortcut / **B7-c** no lock at all.

### B8. Editing built-in lessons
- **B8-a (recommended):** Built-ins are read-only, with a "Duplicate to edit" option. Your official lessons can't be broken by accident, and app updates can still improve them.
- **B8-b:** Tutors can edit built-ins directly, with a "Reset to original" button. More flexible, but riskier.

### B9. Audio file size in lesson packs
Embedding audio makes pack files big (about 1 MB per minute of recording). To keep packs small for WhatsApp:
- **B9-a (recommended):** Record in Opus/WebM (the browser's default, about 10× smaller than wav).
- **B9-b:** Export as a `.zip` (needs one small library, JSZip). Slightly smaller, but two steps to open.

### B10. Who is the tutor?
If tutors are mostly **sighted teachers**, a visual editor with mouse support is fine. If many tutors are **blind**, the editor needs the same careful keyboard and audio design as student mode. That's roughly 30% more work, mostly in testing. The plan assumes **"works fully with NVDA, but designed visual-first."** See C8.

### B11. Plain JS vs. a framework
Plain JS keeps every file readable and needs no build step. The tutor editor is the most "app-like" part; if it grows much bigger later, it can move to Vite + TypeScript. The one-job-per-file structure makes that a mechanical change. **Recommend plain JS for now.**

### B12. Not included unless you ask
- Per-student progress or scores visible to the tutor (needs student profiles; good for a later iteration)
- New exercise types beyond the four (the schema makes this easy to add later)
- Bulk-creating exercises from a spreadsheet

---

## PART C — OPEN QUESTIONS  *(please answer inline)*

**C1. "Think from the user's POV": which way is forward?**
My suggestion: imagine the child standing at cell (1,1) at the front of the classroom, facing into the room.
→ **Forward** = row number goes **up** (1 → 2 → 3, moving away). **Right** = column number goes up.
→ The ↑ arrow then means "forward" = next row. Note: this is the *opposite* of how the screen looks (row 1 at the top, ↓ goes to row 2).
Is this what you mean? Or should forward mean toward row 1?
> Answer:

**C2. Should an exercise speak its question automatically when it opens, or only when R is pressed?**
> Answer:

**C3. Lesson 3 answer format:** type rows → Enter → columns → Enter? Or one entry like "3 4"?
(Also, I read "How big is this cell?" as "How big is this **matrix**?" Is that right?)
> Answer:

**C4. Lesson 4 answer format:** (a) navigate the 10×10 matrix to the cell and press Enter, with every cell silent or a dot, or (b) type the row and column numbers?
I recommend (a): the child is free to start at the given cell and move.
> Answer:

**C5. Wrong answer:** retry the same exercise until right? Or after 2 wrong tries, tell the answer and move on? (Tutors can change this per lesson.)
> Answer:

**C6. The voice for recordings:** who will record (you, a teacher)? Should I write the Bangla script in a formal or a child-friendly style?
> Answer:

**C7. Progress saving:** remember which lesson the child reached (on that device)? No accounts for now.
> Answer:

**C8. Are tutors mostly sighted, mostly blind, or both?**
> Answer:

**C9. Must every custom lesson have both English and Bangla, or can a tutor write in one language only?** (Suggestion: one is required, the other optional. Missing text falls back to the filled language.)
> Answer:

**C10. Can tutors set which cells speak in an exercise** (for example making 3 cells speak in a find-cell exercise), or always use the lesson defaults?
> Answer:

**C11. Matrix size limit for custom exercises:** is 10×10 the maximum?
> Answer:

**C12. In student mode, should custom lessons appear mixed with the built-in ones, or in a separate "Teacher's lessons" section?**
> Answer:

---

## PART D — FINAL IMPLEMENTATION LOG  (2026-11-04)

### D1. How to run
```
npm start          → http://localhost:8080   (no npm install needed; Node only)
npm test           → 26 unit tests
npm run audio-scripts → regenerate audio-scripts/en.script.csv and bn.script.csv
```
Use Chrome or Edge. Tutor mode: type `zxcvbnm1234` on the student home screen.

### D2. What was built
- **Base system:** event bus, app state, one keybinding table, keyboard router (contexts + Alt+T→A chord, uses physical keys so Bangla layouts work), EN/BN strings, Bangla digits in text, speech and answers.
- **Audio:** one `speak()` for the whole app: tutor recording → built-in recording (if listed in `manifest.json`) → TTS. Phrases like "row 3, column 4" are joined from small clips. Synthesized earcons: dot (stereo pan by column, pitch by row), edge thud, celebration, oh-oh, mode tick, new-exercise chime. Each can be replaced by a file.
- **Text navigation:** letter / word / sentence with `Intl.Segmenter` (Bangla grapheme clusters and the danda `।` handled). Highlight follows the reading position.
- **Audio word mode (Alt+T, then A):** word-by-word through the *recording* using `.align.json` timing files; Enter plays on from the current word with a moving highlight; Ctrl+→/← jump by sentence. Falls back to TTS word by word when there is no recording or alignment.
- **Matrix:** model, cursor, view (row 1 at the bottom, ↑ = forward), announcer (speaking cells / dots / edge).
- **Lessons 1–4** in English and Bangla, exactly as in A4, with the decisions above. Lesson 1 has a 3 × 3 practice matrix where every cell speaks.
- **One lesson template** (`lesson-schema.js`) + validator used by built-in lessons, the tutor editor, and import.
- **Student mode:** lesson list with "Lessons" and "Teacher's lessons" sections; finished lessons are remembered on the device.
- **Tutor mode:** create, edit, duplicate, delete, preview, export (`.6dots.json` with recordings inside) and import; duplicate a built-in into an editable copy; record (microphone) or upload a voice clip for every title, paragraph and question in each language; live checks (e.g. "a random start is picked from rows 1–8 and columns 1–6"); speaking-cells choice per exercise; matrices up to 15 × 15.
- **Recording scripts:** `audio-scripts/en.script.csv` and `bn.script.csv` (102 clips each: 30 UI phrases, numbers 1–20, 52 lesson clips) + `audio-scripts/README.md` (naming, folders, manifest, recording tips, how to make alignment files with WhisperX / MMS).

### D3. Differences from the plan
| What | Plan said | Built | Why |
|---|---|---|---|
| Language switch key | Ctrl+Shift+B | **Alt+B** | Ctrl+Shift+B toggles Chrome's bookmarks bar |
| New keys | — | **Alt+N** next/skip, **Alt+M** lesson list, **Alt+H** help | C5 needs a skip key; a way back to the list was needed |
| Tutor entry | Alt+Shift+M + PIN | Type `zxcvbnm1234` anywhere in student mode | Your decision (B7) |
| Extra files | — | `key-signature.js`, `numbers.js`, `speech-text.js`, `prompt-builder.js`, `exercise-session.js`, `progress-store.js`, `lesson-pack-format.js`, `text-pane.js`, `answer-box.js`, `screen-manager.js`, `common-fields.js`, `tools/serve.js`, `tools/generate-audio-scripts.js` | Keeps one job per file and makes the logic testable without a browser |
| `tutor-gate.js` | `src/tutor/` | `src/modes/` | It belongs to mode switching |
| Number clips | 1–100 | **1–20** | Only row/column numbers are spoken, and the max size is 15 |
| `items/` audio folder | Planned | Dropped | Each question is recorded whole, so item names alone are never spoken |
| When an exercise opens | Short spoken cue | **A chime only, no speech** | Decision C2: the question speaks only on R |
| "Where am I" (Space) | Allowed except where it gives the answer away | Only where every cell speaks (Lesson 1 practice, tutor "all cells") | Simplest rule that never reveals an answer |
| Lesson 3 Enter on the matrix | — | Moves to the answer box and says "How many rows?" | Matches the C3 flow |
| Default language | — | English, remembered after Alt+B | Many PCs have no Bangla voice and no clips are recorded yet, so Bangla would start silent |
| Tutor screens | — | English only | Teachers are sighted; translating the editor can come later |

### D4. Verified
- **Unit tests:** 26 / 26 pass (matrix, segmenter incl. Bangla, checkers, random starts, Lesson 3 two-step answer, validator incl. all 4 built-in lessons, lesson pack format).
- **In the browser (Chrome engine, built-in preview):**
  - Lesson 1: Tab to the practice matrix, Space says the position. A wrong answer clears the box; a right one opens the next exercise.
  - Lesson 2: a wrong cell gives oh-oh and you stay on the exercise; the right cell moves on.
  - Lesson 3: rows → Enter → columns → Enter.
  - Lesson 4: a random start, solved with the arrows.
  - Text pane: word mode and letter mode work. R repeats the question; Alt+B switches the whole screen to Bangla (digits included).
  - Tutor mode: the password opens it. Tested Duplicate built-in, New lesson with validation errors, Save and preview, back to the editor, and both lessons showing under "Teacher's lessons".
- Test lessons were deleted from the preview browser afterwards.

### D5. Not verified yet (needs you or a real device)
- **Actual sound.** The automated browser can't hear, so TTS voices, earcon loudness/feel and stereo panning need a listen with headphones.
- **NVDA:** that the `role="application"` areas pass the arrow keys through, and whether self-voicing plus NVDA talk over each other (if so, switch NVDA to sleep mode for the app, or turn `screenReaderOutput` on).
- Microphone recording and file upload in tutor mode, and export → import on a second device (the pack format is unit tested; the file dialogs were not clicked through).
- Audio word mode with real recordings and `.align.json` files (none exist yet; the TTS fallback path was used).
- Firefox: Alt+letter may open Firefox's own menus there. **Use Chrome or Edge.**

### D6. Known limitations / ideas for next iterations
- The tutor password is visible in the page source (accident protection only).
- Lessons made in tutor mode live in that browser; clearing browser data deletes them. Export regularly.
- Recordings of built-in lessons are not copied when a built-in is duplicated.
- Tutor recordings have no word-timing files, so audio word mode reads them with TTS.
- B12 (progress reports for tutors) is deferred, as decided.
