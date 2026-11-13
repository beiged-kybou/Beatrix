# Implementation — Iteration 3

| Field | Value |
|---|---|
| Status | **APPROVED (2026-11-04): use my recommendations; implemented, see Part D** |
| Date | 2026-11-04 |
| Goal | Add **diagonal** lessons: diagonal steps, the main diagonal (and the other diagonal), moves and distances with diagonals |
| Builds on | Iterations 1–2 (9 lessons, 6 exercise types, cell contents, tutor mode) |

> Same workflow: edit Part A, mark picks in Part B with ✅, answer Part C. Then I build it and fill in Part D.
> Note: in iteration 2 I suggested leaving diagonals for later. You want them now, so this plan places them right after Lesson 7 ("How far?"). The child then already knows "rows + columns" counting, and diagonals are the next idea built on it.

---

## YOUR DECISIONS (2026-11-04): "Use your recommendations"

| # | Decision |
|---|---|
| C1 / B3 | Diagonal lessons are **Lessons 10–14**; iteration 2's other ideas move to 15+ |
| C2 / B1 | **B1-c: both key sets.** Numpad 9/7/3/1 = Page Up/Home/Page Down/End, **and** E/Q/C/Z |
| B2 | **B2-a:** diagonal keys work only where the exercise allows them (`diagonalMoves: true`) |
| C3 | Bangla: কর্ণ, প্রধান কর্ণ, বিপরীত কর্ণ; সামনে-ডানে, সামনে-বামে, পেছনে-ডানে, পেছনে-বামে. Identity matrix = একক ম্যাট্রিক্স |
| C4 | No special diagonal sound |
| C5 | Build **all five**: 10, 11, 12 (other diagonal), 13 (shortest way), 14 (identity matrix) |

---

## PART A — DRAFT PLAN

### A1. New idea: the diagonal step
A diagonal step changes the row **and** the column by one, at the same time.

| Step | Row | Column | Suggested key (see B1) |
|---|---|---|---|
| Forward-right | +1 | +1 | Numpad 9 / Page Up |
| Forward-left | +1 | −1 | Numpad 7 / Home |
| Back-right | −1 | +1 | Numpad 3 / Page Down |
| Back-left | −1 | −1 | Numpad 1 / End |

The keys sit in the same shape as the moves: top-right key = forward-right. This matches the screen, where row 1 is at the bottom.
If a diagonal step would leave the matrix (even on only one side), the child hears the **thud** and doesn't move. There is no sliding along the wall, so the rule stays simple.

### A2. Proposed lessons (numbered 10–13; see C1)

