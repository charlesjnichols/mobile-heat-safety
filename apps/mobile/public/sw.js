/* Service worker for the Mobile Heat Safety Tracker PWA.
 *
 * Strategy:
 *  - App shell (navigation + JS bundle): cache-first with background refresh so a
 *    previously-loaded app launches instantly offline, while online usage stays fresh.
 *  - Same-origin static assets (JS/CSS/fonts): stale-while-revalidate.
 *  - On each install we purge old cache versions so a freshly deployed build supersedes
 *    the previous one on the next launch (FR-006 / FR-007).
 */

const CACHE_PREFIX = 'heat-safety-shell-v';
const STATIC_CACHE = 'heat-safety-static';
const RUNTIME_CACHE = 'heat-safety-runtime';

// Base path (repo subpath on GitHub Pages). Resolved at registration time from
// the service worker's own URL so the PWA works whether served at the domain
// root or under /coaching-code-orange/.
const BASE_PATH = new URL(self.registration.scope).pathname;

let cacheVersion = `${CACHE_PREFIX}1`;

// Precache the app shell (the root document and its script bundle) so the PWA
// launches fully offline after the first successful load.
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      let shell = [BASE_PATH || '/'];
      try {
        const res = await fetch(BASE_PATH || '/', { cache: 'no-cache' });
        if (res.ok) {
          const html = await res.text();
          const scriptMatch = html.match(/<script[^>]+src="([^"]+)"/i);
          if (scriptMatch && scriptMatch[1]) {
            shell.push(scriptMatch[1].startsWith('/') ? scriptMatch[1] : `${BASE_PATH}/${scriptMatch[1]}`);
          }
        }
      } catch (err) {
        // Offline-first install; precache what we know.
      }

      const cache = await caches.open(cacheVersion);
      await cache.addAll(shell);
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== cacheVersion)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Only handle requests from our own origin (FR-008: no cross-origin interception).
  if (url.origin !== self.location.origin) {
    return;
  }

  // Navigation requests: network-first, fall back to the cached app shell so
  // both offline launch and online updates behave correctly.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          const cached = await cache.match(request);
          if (cached) {
            return cached;
          }
          const shell = await caches.match(BASE_PATH || '/');
          return shell || Response.error();
        }
      })()
    );
    return;
  }

  // Same-origin static assets (JS, CSS, fonts, icons): stale-while-revalidate.
  event.respondWith(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(request);
      const networkPromise = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkPromise;
    })()
  );
});

// Allow an awaiting new service worker to take control immediately (FR-006).
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
