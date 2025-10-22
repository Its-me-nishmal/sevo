const CACHE_NAME = 'sevo-cache-v6'; // Increment cache version to force update
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/styles/globals.css',
  '/src/components/Header.jsx',
  '/src/components/NetworkStatusModal.jsx',
  '/src/hooks/useNetworkStatus.js',
  'https://placehold.co/64x64/7DD3FC/111827.png?text=SEVO&font=Raleway',
  'https://placehold.co/192x192/7DD3FC/111827.png?text=SEVO&font=Raleway',
  'https://placehold.co/512x512/7DD3FC/111827.png?text=SEVO&font=Raleway',
  // Add other critical assets here, e.g., fonts, images, JS bundles
  // Note: Vite bundles will have unique names, so consider a build step to generate this list
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache-first strategy for static assets
      if (response) {
        return response;
      }

      // Network-first strategy for other requests (e.g., API calls)
      return fetch(event.request)
        .then((networkResponse) => {
          // Only cache successful responses
          if (networkResponse.ok && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If both cache and network fail, you might want to return an offline page
          // For now, just re-throw the error or return a generic fallback
          console.log('Service Worker: Fetch failed for', event.request.url);
          // Example: return caches.match('/offline.html');
        });
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});