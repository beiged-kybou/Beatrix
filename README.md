# 6DotsLab · Matrix

Audio-first lessons that teach **blind children** what a matrix is: rows, columns, m × n, cell addresses (row, column), and moving around a grid. The goal is to build the spatial sense needed for the matrix-shaped math platform that comes next.

- English and Bangla
- Speaks for itself (text-to-speech), with optional **recorded voice** for every phrase
- Keyboard only, works with NVDA
- **Student mode** (default) and **Tutor mode** (teachers create their own lessons)
- Plain HTML/CSS/JavaScript: no build step, runs on any static web host

## Run it

The app must be opened through a web server (browsers don't load ES modules from `file://`).

```bash
npm start
```

Then open http://localhost:8080 in **Chrome or Edge**. No `npm install` is needed. Alternatively, run `python -m http.server 8080` in this folder.

**Hosting:** upload the whole folder to any static host (GitHub Pages, Netlify, a school server). `tools/` and `tests/` are not needed online.

## Lessons

| # | Lesson | The child… |
|---|---|---|
| 1 | What is a matrix? | learns row, column, cell, m × n; explores a 3 × 3 matrix |
| 2 | The address of a cell | finds (row, column) with only (1,1) speaking |
| 3 | How big is the matrix? | finds m × n from three speaking cells |
| 4 | Where am I after moving? | follows moves from a given start on a 10 × 10 matrix |
| 5 | Where am I? | works out a hidden start cell by counting to the edges |
| 6 | Corners, edges and the middle | goes to landmarks named in words |
| 7 | How far? | counts the shortest number of steps between two cells |
| 8 | Same row or same column? | answers yes/no and pick-one questions |
| 9 | What is in this cell? | hears what cells hold (Space), finds and counts things |
| 10 | Diagonal steps | learns the four diagonal moves |
| 11 | The main diagonal | walks and counts the cells where row = column |
| 12 | The other diagonal | walks from the near-right to the far-left corner (row + column is constant) |
| 13 | Shortest way with diagonals | compares with Lesson 7: the answer is the bigger of the row and column change |
| 14 | The identity matrix | 1s on the main diagonal, 0s elsewhere; Space reads the numbers |
| 15 | Numbers in cells | reads numbers with Space; finds, compares, finds the biggest/smallest |
| 16 | Adding a row, adding a column | adds up rows and columns; compares totals |
| 17 | The times table is a matrix | (r, c) holds r × c; finds products and patterns |
| 18 | Turn the matrix | rows become columns: (2, 3) moves to (3, 2) (the transpose) |
| 19 | Shapes in the grid | finds the stars and names the shape: line, L, square, diagonal line |

In the lesson list they are grouped in sections: **Basics** (1–4), **Finding your way** (5–9), **Diagonals** (10–14), **Numbers in the matrix** (15–19), then **Teacher's lessons**.

Teachers can make their own lessons of every one of these kinds in tutor mode.

## Keys (student mode)

| Key | What it does |
|---|---|
| ↑ ↓ | Lesson list: choose a lesson |
| Page Down / Page Up | Lesson list: jump to the next / previous section |
| Enter | Open a lesson / give an answer / go from the text to the task |
| Tab | Move between the text, the matrix and the answer box |
| → ← | Text: read the next / previous unit |
| Alt+L / Alt+W / Alt+S | Read by **letter / word / sentence** |
| Alt+T, then A | **Audio word mode**: walk through the *recording* word by word (Enter plays from the current word, Ctrl+→/← jumps by sentence) |
| ↑ ↓ ← → | Matrix: forward / back / left / right. **Forward = row number grows** |
| E / Q / C / Z | Matrix, diagonal lessons only: forward-right / forward-left / back-right / back-left. Also numpad 9 / 7 / 3 / 1 and Page Up / Home / Page Down / End |
| Space | Matrix: "what is here?" when cells hold things (Lesson 9); otherwise "where am I?" (only where every cell speaks) |
| ↑ ↓ then Enter, or 1–4 | Answer options: hear them, then choose (Lesson 8) |
| R | Hear the question (questions are never read automatically) |
| Alt+N | Next / skip |
| Alt+M | Back to the lesson list |
| Alt+B | Switch English ↔ Bangla |
| Alt+H | Help for the current place |
| Esc | Stop speaking |

Why Alt and not Ctrl: Chrome never lets a web page block **Ctrl+W** (closes the tab) or **Ctrl+T** (new tab). All shortcuts live in [src/config/keybindings.js](src/config/keybindings.js); change them there.

**The matrix from the student's point of view:** the child stands at row 1 (nearest), column 1 (left). Forward (↑) goes to row 2, 3, … and right (→) to column 2, 3, … The screen shows it the same way: row 1 is at the bottom.

**Sounds:** a **dot** on silent cells (it moves left→right with the column and gets higher with the row), a **thud** at the edge, a **rising tune** for a right answer, **"oh-oh"** for a wrong one (try again or Alt+N to skip).

## Tutor mode

In student mode, type **`zxcvbnm1234`** (anywhere, no box needed). Tutor mode opens.

- **New lesson**: title, intro paragraphs, an optional practice matrix, and exercises of the same four kinds as Lessons 1–4. Up to 15 × 15. One language is required, the other is optional.
- **Record / Upload voice** for the title, each paragraph and each question, in each language.
- **Duplicate to edit** makes an editable copy of a built-in lesson (the built-ins stay unchanged).
- **Preview** runs the lesson exactly as a student sees it.
- **Export / Import**: lessons are saved **in this browser on this device**. To use one on another computer, Export it (a `.6dots.json` file with its recordings inside), send it by USB, WhatsApp or email, and Import it there.
- Students see teacher lessons under **"Teacher's lessons"**.

The password is in [src/config/settings.js](src/config/settings.js). It only stops children from opening tutor mode by accident. Anyone who reads the page source can find it.

## Recorded voice

See [audio-scripts/README.md](audio-scripts/README.md): what to record, the file names, where to put them, and how to make the word-timing files for audio word mode. The full list of phrases is in `audio-scripts/en.script.csv` and `bn.script.csv`.

## For developers

```bash
npm test
```
Runs the unit tests for the pure-logic modules.

```bash
npm run audio-scripts
```
Regenerates the recording scripts after changing text.

| Folder | One job per file |
|---|---|
| `src/core` | event bus, app state |
| `src/config` | settings, keybindings |
| `src/input` | keyboard → named commands |
| `src/i18n` | English/Bangla strings, numbers, speech clean-up |
| `src/audio` | TTS, recorded clips, phrase joining, sound effects |
| `src/text-navigation` | letter/word/sentence splitting and the reading cursor |
| `src/transcript` | audio word mode (alignment files) |
| `src/matrix` | matrix shape, cursor, drawing, what each cell says |
| `src/lessons` | the lesson template (`lesson-schema.js`), validator, checkers, lesson flow |
| `src/storage` | IndexedDB for tutor lessons and recordings, export/import, progress |
| `src/modes` | student/tutor mode switching, password gate |
| `src/tutor` | tutor screens and editor forms |
| `src/ui` | student screens and their parts |
| `content/lessons` | the built-in lessons as JSON |

Every source file starts with a comment saying what it is, what it does and what it depends on. The plan and the log of each change are in `internal_logs/`.
