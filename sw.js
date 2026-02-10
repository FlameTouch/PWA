// Service Worker для PWA додатку Drink Master
// Обробляє кешування та офлайн функціональність (без жодного CORS‑коду)

const CACHE_NAME = 'drink-master-v5';
const RUNTIME_CACHE = 'drink-master-runtime-v5';
const API_CACHE = 'drink-master-api-v5';

// Статичні ресурси для кешування при встановленні
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/drinks.json',          // локальне "API"
    '/database.js',
    '/api.js',
    '/state.js',
    '/views.js',
    '/filters.js',
    '/native-features.js',
    '/manifest.json',
    '/icons/icon-72x72.svg',
    '/icons/icon-96x96.svg',
    '/icons/icon-128x128.svg',
    '/icons/icon-144x144.svg',
    '/icons/icon-152x152.svg',
    '/icons/icon-192x192.svg',
    '/icons/icon-384x384.svg',
    '/icons/icon-512x512.svg'
];

// Подія встановлення Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installation');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_CACHE_URLS).catch((error) => {
                    console.log('Service Worker: Some files were not cached:', error);
                    return cache.add('/index.html').catch(() => {
                        console.log('Service Worker: Failed to cache index.html');
                    });
                });
            })
    );
    self.skipWaiting();
});

// Подія активації Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activation');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== API_CACHE) {
                        console.log('Service Worker: Removing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Стратегія Network First з fallback до Cache (для динамічних запитів, якщо з'являться)
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(API_CACHE);
            await cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Network is not working, using cache:', request.url);
        const cachedResponse = await caches.match(request, { cacheName: API_CACHE });
        if (cachedResponse) {
            console.log('Service Worker: Found in cache:', request.url);
            return cachedResponse;
        }
        const runtimeCached = await caches.match(request, { cacheName: RUNTIME_CACHE });
        if (runtimeCached) {
            return runtimeCached;
        }
        throw error;
    }
}

// Стратегія Cache First (для статики і JSON, включно з drinks.json)
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
            const indexCache = await caches.match('/index.html');
            if (indexCache) {
                return indexCache;
            }
        }
        const url = new URL(request.url);
        if (url.pathname === '/' || url.pathname === '') {
            const indexCache = await caches.match('/index.html');
            if (indexCache) {
                return indexCache;
            }
        }
        throw error;
    }
}

// Стратегія Stale While Revalidate (для зображень тощо)
async function staleWhileRevalidate(request) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => {});

    return cachedResponse || fetchPromise;
}

// Основний fetch‑обробник
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') {
        return;
    }

    // Обробляємо тільки свій origin (локальні файли)
    if (url.origin !== self.location.origin) {
        return;
    }

    // Навігація (HTML)
    if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
        event.respondWith(
            caches.match('/index.html').then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return fetch(request).then((networkResponse) => {
                    if (networkResponse.ok) {
                        caches.open(CACHE_NAME).then(c => c.put('/index.html', networkResponse.clone()));
                    }
                    return networkResponse;
                }).catch(() => caches.match('/index.html'));
            })
        );
        return;
    }

    // Зображення
    if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    // Статичні ресурси (HTML, CSS, JS, JSON – включно з drinks.json)
    if (
        request.destination === 'document' ||
        request.destination === 'style' ||
        request.destination === 'script' ||
        url.pathname.match(/\.(html|css|js|json)$/i) ||
        url.pathname === '/' ||
        url.pathname === ''
    ) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Інше – network first
    event.respondWith(networkFirst(request));
});

// Обробка повідомлень
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(RUNTIME_CACHE).then((cache) => cache.addAll(event.data.urls))
        );
    }
});

