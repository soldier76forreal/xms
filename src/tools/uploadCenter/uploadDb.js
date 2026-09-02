// IndexedDB store behind the Upload Center.
//
// This is what makes an upload survive more than a page view. The queue —
// including the actual file bytes — lives here, not in memory, so closing the
// tab (or the whole browser) and coming back later resumes from the last
// completed byte instead of starting over. IndexedDB can hold Blob/File
// objects directly in every browser this app supports, which is the only way
// to have the remaining bytes still available after a restart.
//
// Honest limit, stated plainly because it shapes the whole design: while the
// tab is closed NO bytes move. No web API changes that reliably across iOS,
// Android and desktop. What this buys is that nothing is ever lost and nothing
// is ever re-sent — reopening the app continues exactly where it stopped.
//
// Plain indexedDB, no wrapper library (this project doesn't add dependencies
// without asking, and the surface used here is small).

const DB_NAME = 'xms_upload_center';
const DB_VERSION = 1;
const STORE = 'uploads';

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    let req;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (err) {
      reject(err); return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'localId' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(mode, fn) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    let result;
    try { result = fn(store); } catch (err) { reject(err); return; }
    t.oncomplete = () => resolve(result && result.__req ? result.__req.result : result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

export async function putItem(item) {
  await tx('readwrite', (store) => { store.put(item); });
  return item;
}

export async function getItem(localId) {
  return tx('readonly', (store) => ({ __req: store.get(localId) }));
}

export async function deleteItem(localId) {
  return tx('readwrite', (store) => { store.delete(localId); });
}

export async function getAllItems() {
  const all = await tx('readonly', (store) => ({ __req: store.getAll() }));
  return (all || []).sort((a, b) => a.createdAt - b.createdAt);
}

/** Drop finished/cancelled rows — the panel's "clear finished". */
export async function clearFinished() {
  const all = await getAllItems();
  const done = all.filter((i) => i.status === 'done' || i.status === 'cancelled');
  await Promise.all(done.map((i) => deleteItem(i.localId)));
  return done.length;
}

/**
 * Storage is not guaranteed: a private window, a browser set to block site
 * data, or a quota refusal all make IndexedDB unavailable. The manager treats
 * that as "run in memory only for this session" rather than failing the
 * upload outright — degraded, but the user can still upload.
 */
export async function isAvailable() {
  try {
    await openDb();
    return true;
  } catch (_) {
    return false;
  }
}
