const CACHE_NAME = "web-tools-v2.0.2";
const OFFLINE_PAGE = "/offline.html";

const urlsToCache = [
  "/",
  "/index.html",
  "/offline.html",
  "/favicon.png",
  "/favicon.ico",
  "/manifest.json",
  "/app-updater.js",
  "/Vazirmatn-font-face.css",
  "/assets/tool-wrapper.js",
  "/assets/tool-wrapper.css",
  "/assets/contact-form.css",
  "/assets/contact-form.js",
  "/assets/contact-form.html",
  "/assets/tools.css",
];

function shouldCache(url) {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;

  // Cache static assets
  if (
    pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)
  ) {
    return true;
  }

  // Cache HTML pages from the same origin
  if (
    urlObj.origin === self.location.origin &&
    (pathname.endsWith("/") || pathname.endsWith(".html"))
  ) {
    return true;
  }

  return false;
}

// Installation of caching patterns
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      // cache: "reload" bypasses the browser HTTP cache, so a new version
      // never precaches stale copies of the files
      return cache.addAll(
        urlsToCache.map((url) => new Request(url, { cache: "reload" })),
      );
    }),
  );
});

// Send message to all clients when new version is ready
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => self.clients.claim())
      .then(() => {
        // Notify all clients about the update
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "SW_UPDATED",
              message: "نسخه جدید در دسترس است",
            });
          });
        });
      }),
  );
});

// Listen for skip waiting message from page
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Cache first, then network, with a safe offline fallback
async function handleRequest(event) {
  const { request } = event;

  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    // no-cache: revalidate with the server instead of trusting the HTTP cache
    const response = await fetch(request, { cache: "no-cache" });

    if (response.ok && shouldCache(request.url)) {
      const copy = response.clone();
      event.waitUntil(
        caches
          .open(CACHE_NAME)
          .then((cache) => cache.put(request, copy))
          .catch((error) =>
            console.warn("[SW] Cache put failed:", request.url, error),
          ),
      );
    }

    return response;
  } catch (error) {
    console.warn("[SW] Network request failed:", request.url, error);

    if (request.mode === "navigate") {
      const offlinePage = await caches.match(OFFLINE_PAGE);
      if (offlinePage) {
        return offlinePage;
      }
    }

    return new Response("", { status: 504, statusText: "Offline" });
  }
}

// Fetch and cache strategy with offline fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Chrome throws if only-if-cached is used with a non same-origin mode
  if (request.cache === "only-if-cached" && request.mode !== "same-origin") {
    return;
  }

  // Let the browser handle third-party requests (fonts, analytics, CDNs)
  if (new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(handleRequest(event));
});

// Background sync event
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-data") {
    event.waitUntil(syncData());
  }
});

// Example function to sync data
async function syncData() {
  console.log("Syncing data...");
}

// Push notification event
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "اعلان جدید",
    icon: "/favicon.png",
    badge: "/favicon.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(self.registration.showNotification("ابزارهای وب", options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(clients.openWindow("/"));
});
