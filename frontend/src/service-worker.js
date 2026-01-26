/**
 * Enhanced Service Worker with Workbox-inspired strategies
 * Implements offline-first caching for optimal performance
 */

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `static-assets-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-cache-${CACHE_VERSION}`;
const API_CACHE = `api-cache-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// Static assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json'
];

// Max cache sizes
const MAX_CACHE_SIZE = {
  [RUNTIME_CACHE]: 50,
  [API_CACHE]: 100,
  [IMAGE_CACHE]: 60
};

// Cache expiration times (in seconds)
const CACHE_EXPIRATION = {
  [API_CACHE]: 5 * 60, // 5 minutes
  [IMAGE_CACHE]: 30 * 24 * 60 * 60, // 30 days
  [RUNTIME_CACHE]: 24 * 60 * 60 // 24 hours
};

/**
 * Installation - precache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing version', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[ServiceWorker] Precaching static assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * Activation - cleanup old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating version', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Remove old version caches
              return cacheName.startsWith('static-assets-') ||
                     cacheName.startsWith('runtime-cache-') ||
                     cacheName.startsWith('api-cache-') ||
                     cacheName.startsWith('images-');
            })
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE &&
                     cacheName !== RUNTIME_CACHE &&
                     cacheName !== API_CACHE &&
                     cacheName !== IMAGE_CACHE;
            })
            .map((cacheName) => {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

/**
 * Fetch - route requests to appropriate cache strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Route to appropriate strategy based on request type
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
  } else if (isImageRequest(url)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  } else if (isNavigationRequest(request)) {
    event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE));
  } else {
    event.respondWith(staleWhileRevalidateStrategy(request, RUNTIME_CACHE));
  }
});

/**
 * Cache-First Strategy
 * Best for: Static assets that rarely change (images, fonts, compiled JS/CSS)
 */
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Check if cache entry is expired
      if (!isCacheExpired(cachedResponse, cacheName)) {
        return cachedResponse;
      }
    }

    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      await cache.put(request, addCacheMetadata(networkResponse.clone()));
      await trimCache(cacheName);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] Cache-First failed:', error);
    
    // Return cached version even if expired
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback
    return createOfflineResponse(request);
  }
}

/**
 * Network-First Strategy
 * Best for: API calls and dynamic content that should be fresh
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request.clone());
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      await cache.put(request, addCacheMetadata(networkResponse.clone()));
      await trimCache(cacheName);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network-First fallback to cache:', error.message);
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return createOfflineResponse(request);
  }
}

/**
 * Stale-While-Revalidate Strategy
 * Best for: Assets that can be slightly stale but should update in background
 */
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  // Fetch in background and update cache
  const fetchPromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        const cache = await caches.open(cacheName);
        await cache.put(request, addCacheMetadata(networkResponse.clone()));
        await trimCache(cacheName);
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[ServiceWorker] Stale-While-Revalidate fetch failed:', error.message);
      return cachedResponse || createOfflineResponse(request);
    });
  
  // Return cached response immediately if available
  return cachedResponse || fetchPromise;
}

/**
 * Add cache metadata to response for expiration tracking
 */
function addCacheMetadata(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cache-time', Date.now().toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

/**
 * Check if cache entry has expired
 */
function isCacheExpired(response, cacheName) {
  const cacheTime = response.headers.get('sw-cache-time');
  
  if (!cacheTime) {
    return true; // No metadata, consider expired
  }
  
  const expirationTime = CACHE_EXPIRATION[cacheName] || 3600; // Default 1 hour
  const age = (Date.now() - parseInt(cacheTime)) / 1000;
  
  return age > expirationTime;
}

/**
 * Trim cache to max size (LRU eviction)
 */
async function trimCache(cacheName) {
  const maxSize = MAX_CACHE_SIZE[cacheName];
  
  if (!maxSize) {
    return;
  }
  
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    // Delete oldest entries
    const entriesToDelete = keys.length - maxSize;
    for (let i = 0; i < entriesToDelete; i++) {
      await cache.delete(keys[i]);
    }
  }
}

/**
 * Create offline fallback response
 */
function createOfflineResponse(request) {
  const url = new URL(request.url);
  
  if (request.headers.get('accept')?.includes('application/json')) {
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'You are currently offline. This request will be retried when you are back online.'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        })
      }
    );
  }
  
  return new Response(
    '<html><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store'
      })
    }
  );
}

/**
 * Type detection helpers
 */
function isImageRequest(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname);
}

function isStaticAsset(url) {
  return /\.(js|css|woff|woff2|ttf|eot)$/i.test(url.pathname);
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

/**
 * Background sync for offline queue
 */
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'offline-queue-sync') {
    event.waitUntil(syncOfflineQueue());
  }
});

async function syncOfflineQueue() {
  try {
    const clients = await self.clients.matchAll();
    
    if (clients.length > 0) {
      clients[0].postMessage({
        type: 'SYNC_QUEUE',
        timestamp: Date.now()
      });
    }
    
    console.log('[ServiceWorker] Offline queue sync triggered');
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
    throw error;
  }
}

/**
 * Message handling from clients
 */
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }

  if (event.data?.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls || []);
      })
    );
  }
});

/**
 * Push notification handling
 */
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Notification';
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    data: data.data || {}
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click:', event.notification.tag);
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

console.log('[ServiceWorker] Service Worker loaded');
