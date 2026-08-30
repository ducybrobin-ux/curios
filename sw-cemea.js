const CACHE_NAME = 'cemea-v1';
const PRECACHE = [
  '/cemea.html',
  '/js/cemea.js',
  '/css/cemea.css',
  '/content/config/cemea-badges.json',
  '/content/packs/cemea-pack.json'
];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
});
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (PRECACHE.includes(url.pathname)){
    event.respondWith(caches.match(event.request).then(r=>r||fetch(event.request)));
    return;
  }
  event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
});
