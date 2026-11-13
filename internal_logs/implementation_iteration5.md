# Iteration 5: Publish the project to GitHub as "Beatrix"

Status: **DONE, with a simpler plan (see Part D)**

## Request

Create a GitHub repo called **Beatrix** under the account **beiged-kybou**. Push the project in small pieces, with commit dates spread over time so the history looks like piece-by-piece work. Every commit is authored by beiged-kybou only: no Claude name, no `Co-Authored-By` line.

## What I found

| Check | Result |
|---|---|
| git | installed (2.50.1) |
| GitHub CLI (`gh`) | **not installed** |
| Global git name | `beiged_kybou` (underscore, not a hyphen) |
| Global git email | a Gmail address. A commit only links to the GitHub profile if this email is added to the beiged-kybou account |
| Project folder | not a git repo yet; about 1.1 MB |

## Part A: Plan

### A1. Make the repo
Option 1 (recommended): you create an **empty** repo on github.com: name `Beatrix`, no README, no .gitignore, no licence. That takes 30 seconds and needs no extra software.
Option 2: I install the GitHub CLI with winget and create it with `gh repo create`. You sign in once in the browser.

### A2. Local setup
- `git init`, branch `main`.
- Set the name and email **for this repo only** (`git config user.name "beiged-kybou"`), so your global settings stay unchanged.
- Add a `.gitignore`: `.claude/`, `node_modules/`, OS files.

### A3. Commits with spread-out dates
Each commit sets both `GIT_AUTHOR_DATE` and `GIT_COMMITTER_DATE`, so GitHub shows the past date. Proposed range: **18 Aug 2026 to 12 Nov 2026**, evenings and weekends, with gaps of 1 to 5 days. Each commit only adds files that make sense at that stage:

| # | Date (draft) | Message | Files |
|---|---|---|---|
| 1 | 18 Aug | Project skeleton and README | package.json, README.md (early version), index.html, styles/base.css |
| 2 | 20 Aug | Event bus and app state | src/core/ |
| 3 | 23 Aug | Settings and keybindings | src/config/ |
| 4 | 25 Aug | Keyboard router with layout-independent keys | src/input/ |
| 5 | 29 Aug | English and Bangla strings, Bangla numbers | src/i18n/ |
| 6 | 2 Sep | Text-to-speech, recorded clips, sound effects | src/audio/ |
| 7 | 6 Sep | Letter, word and sentence reading | src/text-navigation/, tests/segmenter.test.js |
| 8 | 10 Sep | Audio word mode with alignment files | src/transcript/ |
| 9 | 14 Sep | Matrix model, cursor and view | src/matrix/, styles/matrix.css, tests/matrix-model.test.js |
| 10 | 19 Sep | Lesson template, validator and checkers | src/lessons/ (schema, validator, checkers), their tests |
| 11 | 23 Sep | Lesson flow and prompts | rest of src/lessons/ |
| 12 | 27 Sep | Student screens | src/ui/, src/main.js |
| 13 | 1 Oct | Lessons 1 to 4 | content/lessons/ 01–04 |
| 14 | 5 Oct | Local storage for tutor lessons and recordings | src/storage/, tests/lesson-pack-io.test.js |
| 15 | 10 Oct | Tutor mode and lesson editor | src/modes/, src/tutor/, styles/tutor.css |
| 16 | 14 Oct | Recording scripts and dev server | tools/, audio-scripts/, assets/ |
| 17 | 20 Oct | Lessons 5 to 9 | lessons 05–09 |
| 18 | 28 Oct | Diagonal moves and Lessons 10 to 14 | lessons 10–14 |
| 19 | 6 Nov | Numbers in the matrix (Lessons 15 to 19) and lesson sections | lessons 15–19, index.json |
| 20 | 12 Nov | Final README and recording guide | README.md, audio-scripts/README.md |

Simplification: the source files are committed as they are **today**. Earlier commits will not show the older versions of a file (e.g. commit 9 already contains diagonal support). Rebuilding true old versions is not possible, because those versions were never saved.

Two exceptions keep each step runnable: `index.json` in commit 13 only lists Lessons 1–4 (then 1–9, 1–14, 1–19), and the README grows in two steps.

### A4. Push
`git remote add origin https://github.com/beiged-kybou/Beatrix.git`, then `git push -u origin main`. Windows will open a GitHub sign-in window the first time. **You do the sign-in**; I never type passwords.

### A5. Check
Open the repo page and check the commit list: 20 commits, the right dates, the author shown as beiged-kybou, no Claude name anywhere.

## Part B: Critique and alternatives

- **GitHub still records the real push time.** Commit dates will show the past, but the repo's creation date and the push event say 13 Nov 2026. Anyone looking closely can see that. That's fine for a portfolio; it would not hold up if someone needs proof of when the work was done.
- **The tutor password goes public** (`zxcvbnm1234` in `src/config/settings.js`). It was never real security, but in a public repo anyone can read it. Alternative: make the repo **private**.
- **`internal_logs/`** contains the planning conversation with the AI. You can keep it (it shows the design process) or leave it out of the repo.
- **Email:** to hide your Gmail, use GitHub's private address (`<id>+beiged-kybou@users.noreply.github.com`, shown at github.com/settings/emails).
- Alternative to 20 commits: fewer, bigger ones (about 8). That's quicker to review, but looks less like real step-by-step work.

## Part C: Questions for you

1. Who makes the repo: you on github.com (recommended) or me with the GitHub CLI?
2. Public or private?
3. Is the date range 18 Aug to 12 Nov 2026 right?
4. Which email: your Gmail, or the GitHub noreply address?
5. Include `internal_logs/` in the repo?

## Part D: Implementation log

**The user changed the plan:** they created the repo themselves (https://github.com/beiged-kybou/Beatrix) and asked for the whole project to be pushed **in one commit**, with today's date and no custom dates. Parts A3 and B above were not used.

What was done:
- `git init` on branch `main`.
- Name `beiged-kybou` set **for this repo only**, with the email from the global git config. The global settings were not changed.
- `.gitignore` added: `.claude/`, `node_modules/`, OS and editor files.
- One commit, "Initial commit: 6DotsLab matrix lessons for blind children", authored by beiged-kybou only (no Co-Authored-By line).
- Pushed to `origin/main`.
- `internal_logs/` is included in the repo.
