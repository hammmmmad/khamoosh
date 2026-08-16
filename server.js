// ============================================================
// server.js - Push Notification Server for Khamoosh
// ============================================================

const express = require('express');
const cors = require('cors');
const webpush = require('web-push');

const app = express();
app.use(cors());
app.use(express.json());

// ===== VAPID Keys (فقط از Environment Variables، بدون مقدار ساختگی) =====
const VAPID_PUBLIC_KEY = (process.env.VAPID_PUBLIC_KEY || '').trim();
const VAPID_PRIVATE_KEY = (process.env.VAPID_PRIVATE_KEY || '').trim();
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:your-email@example.com';

function isValidVapidKey(key) {
    try {
        return Buffer.from(key, 'base64url').length === 65;
    } catch {
        return false;
    }
}

let pushEnabled = false;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error('⚠️  VAPID_PUBLIC_KEY یا VAPID_PRIVATE_KEY تنظیم نشده — پوش نوتیفیکیشن غیرفعال است.');
    console.error('این دو متغیر را در Render → Environment اضافه کن.');
} else if (!isValidVapidKey(VAPID_PUBLIC_KEY)) {
    console.error('⚠️  VAPID_PUBLIC_KEY نامعتبر است (باید ۶۵ بایت پس از decode باشد، الان',
        Buffer.from(VAPID_PUBLIC_KEY, 'base64url').length, 'بایت است).');
    console.error('یک کلید جدید بساز: npx web-push generate-vapid-keys');
} else {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    pushEnabled = true;
    console.log('✅ VAPID با موفقیت تنظیم شد.');
}

// ===== ذخیره‌سازی موقت (در حافظه) =====
let subscriptions = [];

// ================================================================
// ===== ROUTES =====
// ================================================================

// ===== ثبت اشتراک جدید =====
app.post('/api/subscribe', (req, res) => {
    try {
        const subscription = req.body;
        const id = Date.now().toString();
        subscriptions.push({ id, subscription });
        console.log('New subscription:', id);
        res.json({ success: true, id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== دریافت لیست کاربران =====
app.get('/api/users', (req, res) => {
    try {
        const users = subscriptions.map((s, i) => ({
            id: s.id,
            name: 'User ' + (i + 1)
        }));
        res.json(users);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== ارسال به یک کاربر خاص =====
app.post('/api/send', async (req, res) => {
    if (!pushEnabled) {
        return res.status(503).json({ success: false, error: 'Push notifications not configured (VAPID keys missing/invalid)' });
    }
    try {
        const { subscriptionId, title, body, programId } = req.body;
        const sub = subscriptions.find(s => s.id === subscriptionId);
        if (!sub) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const payload = {
            title: title || 'New Message',
            body: body || 'You have a new update',
            programId: programId || 'admin',
            icon: '/images/Kham.png',
            url: '/?page=immigration' + (programId ? '&highlight=' + programId : '')
        };

        await webpush.sendNotification(sub.subscription, JSON.stringify(payload));
        res.json({ success: true });
    } catch (error) {
        if (error.statusCode === 410) {
            subscriptions = subscriptions.filter(s => s.id !== req.body.subscriptionId);
            return res.status(410).json({ success: false, error: 'Subscription expired' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== ارسال به همه کاربران =====
app.post('/api/send-all', async (req, res) => {
    if (!pushEnabled) {
        return res.status(503).json({ success: false, error: 'Push notifications not configured (VAPID keys missing/invalid)' });
    }
    try {
        const { title, body, programId } = req.body;
        let sent = 0, failed = 0;

        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification(sub.subscription, JSON.stringify({
                    title: title || 'New Message',
                    body: body || 'You have a new update',
                    programId: programId || 'admin',
                    icon: '/images/Kham.png',
                    url: '/?page=immigration'
                }));
                sent++;
            } catch (error) {
                failed++;
                if (error.statusCode === 410) {
                    subscriptions = subscriptions.filter(s => s.id !== sub.id);
                }
            }
        }

        res.json({ success: true, sent, failed });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== Health Check (برای تست سرور) =====
app.get('/health', (req, res) => {
    res.json({ status: 'ok', pushEnabled, subscriptions: subscriptions.length });
});

// ===== روت اصلی =====
app.get('/', (req, res) => {
    res.json({
        name: 'Push Server - Khamoosh',
        status: 'running',
        pushEnabled,
        subscriptions: subscriptions.length
    });
});

// ================================================================
// ===== راه‌اندازی سرور =====
// ================================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Server running on port', PORT);
    console.log('Push enabled:', pushEnabled);
    console.log('Subscriptions:', subscriptions.length);
});
