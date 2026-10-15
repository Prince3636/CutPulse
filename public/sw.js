/**
 * CutPulse Service Worker - Offline & PWA Caching Engine
 * Cache-First for static assets and WebAssembly binaries. Network-first for navigation.
 */

const CACHE_NAME = 'cutpulse-v2';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

// Install: Pre-cache core shell and activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Activate: Clean up any old version caches immediately and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Allow clients to force skipWaiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch: Strategy dispatcher
self.addEventListener('fetch', (event) => {
  const reqUrl = event.request.url;

  // 1. CRITICAL: NEVER intercept non-HTTP(S) schemes!
  // Client Blob URLs (blob:https://...) and data: URLs are internal to the browser's
  // renderer memory. Service Workers cannot fetch client blobs and will fail with ERR_FILE_NOT_FOUND.
  if (!reqUrl.startsWith('http://') && !reqUrl.startsWith('https://')) {
    return;
  }

  let url;
  try {
    url = new URL(reqUrl);
  } catch {
    return;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // 2. Ignore non-GET requests and cross-origin tracking/ads
  if (event.request.method !== 'GET') return;
  if (!url.origin.includes(self.location.origin)) return;

  // 3. DO NOT intercept media range requests (video and audio tags use HTTP Range headers)
  if (event.request.destination === 'video' || event.request.destination === 'audio') {
    return;
  }

  // 4. Navigation requests: Network-First with cached fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // 5. Static Assets (/assets/, /ffmpeg/, .js, .css, .wasm, .svg, .json): Cache-First, then network fallback
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/ffmpeg/') ||
    url.pathname.endsWith('.wasm') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.json')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone).catch(() => {});
            }).catch(() => {});
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 6. Default: Network with Cache fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
