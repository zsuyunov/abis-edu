// ULTRA-INSTANT Service Worker for zero loading time
const CACHE_NAME = 'beruniy-ultra-cache-v1';
const STATIC_CACHE = 'beruniy-static-v1';
const API_CACHE = 'beruniy-api-v1';

// Cache all static assets instantly
const STATIC_ASSETS = [
  '/',
  '/admin',
  '/admin/list/students',
  '/admin/list/parents',
  '/admin/homework',
  '/admin/complaints',
  '/admin/documents',
  '/api/auth/me',
  '/api/dashboard/stats',
  '/api/branches',
  '/api/classes',
  '/api/subjects',
  '/api/teachers'
];

// Install event - cache everything instantly
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
      caches.open(API_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
    ])
  );
  self.skipWaiting();
});

// Activate event - take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Fetch event - serve from cache instantly
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API routes - network first, no caching for fresh data
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).then((networkResponse) => {
        // Don't cache API responses to ensure fresh data
        return networkResponse;
      }).catch(() => {
        // Only fallback to cache if network fails
        return caches.open(API_CACHE).then((cache) => {
          return cache.match(request);
        });
      })
    );
    return;
  }

  // Static assets - cache first
  if (request.method === 'GET') {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            return response;
          }
          return fetch(request);
        });
      })
    );
    return;
  }

  // Default - network first
  event.respondWith(fetch(request));
});

// Background sync for data updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sync critical data in background
      Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/dashboard/stats'),
        fetch('/api/branches'),
        fetch('/api/classes'),
        fetch('/api/subjects'),
        fetch('/api/teachers')
      ]).then((responses) => {
        // Cache successful responses
        responses.forEach((response) => {
          if (response.ok) {
            caches.open(API_CACHE).then((cache) => {
              cache.put(response.url, response);
            });
          }
        });
      })
    );
  }
});

// Push notifications for instant updates
self.addEventListener('push', (event) => {
  const options = {
    body: 'New data available',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Beruniy School', options)
  );
});
