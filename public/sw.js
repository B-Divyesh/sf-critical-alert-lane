const VERSION = 'cal-v3';
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;
const PRECACHE = ['/', '/offline.html', '/manifest.webmanifest', '/icons/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png', '/art/hero-cassette-512.webp', '/art/hero-cassette-768.webp', '/art/hero-cassette-768.avif', '/art/hero-cassette-768.jpg', '/privacy/', '/terms/'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    const fetchFresh = async url => {
      const response = await fetch(new Request(url, { cache: 'reload' }));
      if (!response.ok) throw new Error(`Could not precache ${url}`);
      await cache.put(url, response);
    };
    await Promise.all(PRECACHE.map(fetchFresh));
    const shell = await caches.match('/');
    const html = await shell.clone().text();
    const builtAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(match => match[1]);
    await Promise.all(builtAssets.map(fetchFresh));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => ![SHELL, ASSETS].includes(key)).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone(); caches.open(SHELL).then(cache => cache.put(event.request, copy)); return response;
    }).catch(async () => (await caches.match(event.request)) || (await caches.match('/')) || caches.match('/offline.html')));
    return;
  }
  if (/\.(?:js|css|png|jpe?g|webp|avif|svg|webmanifest)$/.test(url.pathname)) {
    event.respondWith(caches.match(url.pathname).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone(); caches.open(ASSETS).then(cache => cache.put(event.request, copy)); return response;
    })));
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    const existing = clients.find(client => new URL(client.url).origin === self.location.origin);
    return existing ? existing.focus() : self.clients.openWindow(event.notification.data?.url || '/');
  }));
});