#### Lesson 10: Diagonal steps
**Idea:** learn the four diagonal keys and what they do to the row and column numbers.
- **Intro:** what a diagonal step is; the four keys and their shape; a 5×5 practice matrix where every cell speaks, so the child hears "row 2, column 2" after one forward-right step.
- **8 exercises** (`relative-move` with diagonal directions, fixed start so it's predictable at first, then random):
  1. 5×5, start (1,1): 2 steps forward-right → (3,3)
  2. 5×5, start (1,5): 3 steps forward-left → (4,2)
  3. 5×5, start (5,5): 2 steps back-left → (3,3)
  4. 5×5, start (4,1): 3 steps back-right → (1,4)
  5. 7×7, random start: 2 forward-right, then 1 forward
  6. 7×7, random start: 3 back-left, then 2 right
  7. 7×7, random start: 1 forward-left, 1 forward-right (zig-zag)
  8. 10×10, random start: 2 forward-right, 2 back-right, 1 left

#### Lesson 11: The main diagonal
**Idea:** the cells where **row = column**: (1,1), (2,2), (3,3)… A line from the near-left corner to the far-right corner.
**Why:** the most important diagonal in matrix maths (later: identity matrix, square matrices).
- **10 exercises:**
  1. Walk the main diagonal of a 4×4 with forward-right; how many cells is it? (`number-answer`, practice matrix) → 4
  2. Same for 6×6 → 6
  3. Is (3,3) on the main diagonal? Yes (`choice`)
  4. Is (2,4) on the main diagonal? No
  5. Is (5,5) on the main diagonal of a 5×5? Yes
  6. Go to the 4th cell of the main diagonal of a 6×6 (`find-cell`, only (1,1) speaks) → (4,4)
  7. Go to the last cell of the main diagonal of a 5×5 → (5,5)
  8. A 3×5 matrix: how many cells are on its main diagonal? → 3 (it stops at the far wall)
  9. Which cell is on the main diagonal: (2,3) or (3,3)? → (3,3)
  10. Things in cells: a 4×4 where the diagonal holds stars; how many stars? (reuses Lesson 9 contents) → 4

#### Lesson 12: The other diagonal
**Idea:** from the near-right corner to the far-left corner: (1,n), (2,n−1)… In a 5×5: (1,5), (2,4), (3,3), (4,2), (5,1). Here **row + column = n + 1**.
- **8 exercises:** walk it with forward-left and count; "is (2,4) on the other diagonal of a 5×5?"; "go to the middle of the other diagonal"; "which cell is on BOTH diagonals of a 5×5?" → (3,3).
- *Optional.* Mark ❌ in C5 to drop it.

#### Lesson 13: Shortest way with diagonals
**Idea:** compare with Lesson 7. From (1,1) to (4,3):
- without diagonals: 3 + 2 = **5 steps**
- with diagonals: 2 forward-right, then 1 forward = **3 steps** (the bigger of 3 and 2)
- **8 exercises** (`number-answer`, practice matrix where the two cells speak and Space names the target):
  1. (1,1) → (3,3) = 2
  2. (1,1) → (4,2) = 3
  3. (2,5) → (5,2) = 3
  4. (1,3) → (5,4) = 4
  5. (5,5) → (1,2) = 4
  6. (3,1) → (3,5) = 4 (same row: diagonals don't help!)
  7. (1,1) → (6,6) on 6×6 = 5
  8. (2,2) → (6,3) on 7×7 = 4
- Intro gives the rule: "count the row change and the column change; the answer is the bigger one."

#### Lesson 14 (optional bridge): The identity matrix
**Idea:** a matrix with **1** on the main diagonal and **0** everywhere else. Uses cell contents only (no new code).
- **6 exercises:** "What is at (3,3)?", "What is at (3,2)?", "How many 1s in a 4×4?", "How many 0s in a 3×3?" → 6.
- *Optional.* This is where matrices start to look like maths. Mark ✅/❌ in C5.

### A3. Engine changes
| Change | Where | Size |
|---|---|---|
| 4 new directions (`forward-right`, `forward-left`, `back-right`, `back-left`) | `matrix-model.js` DIRECTION_DELTAS; cursor, checker and validator use it automatically | tiny |
| 4 new key commands | `keybindings.js`, `screen-lesson.js` | tiny |
| **`diagonalMoves: true \| false` per exercise** (default false); a diagonal key in an exercise without it plays a short "not here" sound | schema, session, validator, screen | small |
| Move phrases ("move 2 steps forward-right"; Bangla "সামনে-ডানে কোনাকুনি ২ ঘর যাও") | `strings/*.json` | tiny |
| Tutor editor: the 4 new directions in the moves list + a "Diagonal moves allowed" checkbox on every exercise with a matrix | `relative-move-editor.js`, `common-fields.js` | small |
| Help text and README key table | strings, README | tiny |
| Recording scripts regenerated | tool | — |

No new exercise type is needed: everything above reuses `relative-move`, `number-answer`, `choice` and `find-cell`.

---

## PART B — CRITIQUE & ALTERNATIVES  *(mark your pick with ✅)*

### B1. ⚠️ Which keys for diagonal steps?
- **B1-a (recommended): Numpad 7 / 9 / 1 / 3 plus Home / Page Up / End / Page Down.** The shape matches the direction. With Num Lock off, the numpad keys *are* Home / PgUp / End / PgDn, so both always work.
  **Risk:** many laptops have no numpad, and their Home/PgUp/End/PgDn keys aren't in a square (often Fn combinations). **Also: NVDA uses the numpad (Num Lock off) for its own review commands**, which may steal these keys. This needs an NVDA test.
- **B1-b:** Letter keys around the arrows' idea: **Q** (forward-left), **E** (forward-right), **Z** (back-left), **C** (back-right). Every keyboard has them and NVDA doesn't use them in application mode. They don't clash with the braille keys (S D F J K L), but the shape is less obvious.
- **B1-c:** Both B1-a and B1-b at once. Recommended if you're unsure what keyboards schools have. All keys live in `keybindings.js`, so this costs nothing extra.
- **B1-d:** Two arrows in a row (↑ then → quickly = forward-right). No new keys, but slow, and a child who wanted two separate steps gets one diagonal. Not recommended.

### B2. Diagonal keys everywhere, or only in diagonal lessons?
- **B2-a (recommended): Only where the exercise allows it** (`diagonalMoves: true`). Lessons 1–9 stay as they are. Lesson 7's answers ("no diagonals") stay correct, and children can't use diagonals to skip the counting practice.
- **B2-b:** Everywhere. Simpler, but Lesson 7's questions become confusing ("shortest way" changes).

### B3. Order of lessons
Diagonals right after Lesson 9 (as 10–13) keeps the numbering simple. Pedagogically they could also sit right after Lesson 7, so Lesson 13 can be compared directly with Lesson 7. Moving them means renumbering Lessons 8–9. **I suggest keeping 10–13.**

### B4. Iteration 2's Lessons 10–14 ideas
"Remember the map", "Speed walk", "Times table", "Calendar" and "Which cell made that sound?" would move to **15+**. Nothing is lost; they're still in `implementation_iteration2.md` Part A.

### B5. Things I'd still leave out
- **Diagonal moves of more than one step per key press** (e.g. "jump to the end of the diagonal"): handy, but it removes the counting.
- **Diagonals of non-square matrices beyond the main one** (e.g. "the diagonal starting at (1,2)"): mathematically "super-diagonals"; too abstract for now.

---

## PART C — OPEN QUESTIONS  *(please answer inline)*

**C1. Numbering:** diagonal lessons as **Lessons 10–13** (and the iteration 2 ideas move to 15+)? Or a separate section "Diagonals" in the lesson list?
> Answer:

**C2. Keys:** B1-a (numpad / Home-PgUp-End-PgDn), B1-b (Q E Z C), or B1-c (both)?
> Answer:

**C3. Bangla words.** My suggestions; please correct them to match the school textbooks:
- diagonal: **কর্ণ** (main diagonal: **প্রধান কর্ণ**; the other diagonal: **বিপরীত কর্ণ**)
- diagonal step names: **সামনে-ডানে**, **সামনে-বামে**, **পেছনে-ডানে**, **পেছনে-বামে**
> Answer:

**C4. Should a diagonal step make a slightly different sound** (e.g. a two-note dot), so the child knows a diagonal move happened? The pan and pitch already both change, so I lean towards no.
> Answer:

**C5. Which lessons:** keep all of 10, 11, 12 (other diagonal), 13 (shortest way), 14 (identity matrix)? Delete any you don't want.
> Answer:

---

## PART D — FINAL IMPLEMENTATION LOG  (2026-11-04)

### D1. What was built
- **Four diagonal directions** in `matrix-model.js` (`forward-right` +1/+1, `forward-left` +1/−1, `back-right` −1/+1, `back-left` −1/−1) plus `isDiagonal()`. The cursor, the relative-move checker and the validator pick them up automatically. A diagonal step that would leave the matrix gives the thud and no move (no sliding).
- **Keys (B1-c):** E / Q / C / Z, numpad 9 / 7 / 3 / 1, Page Up / Home / Page Down / End. All in `keybindings.js`, matrix context only.
- **`diagonalMoves` switch (B2-a)** on any exercise with a matrix, and on `intro.explore`. Off by default, so Lessons 1–9 are unchanged. Where it is off, a diagonal key says "Diagonal steps are off here." and doesn't move. The validator requires it when a relative-move uses diagonal moves.
- **Phrases** in English and Bangla for the diagonal moves ("move 2 steps forward-right, on a slant" / "সামনে-ডানে কোনাকুনি ২ ঘর যাও"), "diagonal off", and matrix help that lists the diagonal keys.
- **Tutor editor:** "Diagonal moves allowed" checkbox on every exercise type with a matrix and on the intro practice matrix; the 4 diagonal directions in the relative-move list; the live check warns if diagonal moves are listed but not allowed.
- **Lessons 10–14** (English + Bangla), added to `index.json`:
  | # | Lesson | Exercises |
  |---|---|---|
  | 10 | Diagonal steps (practice matrix with diagonals on) | 8 relative-move: 4 fixed starts, then random |
  | 11 | The main diagonal (প্রধান কর্ণ) | 10: walk and count ×3, yes/no ×3, go-to ×2, pick ×1, count stars on the diagonal ×1 |
  | 12 | The other diagonal (বিপরীত কর্ণ) | 8: walk and count ×2, yes/no ×2, go-to ×2, pick ×2 |
  | 13 | Shortest way with diagonals | 8 distance questions (answers 2,3,3,4,4,4,5,4; one same-row case where diagonals don't help) |
  | 14 | The identity matrix (একক ম্যাট্রিক্স) | 6: what number is at…, count ones/zeros, which column holds the one, find the one in row 4 |
- **Recording scripts:** 311 clips per language (was 219), including `item.one` / `item.zero`.

### D2. Differences from the plan
| What | Plan said | Built | Why |
|---|---|---|---|
| Diagonal key where not allowed | "a short 'not here' sound" | Speaks **"Diagonal steps are off here."** | A child can't guess what an unknown sound means; one short sentence is clearer |
| Lesson 14 numbers | "1" and "0" | Cells and options say **"one" / "zero"** (Bangla "এক" / "শূন্য") | The options are read as "1. one, 2. zero"; "1. 1, 2. 0" would be confusing |
| Lessons 10–14 files | Written by hand | Generated once by a script in the scratchpad (not part of the project), then saved as normal lesson JSON | Lesson 14 needs every cell of 3×3 to 5×5 grids filled in; a script avoids typing mistakes |
| Lesson 11 walk-and-count | — | Only (1,1) speaks; the rest are dots | Otherwise the cells would say the answer |

### D3. Verified
- **Unit tests:** 35 / 35 pass (4 new: diagonal cursor + no sliding, blocked diagonal where off, relative moves with diagonals, validator rule). All 14 built-in lessons pass the validator.
- **In the browser:**
  - **Lesson 10:** in the practice matrix, E goes to (2,2); Page Up then Home goes to (4,2). Exercise 1 (2 × forward-right from (1,1)) moves on to exercise 2, which reads "Move 3 steps forward-left, on a slant."
  - **Lesson 2:** E says "Diagonal steps are off here." and the cursor stays at (1,1).
  - **Lesson 14:** E then Space says "one"; choosing option 1 moves on.
  - No console errors. The preview browser's storage was cleared afterwards.

### D4. Not verified
- **Numpad keys** (Num Lock on and off) and **NVDA's numpad review commands**: need a real keyboard with a numpad and NVDA. If NVDA takes them, E/Q/C/Z still work.
- Lessons 11–13 were checked by the validator and unit tests only, not clicked through.
- The tutor-editor diagonal checkbox was not clicked through in the browser.
- Sound and Bangla TTS, as in earlier iterations.
