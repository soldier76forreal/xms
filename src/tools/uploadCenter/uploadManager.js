import { putItem, deleteItem, getAllItems, clearFinished, isAvailable } from './uploadDb';

// The Upload Center engine.
//
// One queue for the whole app. Every upload anywhere — File Manager, Inventory
// media, Digital Marketing, Tutorials, CRM attachments, Job Reports, avatars —
// is handed to enqueueUpload() and then forgotten about by the form that
// started it. Nothing blocks on a transfer any more; the user closes the
// dialog and keeps working while it runs.
//
// Backed by api/routes/uploads/sessions.js's chunked protocol, so a dropped
// connection resumes from the last acknowledged byte rather than restarting,
// and by IndexedDB (uploadDb.js) so the same is true across a page reload or a
// closed-and-reopened browser.
//
// State lives outside React and is published through useSyncExternalStore —
// this thing must keep running while the component that started it unmounts
// (that's the entire point), so it can't be owned by any component.

const DEFAULT_CHUNK = 2 * 1024 * 1024;   // server suggests this too; kept in step

let items = [];              // in-memory mirror of the IndexedDB queue
let listeners = new Set();
let snapshot = [];           // frozen array handed to React
let ctx = null;              // { authCtx, axiosGlobal } — set once at app start
let persistent = true;       // false when IndexedDB is unavailable
let pumping = false;

// ── external store plumbing ─────────────────────────────────────────────────
function rebuildSnapshot() {
  snapshot = items.map((i) => ({
    localId: i.localId,
    purpose: i.purpose,
    targetId: i.targetId,
    filename: i.filename,
    totalBytes: i.totalBytes,
    sentBytes: i.sentBytes,
    status: i.status,
    error: i.error || null,
    sectionLabel: i.sectionLabel || null,
    createdAt: i.createdAt,
  }));
}

function emit() {
  rebuildSnapshot();
  listeners.forEach((l) => { try { l(); } catch (_) { /* a bad listener must not stall the queue */ } });
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  return snapshot;
}

// ── persistence helpers ─────────────────────────────────────────────────────
async function persist(item) {
  if (!persistent) return;
  try { await putItem(item); } catch (_) { persistent = false; }
}

async function removePersisted(localId) {
  if (!persistent) return;
  try { await deleteItem(localId); } catch (_) { /* best-effort */ }
}

function findItem(localId) {
  return items.find((i) => i.localId === localId);
}

async function updateItem(localId, patch) {
  const item = findItem(localId);
  if (!item) return null;
  Object.assign(item, patch);
  await persist(item);
  emit();
  return item;
}

// ── the transfer itself ─────────────────────────────────────────────────────
function api(path) {
  return `${ctx.axiosGlobal.defaultTargetApi}${path}`;
}

async function ensureSession(item) {
  if (item.sessionId) {
    // Resuming: ask the server where it actually got to. Its number wins over
    // ours — it is the only one that reflects what really landed on disk.
    try {
      const res = await ctx.authCtx.jwtInst({ method: 'get', url: api(`/uploads/sessions/${item.sessionId}`) });
      if (res.data && res.data.status === 'uploading') {
        await updateItem(item.localId, { sentBytes: res.data.receivedBytes });
        return item.sessionId;
      }
      if (res.data && res.data.status === 'completed') {
        await updateItem(item.localId, { status: 'done', sentBytes: item.totalBytes, result: res.data.result });
        return null;
      }
    } catch (_) {
      // Session gone (expired/swept) — fall through and start a fresh one.
    }
    await updateItem(item.localId, { sessionId: null, sentBytes: 0 });
  }

  const res = await ctx.authCtx.jwtInst({
    method: 'post', url: api('/uploads/sessions'),
    data: {
      purpose: item.purpose,
      targetId: item.targetId,
      extra: item.extra || {},
      filename: item.filename,
      mimetype: item.mimetype,
      totalBytes: item.totalBytes,
    },
  });
  await updateItem(item.localId, { sessionId: res.data.sessionId, sentBytes: res.data.receivedBytes || 0, chunkSize: res.data.chunkSize || DEFAULT_CHUNK });
  return res.data.sessionId;
}

async function sendChunks(item) {
  const chunkSize = item.chunkSize || DEFAULT_CHUNK;

  while (item.sentBytes < item.totalBytes) {
    // Re-read status every loop: pause/cancel arrive from the UI mid-transfer.
    const current = findItem(item.localId);
    if (!current || current.status !== 'uploading') return;
    if (!navigator.onLine) {
      await updateItem(item.localId, { status: 'offline' });
      return;
    }

    const start = current.sentBytes;
    const slice = current.file.slice(start, Math.min(start + chunkSize, current.totalBytes));

    let res;
    try {
      res = await ctx.authCtx.jwtInst({
        method: 'put',
        url: api(`/uploads/sessions/${current.sessionId}/chunk?offset=${start}`),
        data: slice,
        headers: { 'Content-Type': 'application/octet-stream' },
      });
    } catch (err) {
      const status = err?.response?.status;
      const serverOffset = err?.response?.data?.receivedBytes;

      // The server telling us its real offset is a recoverable disagreement,
      // not a failure — re-seek and keep going.
      if (status === 409 && typeof serverOffset === 'number') {
        await updateItem(item.localId, { sentBytes: serverOffset });
        continue;
      }
      // Anything else: park it. A network blip becomes 'offline' (auto-retried
      // when connectivity returns), a real rejection becomes 'error'.
      const offline = !navigator.onLine || err?.code === 'ERR_NETWORK';
      await updateItem(item.localId, {
        status: offline ? 'offline' : 'error',
        error: offline ? null : (err?.response?.data?.message || err?.message || 'Upload failed'),
      });
      return;
    }

    await updateItem(item.localId, { sentBytes: res.data.receivedBytes });
  }

  // All bytes in — finalize, which is where the module-specific work runs.
  try {
    const done = await ctx.authCtx.jwtInst({
      method: 'post', url: api(`/uploads/sessions/${item.sessionId}/complete`), data: {},
    });
    await updateItem(item.localId, { status: 'done', result: done.data.result || done.data });
    notifyCompleted(findItem(item.localId));
  } catch (err) {
    await updateItem(item.localId, {
      status: 'error',
      error: err?.response?.data?.message || err?.message || 'Could not finish the upload',
    });
  }
}

