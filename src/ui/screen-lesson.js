/**
 * File:        src/ui/screen-lesson.js
 * What it is:  The lesson screen a student works in (also used for tutor preview).
 * What it does:
 *   Shows one step at a time (intro → exercises → summary) with:
 *     - the text pane   (lesson text or the question)
 *     - the matrix      (if the step has one)
 *     - the answer box  (number answers; rows → columns answers)
 *     - the option list (choice exercises)
 *   and turns keyboard commands into actions:
 *     arrows in matrix → move + dot / speech / edge bump; ↑/↓ follow the view
 *                        chosen with Alt+P (config/pov.js)
 *     Space in matrix  → "what is here" if cells hold things, else "where am I"
 *     ↑ ↓ / 1–4 in options → read / choose an answer
 *     Enter            → answer (celebration or "oh-oh"), or go to the task
 *     R                → speak the question (decision C2: only on R)
 *     Alt+N            → next step / skip (decision C5)
 *     Ctrl+↓ / Ctrl+↑  → next / previous part: text → matrix → answer (Tab too)
 *     Alt+P            → reader's view ↔ screen view (redraws the step)
 *     Space in text    → play / pause all;  Alt+L/W/S, Alt+T A, Alt+B, Alt+H, Alt+M, Esc
 *   Every step starts with the focus on the text / question (iteration 6).
 *   The decisions about right/wrong live in lessons/exercise-session.js;
 *   this file only connects them to the screen and to sound.
 * Mount:       mountLesson(root, { lesson, onExit, preview }) -> cleanup function
 * Depends on:  lessons/*, matrix/*, ui/text-pane.js, ui/answer-box.js,
 *              ui/area-cycle.js, audio/*, i18n/language.js, config/pov.js,
 *              storage/progress-store.js, core/*
 */

import { createLessonRunner } from '../lessons/lesson-runner.js';
import { createExerciseSession, createExploreSession } from '../lessons/exercise-session.js';
import { promptText, promptSpeech, optionParts } from '../lessons/prompt-builder.js';
import { clipKeyForParagraph, clipKeyForPrompt, povText } from '../lessons/lesson-schema.js';
import { renderMatrix } from '../matrix/matrix-view.js';
import { createMatrixAnnouncer } from '../matrix/matrix-announcer.js';
import { createTextPane } from './text-pane.js';
import { createAnswerBox } from './answer-box.js';
import { createChoiceList } from './choice-list.js';
import { nextArea } from './area-cycle.js';
import * as speech from '../audio/speech-service.js';
import * as sfx from '../audio/sound-effects.js';
import { spoken } from '../audio/phrase-composer.js';
import { t, pickTextInfo, setLang, otherLang, viewKey } from '../i18n/language.js';
import { moveFor, rowOneAtTop, togglePov, currentPov } from '../config/pov.js';
import { formatNumber } from '../i18n/numbers.js';
import { markFinished } from '../storage/progress-store.js';
import { SETTINGS } from '../config/settings.js';
import { getState, setState } from '../core/app-state.js';
import { on } from '../core/event-bus.js';

/** Arrow / diagonal commands -> direction on the screen (pov.js makes it a matrix move). */
const MOVE_COMMANDS = {
  MOVE_UP: 'up',
  MOVE_DOWN: 'down',
  MOVE_LEFT: 'left',
  MOVE_RIGHT: 'right',
  MOVE_UP_RIGHT: 'up-right',
  MOVE_UP_LEFT: 'up-left',
  MOVE_DOWN_RIGHT: 'down-right',
  MOVE_DOWN_LEFT: 'down-left',
};
const UNIT_COMMANDS = { TEXT_UNIT_LETTER: 'letter', TEXT_UNIT_WORD: 'word', TEXT_UNIT_SENTENCE: 'sentence' };
const CHOOSE_COMMANDS = { CHOOSE_1: 0, CHOOSE_2: 1, CHOOSE_3: 2, CHOOSE_4: 3 };

