/**
 * File:        src/core/event-bus.js
 * What it is:  A tiny publish/subscribe message bus shared by the whole app.
 * What it does:
 *   - on(event, handler)  -> subscribe; returns an "unsubscribe" function
 *   - emit(event, data)   -> call every handler subscribed to that event
 * Why it exists:
 *   Modules talk through named events instead of importing each other, so
 *   any module (e.g. the UI) can be replaced without touching the others.
 * Known events (keep this list up to date):
 *   'command'          { name, context, event }  from input/keyboard-router.js
 *   'state:changed'    { key, value }            from core/app-state.js
 *   'speech:spoken'    { text, lang }            from audio/speech-service.js
 * Depends on:  nothing.
 */

const handlers = new Map();

/**
 * Subscribe to an event.
 * @param {string} event
 * @param {(data:any) => void} handler
 * @returns {() => void} call it to unsubscribe
 */
export function on(event, handler) {
  if (!handlers.has(event)) handlers.set(event, new Set());
  handlers.get(event).add(handler);
  return () => handlers.get(event)?.delete(handler);
}

/**
 * Publish an event to every subscriber.
 * A failing handler is logged but never stops the others.
 * @param {string} event
 * @param {any} [data]
 */
export function emit(event, data) {
  const set = handlers.get(event);
  if (!set) return;
  for (const handler of [...set]) {
    try {
      handler(data);
    } catch (err) {
      console.error(`[event-bus] handler for "${event}" failed:`, err);
    }
  }
}
