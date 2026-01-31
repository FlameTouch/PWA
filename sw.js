// Service Worker dla aplikacji Drink Master
// Implementuje strategię buforowania dla trybu offline

const CACHE_NAME = 'drink-master-v2';
const RUNTIME_CACHE = 'drink-master-runtime-v2';

// Zasoby do buforowania przy instalacji
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png'
];

// Instalacja Service Workera
self.addEventListener('install', (event) => {
    console.log('Service Worker: Instalacja');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Buforowanie plików statycznych');
                // Buforuj tylko krytyczne pliki, reszta będzie buforowana dynamicznie
                return cache.addAll(STATIC_CACHE_URLS.filter(url => {
                    // Sprawdź czy URL jest dostępny (dla lokalnego developmentu)
                    return true;
                })).catch((error) => {
                    console.log('Service Worker: Niektóre pliki nie zostały zbuforowane:', error);
                    // Kontynuuj nawet jeśli niektóre pliki nie zostały zbuforowane
                });
            })
    );
    // Wymuś aktywację nowego Service Workera
    self.skipWaiting();
});

// Aktywacja Service Workera
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Aktywacja');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Usuń stare cache jeśli istnieją
                    if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                        console.log('Service Worker: Usuwanie starego cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Przejmij kontrolę nad wszystkimi klientami
    return self.clients.claim();
});

// Strategia buforowania: Network First z fallback do Cache
// Używana dla żądań API (dynamiczne dane)
async function networkFirst(request) {
    try {
        // Najpierw spróbuj pobrać z sieci
        const networkResponse = await fetch(request);
        
        // Jeśli sukces, zbuforuj odpowiedź
        if (networkResponse.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Jeśli sieć nie działa, użyj cache
        console.log('Service Worker: Sieć nie działa, używam cache:', request.url);
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Jeśli nie ma w cache, zwróć odpowiedź offline
        if (request.url.includes('thecocktaildb.com')) {
            return new Response(JSON.stringify({ drinks: [] }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        throw error;
    }
}

// Strategia buforowania: Cache First
// Używana dla zasobów statycznych (HTML, CSS, JS, obrazy)
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Jeśli to żądanie HTML i nie ma w cache, zwróć index.html
        if (request.headers.get('accept').includes('text/html')) {
            const indexCache = await caches.match('/index.html');
            if (indexCache) {
                return indexCache;
            }
        }
        throw error;
    }
}

// Strategia buforowania: Stale While Revalidate
// Używana dla obrazów z API (szybki dostęp z cache, aktualizacja w tle)
async function staleWhileRevalidate(request) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match(request);
    
    // Zwróć cache natychmiast jeśli istnieje
    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => {
        // Ignoruj błędy sieci
    });
    
    return cachedResponse || fetchPromise;
}

// Obsługa żądań fetch
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Pomiń żądania do innych domen (oprócz API)
    if (url.origin !== self.location.origin && !url.hostname.includes('thecocktaildb.com')) {
        return;
    }
    
    // Strategia dla różnych typów zasobów
    if (request.method === 'GET') {
        // API requests - Network First
        if (url.hostname.includes('thecocktaildb.com') || url.pathname.includes('/api/')) {
            event.respondWith(networkFirst(request));
        }
        // Obrazy - Stale While Revalidate
        else if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            event.respondWith(staleWhileRevalidate(request));
        }
        // Zasoby statyczne (HTML, CSS, JS) - Cache First
        else if (
            request.destination === 'document' ||
            request.destination === 'style' ||
            request.destination === 'script' ||
            url.pathname.match(/\.(html|css|js|json)$/i)
        ) {
            event.respondWith(cacheFirst(request));
        }
        // Domyślnie - Network First
        else {
            event.respondWith(networkFirst(request));
        }
    }
});

// Obsługa wiadomości z aplikacji
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(RUNTIME_CACHE).then((cache) => {
                return cache.addAll(event.data.urls);
            })
        );
    }
});

// Background Sync (dla przyszłych funkcji)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-drinks') {
        event.waitUntil(syncDrinks());
    }
});

async function syncDrinks() {
    // Funkcja do synchronizacji drinków w tle
    console.log('Service Worker: Synchronizacja drinków w tle');
    // Implementacja synchronizacji...
}