export function mountLesson(root, { lesson, onExit, preview = false }) {
  const runner = createLessonRunner(lesson);

  // ----- Layout -----
  const screen = document.createElement('section');
  screen.className = 'screen lesson';
  screen.dataset.navRoot = '';

  const header = document.createElement('header');
  const title = document.createElement('h1');
  const stepHeading = document.createElement('p');
  stepHeading.className = 'step-heading';
  const modeLine = document.createElement('p');
  modeLine.className = 'mode-line';
  header.append(title, stepHeading, modeLine);

  const textArea = document.createElement('div');
  const matrixArea = document.createElement('div');
  const answerArea = document.createElement('div');
  const hint = document.createElement('p');
  hint.className = 'hint';

  screen.append(header, textArea, matrixArea, answerArea, hint);
  if (preview) {
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'preview-exit';
    back.textContent = t('screen.back_to_editor');
    back.addEventListener('click', () => onExit());
    screen.prepend(back);
  }
  root.append(screen);

  const textPane = createTextPane(textArea, t('screen.text_pane'));

  // ----- Per-step state -----
  let session = null; // exercise or explore session
  let view = null; // matrix view
  let announcer = null;
  let answerBox = null;
  let choiceList = null;
  let busy = false; // true while waiting to move on after a correct answer
  let advanceTimer = 0;

  function step() {
    return runner.current();
  }

  /** (Re)draw everything for the current step. keepSession = true after a language switch. */
  function renderStep(keepSession = false) {
    const s = step();
    title.textContent = pickTextInfo(lesson.title).text;
    const lang = getState('language');
    stepHeading.textContent =
      s.kind === 'exercise'
        ? t('templates.exercise_heading', { n: formatNumber(s.number, lang), total: formatNumber(s.total, lang) })
        : s.kind === 'intro'
          ? t('spoken.introduction')
          : '';
    hint.textContent = t('screen.lesson_hint');
    renderModeLine();

    if (!keepSession) {
      session = null;
      if (s.kind === 'intro' && lesson.intro.explore) {
        const { rows, cols, diagonalMoves } = lesson.intro.explore;
        session = createExploreSession(rows, cols, { diagonalMoves: !!diagonalMoves });
      }
      if (s.kind === 'exercise') session = createExerciseSession(s.exercise);
    }

    // Text
    textPane.setBlocks(textBlocks(s));

    // Matrix
    const keepPos = keepSession && session?.matrix ? session.position() : null;
    matrixArea.replaceChildren();
    view = null;
    announcer = null;
    if (session?.matrix) {
      const m = session.matrix;
      view = renderMatrix(matrixArea, m, {
        label: t('templates.matrix_label', { rows: m.rows, cols: m.cols }),
        // Row/column numbers would give the answer away when finding your own cell.
        showAxisNumbers: SETTINGS.showAxisNumbers && !session.asksForStart,
        hints: { forward: t(viewKey('screen.forward_hint')), right: t('screen.right_hint') },
        rowOneAtTop: rowOneAtTop(),
        formatNumber: (n) => formatNumber(n, getState('language')),
      });
      const pos = keepPos ?? session.position();
      view.setCursor(pos.row, pos.col);
      announcer = createMatrixAnnouncer(m, session.speaking);
    }

    // Answer box or option list
    answerArea.replaceChildren();
    answerBox = null;
    choiceList = null;
    if (session?.answerStage) answerBox = createAnswerBox(answerArea, answerLabel());
    if (session?.options) {
      const labels = session.options.map((_, i) => optionParts(lesson, s.exercise, i + 1)[0].text);
      choiceList = createChoiceList(answerArea, labels, t('screen.choices'));
    }
  }

  /** Read option i (counting from 0) aloud. */
  function speakOption(i) {
    speech.speak(optionParts(lesson, step().exercise, i + 1));
  }

  function submitChoice(i) {
    choiceList.select(i);
    if (session.submitChoice(i).correct) onCorrect();
    else onWrong();
  }

  function textBlocks(s) {
    const lang = getState('language');
    if (s.kind === 'intro') {
      return lesson.intro.paragraphs.map((p) => {
        const info = pickTextInfo(povText(p, 'text'), lang);
        return { text: info.text, lang: info.lang, clipKey: clipKeyForParagraph(lesson, p) };
      });
    }
    if (s.kind === 'exercise') {
      return [{ text: promptText(lesson, s.exercise, session.start, lang), lang, clipKey: clipKeyForPrompt(lesson, s.exercise) }];
    }
    return [{ text: t('spoken.lesson_complete'), lang, clipKey: 'ui.lesson_complete' }];
  }

  function answerLabel() {
    const stage = session?.answerStage;
    const start = session?.asksForStart;
    if (stage === 'rows') return t(start ? 'screen.answer_start_row' : 'screen.answer_rows');
    if (stage === 'columns') return t(start ? 'screen.answer_start_column' : 'screen.answer_columns');
    return t('screen.answer_number');
  }

  /** The spoken question for the current answer step ("How many rows?" / "Which row did you start in?"). */
  function stageQuestion() {
    const start = session?.asksForStart;
    if (session?.answerStage === 'rows') return start ? 'start_row_question' : 'rows_question';
    if (session?.answerStage === 'columns') return start ? 'start_column_question' : 'columns_question';
    return 'type_number';
  }

  function renderModeLine() {
    const unit = t(`spoken.unit_${getState('textUnit')}`);
    const audio = getState('transcriptMode') ? ` · ${t('screen.audio_word_mode')}` : '';
    const pov = t(`screen.view_${currentPov()}`);
    modeLine.textContent = `${t('screen.reading_by')}: ${unit}${audio} · ${t('screen.text_navigation_hint')} · ${pov}`;
  }

  /** Every step starts on the text / question (iteration 6). */
  function focusForStep() {
    textPane.focus();
  }

  /** The parts of this step, in Ctrl+↓ order. */
  function areas() {
    return ['text', view && 'matrix', answerBox && 'answer', choiceList && 'choice'].filter(Boolean);
  }

  /** Ctrl+↓ / Ctrl+↑ (and Tab / Shift+Tab): focus the next / previous part and say its name. */
  function moveToArea(context, stepBy) {
    const area = nextArea(areas(), context, stepBy);
    if (!area) return;
    focusArea(area);
    speech.speak([spoken(`area_${area}`)]);
  }

  /** Focus one part; falls back to the text if this step does not have it. */
  function focusArea(area) {
    if (area === 'matrix' && view) view.focus();
    else if (area === 'answer' && answerBox) answerBox.focus();
    else if (area === 'choice' && choiceList) choiceList.focus();
    else textPane.focus();
  }

  /** Focus the answer box or the option list, whichever this exercise has. */
  function focusAnswer() {
    if (answerBox) answerBox.focus();
    else choiceList?.focus();
  }

  function goNext() {
    clearTimeout(advanceTimer);
    busy = false;
    const s = runner.next();
    renderStep();
    if (s.kind === 'summary') {
      if (!preview) markFinished(lesson.id);
      sfx.correct();
    } else {
      sfx.newExercise();
    }
    focusForStep();
  }

  function onCorrect() {
    busy = true;
    speech.stop();
    sfx.correct();
    advanceTimer = setTimeout(goNext, SETTINGS.autoAdvanceDelayMs);
  }

  function onWrong() {
    speech.stop();
    sfx.wrong();
  }

  // ----- Command handling -----
  function handleSelect(context) {
    const s = step();
    if (s.kind === 'summary') {
      onExit();
      return;
    }
    if (context === 'text') {
      if (textPane.handle('SELECT')) return; // audio word mode: play from here
      if (view) view.focus();
      else focusAnswer();
      return;
    }
    if (context === 'choice' && choiceList) {
      if (choiceList.index < 0) speech.speak([spoken('choose')]);
      else submitChoice(choiceList.index);
      return;
    }
    if (context === 'matrix' && session) {
      if (session.answerOnMatrix) {
        if (session.submitCell().correct) onCorrect();
        else onWrong();
      } else if (choiceList) {
        choiceList.focus();
        speech.speak([spoken('choose')]);
      } else if (answerBox) {
        answerBox.focus();
        speech.speak([spoken(stageQuestion())]);
      }
      return;
    }
    if (context === 'answer' && session && answerBox) {
      const result = session.submitNumber(answerBox.value);
      if (result.status === 'invalid') {
        speech.speak([spoken('not_a_number')]);
      } else if (result.status === 'next') {
        answerBox.clear();
        answerBox.setLabel(answerLabel());
        speech.speak([spoken(stageQuestion())]);
      } else if (result.status === 'correct') {
        onCorrect();
      } else {
        answerBox.clear();
        answerBox.setLabel(answerLabel());
        onWrong();
      }
    }
  }

  function handleCommand({ name, context }) {
    if (busy && name !== 'STOP' && name !== 'MENU') return;

    if (name in UNIT_COMMANDS) {
      setState('textUnit', UNIT_COMMANDS[name]);
      renderModeLine();
      sfx.modeChange();
      speech.speak([spoken(`unit_${UNIT_COMMANDS[name]}`)]);
      return;
    }

    if (name in CHOOSE_COMMANDS) {
      const i = CHOOSE_COMMANDS[name];
      if (choiceList && i < session.options.length) submitChoice(i);
      return;
    }

    if (name === 'CHOICE_NEXT' || name === 'CHOICE_PREV') {
      if (!choiceList) return;
      const i = choiceList.move(name === 'CHOICE_NEXT' ? 1 : -1);
      if (i === null) {
        speech.stop();
        sfx.edge();
      } else {
        speakOption(i);
      }
      return;
    }

    if (name in MOVE_COMMANDS) {
      if (!session?.matrix) return;
      const result = session.move(moveFor(MOVE_COMMANDS[name]));
      view.setCursor(result.row, result.col);
      announcer.afterMove(result);
      return;
    }

    switch (name) {
      case 'TRANSCRIPT_TOGGLE': {
        const onNow = !getState('transcriptMode');
        setState('transcriptMode', onNow);
        renderModeLine();
        sfx.modeChange();
        speech.speak([spoken(onNow ? 'transcript_on' : 'transcript_off')]);
        break;
      }
      case 'NEXT_UNIT':
      case 'PREV_UNIT':
      case 'NEXT_SENTENCE':
      case 'PREV_SENTENCE':
      case 'TOGGLE_PLAY':
        textPane.handle(name);
        break;
      case 'WHERE_AM_I':
        if (!session?.matrix) break;
        if (session.hasContents) {
          const p = session.position();
          announcer.whatIsHere(session.contentAt(p.row, p.col));
        } else if (session.allowWhereAmI) {
          const p = session.position();
          announcer.whereAmI(p.row, p.col);
        } else {
          speech.speak([spoken('where_am_i_off')]);
        }
        break;
      case 'SELECT':
        handleSelect(context);
        break;
      case 'REPEAT_QUESTION': {
        const s = step();
        if (s.kind === 'exercise') speech.speak(promptSpeech(lesson, s.exercise, session.start));
        else speech.speak([spoken('no_question')]);
        break;
      }
      case 'SKIP':
        if (step().kind === 'summary') {
          onExit();
          break;
        }
        if (step().kind === 'exercise') speech.speak([spoken('skipped')]);
        goNext();
        break;
      case 'MENU':
        onExit();
        break;
      case 'AREA_NEXT':
      case 'AREA_PREV':
        moveToArea(context, name === 'AREA_NEXT' ? 1 : -1);
        break;
      case 'POV_TOGGLE': {
        const pov = togglePov();
        renderStep(true);
        focusArea(context); // stay in the same part (the matrix is redrawn)
        sfx.modeChange();
        speech.speak([spoken(`pov_${pov}`)]);
        break;
      }
      case 'LANGUAGE_TOGGLE':
        setLang(otherLang());
        renderStep(true);
        focusArea(context);
        speech.speak([spoken('language_name')]);
        break;
      case 'HELP':
        speech.speak([spoken(helpFor(context))]);
        break;
      case 'STOP':
        speech.stop();
        textPane.handle('STOP');
        break;
      default:
        break;
    }
  }

  function helpFor(context) {
    if (context === 'matrix') {
      if (session?.hasContents) return 'help_matrix_contents';
      const key = session?.diagonalMoves ? 'spoken.help_matrix_diagonal' : 'spoken.help_matrix';
      return viewKey(key).slice('spoken.'.length);
    }
    if (context === 'answer') return 'help_answer';
    if (context === 'choice') return 'help_choice';
    return 'help_text';
  }

  const offCommand = on('command', handleCommand);
  renderStep();
  focusForStep();

  return () => {
    offCommand();
    clearTimeout(advanceTimer);
    textPane.destroy();
  };
}
