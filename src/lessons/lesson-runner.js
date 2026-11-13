/**
 * File:        src/lessons/lesson-runner.js
 * What it is:  The step-by-step flow of one lesson.
 * What it does:
 *   Turns a lesson into steps and remembers which step is open:
 *     intro      (if the lesson has intro paragraphs or a practice matrix)
 *     exercise   one step per exercise
 *     summary    "Lesson complete"
 *   const run = createLessonRunner(lesson);
 *   run.current()        -> { kind:'intro'|'exercise'|'summary', exercise?, number?, total }
 *   run.next()           -> the next step (stays on summary at the end)
 *   run.isLast()         -> true on the summary step
 *   Pure logic, no DOM.
 * Depends on:  nothing.
 */

export function createLessonRunner(lesson) {
  const total = lesson.exercises.length;
  const steps = [];
  if (lesson.intro.paragraphs.length || lesson.intro.explore) steps.push({ kind: 'intro', total });
  lesson.exercises.forEach((exercise, i) => steps.push({ kind: 'exercise', exercise, number: i + 1, total }));
  steps.push({ kind: 'summary', total });

  let index = 0;
  return {
    current: () => steps[index],
    next() {
      if (index < steps.length - 1) index++;
      return steps[index];
    },
    isLast: () => index === steps.length - 1,
  };
}
