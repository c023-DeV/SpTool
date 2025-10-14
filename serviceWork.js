const VERSION = "000.001";
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
  "/img/favicon.png"

];

// On install, cache the static resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      cache.addAll(APP_STATIC_RESOURCES);
    })(),
  );
});

// delete old caches on activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
          return undefined;
        }),
      );
      await clients.claim();
    })(),
  );
});


// On fetch, intercept server requests
// and respond with cached responses instead of going to network
self.addEventListener("fetch", (event) => {
  // As a single page app, direct app to always go to cached home page.
  if (event.request.mode === "navigate") {
    event.respondWith(caches.match("/"));
    return;
  }

  // For all other requests, go to the cache first, and then the network.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request.url);
      if (cachedResponse) {
        // Return the cached response if it's available.
        return cachedResponse;
      }
      // If resource isn't in the cache, return a 404.
      return new Response(null, { status: 404 });
    })(),
  );
});
