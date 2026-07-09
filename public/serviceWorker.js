// XMS service worker — app-shell caching for a fast/offline-capable load.
// Bump CACHE_NAME on any change to this file's caching strategy so old
// clients pick up the new behavior instead of running stale cached logic.
const CACHE_NAME = 'xms-cache-v2';

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

  // Same-origin static assets (hashed /static/js, /static/css, images, fonts,
  // icons) — cache-first. CRA fingerprints these filenames per build, so a
  // cache-first hit can never serve stale code; a new deploy just gets new
  // filenames the cache hasn't seen yet.
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
});

self.addEventListener('push', (e) => {
  const data = e.data.json();
  switch (data.type) {
    case 'newInvoice':
      e.waitUntil(
        self.registration.showNotification(`درخواست توسط ${data.sendFrom} تکمیل شد `, {
          body: `${data.document}`,
          icon: '/icon-192x192.png',
        })
      );
      break;
    case 'sendRequest':
      e.waitUntil(
        self.registration.showNotification(`درخواست از طرف ${data.sendFrom} برای شما ارسال شده است`, {
          body: `${data.document}`,
          icon: '/icon-192x192.png',
        })
      );
      break;
    case 'edited':
      e.waitUntil(
        self.registration.showNotification(`درخواست توسط ${data.sendFrom} ویرایش شد`, {
          body: `${data.document}`,
          icon: '/icon-192x192.png',
        })
      );
      break;
    default:
      break;
  }
});
