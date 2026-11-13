/**
 * File:        src/config/keybindings.js
 * What it is:  THE table of every keyboard shortcut in the app.
 * What it does:
 *   Maps a key "signature" to a named command, per context.
 *   To change a shortcut, edit this table only. Nothing else hard-codes keys.
 *
 * Key signature format (built by input/key-signature.js):
 *   [Ctrl+][Alt+][Shift+]<KeyboardEvent.code>
 *   e.g. 'Alt+KeyL', 'ArrowUp', 'Enter', 'Ctrl+ArrowRight'
 *   We use event.code (the physical key), not event.key, so shortcuts still
 *   work when a Bangla keyboard layout (Avro, Bijoy) is active.
 *
 * Two-key shortcuts ("chords"): write both keys separated by a space,
 *   e.g. 'Alt+KeyT KeyA' = press Alt+T, then A (holding Alt is fine too).
 *
 * Contexts (set by data-nav-context on the focused element):
 *   global  works anywhere inside a student-style screen
 *   list    the lesson list on the home screen
 *   text    the text pane (lesson text / question)
 *   matrix  the matrix grid
 *   answer  the number answer box (only Enter/Escape/Alt keys, so typing works)
 *   choice  the list of answer options (choice exercises)
 *
 * Why Alt and not Ctrl: Chrome never lets a web page block Ctrl+W (closes the
 * tab) or Ctrl+T (new tab). See internal_logs/implementation_iteration1.md, B1.
 * Depends on:  nothing.
 */

export const KEYBINDINGS = [
  // --- Text unit modes (B1-a) ---
  { command: 'TEXT_UNIT_LETTER',   keys: ['Alt+KeyL'],      contexts: ['global'] },
  { command: 'TEXT_UNIT_WORD',     keys: ['Alt+KeyW'],      contexts: ['global'] },
  { command: 'TEXT_UNIT_SENTENCE', keys: ['Alt+KeyS'],      contexts: ['global'] },
  { command: 'TRANSCRIPT_TOGGLE',  keys: ['Alt+KeyT KeyA'], contexts: ['global'] },

  // --- Text pane ---
  { command: 'NEXT_UNIT',     keys: ['ArrowRight'],      contexts: ['text'] },
  { command: 'PREV_UNIT',     keys: ['ArrowLeft'],       contexts: ['text'] },
  { command: 'NEXT_SENTENCE', keys: ['Ctrl+ArrowRight'], contexts: ['text'] },
  { command: 'PREV_SENTENCE', keys: ['Ctrl+ArrowLeft'],  contexts: ['text'] },

  // --- Matrix (C1: forward = row number grows) ---
  { command: 'MOVE_FORWARD', keys: ['ArrowUp'],    contexts: ['matrix'] },
  { command: 'MOVE_BACK',    keys: ['ArrowDown'],  contexts: ['matrix'] },
  { command: 'MOVE_LEFT',    keys: ['ArrowLeft'],  contexts: ['matrix'] },
  { command: 'MOVE_RIGHT',   keys: ['ArrowRight'], contexts: ['matrix'] },

  // Diagonal steps (iteration 3, decision B1-c): the numpad keys sit in the shape
  // of the move (9 = forward-right). With Num Lock off they are PageUp/Home/
  // PageDown/End, and E/Q/C/Z work on laptops without a numpad.
  // They only move where the exercise allows diagonals (diagonalMoves: true).
  { command: 'MOVE_FORWARD_RIGHT', keys: ['Numpad9', 'PageUp', 'KeyE'],   contexts: ['matrix'] },
  { command: 'MOVE_FORWARD_LEFT',  keys: ['Numpad7', 'Home', 'KeyQ'],     contexts: ['matrix'] },
  { command: 'MOVE_BACK_RIGHT',    keys: ['Numpad3', 'PageDown', 'KeyC'], contexts: ['matrix'] },
  { command: 'MOVE_BACK_LEFT',     keys: ['Numpad1', 'End', 'KeyZ'],      contexts: ['matrix'] },
  // Space: "where am I", or "what is here" when the cells hold things
  { command: 'WHERE_AM_I',   keys: ['Space'],      contexts: ['matrix'] },

  // --- Answer options (choice exercises) ---
  { command: 'CHOICE_NEXT', keys: ['ArrowDown'],            contexts: ['choice'] },
  { command: 'CHOICE_PREV', keys: ['ArrowUp'],              contexts: ['choice'] },
  { command: 'CHOOSE_1',    keys: ['Digit1', 'Numpad1'],    contexts: ['choice'] },
  { command: 'CHOOSE_2',    keys: ['Digit2', 'Numpad2'],    contexts: ['choice'] },
  { command: 'CHOOSE_3',    keys: ['Digit3', 'Numpad3'],    contexts: ['choice'] },
  { command: 'CHOOSE_4',    keys: ['Digit4', 'Numpad4'],    contexts: ['choice'] },

  // --- Lesson list ---
  { command: 'LIST_NEXT', keys: ['ArrowDown'], contexts: ['list'] },
  { command: 'LIST_PREV', keys: ['ArrowUp'],   contexts: ['list'] },
  { command: 'SECTION_NEXT', keys: ['PageDown'], contexts: ['list'] },
  { command: 'SECTION_PREV', keys: ['PageUp'],   contexts: ['list'] },

  // --- Shared ---
  { command: 'SELECT',          keys: ['Enter'],    contexts: ['text', 'matrix', 'answer', 'list', 'choice'] },
  { command: 'REPEAT_QUESTION', keys: ['KeyR'],     contexts: ['text', 'matrix', 'answer', 'choice'] },
  { command: 'SKIP',            keys: ['Alt+KeyN'], contexts: ['global'] },
  { command: 'MENU',            keys: ['Alt+KeyM'], contexts: ['global'] },
  { command: 'LANGUAGE_TOGGLE', keys: ['Alt+KeyB'], contexts: ['global'] },
  { command: 'HELP',            keys: ['Alt+KeyH'], contexts: ['global'] },
  { command: 'STOP',            keys: ['Escape'],   contexts: ['global'] },
];
