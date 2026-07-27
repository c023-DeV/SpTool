const VERSION = "000.015";
const CACHE_NAME = `sptool-v-${VERSION}`;

const APP_STATIC_RESOURCES = [
  "/",
  "/index.html",
  "/css/norm.css",
  "/css/style.css",
  "/js/main.js",
  "/app.webmanifest",
  "/img/fav/favicon.svg",
  "/img/fav/favicon_mask.svg",
  "/img/fav/ico_180.png",
  "/img/fav/ico_150.png",
  "/img/fav/ico_192.png",
  "/img/fav/ico_512.png",
  "/img/fav/ico_192_mask.png",
  "/img/fav/ico_512_mask.png",
  "/fonts/SourceSans3VF-Upright.otf.woff2",
  "/img/sdeco/topBo_lit.svg",
  "/img/sdeco/topL_lit.svg",
  "/img/sdeco/topR_lit.svg",
  "/img/sdeco/bottomBo_lit.svg",
  "/img/sdeco/treeL_lit.svg",
  "/img/sdeco/treeR_lit.svg",
  "/img/sdeco/dzBin_lit.svg",
  "/img/sdeco/topBo_drk.svg",
  "/img/sdeco/topL_drk.svg",
  "/img/sdeco/topR_drk.svg",
  "/img/sdeco/bottomBo_drk.svg",
  "/img/sdeco/treeL_drk.svg",
  "/img/sdeco/treeR_drk.svg",
  "/img/sdeco/dzBin_drk.svg",
  "/img/dzTitle.svg",
  "/img/favicon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(APP_STATIC_RESOURCES);
      console.log(`[SW] Installed version ${VERSION}`);
    })(),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      console.log(`[SW] Cleaning old caches. Current: ${CACHE_NAME}, Found:`, names);
      
      await Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log(`[SW] Deleting cache: ${name}`);
            return caches.delete(name);
          }),
      );
      
      await clients.claim();
      console.log(`[SW] Activation complete. Now controlling clients.`);
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data.action === "skipWaiting") {
    console.log("[SW] Received skipWaiting message");
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(caches.match("/"));
    return;
  }

  const url = new URL(event.request.url);
  const isAsset = /\.(js|css|woff2|svg|png)$/i.test(url.pathname);

  if (isAsset) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(event.request);

        const fetchPromise = fetch(event.request).then((response) => {
          if (response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => cached || new Response(null, { status: 404 }));

        return cached || fetchPromise;
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request);
      return cached || new Response(null, { status: 404 });
    })(),
  );
});