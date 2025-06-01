const CACHE_NAME = 'instant-chat-cache-v1';
const urlsToCache = [
  './', // Caches the root, often equivalent to index or start_url if configured
  './messenger_pwa.html',
  // Add paths to your icons if you want them pre-cached
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/apple-icon-180x180.png', // If you have one for apple-touch-icon
  // If you had separate CSS or JS files, list them here:
  // './css/style.css',
  // './js/app.js'
];

// Install a service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Failed to open cache or add urls: ', err);
      })
  );
  self.skipWaiting();
});

// Cache and return requests
self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  // For Firebase and other external resources, always fetch from network.
  // You might need to adjust this if Firebase assets should be cached or have specific caching headers.
  if (event.request.url.includes('firebase') || event.request.url.includes('gstatic')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Not in cache - fetch from network, then cache it
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          }
        ).catch(error => {
          console.error('Fetching failed:', error);
          // You could return a fallback offline page here if desired
          // return caches.match('./offline.html');
          throw error;
        });
      })
  );
});

// Update a service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});