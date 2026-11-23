/* احجز دورك moved to https://ehgez-dorak.web.app — this worker removes the old installed copy and sends every page to the new address. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k)));
    await self.registration.unregister();
    const cs = await self.clients.matchAll({ type: "window" });
    cs.forEach(c => { try { const u = new URL(c.url); c.navigate("https://ehgez-dorak.web.app/" + u.search + u.hash); } catch (x) {} });
  })());
});
