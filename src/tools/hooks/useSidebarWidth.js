import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import AuthContext from '../../components/authAndConnections/auth';
import AxiosGlobal from '../../components/authAndConnections/axiosGlobalUrl';

// Per-user, cross-device sidebar widths.
//
// Two layers on purpose:
//   localStorage — read synchronously on mount, so a resized sidebar renders
//                  at the right width on the very first frame instead of
//                  snapping after a round trip.
//   server       — the source of truth (PUT /users/me/ui-prefs), so the width
//                  follows the person to another machine. Same reasoning as
//                  filterMemory, which is also server-side rather than
//                  per-browser.
//
// Writes are debounced: a drag fires dozens of updates a second and none of
// them are worth a request.

const LS_KEY = 'xms_sidebarWidths';
const SAVE_DEBOUNCE_MS = 600;

// Module-level so every sidebar on the page shares one copy and one save
// timer — otherwise two sidebars saving at once would each PUT a payload
// missing the other's key.
let cache = null;
let saveTimer = null;
let pendingSave = {};
const subscribers = new Set();

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch (_) { return {}; }
}

function writeLocal(widths) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(widths)); } catch (_) { /* storage unavailable */ }
}

function notify() {
  subscribers.forEach((fn) => { try { fn(); } catch (_) { /* ignore */ } });
}

export function useSidebarWidth(key, defaultWidth, { min = 180, max = 720 } = {}) {
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  if (cache === null) cache = readLocal();

  const [width, setWidthState] = useState(() => {
    const stored = Number(cache[key]);
    return Number.isFinite(stored) ? Math.min(max, Math.max(min, stored)) : defaultWidth;
  });

  // Re-render when another sidebar (or the server load) updates the shared map.
  useEffect(() => {
    const fn = () => {
      const stored = Number(cache[key]);
      if (Number.isFinite(stored)) setWidthState(Math.min(max, Math.max(min, stored)));
    };
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }, [key, min, max]);

  // Pull the server's copy once per app load — this is what makes the width
  // follow the user to a different browser.
  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current || authCtx.isLoggedIn !== true) return;
    loadedRef.current = true;
    authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/users/me/ui-prefs` })
      .then((res) => {
        const server = res.data?.sidebarWidths || {};
        if (!Object.keys(server).length) return;
        cache = { ...cache, ...server };
        writeLocal(cache);
        notify();
      })
      .catch(() => { /* fall back to whatever localStorage had */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authCtx.isLoggedIn]);

  const flushSave = useCallback(() => {
    const payload = pendingSave;
    pendingSave = {};
    if (!Object.keys(payload).length) return;
    authCtx.jwtInst({
      method: 'put',
      url: `${axiosGlobal.defaultTargetApi}/users/me/ui-prefs`,
      data: { sidebarWidths: payload },
    }).catch(() => { /* the local value still applies; retried on the next drag */ });
  }, [authCtx, axiosGlobal]);

  const setWidth = useCallback((next) => {
    const clamped = Math.min(max, Math.max(min, Math.round(next)));
    setWidthState(clamped);
    cache = { ...cache, [key]: clamped };
    writeLocal(cache);
    pendingSave[key] = clamped;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
  }, [key, min, max, flushSave]);

  const resetWidth = useCallback(() => setWidth(defaultWidth), [setWidth, defaultWidth]);

  return { width, setWidth, resetWidth, min, max };
}
