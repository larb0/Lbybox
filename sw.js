// ===========================================================================
//  LarbyBox service worker
// ===========================================================================
//  Purpose here is narrow and worth being clear about: this makes the app
//  LAUNCH without a network connection. It does not make the speaker work
//  offline - that was never a network thing. All control happens over Web
//  Bluetooth directly to the LED board, so once the page is open the
//  internet is irrelevant either way.
//
//  Why that matters anyway: the app is served from somewhere (GitHub Pages
//  or similar), and a party is exactly where you won't have reliable signal.
//  Without this, no signal means no app at all.
//
//  Cache-first, because the shell is a single static file that changes only
//  when you deploy. Bump CACHE_NAME on every deploy or clients keep serving
//  the old one - the activate handler deletes any cache that isn't the
//  current name, which is what makes the update actually take effect.

const CACHE_NAME = 'larbybox-v273';

const SHELL = [
  './',
  './index.html',
  './gold.css',
  './gold.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // addAll rejects the whole batch if any single entry 404s, which would
      // leave the app with no cache at all. Individual puts let the shell
      // cache succeed even if an icon is missing.
      .then(cache => Promise.allSettled(SHELL.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Only GETs, and only our own origin. Anything else (a font, a CDN) goes
  // straight to the network - caching third-party responses here would be
  // caching things this app doesn't own the lifecycle of.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(hit => {
      if (hit) {
        // Serve the cached copy immediately, then quietly refresh it so the
        // next launch is current. The user never waits on the network, but
        // also never gets stuck on a stale build indefinitely.
        fetch(req).then(res => {
          if (res && res.ok) caches.open(CACHE_NAME).then(c => c.put(req, res));
        }).catch(() => {});
        return hit;
      }
      return fetch(req).then(res => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
