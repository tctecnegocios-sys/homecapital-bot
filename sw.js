/* ERP Home Capital — Service Worker
   App-shell cache para uso offline. Os dados do ERP ficam em localStorage
   (não passam por rede), então cachear a "casca" já garante o app offline. */
const VERSION = 'hc-erp-v1';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/logo_homecapital.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png',
  './assets/apple-touch-icon.png',
  './assets/favicon-64.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(VERSION).then((c) =>
      // addAll falha se qualquer item faltar; usamos allSettled para robustez
      Promise.allSettled(CORE.map((u) => c.add(u)))
    )
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin) {
    // Stale-while-revalidate para a casca do app
    e.respondWith(
      caches.match(req).then((cached) => {
        const net = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(VERSION).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || net;
      })
    );
  } else {
    // CDN (xlsx, pdf.js): rede primeiro, cache como reserva
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
  }
});
