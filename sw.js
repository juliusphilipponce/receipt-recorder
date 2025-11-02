const CACHE_NAME = 'receipt-scanner-ai-cache-v2'; // Bump version to force update
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.tsx', // Cache the main script
  '/icon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(APP_SHELL_URLS);
      })
      .catch(error => console.error('Failed to cache app shell:', error))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests and API calls to Supabase
  if (request.method !== 'GET' || url.hostname.includes('supabase.co')) {
    return;
  }
  
  // For navigation requests, use a network-first strategy to get the latest HTML.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/index.html')) // Fallback to cached HTML
    );
    return;
  }

  // For all other requests (CSS, JS, images), use a cache-first strategy.
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If not in cache, fetch from network
        return fetch(request).then((networkResponse) => {
          // We must clone the response to use it in the cache and to return it to the browser.
          const responseToCache = networkResponse.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            // Only cache valid responses. 
            // This will cache successful (2xx) same-origin and CORS responses,
            // as well as opaque responses from CDNs, which are essential for offline functionality.
            if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
              cache.put(request, responseToCache);
            }
          });
          
          return networkResponse;
        });
      })
  );
});
