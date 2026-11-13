# Implementation — Iteration 4

| Field | Value |
|---|---|
| Status | **APPROVED (2026-11-04): Lessons 17–21 + sections; implemented, see Part D** |
| Date | 2026-11-04 |
| Goal | More lessons after Lesson 14: memory, fluency, numbers in cells, and first steps from "a grid" to "a matrix in maths" |
| Builds on | Iterations 1–3 (14 lessons; exercise types: number-answer, choice, find-cell, matrix-size, relative-move, find-own-position; cell contents; diagonal moves) |

> Same workflow: edit Part A (delete lessons you don't want, change wording), mark picks in Part B with ✅, answer Part C. Then I build it and fill in Part D.

---

## YOUR DECISIONS (2026-11-04): "Lessons 17–21 + sections"

| # | Decision |
|---|---|
| B1 / C2 | **B1-a:** build the content-only lessons (planned as 17–21) and the lesson sections. 15, 16, 22, 23 wait for testing with children |
| Numbering | Because 15 and 16 are not built, the new lessons are numbered **15–19** so children don't hear gaps: 15 Numbers in cells, 16 Adding a row/column, 17 Times table, 18 Turn the matrix, 19 Shapes. The deferred ideas become 20+ |
| C3 | Sections yes, with my names: Basics (1–4), Finding your way (5–9), Diagonals (10–14), Numbers in the matrix (15–19) |
| C1 | Not answered, so numbers are kept small (0–20, sums ≤ 20; times table up to 10 × 10) |
| C4–C6 | Not needed (their lessons are not built) |

---

## PART A — DRAFT PLAN

### A1. Where the course is now
| Lessons | Theme |
|---|---|
| 1–4 | What a matrix is; addresses; size; moving |
| 5–9 | Finding yourself; landmarks; distance; same row/column; things in cells |
| 10–14 | Diagonals; the identity matrix |

The next step is **numbers in cells**: reading, comparing and spotting patterns. That is what the future math platform will need most. Some memory and fluency lessons are mixed in, so the child gets faster, not only wiser.

### A2. Which lessons need new code
| Tier | Meaning | Lessons |
|---|---|---|
| **A** | Only new content; uses existing exercise types and cell contents | 17, 18, 19, 20, 21 |
| **B** | One small new feature | 15, 16, 22 |
| **C** | A bigger new feature | 23 |

### A3. Proposed lessons

#### Lesson 15: Remember the map — Tier B
*(from iteration 2's list)*
**Idea:** explore a small "garden" where some cells hold things (cow, tree, pond, house). Then the things are **hidden** (Space says nothing), and the questions start: "Where was the pond? Go there and press Enter."
**Why:** builds a mental map, the skill blind children use to remember rooms and screens.
- **New feature: "explore, then hide".** An exercise can show its contents only during the intro exploration. Small: one flag on the lesson (`intro.explore.contents`) plus "hidden" exercises reuse `find-cell`.
- **5 maps** (3×3 with 3 things, up to 5×5 with 5 things), 2–3 questions each. That is about 12 questions in total.

#### Lesson 16: Speed walk — Tier B
*(from iteration 2's list)*
**Idea:** "Go to (4, 2)!" As soon as the child arrives and presses Enter, the next target comes. 8 targets in a row. At the end: "You used 34 steps. The shortest way was 30. ★★★".
**Why:** turns slow counting into fluent movement.
- **New feature: step counter + stars.** Stars count extra steps, **never time**, so slow but careful children are not punished.
- **3 rounds:** 5×5, 7×7, 10×10 (the last one with diagonals on).

#### Lesson 17: Numbers in cells — Tier A
**Idea:** every cell holds a number. "What number is at (2, 3)?" "Which is bigger: the number at (1, 1) or at (3, 2)?" "Find the 9."
**Why:** the first lesson where a matrix holds data like in maths. Space reads the number.
- **10 exercises**, 3×3 and 4×4, numbers 0–20.

#### Lesson 18: Adding a row, adding a column — Tier A
**Idea:** "Walk along row 2 and add the numbers: 3, 5 and 1. What is the total?" Then columns. Then "Which row has the biggest total?"
**Why:** row and column sums are the most common thing done with a table of numbers.
- **10 exercises**, small numbers (sums up to 20), 3×3 and 3×4.

#### Lesson 19: The times table is a matrix — Tier A
*(from iteration 2's list)*
**Idea:** a 10×10 matrix where cell (r, c) holds r × c. "Go to row 3, column 4. What number is there?" → 12. "Walk along row 5: what do you hear?" → 5, 10, 15…
**Why:** the bridge from matrix navigation to arithmetic. The table becomes a place the child can walk.
- **10 exercises:** find a product ×4, "which cell holds 12?" (choice), what comes next in a row ×2, "is 3 × 4 the same as 4 × 3?" (go to both).
- The 100 numbers are generated once by a script into the lesson file. No new code needed.

#### Lesson 20: Turn the matrix (transpose) — Tier A
**Idea:** turning a matrix makes rows into columns: the thing at (2, 3) moves to (3, 2). A 2 × 3 matrix becomes 3 × 2.
**Why:** a real matrix operation, but explained purely by position, which these children are now good at.
- **8 exercises:** "After turning, where is the cat that was at (1, 3)?" (choice), "A 2 × 5 matrix is turned. How many rows does it have now?" (number), and walk a turned matrix to check.
- *Harder than the rest; mark ❌ in C2 if your students are young.*

#### Lesson 21: Shapes in the grid — Tier A
**Idea:** some cells hold a star. Walk around, find them, and say what shape they make: a line, an L, a square, a diagonal line.
**Why:** spatial cognition and early geometry (lines, corners, squares) using the grid the child already knows.
- **8 exercises** (choice: "line / L shape / square"), 4×4 and 5×5.

#### Lesson 22: A calendar is a matrix — Tier B
*(from iteration 2's list)*
**Idea:** a month: rows are weeks, columns are days (Saturday first). "What day is the 15th?" "How many Fridays are in this month?"
**Why:** shows that matrices are everywhere; a useful daily-life skill.
- **New feature: column names.** Cells in the top row (or a "header") say the day name at the far edge. Small.
- **8 exercises**, one fixed example month, Gregorian calendar (see C4).

#### Lesson 23: Which cell made that sound? — Tier C
*(from iteration 2's list)*
**Idea:** a dot plays from a hidden cell. Left/right in the headphones gives the column, low/high pitch gives the row. Guess the cell, walk there, press Enter.
**Why:** trains the sound-to-place link; could make all later navigation much faster.
- **New exercise type `sound-locate`.** Needs headphones; the intro checks left/right first.
- **8 exercises:** 1×5 (left/right only), 5×1 (pitch only), then 3×3.

### A4. Making the lesson list easier to use
With 20+ lessons, ↑ ↓ through one long list gets slow for a blind child.
- **Proposal: sections in the lesson list.** "Basics (1–4)", "Finding your way (5–9)", "Diagonals (10–14)", "Numbers (15–23)", then "Teacher's lessons". When moving between sections the section name is said first (already done for "Teacher's lessons"). **Page Down / Page Up** jump to the next/previous section.
- Small change: the section list goes in `content/lessons/index.json`.

### A5. Engine changes (summary)
| Feature | Used by | Size |
|---|---|---|
| "Explore, then hide": contents shown during the intro only | L15 | small |
| Step counter + stars at the end of a round | L16 | small |
| Column names said at the top edge | L22 | small |
| `sound-locate` exercise type | L23 | medium |
| Sections in the lesson list + Page Up/Down | all | small |

Each new feature also gets a tutor-editor form, a validator rule and tests, as before.

---

## PART B — CRITIQUE & ALTERNATIVES  *(mark your pick with ✅)*

### B1. ⚠️ No child has tried the app yet
14 lessons exist, and none has been tested with a blind child. Adding 9 more before that risks building on wrong guesses: about keys, speed, wording, how hard the questions are.
- **B1-a (recommended):** Build only **Tier A (17–21)** now. No new code: just content on proven parts. Plus the **lesson sections** (A4), because the list is already long. Then test Lessons 1–21 with children before building the features for 15, 16, 22, 23.
- **B1-b:** Tier A + Tier B (15–22) + sections. About twice the work.
- **B1-c:** Everything (15–23) + sections.

### B2. Too much maths too soon?
Lessons 18–20 (sums, times table, transpose) assume children who can add and multiply. In Bangladesh's curriculum the times table comes in Class 2–3, and sums of three small numbers in Class 1–2. If students are younger or behind, **move 18–20 later** and do 15, 16, 21 first. See C1.

### B3. Lesson length
Lessons 1–14 have 5–10 exercises each. I keep the new ones to 8–10, and Lesson 15 to about 12 short questions. If children get tired, splitting a lesson in two is easy later.

### B4. Things I'd still leave out
- **Matrix addition and multiplication:** they belong in the math platform you plan next, not in this "get used to the grid" module.
- **Timed challenges:** stars count steps, not seconds, so slower children are not punished.

---

## PART C — OPEN QUESTIONS  *(please answer inline)*

**C1. What class / age are the students?** (Still open from iteration 2. It decides whether 18–20 fit now.)
> Answer:

**C2. Which lessons do you want?** Delete from Part A, or list numbers here.
> Answer:

**C3. Lesson sections (A4):** yes / no? Are my section names OK?
> Answer:

**C4. Calendar (L22):** Gregorian, Bangla calendar (বঙ্গাব্দ), or both? Week starting Saturday?
> Answer:

**C5. Headphones for L23:** does every child have headphones (or a stereo speaker pair)?
> Answer:

**C6. Things in the "Remember the map" garden (L15):** my list is cow (গরু), tree (গাছ), pond (পুকুর), house (ঘর → better "বাড়ি" to avoid confusion with "cell"), boat (নৌকা). Change if you like.
> Answer:

---

## PART D — FINAL IMPLEMENTATION LOG  (2026-11-04)

### D1. What was built
- **Five lessons** in English and Bangla, section "Numbers in the matrix". All use existing exercise types and cell contents; no new exercise code.
  | # | Lesson | Exercises |
  |---|---|---|
  | 15 | Numbers in cells (ঘরে ঘরে সংখ্যা) | 10: read a number, find a number, compare two cells, biggest/smallest in a row/column/matrix (3×3 and 4×4, numbers 0–20) |
  | 16 | Adding a row, adding a column | 10: row and column totals (all ≤ 13), biggest/smallest total, "same total?" |
  | 17 | The times table is a matrix (নামতার ম্যাট্রিক্স) | 10: 10×10 with r × c in every cell, diagonals on: products, which cell holds 12, what comes next, 3×4 = 4×3, the diagonal 1, 4, 9, 16… |
  | 18 | Turn the matrix (transpose) | 8: new size after turning, where a thing moves, which cells stay, find the mango in a turned matrix, how many cells move |
  | 19 | Shapes in the grid | 8: find the stars, name the shape (line, L, square, diagonal line) |
- **Sections in the lesson list:** Basics (1–4), Finding your way (5–9), Diagonals (10–14), Numbers in the matrix (15–19), then Teacher's lessons. `content/lessons/index.json` now lists sections; the loader, catalog, tutor home and script generator read it. **Page Down / Page Up** jump to the next/previous section. The section name is said when you enter a section (recordable as `section.<id>`).
- **Numbers in cells reuse the number clips:** a cell holding "12" says `num.12`, so recording numbers once covers both "row 12" and "the cell holds 12".
- **Recording scripts:** 468 clips per language (was 311): numbers 0–100 used in Lessons 15–17, the 4 section names, and the new lessons. Duplicate keys are now listed only once.

### D2. Differences from the plan
| What | Plan said | Built | Why |
|---|---|---|---|
| Lesson numbers | 17–21 | **15–19** | 15 and 16 (Remember the map, Speed walk) are not built yet; children would otherwise hear a gap after Lesson 14. The deferred ideas are now 20+ |
| Lesson 17 | — | Diagonal steps on | 10×10 is big; the child learned diagonals in Lessons 10–14 |
| Lesson 18, transpose word | — | English "transpose"; Bangla "ট্রান্সপোজ, বা স্থানান্তর ম্যাট্রিক্স" | Please check the Bangla term against the textbook |

### D3. Verified
- **Unit tests:** 36 / 36 pass (index.json sections, no lesson listed twice, all 19 lessons valid, number items reuse `num.*` clips).
- **In the browser** (key events sent from inside the page because the pane was hidden):
  - The list shows the 5 section headings and 19 lessons. Page Down from the top says "Basics, Lesson 1…"; three more Page Downs say "Numbers in the matrix, Lesson 15…". Page Down at the last section stays put; Page Up goes back to "Diagonals, Lesson 10…".
  - **Lesson 16:** Space reads 2, then 3; answering 6 moves on.
  - **Lesson 17:** E, E, → reaches (3,4), Space reads 12, answering 12 moves on.
  - **Lesson 19:** Space reads "star"; choosing 1 (straight line) moves on.
  - **Lesson 15 in Bangla:** the title is Bangla and Space reads "৬".
  - No console errors. The preview browser's storage was cleared afterwards.

### D4. Not verified
- Lesson 18 was clicked into but not played through (its data passes validation).
- Real key presses on a physical keyboard, sound, NVDA and Bangla TTS, as before.

### D5. Next
- **Test Lessons 1–19 with children** before adding more (B1).
- Waiting ideas: Remember the map, Speed walk, Calendar, Which cell made that sound? (`implementation_iteration4.md` Part A).
