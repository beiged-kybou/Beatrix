/**
 * File:        src/ui/answer-box.js
 * What it is:  The number input where a student types an answer.
 * What it does:
 *   const box = createAnswerBox(parent, label);
 *   box.value / box.clear() / box.focus() / box.setLabel(text)
 *   Accepts only English or Bangla digits (other keys are ignored), so a
 *   child can't type something confusing. Enter is handled by the lesson
 *   screen through the keyboard router (context 'answer').
 * Depends on:  nothing.
 */

let counter = 0;

export function createAnswerBox(parent, label) {
  const id = `answer-${++counter}`;
  const wrap = document.createElement('div');
  wrap.className = 'answer-box';

  const labelEl = document.createElement('label');
  labelEl.htmlFor = id;
  labelEl.textContent = label;

  const input = document.createElement('input');
  input.id = id;
  input.type = 'text';
  input.inputMode = 'numeric';
  input.autocomplete = 'off';
  input.maxLength = 4;
  input.dataset.navContext = 'answer';
  input.addEventListener('input', () => {
    input.value = input.value.replace(/[^0-9০-৯]/g, '');
  });

  wrap.append(labelEl, input);
  parent.append(wrap);

  return {
    element: input,
    get value() {
      return input.value;
    },
    clear() {
      input.value = '';
    },
    focus() {
      input.focus();
    },
    setLabel(text) {
      labelEl.textContent = text;
    },
  };
}
