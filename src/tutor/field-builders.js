/**
 * File:        src/tutor/field-builders.js
 * What it is:  Small helpers that build labelled, accessible form fields
 *              for the tutor editor.
 * What it does:
 *   bilingualField({ label, value:{en,bn}, multiline, required, onChange })
 *   numberField({ label, value, min, max, onChange })
 *   selectField({ label, value, options:[[value, text]], onChange })
 *   cellField({ label, value:{row,col}, max, onChange })
 *   checkboxField({ label, checked, onChange })
 *   button(text, onClick, className?)
 *   group(legend, ...children)     a <fieldset> with a <legend>
 *   el(tag, className?, text?)     plain element
 *   Every input gets a real <label>, so the editor also works with NVDA.
 *   Fields call onChange with the new value; they never touch lesson objects.
 * Depends on:  nothing.
 */

let uid = 0;
const nextId = () => `f${++uid}`;

export function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function button(text, onClick, className = '') {
  const b = el('button', `btn ${className}`.trim(), text);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

export function group(legend, ...children) {
  const fs = el('fieldset', 'group');
  fs.append(el('legend', '', legend), ...children.filter(Boolean));
  return fs;
}

function labelled(labelText, input, className = 'field') {
  const wrap = el('div', className);
  const id = nextId();
  input.id = id;
  const label = el('label', '', labelText);
  label.htmlFor = id;
  wrap.append(label, input);
  return wrap;
}

export function bilingualField({ label, value, multiline = false, required = false, onChange }) {
  const current = { en: value?.en ?? '', bn: value?.bn ?? '' };
  const wrap = el('div', 'bilingual');
  wrap.append(el('div', 'bilingual-label', label + (required ? ' (English or Bangla required)' : '')));
  for (const [lang, name] of [['en', 'English'], ['bn', 'বাংলা (Bangla)']]) {
    const input = el(multiline ? 'textarea' : 'input');
    if (!multiline) input.type = 'text';
    else input.rows = 3;
    input.lang = lang;
    input.value = current[lang];
    input.addEventListener('input', () => {
      current[lang] = input.value;
      onChange({ ...current });
    });
    wrap.append(labelled(name, input));
  }
  return wrap;
}

export function numberField({ label, value, min, max, onChange }) {
  const input = el('input');
  input.type = 'number';
  if (min !== undefined) input.min = String(min);
  if (max !== undefined) input.max = String(max);
  input.step = '1';
  input.value = String(value ?? '');
  input.addEventListener('input', () => onChange(input.value === '' ? NaN : Number(input.value)));
  return labelled(label, input, 'field field-number');
}

export function selectField({ label, value, options, onChange }) {
  const select = el('select');
  for (const [v, text] of options) {
    const o = el('option', '', text);
    o.value = v;
    select.append(o);
  }
  select.value = value;
  select.addEventListener('change', () => onChange(select.value));
  return labelled(label, select);
}

export function cellField({ label, value, max, onChange }) {
  const current = { row: value?.row ?? 1, col: value?.col ?? 1 };
  const wrap = el('div', 'cell-field');
  wrap.append(el('div', 'bilingual-label', label));
  wrap.append(
    numberField({ label: 'Row', value: current.row, min: 1, max, onChange: (v) => onChange({ ...current, row: (current.row = v) }) }),
    numberField({ label: 'Column', value: current.col, min: 1, max, onChange: (v) => onChange({ ...current, col: (current.col = v) }) }),
  );
  return wrap;
}

export function checkboxField({ label, checked, onChange }) {
  const input = el('input');
  input.type = 'checkbox';
  input.checked = !!checked;
  input.addEventListener('change', () => onChange(input.checked));
  const wrap = labelled(label, input, 'field field-checkbox');
  wrap.prepend(input); // checkbox before its label
  return wrap;
}
