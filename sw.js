/* احجز دورك (Dorak) service worker — makes the app installable on the home screen.
   Pages are always fetched from the network first, so every new index.html shows up at once;
   the cached copy is used only when there is no internet. Firebase traffic is never touched. */
const CACHE = "dawrak-v5.0";
const SHELL = ["./", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;            // Firebase, fonts, maps: straight to the network

  if (req.mode === "navigate") {                          // the page itself: network first, cached copy offline
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./", copy)); }
        return res;
      }).catch(() => caches.match("./"))
    );
    return;
  }
  if (SHELL.some(p => url.pathname.endsWith(p.slice(1)) && p !== "./")) {   // icons + manifest: cache first
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
  }
});
