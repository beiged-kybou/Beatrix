/**
 * File:        src/matrix/matrix-view.js
 * What it is:  Draws a matrix on the screen and shows where the cursor is.
 * What it does:
 *   const view = renderMatrix(parentEl, matrix, { label, showAxisNumbers, hints });
 *   view.setCursor(row, col)   moves the highlight
 *   view.focus()               puts keyboard focus on the grid
 *   view.element               the focusable grid element
 *   Layout follows decision C1 (the student's point of view):
 *     row 1 is at the BOTTOM, rows grow upward (↑ = forward),
 *     column 1 is on the LEFT, columns grow to the right.
 *   Cells are empty on purpose: showing items or labels would give the answer
 *   away to low-vision students. Axis numbers can be hidden in settings.
 *   The grid has role="application" so screen readers (NVDA) pass the arrow
 *   keys to the app instead of using them for reading.
 * Depends on:  nothing (styles in styles/matrix.css).
 */

/**
 * @param {HTMLElement} parent
 * @param {{rows:number, cols:number}} matrix
 * @param {{label:string, showAxisNumbers:boolean, hints:{forward:string, right:string},
 *          formatNumber?:(n:number)=>string}} opts   formatNumber writes Bangla digits in Bangla
 */
export function renderMatrix(parent, matrix, opts) {
  const num = opts.formatNumber ?? String;
  const pane = document.createElement('div');
  pane.className = 'matrix-pane';

  const grid = document.createElement('div');
  grid.className = 'matrix-grid';
  grid.tabIndex = 0;
  grid.setAttribute('role', 'application');
  grid.setAttribute('aria-label', opts.label);
  grid.dataset.navContext = 'matrix';
  grid.style.setProperty('--cols', String(matrix.cols));
  grid.style.setProperty('--rows', String(matrix.rows));
  if (!opts.showAxisNumbers) grid.classList.add('no-axis');

  const cells = new Map(); // "r,c" -> element

  // Top row of the screen = highest row number.
  for (let r = matrix.rows; r >= 1; r--) {
    grid.append(axisLabel(num(r), 'row-label'));
    for (let c = 1; c <= matrix.cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = String(r);
      cell.dataset.col = String(c);
      cells.set(`${r},${c}`, cell);
      grid.append(cell);
    }
  }
  // Bottom line: column numbers.
  grid.append(axisLabel('', 'corner'));
  for (let c = 1; c <= matrix.cols; c++) grid.append(axisLabel(num(c), 'col-label'));

  const hints = document.createElement('div');
  hints.className = 'matrix-hints';
  hints.setAttribute('aria-hidden', 'true');
  hints.innerHTML = `<span>${escapeHtml(opts.hints.forward)}</span><span>${escapeHtml(opts.hints.right)}</span>`;

  pane.append(hints, grid);
  parent.append(pane);

  let current = null;
  return {
    element: grid,
    setCursor(row, col) {
      current?.classList.remove('is-cursor');
      current = cells.get(`${row},${col}`) ?? null;
      current?.classList.add('is-cursor');
    },
    focus() {
      grid.focus();
    },
  };
}

function axisLabel(text, cls) {
  const el = document.createElement('div');
  el.className = `axis ${cls}`;
  el.setAttribute('aria-hidden', 'true');
  el.textContent = String(text);
  return el;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
}
