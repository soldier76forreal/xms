// ── Unsent drafts for the Digital Marketing upload forms ────────────────────
// A draft here is DELIBERATELY local. Uploading a file is what creates the
// record — so nothing reaches the server until the person presses Save. The
// draft exists for one reason: if the browser dies, the tab is closed or a
// phone call interrupts a half-filled batch, they come back and send it.
//
// IndexedDB, not localStorage, for two reasons that both matter here:
//   · localStorage stores strings only. A picked File cannot go in it, and
//     base64-ing a video would both blow the quota and cost a third more size.
//   · localStorage is capped around 5 MB. IndexedDB holds real Blobs and is
//     bounded by the browser's disk quota instead.
//
// Written by hand rather than adding idb or similar — this is one object store
// with four operations, and the project's rule is no new dependency for
// something this small.
//
// SIZE BUDGET. The irreplaceable part of a draft is the typing: titles, per
// file descriptions, recorded voice notes, product tags. The raw video is
// already on the person's own disk, so re-picking it costs a few clicks.
// Blobs are therefore kept only while the batch stays under a budget; past it
// the draft keeps every name and description and says which files need
// re-picking, instead of writing gigabytes to disk on every change.

const DB_NAME = 'xms_dm_drafts';
const DB_VERSION = 1;
const STORE = 'drafts';

// Total picked bytes we are willing to hold. Beyond this the file CONTENT is
// dropped from the draft and only its name/description survive.
export const DRAFT_BLOB_BUDGET = 200 * 1024 * 1024;   // 200 MB

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    // Private windows, blocked site data and some embedded browsers have no
    // IndexedDB at all. The form has to keep working without it, so every
    // caller treats a failure as "no draft" rather than an error.
    if (typeof indexedDB === 'undefined') { reject(new Error('no indexedDB')); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).catch((err) => { dbPromise = null; throw err; });
  return dbPromise;
}

function tx(mode, run) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    let out;
    try { out = run(store); } catch (err) { reject(err); return; }
    t.oncomplete = () => resolve(out && out.result !== undefined ? out.result : out);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

/** One draft per key. 'rawContent', or `readyToUpload:<rawContentId>`. */
export async function saveDraft(key, draft) {
  try {
    await tx('readwrite', (store) => store.put({ ...draft, key, updatedAt: Date.now() }));
    return true;
  } catch (err) {
    return false;   // no IndexedDB, or the quota said no — typing must not break
  }
}

export async function loadDraft(key) {
  try {
    const row = await tx('readonly', (store) => store.get(key));
    return row || null;
  } catch (err) {
    return null;
  }
}

export async function clearDraft(key) {
  try {
    await tx('readwrite', (store) => store.delete(key));
    return true;
  } catch (err) {
    return false;
  }
}

/** Every stored draft, newest first — what the list's draft strip reads. */
export async function listDrafts(kind) {
  try {
    const rows = await tx('readonly', (store) => store.getAll());
    return (rows || [])
      .filter((r) => !kind || r.kind === kind)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (err) {
    return [];
  }
}

// ── Turning picked files into something storable, and back ──────────────────
// A File IS a Blob, so it survives IndexedDB as-is; what does not survive is
// the File wrapper's name, which is why it is carried alongside and the File
// is rebuilt on the way out.

export function totalBytes(files) {
  return (files || []).reduce((sum, f) => sum + ((f.file && f.file.size) || 0)
    + ((f.voiceFile && f.voiceFile.size) || 0), 0);
}

/**
 * Which files to keep the BYTES of, given their sizes. Smallest first, so one
 * huge video costs only itself: the first version dropped every file's bytes
 * the moment the batch as a whole went over budget, so a single 500 MB clip
 * took ten small photos down with it.
 * @returns {Set<number>} indexes into `sizes`
 */
export function keepWithinBudget(sizes, budget = DRAFT_BLOB_BUDGET) {
  const order = sizes.map((_, i) => i).sort((a, b) => (sizes[a] || 0) - (sizes[b] || 0));
  const keep = new Set();
  let used = 0;
  for (const i of order) {
    const size = sizes[i] || 0;
    if (used + size <= budget) { keep.add(i); used += size; }
  }
  return keep;
}

/**
 * @param files the form's own pendingFiles shape
 * @returns {{ entries, droppedContent }} droppedContent is true when at least
 *          one file is in the draft by name only and has to be picked again.
 */
export function packFiles(files) {
  const list = files || [];
  // Voice notes are small and are the person's own recording — always kept, so
  // they come off the budget before any picked file is considered.
  const voiceBytes = list.reduce((n, f) => n + ((f.voiceFile && f.voiceFile.size) || 0), 0);
  const keep = keepWithinBudget(list.map((f) => (f.file ? f.file.size : 0)), DRAFT_BLOB_BUDGET - voiceBytes);
  const entries = list.map((f, i) => ({
    key: f.key,
    name: f.name || '',
    description: f.description || '',
    // A restored entry whose bytes were not kept has no File at all. Fall back
    // to the name and size it was saved with — reading them off the missing
    // File wiped them on the very next autosave.
    fileName: (f.file && f.file.name) || f.fileName || '',
    fileType: (f.file && f.file.type) || f.fileType || '',
    fileSize: (f.file && f.file.size) || f.fileSize || 0,
    blob: f.file && keep.has(i) ? f.file : null,
    voiceBlob: f.voiceFile || null,
    voiceName: (f.voiceFile && f.voiceFile.name) || '',
  }));
  // Derived from the entries themselves, not from "was this save over budget":
  // after a restore nothing is over budget (the big file has no bytes left to
  // count), and the old rule then reported nothing missing.
  return { entries, droppedContent: entries.some((e) => !e.blob && e.fileName) };
}

/** Rebuild the form's pendingFiles. Entries whose bytes were dropped come back
 *  flagged, so the form can show which ones need picking again. */
export function unpackFiles(entries, nextKey) {
  return (entries || []).map((e) => ({
    key: e.key != null ? e.key : nextKey(),
    name: e.name,
    description: e.description,
    file: e.blob ? new File([e.blob], e.fileName || 'file', { type: e.fileType || undefined }) : null,
    voiceFile: e.voiceBlob ? new File([e.voiceBlob], e.voiceName || 'voice.webm', { type: 'audio/webm' }) : null,
    missingContent: !e.blob,          // picked before, bytes not kept — re-pick to send
    fileName: e.fileName,
    fileType: e.fileType,
    fileSize: e.fileSize,
  }));
}
