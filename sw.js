// ============================================================
// sw.js - Service Worker برای PWA و کش کردن فایل‌ها
// ============================================================

const CACHE_NAME = 'sarfraz-site-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/ntfy.js',
    '/manifest.json',
    '/images/Kham.png',
    '/images/Khamoosh.jpg'
];

// نصب Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('✅ Cache opened, adding files...');
                return cache.addAll(urlsToCache);
            })
            .catch(err => console.log('❌ Cache failed:', err))
    );
    self.skipWaiting();
});

// فعال‌سازی
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// درخواست‌های شبکه
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // اگر در کش بود، برگردان
                if (response) {
                    return response;
                }
                // در غیر این صورت از شبکه دریافت کن
                return fetch(event.request)
                    .then(response => {
                        // فقط فایل‌های موفق را کش کن
                        if (!response || response.status !== 200) {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    })
                    .catch(() => {
                        // اگر آفلاین بود، صفحه اصلی را برگردان
                        return caches.match('/index.html');
                    });
            })
    );
});

// دریافت پیام از صفحه
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'skipWaiting') {
        self.skipWaiting();
    }
});
