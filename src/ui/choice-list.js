/**
 * File:        src/ui/choice-list.js
 * What it is:  The list of answer options for a 'choice' exercise.
 * What it does:
 *   const list = createChoiceList(parent, ['1. Yes', '2. No'], label);
 *   list.move(+1 | -1) -> the new index, or null at either end (nothing changes)
 *   list.index         the highlighted option (-1 before the first move)
 *   list.focus()
 *   The list is focusable (data-nav-context="choice"); the keys are handled by
 *   the lesson screen: ↑ ↓ read the options, Enter or 1–4 choose.
 *   It has role="application" so NVDA passes the keys through.
 * Depends on:  nothing.
 */

/**
 * @param {HTMLElement} parent
 * @param {string[]} labels  option texts as shown, e.g. "1. Yes"
 * @param {string} ariaLabel
 */
export function createChoiceList(parent, labels, ariaLabel) {
  const box = document.createElement('div');
  box.className = 'choice-list';
  box.tabIndex = 0;
  box.setAttribute('role', 'application');
  box.setAttribute('aria-label', ariaLabel);
  box.dataset.navContext = 'choice';

  const items = labels.map((text) => {
    const li = document.createElement('div');
    li.className = 'choice';
    li.textContent = text;
    box.append(li);
    return li;
  });
  parent.append(box);

  let index = -1;
  const highlight = () => items.forEach((li, i) => li.classList.toggle('is-current', i === index));

  return {
    element: box,
    get index() {
      return index;
    },
    move(delta) {
      const next = index === -1 ? (delta > 0 ? 0 : -1) : index + delta;
      if (next < 0 || next >= items.length) return null;
      index = next;
      highlight();
      return index;
    },
    /** Highlight an option directly (when chosen with a number key). */
    select(i) {
      index = i;
      highlight();
    },
    focus() {
      box.focus();
    },
  };
}
