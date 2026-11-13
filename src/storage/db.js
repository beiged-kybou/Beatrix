/**
 * File:        src/storage/db.js
 * What it is:  Opens the browser database (IndexedDB) used for custom content.
 * What it does:
 *   openDb() -> Promise<IDBDatabase>, opened once and reused.
 *   Stores ("tables"):
 *     lessons  key: lesson.id               custom lessons made in tutor mode
 *     clips    key: '<lang>:<clipKey>'      tutor recordings (audio blobs)
 *   request(storeName, mode, fn) runs one small operation and returns its result.
 *   To change the database layout: bump DB_VERSION and extend upgrade().
 * Depends on:  nothing.
 */

const DB_NAME = '6dotslab';
const DB_VERSION = 1;

let dbPromise = null;

function upgrade(db) {
  if (!db.objectStoreNames.contains('lessons')) db.createObjectStore('lessons', { keyPath: 'id' });
  if (!db.objectStoreNames.contains('clips')) {
    const clips = db.createObjectStore('clips', { keyPath: 'id' });
    clips.createIndex('byLesson', 'lessonId');
  }
}

export function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => upgrade(req.result);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

/**
 * Run one operation on a store.
 * @param {'lessons'|'clips'} storeName
 * @param {'readonly'|'readwrite'} mode
 * @param {(store: IDBObjectStore) => IDBRequest} fn
 */
export async function request(storeName, mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const req = fn(tx.objectStore(storeName));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
