// ============================================================
// OneSignalSDKWorker.js
// این فایل هم پوش‌نوتیفیکیشن (OneSignal) و هم کش آفلاین PWA را مدیریت می‌کند.
// توجه: هر origin فقط یک Service Worker فعال می‌تواند داشته باشد، پس منطق
// کش‌گذاری از sw.js داخل همین فایل ادغام شده تا با OneSignal تداخل نکند.
// ============================================================

importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// ===== کش آفلاین (PWA) =====
const CACHE_NAME = 'sarfraz-pwa-v2';
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/images/Khamoosh.jpg'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cache opened, adding files...');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                console.log('[SW] All static files cached');
                return self.skipWaiting();
            })
            .catch(err => {
                console.error('[SW] Cache installation failed:', err);
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => {
                            console.log('[SW] Removing old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Claiming clients...');
                return self.clients.claim();
            })
    );
});

// توجه: رویدادهای 'push' و 'notificationclick' عمداً اینجا اضافه نشده‌اند،
// چون OneSignalSDK.sw.js (import شده در بالا) خودش این رویدادها را کامل
// مدیریت می‌کند. اضافه کردن یک listener دیگر باعث نمایش نوتیفیکیشن تکراری
// (دوبل) روی گوشی کاربر می‌شد.

self.addEventListener('message', event => {
    console.log('[SW] Message received:', event.data);
    if (event.data && event.data.type === 'skipWaiting') {
        self.skipWaiting();
    }
    if (event.data && event.data.type === 'getSubscription') {
        event.ports[0].postMessage({
            subscription: self.registration.pushManager.getSubscription()
        });
    }
});

self.addEventListener('error', event => {
    console.error('[SW] Error:', event.message);
});

self.addEventListener('unhandledrejection', event => {
    console.error('[SW] Unhandled rejection:', event.reason);
});

console.log('[SW] Service Worker (OneSignal + cache) loaded successfully');
