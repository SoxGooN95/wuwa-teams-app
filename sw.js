// Offline-Betrieb: App-Code aus dem Cache. Spieldaten und Bilder liegen in IndexedDB, nicht hier.
// index.html und Manifest: erst Netz, dann Cache (Updates kommen an). Alles andere: erst Cache, dann Netz.
const CACHE = "wuwa-teams-v128";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html", "./manifest.webmanifest"]))); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return; // iCloud-Anfragen nie abfangen
  const networkFirst = req.mode === "navigate" || url.pathname.endsWith("manifest.webmanifest");
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (networkFirst) {
      try { const res = await fetch(req); cache.put(req, res.clone()); return res; }
      catch { return (await cache.match(req)) || (await cache.match("./index.html")) || Response.error(); }
    }
    const hit = await cache.match(req);
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  })());
});
