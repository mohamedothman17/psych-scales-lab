/* Offline support: network first, cached copy when offline. Only same-origin GET requests are cached.
   The app shell (CORE) is precached at install. Lazy chunks (lessons, laws, tools, images) are not:
   they are cached the first time they are fetched and stay available offline afterwards. */
const CACHE = 'psych-scales-lab-7a6ce0e4';
const RUNTIME = 'psych-scales-lab-runtime';
const CORE = [
 "./",
 "icon-192.png",
 "icon-512.png",
 "manifest.webmanifest",
 "firebase-config.js?v=e2352a7279",
 "vendor/anim/gsap.min.js",
 "vendor/anim/ScrollTrigger.min.js",
 "vendor/anim/SplitText.min.js",
 "vendor/anim/MotionPathPlugin.min.js",
 "vendor/anim/lenis.min.js",
 "privacy.js?v=2298d6faf6",
 "visits.js?v=60e8c491af",
 "app.js?v=94cbb1987e",
 "style.css?v=907f9377c5"
];
const SHELL = new Set(CORE.map(u => new URL(u, self.location).href));
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('psych-scales-lab-') && k !== CACHE && k !== RUNTIME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Store a lazily fetched file and drop older versions of the same file (same path, different ?v=). */
function keep(req, copy) {
  return caches.open(RUNTIME).then(c => c.put(req, copy).then(() => c.keys()).then(ks => { const u = new URL(req.url); return Promise.all(ks.filter(k => { const o = new URL(k.url); return o.pathname === u.pathname && o.search !== u.search; }).map(k => c.delete(k))); })).catch(() => null);
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req).then(res => {
    if (res.ok && res.type === 'basic') { const copy = res.clone(); if (req.mode === 'navigate' || SHELL.has(req.url)) caches.open(CACHE).then(c => c.put(req, copy)); else e.waitUntil(keep(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(r => r || (req.mode === 'navigate' ? caches.match('./') : null)).then(r => r || Response.error())));
});
