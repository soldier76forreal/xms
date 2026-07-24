// XMS service worker — app-shell caching for a fast/offline-capable load.
// Bump CACHE_NAME on any change to this file's caching strategy so old
// clients pick up the new behavior instead of running stale cached logic.
const CACHE_NAME = 'xms-cache-v4';

// Precached at install — the app shell + icons. NOT the hashed /static/js
// and /static/css bundles (their exact filenames change per build and are
// cached on first fetch instead, see the fetch handler below).
const PRECACHE_URLS = [
  '/', '/index.html', '/manifest.json', '/offline.html',
  '/favicon.ico', '/favicon-16x16.png', '/favicon-32x32.png',
  '/icon-192x192.png', '/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {
      // Precaching is best-effort — a missing/renamed asset shouldn't block install.
    }))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;   // never intercept mutations

  const url = new URL(request.url);

  // Cross-origin (the API/auth servers, CDNs) — always go to the network.
  // Business data (inventory/CRM/invoices) must never be served stale.
  if (url.origin !== self.location.origin) return;

  // Navigation requests (the app shell) — network-first, so a deployed
  // update is picked up immediately when online; cache/offline as fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/offline.html')))
    );
    return;
  }

  // Same-origin static assets. Cache-first is ONLY safe for content-hashed
  // filenames (CRA production emits main.<8-hex>.js etc.) — a hashed hit can
  // never be stale. The DEV server's bundle.js / *.chunk.js are NOT hashed;
  // cache-first on those served a frozen old build (the "UI jumped back to the
  // pre-redesign nav after switching branch" bug, incl. the 400s from the old
  // bundle sending no branchId). Unhashed assets go network-first instead.
  const isFingerprinted = /\.[0-9a-f]{8,}\./i.test(url.pathname);

  if (isFingerprinted) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Unhashed same-origin asset — network-first, cached copy only as an
  // offline fallback so a dev bundle or icon can never go permanently stale.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (_) { data = { title: 'XCAPITAL', body: e.data ? e.data.text() : '' }; }

  // Current app notifications send { type:'generic', title, body, url }. The
  // three legacy Farsi types are kept for backward compatibility.
  const LEGACY = {
    newInvoice:  (d) => ({ title: `درخواست توسط ${d.sendFrom} تکمیل شد `, body: `${d.document}` }),
    sendRequest: (d) => ({ title: `درخواست از طرف ${d.sendFrom} برای شما ارسال شده است`, body: `${d.document}` }),
    edited:      (d) => ({ title: `درخواست توسط ${d.sendFrom} ویرایش شد`, body: `${d.document}` }),
  };

  const view = LEGACY[data.type] ? LEGACY[data.type](data) : { title: data.title || 'XCAPITAL', body: data.body || '' };

  e.waitUntil(
    self.registration.showNotification(view.title, {
      body: view.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: { url: data.url || '/' },
    })
  );
});

// Focus an existing app tab (navigating it to the related record) or open a new
// one when a push notification is clicked.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          await client.focus();
          // Route the already-open app to the record. navigate() needs the full
          // origin; fall back to postMessage if the browser blocks it.
          try {
            if ('navigate' in client) return client.navigate(self.location.origin + target);
          } catch (_) { /* fall through */ }
          client.postMessage({ type: 'notification-navigate', url: target });
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