// ── completion fan-out ──────────────────────────────────────────────────────
// Sections that are on screen when one of their uploads lands need to refresh.
// A plain event bus keeps the manager from having to know about any of them.
const completionListeners = new Set();

export function onUploadCompleted(fn) {
  completionListeners.add(fn);
  return () => completionListeners.delete(fn);
}

function notifyCompleted(item) {
  if (!item) return;
  completionListeners.forEach((fn) => {
    try { fn({ purpose: item.purpose, targetId: item.targetId, result: item.result, filename: item.filename }); }
    catch (_) { /* one bad subscriber must not break the others */ }
  });
}

// ── the pump ────────────────────────────────────────────────────────────────
// One upload at a time, on purpose: a single transfer gets the whole
// connection, progress is honest, and a phone on mobile data isn't running six
// sockets at once.
async function pump() {
  if (pumping || !ctx) return;
  pumping = true;
  try {
    for (;;) {
      const next = items.find((i) => i.status === 'queued'
        || (i.status === 'offline' && navigator.onLine));
      if (!next) break;

      await updateItem(next.localId, { status: 'uploading', error: null });
      const item = findItem(next.localId);
      if (!item) continue;

      try {
        const sessionId = await ensureSession(item);
        if (!sessionId) continue;               // already completed server-side
        const fresh = findItem(item.localId);
        if (fresh && fresh.status === 'uploading') await sendChunks(fresh);
      } catch (err) {
        const offline = !navigator.onLine || err?.code === 'ERR_NETWORK';
        await updateItem(item.localId, {
          status: offline ? 'offline' : 'error',
          error: offline ? null : (err?.response?.data?.message || err?.message || 'Upload failed'),
        });
      }
    }
  } finally {
    pumping = false;
  }
}

// ── public API ──────────────────────────────────────────────────────────────

/**
 * Hand a file to the queue and return immediately. The caller does NOT await
 * the transfer — that is the whole point of the Upload Center.
 *
 * purpose      — one of the keys in api/routes/uploads/purposes.js
 * targetId     — the record it attaches to (tutorial id, variant id, …)
 * extra        — anything that purpose's completion needs (folder, description)
 * sectionLabel — what the panel shows under "related section"
 */
export async function enqueueUpload({ purpose, targetId = null, extra = {}, file, sectionLabel = null }) {
  const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const item = {
    localId, purpose, targetId, extra,
    file,
    filename: file.name,
    mimetype: file.type || 'application/octet-stream',
    totalBytes: file.size,
    sentBytes: 0,
    sessionId: null,
    chunkSize: DEFAULT_CHUNK,
    status: 'queued',
    error: null,
    sectionLabel,
    createdAt: Date.now(),
  };
  items.push(item);
  await persist(item);
  emit();
  pump();
  return localId;
}

export async function pauseUpload(localId) {
  await updateItem(localId, { status: 'paused' });
}

export async function resumeUpload(localId) {
  await updateItem(localId, { status: 'queued', error: null });
  pump();
}

export async function cancelUpload(localId) {
  const item = findItem(localId);
  if (!item) return;
  // Tell the server to reclaim the partial file. Best-effort — a failure here
  // just means the sweep gets it later.
  if (item.sessionId && ctx) {
    try { await ctx.authCtx.jwtInst({ method: 'delete', url: api(`/uploads/sessions/${item.sessionId}`) }); } catch (_) { /* swept later */ }
  }
  items = items.filter((i) => i.localId !== localId);
  await removePersisted(localId);
  emit();
}

export async function clearFinishedUploads() {
  items = items.filter((i) => i.status !== 'done' && i.status !== 'cancelled');
  if (persistent) { try { await clearFinished(); } catch (_) { /* best-effort */ } }
  emit();
}

export function retryUpload(localId) {
  return resumeUpload(localId);
}

/**
 * Called once from the app shell after login. Reloads anything left in
 * IndexedDB from a previous session and starts pushing it again.
 */
export async function initUploadManager({ authCtx, axiosGlobal }) {
  ctx = { authCtx, axiosGlobal };

  persistent = await isAvailable();
  if (persistent && items.length === 0) {
    try {
      const stored = await getAllItems();
      // 'uploading' from a previous run is a lie — that process is gone.
      // Anything unfinished goes back to 'queued' so the pump picks it up.
      items = stored.map((i) => (
        i.status === 'uploading' || i.status === 'offline'
          ? { ...i, status: 'queued' }
          : i
      ));
    } catch (_) {
      persistent = false;
    }
  }
  emit();

  // Resume as soon as connectivity comes back, without the user touching
  // anything — matches the "restore the connection and continue" requirement.
  window.addEventListener('online', () => {
    items.forEach((i) => { if (i.status === 'offline') i.status = 'queued'; });
    emit();
    pump();
  });

  pump();
}

export function isUploadManagerReady() {
  return !!ctx;
}
