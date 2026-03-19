const CACHE_NAME = "neoarcade-v1";
const CORE_ASSETS = [
  "/",
  "/controller",
  "/logo.png",
  "/logo.webp",
  "/games/slug/index.html",
  "/games/mario/index.html",
  "/games/pong.html",
  "/games/snake.html",
  "/games/breakout.html",
  "/games/invaders.html",
  "/games/pacman.html",
  "/games/pacman/pacman.js",
  "/games/pacman/modernizr-1.5.min.js",
  "/games/pacman/BD_Cartoon_Shout-webfont.ttf",
  "/games/pacman/audio/opening_song.ogg",
  "/games/pacman/audio/die.ogg",
  "/games/pacman/audio/eatghost.ogg",
  "/games/pacman/audio/eatpill.ogg",
  "/games/pacman/audio/eating.short.ogg",
  "/games/pacman/audio/opening_song.mp3",
  "/games/pacman/audio/die.mp3",
  "/games/pacman/audio/eatghost.mp3",
  "/games/pacman/audio/eatpill.mp3",
  "/games/pacman/audio/eating.short.mp3",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }
          const responseClone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match("/"));
    }),
  );
});
