// ============================================================
// sw.js - Service Worker برای Push Notifications
// ============================================================

const CACHE_NAME = 'sarfraz-notif-v1';
const VAPID_PUBLIC_KEY = 'BEl62JiU0R9M6cL9nXZx7Qy8WpNfJkLmQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYz';

// نصب Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/images/Kham.png',
        '/images/Khamoosh.jpg',
        '/manifest.json'
      ]);
    })
  );
  self.skipWaiting();
});

// فعال‌سازی Service Worker
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

// دریافت Push Notification
self.addEventListener('push', event => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'سرفراز خموش',
        body: event.data.text(),
        icon: '/images/Kham.png',
        badge: '/images/Kham.png',
        programId: null
      };
    }
  }

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
      { action: 'open', title: 'مشاهده', icon: '/images/Kham.png' },
      { action: 'close', title: 'بستن', icon: '/images/Kham.png' }
    ],
    dir: 'rtl',
    lang: 'fa',
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'سرفراز خموش', options)
  );
});

// کلیک روی Notification
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'close') return;

  const urlToOpen = event.notification.data?.url || '/?page=immigration';
  const programId = event.notification.data?.programId;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        for (const client of windowClients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            client.focus();
            if (programId) {
              client.postMessage({
                type: 'highlight-program',
                programId: programId
              });
            }
            return;
          }
        }
        if (clients.openWindow) {
          const openUrl = programId ? `${urlToOpen}&highlight=${programId}` : urlToOpen;
          return clients.openWindow(openUrl);
        }
      })
  );
});

// دریافت پیام از صفحه
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'skipWaiting') {
    self.skipWaiting();
  }
});
