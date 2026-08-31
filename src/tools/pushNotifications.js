// Shared web-push helpers. The VAPID public key matches the backend's
// process.env.PublicVapidKey (unchanged from the original setup). Subscriptions
// are saved via the existing /notfication/saveSubsToDb route.
const VAPID_PUBLIC_KEY = 'BM67mHEyeX_8ChNMsQGcVkgE965usqKz0LTBppeporoWbviq6zPdH2EELVIK2QnlL5MLYqIzf-0-qxdWtBAd5w4';

export const pushSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

// Subscribe this device to push and persist the subscription server-side.
// Assumes permission is already 'granted'. Best-effort; throws are the caller's.
export async function subscribeToPush(authCtx, axiosGlobal) {
  if (!pushSupported()) return false;
  const swreg = await navigator.serviceWorker.ready;
  let sub = await swreg.pushManager.getSubscription();
  if (!sub) {
    sub = await swreg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY,
    });
  }
  await authCtx.jwtInst({
    method: 'post',
    url: `${axiosGlobal.defaultTargetApi}/notfication/saveSubsToDb`,
    data: { subs: JSON.stringify(sub), userId: authCtx.userId },
  });
  return true;
}

// Maps a notification's entityType/entityId to the in-app route that shows the
// related record. Kept in sync with the backend copy in xmsNotifications.js
// (which builds the same path for the push payload's click URL). Returns null
// when there's nothing specific to open.
export function notifPath(entityType, entityId) {
  const id = entityId ? String(entityId) : '';
  switch (entityType) {
    case 'invoice':       return id ? `/mis?open=${id}` : '/mis';
    case 'rawContent':    return id ? `/digitalMarketing?dm=raw&open=${id}`   : '/digitalMarketing?dm=raw';
    case 'readyToUpload': return id ? `/digitalMarketing?dm=ready&open=${id}` : '/digitalMarketing?dm=ready';
    case 'task':          return '/crm';
    case 'customer':      return id ? `/crm?open=${id}` : '/crm';
    case 'user':          return id ? `/users?open=${id}` : '/users';
    case 'tutorial':      return id ? `/tutorials?open=${id}` : '/tutorials';
    default:              return null;
  }
}

// Maps a resolved short link (module/entityType/entityId) to the in-app route
// that shows the target record. Separate from notifPath (above) because short
// links also cover entity types notifications never point at (product/variant).
// Both funnel into the same `?open=<id>` convention each section listens for.
export function shortLinkPath(module, entityType, entityId) {
  const id = entityId ? String(entityId) : '';
  switch (entityType) {
    case 'customer':      return id ? `/crm?open=${id}` : '/crm';
    case 'invoice':       return id ? `/mis?open=${id}` : '/mis';
    case 'product':       return id ? `/inventory?open=${id}` : '/inventory';
    case 'variant':       return id ? `/inventory?open=${id}&variant=1` : '/inventory';
    case 'rawContent':    return id ? `/digitalMarketing?dm=raw&open=${id}`   : '/digitalMarketing?dm=raw';
    case 'readyToUpload': return id ? `/digitalMarketing?dm=ready&open=${id}` : '/digitalMarketing?dm=ready';
    case 'user':          return id ? `/users?open=${id}` : '/users';
    case 'tutorial':      return id ? `/tutorials?open=${id}` : '/tutorials';
    default:              return '/';
  }
}

// Ask for permission (if not decided) and subscribe on grant.
// Returns 'granted' | 'denied' | 'unsupported'.
export async function enablePushNotifications(authCtx, axiosGlobal) {
  if (!pushSupported()) return 'unsupported';
  let perm = Notification.permission;
  if (perm === 'default') perm = await Notification.requestPermission();
  if (perm === 'granted') {
    try { await subscribeToPush(authCtx, axiosGlobal); } catch (_) { /* best-effort */ }
  }
  return perm;
}
