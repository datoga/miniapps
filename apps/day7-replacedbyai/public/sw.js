// Service Worker for Will AI Replace...?
// Implements caching strategy for offline support

const CACHE_NAME = "replacedbyai-v3";

// Assets to precache (avoid root "/" as it redirects to locale)
const PRECACHE_ASSETS = [
  "/en",
  "/es",
  "/data/professions.index.json",
  "/manifest.webmanifest",
];

// Install event - precache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip cross-origin requests (analytics, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip root path (redirects to locale, SW can't handle redirects)
  if (url.pathname === "/") {
    return;
  }

  // Skip navigation requests that might redirect
  if (request.mode === "navigate" && !url.pathname.match(/^\/[a-z]{2}(\/|$)/)) {
    return;
  }

  // Strategy: Cache First for static assets
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|eot|ico|png|jpg|jpeg|gif|svg|webp)$/)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Strategy: Cache First for data files
  if (url.pathname.startsWith("/data/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Strategy: Stale While Revalidate for HTML pages
  if (
    request.headers.get("accept")?.includes("text/html") ||
    url.pathname.match(/^\/[a-z]{2}(\/|$)/)
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default: Network first
  event.respondWith(networkFirst(request));
});

// Cache First strategy
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline fallback if available (use /en as fallback, not / which redirects)
    const offlinePage = await caches.match("/en") || await caches.match("/es");
    if (offlinePage) {
      return offlinePage;
    }
    throw error;
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        // Clone BEFORE any other operation to avoid "body already used" error
        const responseToCache = response.clone();
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, responseToCache);
      }
      return response;
    })
    .catch(() => null);

  return cached || fetchPromise;
}

// Network First strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Listen for messages from the client
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});


