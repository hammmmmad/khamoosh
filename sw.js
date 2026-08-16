// ============================================================
// sw.js - Service Worker برای Web Push Notifications
// ============================================================

const CACHE_NAME = 'sarfraz-pwa-v1';
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/images/Kham.png',
    '/images/Khamoosh.jpg'
];

// ===== نصب Service Worker =====
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

// ===== فعال‌سازی =====
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

// ===== دریافت Push Notification =====
self.addEventListener('push', event => {
    console.log('[SW] Push event received');

    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
            console.log('[SW] Push data:', data);
        } catch (error) {
            console.error('[SW] Failed to parse push data:', error);
            data = {
                title: 'سرفراز خموش',
                body: event.data.text() || 'خبر جدید در بخش مهاجرت',
                icon: '/images/Kham.png',
                badge: '/images/Kham.png',
                programId: null,
                url: '/?page=immigration'
            };
        }
    } else {
        // اگر داده‌ای در push نباشد
        data = {
            title: 'سرفراز خموش',
            body: 'خبر جدید در بخش مهاجرت',
            icon: '/images/Kham.png',
            badge: '/images/Kham.png',
            programId: null,
            url: '/?page=immigration'
        };
    }

    // تنظیمات نمایش Notification
    const options = {
        body: data.body || 'خبر جدید در بخش مهاجرت',
        icon: data.icon || '/images/Kham.png',
        badge: data.badge || '/images/Kham.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/?page=immigration',
            programId: data.programId || null
        },
        actions: [
            {
                action: 'open',
                title: 'مشاهده',
                icon: '/images/Kham.png'
            },
            {
                action: 'close',
                title: 'بستن',
                icon: '/images/Kham.png'
            }
        ],
        dir: 'rtl',
        lang: 'fa',
        requireInteraction: true,
        silent: false,
        tag: data.programId || 'default',
        renotify: true
    };

    event.waitUntil(
        self.registration.showNotification(
            data.title || 'سرفراز خموش',
            options
        )
    );
});

// ===== کلیک روی Notification =====
self.addEventListener('notificationclick', event => {
    console.log('[SW] Notification clicked:', event);

    // بستن Notification
    event.notification.close();

    // اگر کاربر روی دکمه "بستن" کلیک کرده باشد
    if (event.action === 'close') {
        return;
    }

    const urlToOpen = event.notification.data?.url || '/?page=immigration';
    const programId = event.notification.data?.programId;

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        })
        .then(windowClients => {
            // اگر پنجره باز وجود دارد، به آن برو
            for (const client of windowClients) {
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    client.focus();
                    // اگر programId وجود دارد، به صفحه مهاجرت با هایلایت برو
                    if (programId) {
                        client.postMessage({
                            type: 'highlight-program',
                            programId: programId
                        });
                    }
                    return;
                }
            }
            // در غیر این صورت پنجره جدید باز کن
            if (clients.openWindow) {
                const openUrl = programId
                    ? `${urlToOpen}&highlight=${programId}`
                    : urlToOpen;
                return clients.openWindow(openUrl);
            }
        })
    );
});

// ===== دریافت پیام از صفحه =====
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

// ===== مدیریت خطاها و لاگ‌ها =====
self.addEventListener('error', event => {
    console.error('[SW] Error:', event.message);
});

self.addEventListener('unhandledrejection', event => {
    console.error('[SW] Unhandled rejection:', event.reason);
});

// ===== برای اطمینان از به‌روزرسانی =====
console.log('[SW] Service Worker loaded successfully');
