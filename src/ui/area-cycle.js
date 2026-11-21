/**
 * File:        src/ui/area-cycle.js
 * What it is:  The order of the parts of a lesson screen, for Ctrl+↓ / Ctrl+↑
 *              (and Tab / Shift+Tab inside a lesson; iteration 6, decision B3-a).
 * What it does:
 *   nextArea(areas, current, step) -> the area to focus
 *     areas   the parts this step has, in order, e.g. ['text', 'matrix', 'answer']
 *     current the part that has focus now ('text', 'matrix', 'answer', 'choice')
 *     step    +1 (Ctrl+↓) or -1 (Ctrl+↑)
 *   Wraps around: after the last part comes the first. If the focus is in no
 *   known part, +1 goes to the first part and -1 to the last.
 *   Pure logic, no DOM: ui/screen-lesson.js does the focusing.
 * Depends on:  nothing.
 */

/**
 * @param {string[]} areas
 * @param {string} current
 * @param {1|-1} step
 * @returns {string|null} null when there are no areas
 */
export function nextArea(areas, current, step) {
  if (!areas.length) return null;
  const i = areas.indexOf(current);
  if (i < 0) return step > 0 ? areas[0] : areas[areas.length - 1];
  return areas[(i + step + areas.length) % areas.length];
}
