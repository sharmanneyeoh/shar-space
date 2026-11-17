// Keeps the app working offline. Bump CACHE when shipping big changes.
const CACHE = 'shar-space-v1';
const SHELL = ['./', './index.html', './styles.css', './app.js', './manifest.json', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const stash = (req, res) => {
  if (res.ok || res.type === 'opaque') {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy));
  }
  return res;
};

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // network first so updates show up straight away; cache when offline
    e.respondWith(
      fetch(req).then(res => stash(req, res))
        .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html')))
    );
  } else if (/(^|\.)(googleapis|gstatic)\.com$/.test(url.hostname)) {
    // fonts rarely change: cache first
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => stash(req, res))));
  }
});
