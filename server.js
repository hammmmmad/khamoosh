// ============================================================
// server.js - Push Notification Backend (via OneSignal)
// ============================================================
// این سرور دیگر خودش لیست مشترکین را نگه نمی‌دارد — OneSignal این کار را
// روی سرورهای خودش انجام می‌دهد، پس با خواب رفتن Render چیزی گم نمی‌شود.

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const ONESIGNAL_APP_ID = (process.env.ONESIGNAL_APP_ID || '').trim();
const ONESIGNAL_REST_API_KEY = (process.env.ONESIGNAL_REST_API_KEY || '').trim();
const SITE_URL = process.env.SITE_URL || 'https://sarfraz.abrdns.com';
const DEFAULT_IMAGE = process.env.DEFAULT_NOTIF_IMAGE || (SITE_URL + '/images/Khamoosh.jpg');

const pushEnabled = !!(ONESIGNAL_APP_ID && ONESIGNAL_REST_API_KEY);

if (!pushEnabled) {
    console.error('⚠️  ONESIGNAL_APP_ID یا ONESIGNAL_REST_API_KEY تنظیم نشده — ارسال نوتیفیکیشن غیرفعال است.');
} else {
    console.log('✅ OneSignal با موفقیت تنظیم شد.');
}

async function sendOneSignalNotification({ title, body, imageUrl, filters, includedSegments }) {
    const payload = {
        app_id: ONESIGNAL_APP_ID,
        target_channel: 'push',
        headings: { en: title || 'سرفراز خموش' },
        contents: { en: body || '' },
        chrome_web_image: imageUrl || DEFAULT_IMAGE,
        chrome_web_icon: SITE_URL + '/images/Khamoosh.jpg',
        url: SITE_URL + '/?page=immigration'
    };
    if (filters) payload.filters = filters;
    if (includedSegments) payload.included_segments = includedSegments;

    const response = await fetch('https://api.onesignal.com/notifications', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': 'Key ' + ONESIGNAL_REST_API_KEY
        },
        body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
}

// ===== ارسال فقط به مشترکین یک دستهٔ خاص (تگ OneSignal) — صفحه «نشر» =====
app.post('/api/send-category', async (req, res) => {
    if (!pushEnabled) {
        return res.status(503).json({ success: false, error: 'OneSignal not configured (env vars missing)' });
    }
    try {
        const { programId, title, body, imageUrl } = req.body;
        if (!programId) {
            return res.status(400).json({ success: false, error: 'programId is required' });
        }
        const { ok, status, data } = await sendOneSignalNotification({
            title,
            body,
            imageUrl,
            filters: [{ field: 'tag', key: programId, relation: '=', value: '1' }]
        });
        if (!ok) {
            console.error('OneSignal error:', status, data);
            return res.status(500).json({ success: false, error: (data && data.errors) ? data.errors.join(', ') : 'OneSignal request failed' });
        }
        res.json({ success: true, recipients: data.recipients ?? null, id: data.id ?? null });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== ارسال به همهٔ مشترکین سایت =====
app.post('/api/send-all', async (req, res) => {
    if (!pushEnabled) {
        return res.status(503).json({ success: false, error: 'OneSignal not configured (env vars missing)' });
    }
    try {
        const { title, body, imageUrl } = req.body;
        const { ok, status, data } = await sendOneSignalNotification({
            title,
            body,
            imageUrl,
            includedSegments: ['Subscribed Users']
        });
        if (!ok) {
            console.error('OneSignal error:', status, data);
            return res.status(500).json({ success: false, error: (data && data.errors) ? data.errors.join(', ') : 'OneSignal request failed' });
        }
        res.json({ success: true, recipients: data.recipients ?? null, id: data.id ?? null });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== Health Check =====
app.get('/health', (req, res) => {
    res.json({ status: 'ok', pushEnabled });
});

app.get('/', (req, res) => {
    res.json({ name: 'Push Server - Khamoosh (OneSignal)', status: 'running', pushEnabled });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Server running on port', PORT);
    console.log('Push enabled:', pushEnabled);
});
