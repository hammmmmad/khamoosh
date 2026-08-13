// ============================================================
// sw.js — Service Worker سایت سرفراز خموش
// نسخه‌بندی‌شده برای رفع همیشگیِ مشکل «تغییرات دیده نمی‌شوند»
// ============================================================

// هر بار که سایت را آپدیت می‌کنید، فقط همین عدد را +۱ کنید.
// همین یک تغییر کافی است تا مرورگر کش قدیمی را کنار بگذارد.
const CACHE_VERSION = 'sarfraz-v1';
const CORE_CACHE = `${CACHE_VERSION}-core`;

// فقط فایل‌هایی که مطمئنیم وجود دارند — هرکدام جدا کش می‌شود
// تا اگر یکی ۴۰۴ داد، بقیه‌ی نصب خراب نشود (برخلاف addAll قدیمی).
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/images/Kham.png'
];

// ===== نصب =====
self.addEventListener('install', (event) => {
    self.skipWaiting(); // نسخه‌ی جدید فوراً فعال می‌شود، بدون نیاز به بستن تب‌ها
    event.waitUntil(
        caches.open(CORE_CACHE).then((cache) => {
            return Promise.all(
                CORE_ASSETS.map((url) =>
                    cache.add(url).catch((err) => {
                        console.warn('⚠️ کش نشد (نادیده گرفته شد، نصب ادامه می‌یابد):', url, err.message);
                    })
                )
            );
        })
    );
});

// ===== فعال‌سازی: حذف کش‌های قدیمی + کنترل فوری همه‌ی تب‌های باز =====
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key.startsWith('sarfraz-') && key !== CORE_CACHE)
                        .map((key) => caches.delete(key))
                )
            ),
            self.clients.claim()
        ])
    );
});

// ===== واکشی =====
// HTML و JS: همیشه اول از شبکه (Network First) — تضمین می‌کند
// همیشه آخرین نسخه‌ی فایل دیده شود؛ فقط وقتی آفلاین باشد از کش استفاده می‌شود.
// بقیه (عکس، فونت، CSS): اول کش (Cache First) برای سرعت بیشتر.
self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const isPage = request.mode === 'navigate';
    const isScript = request.destination === 'script';

    if (isPage || isScript) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CORE_CACHE).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() =>
                    caches.match(request).then((cached) => cached || caches.match('/index.html'))
                )
        );
        return;
    }

    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CORE_CACHE).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => cached);
        })
    );
});
