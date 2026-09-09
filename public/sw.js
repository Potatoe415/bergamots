const CACHE_NAME = "bergamots-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Stratégie "Network First" très basique juste pour remplir les critères PWA
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
