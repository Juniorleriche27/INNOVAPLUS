const CACHE = 'innova-pwa-v1';
const ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.ico'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter(k=>k!==CACHE).map((k)=>caches.delete(k))))
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then((resp) => resp || fetch(e.request).then((r)=>{
        const copy = r.clone();
        caches.open(CACHE).then((c)=>c.put(e.request, copy));
        return r;
      }).catch(()=> resp))
    );
  }
});

