// ============================================================
// server.js - Push Notification Server for Render
// ============================================================

const express = require('express');
const cors = require('cors');
const webpush = require('web-push');

// ===== App Setup =====
const app = express();
app.use(cors());
app.use(express.json());

// ===== VAPID Keys =====
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62JiU0R9M6cL9nXZx7Qy8WpNfJkLmQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYz';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE';

webpush.setVapidDetails(
    'mailto:your-email@example.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

// ===== In-Memory Storage (Restart will clear data) =====
// For production, use a database like MongoDB, PostgreSQL, or SQLite
let subscriptions = [];

// ================================================================
// ROUTES
// ================================================================

// ===== Subscribe =====
app.post('/api/subscribe', (req, res) => {
    try {
        const subscription = req.body;

        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({
                success: false,
                error: 'Invalid subscription data'
            });
        }

        const existing = subscriptions.find(s => s.subscription.endpoint === subscription.endpoint);
        if (existing) {
            return res.json({
                success: true,
                id: existing.id,
                message: 'Subscription already exists'
            });
        }

        const id = Date.now().toString();
        subscriptions.push({
            id: id,
            subscription: subscription,
            createdAt: new Date().toISOString()
        });

        console.log(`[SERVER] New subscription registered: ${id}`);
        console.log(`[SERVER] Total subscriptions: ${subscriptions.length}`);

        res.json({
            success: true,
            id: id,
            message: 'Subscription saved successfully'
        });

    } catch (error) {
        console.error('[SERVER] Subscribe error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== Get Users =====
app.get('/api/users', (req, res) => {
    try {
        const users = subscriptions.map((s, index) => ({
            id: s.id,
            name: `User ${index + 1}`,
            createdAt: s.createdAt,
            endpoint: s.subscription.endpoint ? s.subscription.endpoint.substring(0, 50) + '...' : 'N/A'
        }));

        res.json({
            success: true,
            count: users.length,
            users: users
        });

    } catch (error) {
        console.error('[SERVER] Users error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== Send Push to Specific User =====
app.post('/api/send', async (req, res) => {
    try {
        const { subscriptionId, title, body, programId } = req.body;

        if (!subscriptionId) {
            return res.status(400).json({
                success: false,
                error: 'subscriptionId is required'
            });
        }

        const sub = subscriptions.find(s => s.id === subscriptionId);
        if (!sub) {
            return res.status(404).json({
                success: false,
                error: 'Subscription not found'
            });
        }

        const payload = {
            title: title || 'New Message',
            body: body || 'You have a new update',
            programId: programId || 'admin',
            icon: '/images/Kham.png',
            badge: '/images/Kham.png',
            url: `/?page=immigration${programId ? `&highlight=${programId}` : ''}`
        };

        console.log(`[SERVER] Sending push to ${subscriptionId}:`, payload);

        await webpush.sendNotification(
            sub.subscription,
            JSON.stringify(payload)
        );

        console.log(`[SERVER] Push sent successfully to ${subscriptionId}`);

        res.json({
            success: true,
            message: 'Notification sent successfully'
        });

    } catch (error) {
        console.error('[SERVER] Send error:', error);

        if (error.statusCode === 410) {
            const expiredId = req.body.subscriptionId;
            subscriptions = subscriptions.filter(s => s.id !== expiredId);
            console.log(`[SERVER] Removed expired subscription: ${expiredId}`);

            return res.status(410).json({
                success: false,
                error: 'Subscription expired or invalid',
                removed: true
            });
        }

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== Send to All Users =====
app.post('/api/send-all', async (req, res) => {
    try {
        const { title, body, programId } = req.body;

        if (subscriptions.length === 0) {
            return res.json({
                success: true,
                message: 'No subscriptions to send',
                sent: 0,
                failed: 0
            });
        }

        let sentCount = 0;
        let failedCount = 0;
        const failedIds = [];

        for (const sub of subscriptions) {
            const payload = {
                title: title || 'New Message',
                body: body || 'You have a new update',
                programId: programId || 'admin',
                icon: '/images/Kham.png',
                badge: '/images/Kham.png',
                url: `/?page=immigration${programId ? `&highlight=${programId}` : ''}`
            };

            try {
                await webpush.sendNotification(
                    sub.subscription,
                    JSON.stringify(payload)
                );
                sentCount++;
            } catch (error) {
                failedCount++;
                failedIds.push(sub.id);

                if (error.statusCode === 410) {
                    subscriptions = subscriptions.filter(s => s.id !== sub.id);
                    console.log(`[SERVER] Removed invalid subscription: ${sub.id}`);
                }
            }
        }

        console.log(`[SERVER] Send-all complete: ${sentCount} sent, ${failedCount} failed`);

        res.json({
            success: true,
            sent: sentCount,
            failed: failedCount,
            failedIds: failedIds,
            total: subscriptions.length
        });

    } catch (error) {
        console.error('[SERVER] Send-all error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== Health Check =====
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        subscriptions: subscriptions.length,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// ===== Root Route =====
app.get('/', (req, res) => {
    res.json({
        name: 'Push Notification Server',
        version: '1.0.0',
        status: 'running',
        subscriptions: subscriptions.length,
        endpoints: {
            subscribe: 'POST /api/subscribe',
            users: 'GET /api/users',
            send: 'POST /api/send',
            sendAll: 'POST /api/send-all',
            health: 'GET /health'
        }
    });
});

// ================================================================
// START SERVER
// ================================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`Push Notification Server`);
    console.log(`========================================`);
    console.log(`Port: ${PORT}`);
    console.log(`VAPID Public Key: ${VAPID_PUBLIC_KEY.substring(0, 20)}...`);
    console.log(`Subscriptions: ${subscriptions.length}`);
    console.log(`========================================`);
    console.log(`Server is ready to accept connections`);
    console.log(`========================================`);
});

// ===== Global Error Handlers =====
process.on('uncaughtException', (error) => {
    console.error('[SERVER] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[SERVER] Unhandled rejection at:', promise, 'reason:', reason);
});
