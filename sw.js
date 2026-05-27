// MyArubaPlan Service Worker
// Change this version number every time you update the app
var CACHE_VERSION = 'myarubaplan-v1.1';
var CACHE_FILES = ['./'];

// Install - cache the app
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache) {
      return cache.addAll(CACHE_FILES);
    })
  );
  // Take over immediately
  self.skipWaiting();
});

// Activate - delete old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_VERSION; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, fall back to cache
self.addEventListener('fetch', function(e) {
  // Skip Firebase requests - always go to network
  if (e.request.url.includes('firebaseio.com') ||
      e.request.url.includes('open-meteo.com')) {
    return;
  }

  e.respondWith(
    fetch(e.request).then(function(response) {
      // Cache successful responses
      if (response && response.status === 200) {
        var copy = response.clone();
        caches.open(CACHE_VERSION).then(function(cache) {
          cache.put(e.request, copy);
        });
      }
      return response;
    }).catch(function() {
      // Offline - serve from cache
      return caches.match(e.request);
    })
  );
});

// Badge support
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SET_BADGE' && 'setAppBadge' in self) {
    self.setAppBadge(e.data.count).catch(function() {});
  }
});
