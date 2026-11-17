const CACHE_NAME = 'poostudio-shell-v4';
const OFFLINE_PAGE = new URL('offline.html', self.location).pathname;
const OFFLINE_STYLESHEET = new URL('assets/css/offline.css', self.location).pathname;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([OFFLINE_PAGE, OFFLINE_STYLESHEET]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode !== 'navigate') {
    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== self.location.origin) return;
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => cachedResponse || fetch(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_PAGE))
  );
});
