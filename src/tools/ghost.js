// "Ghost in" — client side.
//
// Entering and leaving ghost mode swaps the token in localStorage and then does
// a FULL PAGE RELOAD, deliberately. The app caches identity in many places
// (Redux slices, PermissionContext, per-section local state), so
// hot-swapping who you are inside a live SPA would leave stale fragments of the
// previous identity on screen — exactly the kind of bug that makes an
// impersonation feature untrustworthy. A reload rebuilds everything from the
// new token, which is cheap and unambiguous.
//
// The admin's own token is parked under REAL_TOKEN_KEY so exiting restores the
// real session without a re-login. The server-side sandbox (a cloned database)
// is what actually guarantees the target user's data is untouched — see
// api/connections/xmsPr.js and api/utils/ghost.js.

export const TOKEN_KEY      = 'accessToken';
export const REAL_TOKEN_KEY = 'xms_realToken';
export const GHOST_FLAG_KEY = 'xms_ghostActive';

export function isGhostActive() {
  try {
    return localStorage.getItem(GHOST_FLAG_KEY) === 'true' && !!localStorage.getItem(REAL_TOKEN_KEY);
  } catch (_) {
    return false;
  }
}

/**
 * Enter ghost mode as `userId`.
 * Returns { ok: true } after triggering a reload, or { ok: false, message }.
 */
export async function enterGhost(authCtx, axiosGlobal, userId) {
  try {
    const res = await authCtx.jwtInst({
      method: 'post',
      url: `${axiosGlobal.defaultTargetApi}/ghost/start/${userId}`,
    });
    const { ghostToken } = res.data || {};
    if (!ghostToken) return { ok: false, message: 'No ghost token returned' };

    const realToken = localStorage.getItem(TOKEN_KEY);
    // Park the real token FIRST — if anything below fails, the admin's session
    // is still recoverable rather than lost.
    localStorage.setItem(REAL_TOKEN_KEY, realToken || '');
    localStorage.setItem(TOKEN_KEY, ghostToken);
    localStorage.setItem(GHOST_FLAG_KEY, 'true');

    window.location.assign('/');
    return { ok: true };
  } catch (err) {
    const data = err?.response?.data || {};
    return {
      ok: false,
      message: data.message || 'Could not start ghost session',
      disabled: !!data.ghostDisabled,
    };
  }
}

/**
 * Leave ghost mode: tell the server to destroy the sandbox, then restore the
 * admin's own token. The local restore happens even if the server call fails —
 * being stuck inside a dead ghost session with no way back would be worse, and
 * the server reclaims abandoned sandboxes on its own TTL sweep anyway.
 */
export async function exitGhost(authCtx, axiosGlobal) {
  try {
    await authCtx.jwtInst({ method: 'post', url: `${axiosGlobal.defaultTargetApi}/ghost/stop` });
  } catch (_) { /* fall through — restore locally regardless */ }

  try {
    const realToken = localStorage.getItem(REAL_TOKEN_KEY);
    if (realToken) {
      localStorage.setItem(TOKEN_KEY, realToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);   // no way back — force a clean login
    }
    localStorage.removeItem(REAL_TOKEN_KEY);
    localStorage.removeItem(GHOST_FLAG_KEY);
  } catch (_) { /* storage unavailable */ }

  window.location.assign('/');
}

/**
 * Clear ghost state without calling the server — used when the server has
 * already told us the session is gone (401 + ghostSessionEnded), where another
 * request would only 401 again.
 */
export function forceExitGhostLocally() {
  try {
    const realToken = localStorage.getItem(REAL_TOKEN_KEY);
    if (realToken) localStorage.setItem(TOKEN_KEY, realToken);
    else localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REAL_TOKEN_KEY);
    localStorage.removeItem(GHOST_FLAG_KEY);
  } catch (_) { /* storage unavailable */ }
  window.location.assign('/');
}
