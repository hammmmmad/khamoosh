// ============================================================
// worker.js - Cloudflare Worker با آرشیو پیام‌ها
// ============================================================

const VAPID_PUBLIC_KEY = 'BEl62JiU0R9M6cL9nXZx7Qy8WpNfJkLmQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYz';
const VAPID_PRIVATE_KEY = 'YOUR_PRIVATE_KEY'; // 🔐 کلید خصوصی خود را وارد کنید

// ============ ابزار ارسال Push ============
async function sendPushNotification(subscription, payload) {
    // در اینجا باید از web-push استفاده کنید
    // برای نمونه، فقط موفقیت شبیه‌سازی می‌شود
    console.log('Sending push to:', subscription.endpoint, payload);
    return { success: true };
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;

        // ===== CORS =====
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            });
        }

        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        };

        // ===== ثبت ساب‌اسکریپشن =====
        if (path === '/api/subscribe' && request.method === 'POST') {
            const subscription = await request.json();
            const id = crypto.randomUUID();
            await env.KHAMOOSH_KV.put(`sub:${id}`, JSON.stringify(subscription));
            return new Response(JSON.stringify({ id, success: true }), { headers });
        }

        // ===== ارسال Notification =====
        if (path === '/api/send' && request.method === 'POST') {
            const { subscriptionId, title, body, programId, icon } = await request.json();

            const subData = await env.KHAMOOSH_KV.get(`sub:${subscriptionId}`);
            if (!subData) {
                return new Response(JSON.stringify({ error: 'Subscription not found' }), { status: 404, headers });
            }

            const subscription = JSON.parse(subData);
            const payload = {
                title,
                body,
                programId: programId || 'admin',
                icon: icon || '/images/Kham.png',
                url: '/?page=immigration'
            };

            // ارسال Push
            const result = await sendPushNotification(subscription, payload);

            // ذخیره در آرشیو
            const archiveId = crypto.randomUUID();
            const archiveData = {
                id: archiveId,
                userId: subscriptionId,
                title,
                body,
                programId: programId || 'admin',
                timestamp: Date.now(),
                status: result.success ? 'delivered' : 'failed',
                endpoint: subscription.endpoint
            };
            await env.KHAMOOSH_KV.put(`archive:${archiveId}`, JSON.stringify(archiveData));

            return new Response(JSON.stringify({ success: result.success }), { headers });
        }

        // ===== دریافت لیست کاربران =====
        if (path === '/api/users' && request.method === 'GET') {
            const list = await env.KHAMOOSH_KV.list({ prefix: 'sub:' });
            const users = [];
            for (const key of list.keys) {
                const sub = await env.KHAMOOSH_KV.get(key.name);
                users.push({ id: key.name, subscription: JSON.parse(sub) });
            }
            return new Response(JSON.stringify(users), { headers });
        }

        // ===== دریافت آرشیو =====
        if (path === '/api/archive' && request.method === 'GET') {
            const list = await env.KHAMOOSH_KV.list({ prefix: 'archive:' });
            const archives = [];
            for (const key of list.keys) {
                const data = await env.KHAMOOSH_KV.get(key.name);
                archives.push(JSON.parse(data));
            }
            // مرتب‌سازی بر اساس زمان (جدیدترین اول)
            archives.sort((a, b) => b.timestamp - a.timestamp);
            return new Response(JSON.stringify(archives), { headers });
        }

        // ===== حذف از آرشیو =====
        if (path.startsWith('/api/archive/') && request.method === 'DELETE') {
            const id = path.split('/').pop();
            await env.KHAMOOSH_KV.delete(`archive:${id}`);
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        return new Response('Not Found', { status: 404, headers });
    }
};
