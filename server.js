// ============================================================
// server.js - Push Notification Backend (via OneSignal)
// با ترجمهٔ خودکار سه‌زبانه (دری/انگلیسی/پشتو) و ارسال هدفمند به زبان هر کاربر
// ============================================================

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const ONESIGNAL_APP_ID = (process.env.ONESIGNAL_APP_ID || '').trim();
const ONESIGNAL_REST_API_KEY = (process.env.ONESIGNAL_REST_API_KEY || '').trim();
const SITE_URL = process.env.SITE_URL || 'https://sarfraz.abrdns.com';
const DEFAULT_IMAGE = process.env.DEFAULT_NOTIF_IMAGE || (SITE_URL + '/images/notification.png');
const SUPPORTED_LANGS = ['fa', 'en', 'ps'];

const pushEnabled = !!(ONESIGNAL_APP_ID && ONESIGNAL_REST_API_KEY);

if (!pushEnabled) {
    console.error('⚠️  ONESIGNAL_APP_ID یا ONESIGNAL_REST_API_KEY تنظیم نشده — ارسال نوتیفیکیشن غیرفعال است.');
} else {
    console.log('✅ OneSignal با موفقیت تنظیم شد.');
}

// ===== ترجمهٔ خودکار متن (بدون کلید API، از اندپوینت عمومی گوگل ترنسلیت) =====
// توجه: این اندپوینت رسمی/مستند نیست و ممکن است در آینده تغییر کند؛
// اگر ترجمه شکست بخورد، همان متن اصلی بدون تغییر فرستاده می‌شود (هیچ‌وقت خبر گم نمی‌شود)
async function translateText(text, targetLang) {
    if (!text) return '';
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Translate HTTP ' + response.status);
        const data = await response.json();
        return data[0].map(chunk => chunk[0]).join('');
    } catch (error) {
        console.error(`⚠️  ترجمه به ${targetLang} ناموفق بود:`, error.message);
        return text;
    }
}

async function translateToAllLangs(text) {
    const out = {};
    for (const lang of SUPPORTED_LANGS) {
        out[lang] = await translateText(text, lang);
    }
    return out;
}

function buildNotifyUrl(lang, title, body, imageUrl) {
    const params = new URLSearchParams({
        page: 'notify',
        lang,
        title: title || '',
        body: body || '',
        image: imageUrl || DEFAULT_IMAGE
    });
    return SITE_URL + '/?' + params.toString();
}

async function sendOneSignalNotification({ title, body, imageUrl, url, filters }) {
    const payload = {
        app_id: ONESIGNAL_APP_ID,
        target_channel: 'push',
        headings: { en: title || 'سرفراز خموش' },
        contents: { en: body || '' },
        chrome_web_image: imageUrl || DEFAULT_IMAGE,
        chrome_web_icon: SITE_URL + '/images/notification.png',
        url: url || (SITE_URL + '/?page=immigration'),
        filters
    };
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

// ===== ارسال فقط به مشترکین یک دستهٔ خاص — هرکس به زبان خودش =====
app.post('/api/send-category', async (req, res) => {
    if (!pushEnabled) {
        return res.status(503).json({ success: false, error: 'OneSignal not configured (env vars missing)' });
    }
    try {
        const { programId, title, body, imageUrl } = req.body;
        if (!programId) return res.status(400).json({ success: false, error: 'programId is required' });
        if (!title && !body) return res.status(400).json({ success: false, error: 'title or body is required' });

        const titles = await translateToAllLangs(title || '');
        const bodies = await translateToAllLangs(body || '');

        let totalRecipients = 0;
        const perLang = {};
        for (const lang of SUPPORTED_LANGS) {
            const { ok, status, data } = await sendOneSignalNotification({
                title: titles[lang],
                body: bodies[lang],
                imageUrl,
                url: buildNotifyUrl(lang, titles[lang], bodies[lang], imageUrl),
                filters: [
                    { field: 'tag', key: programId, relation: '=', value: '1' },
                    { field: 'tag', key: 'lang', relation: '=', value: lang }
                ]
            });
            if (!ok) console.error(`OneSignal error (${lang}):`, status, JSON.stringify(data));
            perLang[lang] = ok ? (data.recipients || 0) : 0;
            totalRecipients += perLang[lang];
        }

        // مشترکینی که هنوز تگ زبان ندارند (نسخهٔ قدیمی) هم با متن اصلی پوشش داده شوند
        const fallback = await sendOneSignalNotification({
            title: title,
            body: body,
            imageUrl,
            url: buildNotifyUrl('fa', title, body, imageUrl),
            filters: [
                { field: 'tag', key: programId, relation: '=', value: '1' },
                { field: 'tag', key: 'lang', relation: 'not_exists' }
            ]
        });
        if (fallback.ok) totalRecipients += (fallback.data.recipients || 0);

        res.json({ success: true, recipients: totalRecipients, perLang });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== ارسال به همهٔ مشترکین سایت — هرکس به زبان خودش =====
app.post('/api/send-all', async (req, res) => {
    if (!pushEnabled) {
        return res.status(503).json({ success: false, error: 'OneSignal not configured (env vars missing)' });
    }
    try {
        const { title, body, imageUrl } = req.body;
        if (!title && !body) return res.status(400).json({ success: false, error: 'title or body is required' });

        const titles = await translateToAllLangs(title || '');
        const bodies = await translateToAllLangs(body || '');

        let totalRecipients = 0;
        const perLang = {};
        for (const lang of SUPPORTED_LANGS) {
            const { ok, status, data } = await sendOneSignalNotification({
                title: titles[lang],
                body: bodies[lang],
                imageUrl,
                url: buildNotifyUrl(lang, titles[lang], bodies[lang], imageUrl),
                filters: [{ field: 'tag', key: 'lang', relation: '=', value: lang }]
            });
            if (!ok) console.error(`OneSignal error (${lang}):`, status, JSON.stringify(data));
            perLang[lang] = ok ? (data.recipients || 0) : 0;
            totalRecipients += perLang[lang];
        }

        const fallback = await sendOneSignalNotification({
            title: title,
            body: body,
            imageUrl,
            url: buildNotifyUrl('fa', title, body, imageUrl),
            filters: [{ field: 'tag', key: 'lang', relation: 'not_exists' }]
        });
        if (fallback.ok) totalRecipients += (fallback.data.recipients || 0);

        res.json({ success: true, recipients: totalRecipients, perLang });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== Health Check =====
app.get('/health', (req, res) => {
    res.json({ status: 'ok', pushEnabled });
});

app.get('/', (req, res) => {
    res.json({ name: 'Push Server - Khamoosh (OneSignal + auto-translate)', status: 'running', pushEnabled });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Server running on port', PORT);
    console.log('Push enabled:', pushEnabled);
});