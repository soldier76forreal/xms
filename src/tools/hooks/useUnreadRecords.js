import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import AuthContext from '../../components/authAndConnections/auth';
import AxiosGlobal from '../../components/authAndConnections/axiosGlobalUrl';

// Per-user, per-list "seen up to" cutoffs that drive the unread-record
// indicator (a dot + tinted row) — the same idea as a per-conversation
// unread badge in WhatsApp/Telegram, just applied to app record lists
// instead of chat threads.
//
// Module-level cache (mirrors useSidebarWidth.js's pattern): fetched once
// per app load via GET /users/me/last-seen, shared by every list so two
// sections mounting around the same time share one request instead of
// racing two.
let cache = null;
let cacheLoadPromise = null;
const subscribers = new Set();

function notify() { subscribers.forEach((fn) => { try { fn(); } catch (_) { /* ignore */ } }); }

function loadCache(authCtx, axiosGlobal) {
  if (cache !== null) return Promise.resolve(cache);
  if (cacheLoadPromise) return cacheLoadPromise;
  cacheLoadPromise = authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/users/me/last-seen` })
    .then((res) => {
      cache = res.data?.recordsLastSeenAt || {};
      notify();
      return cache;
    })
    .catch(() => { cache = {}; return cache; });
  return cacheLoadPromise;
}

// `sectionKey` scopes the cutoff (e.g. 'crm', 'mis', 'inventory', 'tutorials',
// 'dmRawContent', ...) — each list tracks its own, like a separate WhatsApp
// conversation. `getInsertDate`/`getCreatedBy` let each module's own field
// names (insertDate vs createdAt, createdBy vs generatedBy vs owner vs
// userId) plug in without forcing one naming convention everywhere.
//
// Lifecycle, once per mount:
//   1. Read (and FREEZE) whatever cutoff is currently stored for this
//      section — a record inserted by someone else after that moment is
//      unread for the rest of this visit, even once step 2 below has
//      already moved the stored cutoff forward.
//   2. Push the stored cutoff to "now", so the NEXT time this section opens,
//      only records inserted after THIS visit will be unread — exactly how
//      opening a chat clears its badge without retroactively erasing what
//      you're looking at right now.
//   3. A section opened for the very first time (no stored cutoff at all)
//      starts from "now", not from the beginning of time — a brand-new
//      viewer shouldn't see the section's entire history flagged unread.
export function useUnreadRecords(sectionKey, {
  getInsertDate = (r) => r.insertDate,
  getCreatedBy = (r) => r.createdBy,
} = {}) {
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const myId = String(authCtx.decode?.id || authCtx.decode?._id || '');

  const cutoffRef = useRef(undefined); // undefined = not resolved yet
  const [, forceRender] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let bumped = false;
    loadCache(authCtx, axiosGlobal).then((map) => {
      if (cancelled) return;
      const stored = map[sectionKey];
      cutoffRef.current = stored ? new Date(stored) : new Date();
      forceRender((n) => n + 1);

      if (bumped) return;
      bumped = true;
      const nowIso = new Date().toISOString();
      cache = { ...(cache || {}), [sectionKey]: nowIso };
      authCtx.jwtInst({
        method: 'put',
        url: `${axiosGlobal.defaultTargetApi}/users/me/last-seen`,
        data: { section: sectionKey },
      }).catch(() => { /* best-effort — worst case this section re-flags the same records next visit */ });
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKey]);

  const isUnread = useCallback((record) => {
    if (!record || cutoffRef.current === undefined) return false;
    const createdBy = getCreatedBy(record);
    if (!createdBy || String(createdBy) === myId) return false; // never flag your own inserts
    const created = getInsertDate(record);
    if (!created) return false;
    return new Date(created) > cutoffRef.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]);

  return { isUnread };
}
