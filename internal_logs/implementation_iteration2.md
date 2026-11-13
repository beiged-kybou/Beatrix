# Implementation — Iteration 2

| Field | Value |
|---|---|
| Status | **APPROVED (2026-11-04): build Lessons 5–9; implemented, see Part D** |
| Date | 2026-11-04 |
| Goal | More lessons after Lessons 1–4, building from "what is a matrix" to "I can find and use information in a grid", the skill the future math platform needs |
| Builds on | `implementation_iteration1.md` (lesson template, 4 exercise types, tutor mode) |

> Same workflow: edit Part A (delete lessons you don't want, change wording), mark picks in Part B with ✅, answer Part C. Then I build it and fill in Part D.

---

## YOUR DECISIONS (2026-11-04). These override anything below.

| # | Decision |
|---|---|
| B1 | **B1-a: build Lessons 5–9.** Lessons 10–14 wait until children have tested 5–9 |
| C1, C5 | Not answered. They only affect Lessons 12 and 14, which are not being built |
| C3 | Not needed (calendar lesson not built) |
| C4 | Not answered, so I'm using my item list: fruits, animals, everyday objects |
| C6 | Not answered, so I'm going with my suggestion: **Space = "what is here"** in exercises whose cells hold things; elsewhere Space stays "where am I" |
| B2, B3, B4 | Order 5 → 9 as listed; lessons stay unlocked (B3-a); stars belong to Lesson 11, so nothing to decide now |

---

## PART A — DRAFT PLAN: proposed lessons

### A1. The learning path
Lessons 1–4 teach **where** things are. The next lessons add, in order:

1. **Find yourself** (no one tells you where you are)
2. **Landmarks**: corners, edges, the middle
3. **Distance**: how far apart are two cells?
4. **Same row / same column**: relations between cells
5. **Cells hold things**: a matrix stores information
6. **Remember a map**: spatial memory
7. **Bridge to math**: the multiplication table and a calendar as matrices
8. **Hear a position**: link sound to place

Each lesson keeps the Lesson 1–4 shape: short intro, 5–10 exercises, about 10 minutes.

### A2. Which lessons need new code
| Tier | Meaning | Lessons |
|---|---|---|
| **A** | Uses the 4 existing exercise types; only new content | 5, 6, 7 |
| **B** | Needs one new, small exercise type or feature | 8, 9, 10, 11 |
| **C** | Needs a bigger new feature | 12, 13, 14 |

---

### Lesson 5: Where am I? (find your own address) — Tier B
**Idea:** the child is dropped into a random cell. Nobody says where. Every cell is a dot, so they must walk to the edges and count back to work out their own (row, column).
**Why:** the reverse of Lessons 2 and 4. Builds the habit of using edges as reference points.
- **New exercise type `find-own-position`:** random hidden start; the answer is typed as row → Enter → column → Enter (same input as Lesson 3).
- **8 exercises:** 3×3, 3×3, 4×4, 4×4, 5×5, 5×5, 6×6, 7×7.
- Intro tip: "Go back until you hear the thud. Count your steps. That tells you your row."

### Lesson 6: Corners, edges and the middle — Tier A
**Idea:** named landmarks instead of numbers. "Go to the far-right corner." "Go to the middle cell."
**Why:** children learn to describe places with words, and to jump to landmarks quickly.
- Uses `find-cell` with its own question text (tutor-style prompts), only (1,1) speaks.
- **10 exercises:**
  1. 5×5: the near-left corner (1,1)
  2. 5×5: the near-right corner (1,5)
  3. 5×5: the far-left corner (5,1)
  4. 5×5: the far-right corner (5,5)
  5. 5×5: the middle cell (3,3)
  6. 3×3: the middle cell (2,2)
  7. 7×7: the middle cell (4,4)
  8. 5×5: the middle of the last row (5,3)
  9. 6×4: the far-right corner (6,4)
  10. 7×7: the middle of the first column (4,1)
- Intro explains: a corner has walls on two sides (you hear two thuds), and the middle has the same number of steps on each side.

### Lesson 7: How far? (counting steps) — Tier A
**Idea:** "You are at (2,1). The ball is at (4,4). How many steps is the shortest way?" Answer = row difference + column difference.
**Why:** first real arithmetic on positions. Prepares for subtraction on a grid.
- Uses `number-answer` with an explore matrix where the two cells speak. (Needs one small addition: let a number-answer's explore matrix use a custom speaking-cells list. Today it is always "all cells".)
- **8 exercises:** same row (2), same column (2), both (4). Distances 1–9.
- Intro: "Steps along the row plus steps along the column. You can't go diagonally."

### Lesson 8: Same row or same column? — Tier B
**Idea:** "Are (3,2) and (3,5) in the same row?" Yes or no. Then "Which cell is in the same column as (2,4): (5,4) or (4,5)?"
**Why:** relations between cells, the base for "row operations" and reading tables later.
- **New answer type `choice`:** the child presses **Y** / **N**, or **1** / **2** to pick an option. Wrong → oh-oh, as usual.
- **10 exercises:** 5 yes/no, 5 choose-one-of-two. A matrix to explore is optional.

### Lesson 9: What is in this cell? — Tier B
**Idea:** cells now *hold* things (fruits, animals, numbers). The child walks to a cell and presses **Space** to hear what is in it.
- Exercises:
  - "What is at (2,3)?" → answer by choosing.
  - "Find the mango" → walk until you hear it, press Enter.
  - "How many apples are in row 2?"
- **Why:** a matrix is a place to store information. This is exactly how the math platform will work (numbers in cells).
- **New feature: cell contents.** An exercise can put an item or number in any cell. Space reads the cell's content instead of "where am I". The tutor editor gets a small grid to fill in.
- **10 exercises**, 3×3 up to 5×5.

### Lesson 10: Remember the map (spatial memory) — Tier B
**Idea:** first explore a 4×4 garden where 4 cells hold things (cow, tree, pond, house). Then, **with the contents hidden**: "Where was the pond?" Walk there, press Enter.
**Why:** a mental map. Blind children who build mental maps navigate rooms and screens better.
- Uses cell contents (Lesson 9) plus an "explore, then hide" step.
- **5 exercises**, each a new map, 3 or 4 items.

### Lesson 11: Speed walk (fluency game) — Tier B
**Idea:** "Go to (4,2)!" Then the next target right away, 10 targets in a row. At the end: "You used 34 steps. The shortest was 30. ★★★"
**Why:** turns slow counting into fluent movement. Stars motivate children.
- **New feature: step counter + stars.** Stars depend on extra steps over the shortest path, never on time, so slow but careful children are not punished.
- **3 rounds** (5×5, 7×7, 10×10).

### Lesson 12: The multiplication table is a matrix — Tier C (bridge to math)
**Idea:** a 10×10 grid where cell (r, c) holds r × c. "Find 3 × 4": go to row 3, column 4, press Space: "12".
**Why:** the bridge from matrix navigation to arithmetic. The table becomes a place the child can walk.
- Uses cell contents with *computed* values (r × c). Exercises:
  - find a product
  - "Which cells hold 12?" (several answers)
  - "Walk along row 3: what pattern do you hear?" (3, 6, 9…)
- **10 exercises.**

### Lesson 13: A calendar is a matrix — Tier C (real life)
**Idea:** a month as rows = weeks, columns = days (Saturday first, the Bangladesh school week). "What day is the 15th?" "How many Fridays are in this month?"
**Why:** shows that matrices are everywhere. A useful daily-life skill.
- Uses cell contents (dates) + `choice` answers + column headers (day names) that speak at the top edge.
- **8 exercises.** English and Bangla day names; Gregorian calendar (Bangla calendar later?).

### Lesson 14: Which cell made that sound? — Tier C (sound to place)
**Idea:** the app plays a dot from a hidden cell, using the stereo pan (left↔right = column) and pitch (low↔high = row). The child guesses the cell, then walks there and presses Enter.
**Why:** trains the sound-to-space link that Lessons 2–4 use silently. With headphones, the child can "hear" a position without speech. This could make later navigation much faster.
- Start with 1×5 (left/right only), then 5×1 (pitch only), then 3×3.
- **New exercise type `sound-locate`.** Needs headphones; the intro checks left/right ("You should hear this in your LEFT ear").
- **8 exercises.**

### A3. Engine changes needed (summary)
| Feature | Used by | Size |
|---|---|---|
| Custom speaking cells for a number-answer's explore matrix | L7 | tiny |
| `find-own-position` exercise type | L5 | small |
| `choice` answer (Y/N, 1/2) | L8, L9, L13 | small |
| Cell contents + Space reads the cell + editor grid | L9, L10, L12, L13 | medium |
| "Explore, then hide" step | L10 | small |
| Step counter + stars | L11 | small |
| Computed contents (r × c), column headers | L12, L13 | medium |
| `sound-locate` exercise type | L14 | medium |

Each new type follows the iteration 1 rule: one schema entry, one checker, one editor form, one validator rule, and tests. Tutors can then make their own lessons of every new type too.

---

## PART B — CRITIQUE & ALTERNATIVES  *(mark your pick with ✅)*

### B1. Too many lessons at once
14 lessons is a lot to test with children. Lessons may need changes once you watch real children use 5–6. Building 7–14 before that risks rework.
- **B1-a (recommended):** Build **Lessons 5–9** now (Tier A + the small Tier B features). Test with children. Then decide on 10–14.
- **B1-b:** Build only **Tier A (5, 6, 7)**. No new engine code, done fastest, safest.
- **B1-c:** Build everything (5–14).

### B2. Lesson order
I put "Find yourself" (L5) first because it reuses Lesson 4 skills directly. An alternative is landmarks first (L6), which is easier: corners are easy to find by sound. **Suggested order if children struggle: 6 → 5 → 7.**

### B3. Unlock lessons step by step?
Right now every lesson is open. Options:
- **B3-a:** All lessons stay open (current). Teachers decide.
- **B3-b (recommended for later):** Lesson N+1 opens after N is finished. A teacher can unlock all in tutor mode. This adds structure without blocking the teacher.

### B4. Stars and scores
Stars motivate, but they can stress children who are slow. In my design (L11), stars count extra steps, never time, and wrong answers never lose stars. **Keep stars only in the Speed walk lesson?** ✅/❌

### B5. Things I deliberately left out
- **Diagonal moves:** they need 4 extra keys and break the simple "row + column" counting. Better after the math platform introduces geometry.
- **Transpose / turning the matrix:** too abstract for this age. Possibly later, for older students.
- **Matrix addition and multiplication:** belongs to the math platform, not this "get used to the grid" module.

---

## PART C — OPEN QUESTIONS  *(please answer inline)*

**C1. What class / age are the students?** (This decides whether L12 (times table) and L7 (distance) fit, or need to be simpler.)
> Answer:

**C2. Which lessons do you want?** Delete the ones you don't want from Part A, or list numbers here.
> Answer:

**C3. Calendar lesson (L13):** Gregorian calendar, Bangla calendar (বঙ্গাব্দ), or both? Week starting Saturday?
> Answer:

**C4. Cell contents (L9, L10):** which items do children know well? My list: fruits (আম, কলা, আপেল), animals (গরু, বিড়াল, মাছ), objects (বই, বল). Add or replace.
> Answer:

**C5. Headphones:** do schools have headphones for every child? L14 and the stereo dot only work with headphones (or two speakers).
> Answer:

**C6. Should Space in content lessons read the cell's content, or should that be a new key (e.g. C)?** Space currently means "where am I". I suggest Space = "what is here" in content lessons, because "where am I" would give answers away there.
> Answer:

---

## PART D — FINAL IMPLEMENTATION LOG  (2026-11-04)

### D1. What was built
- **Lessons 5–9** in English and Bangla (`content/lessons/lesson-05.json` … `lesson-09.json`, added to `index.json`):
  | # | Lesson | Exercises | Type(s) |
  |---|---|---|---|
  | 5 | Where am I? | 8 (3×3 … 7×7, random hidden start, never (1,1)) | `find-own-position` (new) |
  | 6 | Corners, edges and the middle | 10 landmark questions | `find-cell` with own question text |
  | 7 | How far? | 8 (distances 3–9) | `number-answer` + practice matrix where only the two cells speak; Space names the target |
  | 8 | Same row or same column? | 5 yes/no + 5 pick-one-of-two, each with a 5×5 matrix to check on | `choice` (new) |
  | 9 | What is in this cell? | 10: 3 "what is at…", 3 "find the…", 3 counting, 1 combined with Lesson 8 | `choice`, `find-cell`, `number-answer` + **cell contents** (new) |
- **New exercise types:**
  - `find-own-position`: rows → columns answer; the answer is the cell where the child **started**, not where they walked.
  - `choice`: 2–4 options; ↑ ↓ read them, Enter or 1–4 choose; options are read after the question when R is pressed.
- **Cell contents:** `contents: [{row, col, item}]` on any exercise with a matrix. **Space = "what is here"** (decision C6), or "empty".
- `number-answer` and `choice` practice matrices can now use custom speaking cells.
- **Tutor editor:** forms for both new types, a "things in cells" list (find-cell, number-answer, choice), and speaking cells for practice matrices. Validator rules and tests for all of it.
- **Recording scripts** regenerated: **219 clips per language** (was 102), including the new `item.*` clips (said when Space is pressed) and answer options (`l08.ex06.opt2`).

### D2. Differences from the plan
| What | Plan said | Built | Why |
|---|---|---|---|
| Cell contents in the tutor editor | "a small grid to fill in" | A list: row, column, name (EN/BN) | Works for any size up to 15×15 and stays simple |
| Answer box in Lesson 5 | Same as Lesson 3 ("Number of rows") | Says **"Your start row / Your start column"** and asks "Which row did you start in?" | Found in the browser check: the Lesson 3 wording was wrong here |
| Grid numbers in Lesson 5 | Shown | **Hidden in `find-own-position` exercises** | The row/column numbers beside the grid would show the answer to a child with some sight |
| Lesson 6, first exercise | Near-left corner (1,1) | Near-right corner (1,5); a 10th exercise "middle of the right edge" added | The student already starts at (1,1), so that exercise would be free |
| Lesson 8 order | — | The matrix comes first, Enter goes to the answers | Same rule as every other lesson: if there is a matrix, focus starts there |
| Lesson 7 | Two speaking cells | Two speaking cells **plus** the target thing in its cell (Space says "ball") | Lets the child confirm they found the right cell |

### D3. Verified
- **Unit tests:** 31 / 31 pass (5 new: hidden start never (1,1), find-own answer = start cell, choice + contents session, choice validation, contents validation). All 9 built-in lessons pass the validator.
- **In the browser:**
  - **Lesson 5:** a hidden start with grid numbers hidden; walking left to the wall, then Enter, asks "Which row did you start in?"; the right start cell moves on.
  - **Lesson 7:** silent cells give only the dot; Space on the target says "ball"; typing 3 moves on.
  - **Lesson 8:** pressing 2 (wrong) stays on the exercise; pressing 1 (right) moves on; the options appear in the text.
  - **Lesson 9:** Space says "mango", choosing option 1 moves on; Space says "cat", Enter on it moves on.
  - **Tutor editor:** the new types appear in the list; the choice, find-own-position, contents and practice-matrix forms render, with no console errors.
- The preview browser's storage was cleared afterwards.

### D4. Not verified
- **Lesson 6** in the browser. It uses only the existing `find-cell` path, and its data passes validation.
- Saving and previewing a tutor lesson that uses the new types (forms render; save and preview were not clicked through this time).
- Sound, NVDA, and Bangla TTS, as in iteration 1.

### D5. Next
- Test Lessons 5–9 with children, then decide on Lessons 10–14 (Part A).
- Lesson 10 ("Remember the map") can now reuse cell contents; it only needs an "explore, then hide" step.
