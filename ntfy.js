// ============================================================
// ntfy.js - سیستم کامل Notification با Ntfy + آرشیو
// ============================================================

const NTFY_TOPIC_PREFIX = 'sarfraz';
const SITE_URL = 'https://sarfraz.abrdns.com';

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.db = null;
        this.initDB();
        this.loadStoredNotifications();
        this.createBellButton();
        this.updateBellBadge();
    }

    // ============ IndexedDB برای آرشیو ============
    async initDB() {
        return new Promise((resolve) => {
            const request = indexedDB.open('SarfrazNotifDB', 1);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('notifications')) {
                    const store = db.createObjectStore('notifications', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    store.createIndex('programId', 'programId', { unique: false });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };
            request.onerror = () => resolve();
        });
    }

    async saveNotification(notification) {
        if (!this.db) await this.initDB();
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['notifications'], 'readwrite');
            const store = transaction.objectStore('notifications');
            const data = {
                ...notification,
                timestamp: notification.timestamp || Date.now(),
                isRead: notification.isRead || false
            };
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve();
        });
    }

    async getNotifications() {
        if (!this.db) await this.initDB();
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['notifications'], 'readonly');
            const store = transaction.objectStore('notifications');
            const index = store.index('timestamp');
            const request = index.openCursor(null, 'prev');
            const results = [];
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            request.onerror = () => resolve([]);
        });
    }

    async deleteNotification(id) {
        if (!this.db) await this.initDB();
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['notifications'], 'readwrite');
            const store = transaction.objectStore('notifications');
            store.delete(id);
            resolve();
        });
    }

    async deleteAllNotifications() {
        if (!this.db) await this.initDB();
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['notifications'], 'readwrite');
            const store = transaction.objectStore('notifications');
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
        });
    }

    async loadStoredNotifications() {
        this.notifications = await this.getNotifications();
        this.updateBellBadge();
        this.renderArchive();
    }

    // ============ ارسال Notification با Ntfy ============
    async sendNotification(title, body, programId, userId = null) {
        const topic = `${NTFY_TOPIC_PREFIX}_${programId}`;
        
        try {
            const response = await fetch(`https://ntfy.sh/${topic}`, {
                method: 'POST',
                body: body,
                headers: {
                    'Title': title,
                    'Priority': 'high',
                    'Tags': 'bell',
                    'Click': `${SITE_URL}/?page=immigration&highlight=${programId}`
                }
            });
            
            if (response.ok) {
                const notification = { 
                    title, 
                    body, 
                    programId, 
                    userId: userId || 'همه کاربران',
                    status: 'delivered',
                    topic: topic
                };
                await this.saveNotification(notification);
                this.notifications.unshift({ 
                    ...notification, 
                    timestamp: Date.now(), 
                    isRead: false 
                });
                this.updateBellBadge();
                this.renderArchive();
                
                if (Notification.permission === 'granted') {
                    new Notification(title, {
                        body: body,
                        icon: '/images/Kham.png',
                        badge: '/images/Kham.png'
                    });
                }
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Ntfy error:', error);
            return false;
        }
    }

    // ============ ارسال به کاربر خاص ============
    async sendToUser(userId, title, body, programId = 'admin') {
        const topic = `${NTFY_TOPIC_PREFIX}_${programId}`;
        
        try {
            const response = await fetch(`https://ntfy.sh/${topic}`, {
                method: 'POST',
                body: `📨 ${body}`,
                headers: {
                    'Title': `🔔 ${title}`,
                    'Priority': 'high',
                    'Tags': 'envelope',
                    'Click': `${SITE_URL}/?page=immigration`
                }
            });
            
            if (response.ok) {
                const notification = { 
                    title: `🔔 ${title}`, 
                    body: `📨 ${body}`,
                    programId: programId,
                    userId: userId,
                    status: 'delivered',
                    topic: topic
                };
                await this.saveNotification(notification);
                this.notifications.unshift({ 
                    ...notification, 
                    timestamp: Date.now(), 
                    isRead: false 
                });
                this.updateBellBadge();
                this.renderArchive();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error sending to user:', error);
            return false;
        }
    }

    // ============ Notification Center ============
    createNotificationCenter() {
        const existing = document.querySelector('.notification-center');
        if (existing) existing.remove();

        const center = document.createElement('div');
        center.className = 'notification-center';
        center.innerHTML = `
            <div class="notification-header">
                <h3><i class="fas fa-bell"></i> اعلان‌ها</h3>
                <button class="notif-close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="notification-list"></div>
            <div class="notification-footer">
                <button class="notif-clear-btn">پاک کردن همه</button>
            </div>
        `;

        document.body.appendChild(center);

        center.querySelector('.notif-close-btn').addEventListener('click', () => {
            center.classList.remove('open');
        });

        center.querySelector('.notif-clear-btn').addEventListener('click', async () => {
            if (confirm('آیا مطمئن هستید؟')) {
                await this.deleteAllNotifications();
                this.notifications = [];
                this.renderNotifications();
                this.renderArchive();
                this.updateBellBadge();
            }
        });

        document.addEventListener('click', (e) => {
            if (center.classList.contains('open') && 
                !center.contains(e.target) && 
                !e.target.closest('.notif-bell-btn')) {
                center.classList.remove('open');
            }
        });

        return center;
    }

    async renderNotifications() {
        let center = document.querySelector('.notification-center');
        if (!center) center = this.createNotificationCenter();

        const list = center.querySelector('.notification-list');
        const notifications = await this.getNotifications();
        this.notifications = notifications;

        if (notifications.length === 0) {
            list.innerHTML = '<p class="empty-notif">هیچ اعلانی وجود ندارد</p>';
            center.classList.add('open');
            this.updateBellBadge();
            return;
        }

        list.innerHTML = notifications.map(notif => `
            <div class="notif-item ${notif.isRead ? 'read' : 'unread'}" data-id="${notif.id}">
                <div class="notif-icon"><i class="fas fa-bell"></i></div>
                <div class="notif-content">
                    <div class="notif-title">${notif.title}</div>
                    <div class="notif-body">${notif.body}</div>
                    <div class="notif-time">${this.formatTime(notif.timestamp)}</div>
                    <div style="font-size:0.6rem; opacity:0.3;">👤 ${notif.userId || 'همه'}</div>
                </div>
                <button class="notif-delete-btn" data-id="${notif.id}"><i class="fas fa-trash"></i></button>
            </div>
        `).join('');

        list.querySelectorAll('.notif-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                await this.deleteNotification(id);
                this.renderNotifications();
                this.renderArchive();
                this.updateBellBadge();
            });
        });

        list.querySelectorAll('.notif-item').forEach(item => {
            item.addEventListener('click', async () => {
                const id = parseInt(item.dataset.id);
                const notif = this.notifications.find(n => n.id === id);
                if (notif) {
                    notif.isRead = true;
                    await this.saveNotification(notif);
                    item.classList.remove('unread');
                    item.classList.add('read');
                    this.updateBellBadge();
                    this.renderArchive();
                }
            });
        });

        center.classList.add('open');
        this.updateBellBadge();
    }

    formatTime(timestamp) {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (days > 0) return `${days} روز پیش`;
        if (hours > 0) return `${hours} ساعت پیش`;
        if (minutes > 0) return `${minutes} دقیقه پیش`;
        return 'چند لحظه پیش';
    }

    async updateBellBadge() {
        const notifs = await this.getNotifications();
        const unread = notifs.filter(n => !n.isRead).length;
        const bellBtn = document.querySelector('.notif-bell-btn');
        if (bellBtn) {
            const badge = bellBtn.querySelector('.notif-badge');
            if (unread > 0) {
                if (!badge) {
                    const b = document.createElement('span');
                    b.className = 'notif-badge';
                    b.textContent = unread;
                    bellBtn.appendChild(b);
                } else {
                    badge.textContent = unread;
                }
                bellBtn.classList.add('has-notif');
            } else {
                if (badge) badge.remove();
                bellBtn.classList.remove('has-notif');
            }
        }
    }

    createBellButton() {
        const existing = document.querySelector('.notif-bell-btn');
        if (existing) existing.remove();

        const nav = document.querySelector('.bottom-nav');
        if (!nav) return;

        const btn = document.createElement('button');
        btn.className = 'nav-item notif-bell-btn';
        btn.innerHTML = `<i class="fas fa-bell"></i><span>اعلان</span>`;
        btn.style.position = 'relative';

        nav.appendChild(btn);

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.renderNotifications();
        });

        this.updateBellBadge();
    }

    // ============ آرشیو در پنل مدیریت ============
    async renderArchive() {
        const container = document.getElementById('archiveList');
        if (!container) return;

        const notifications = await this.getNotifications();
        
        if (notifications.length === 0) {
            container.innerHTML = `<div class="archive-empty">هنوز پیامی ارسال نشده است</div>`;
            return;
        }

        container.innerHTML = notifications.map(notif => `
            <div class="archive-item">
                <div class="info">
                    <div class="title">${notif.title}</div>
                    <div class="body">${notif.body}</div>
                    <div class="meta">
                        <span>👤 ${notif.userId || 'همه کاربران'}</span>
                        <span>🕐 ${this.formatTime(notif.timestamp)}</span>
                        <span>📌 ${notif.programId || 'admin'}</span>
                    </div>
                </div>
                <span class="status ${notif.status === 'delivered' ? 'delivered' : 'pending'}">
                    ${notif.status === 'delivered' ? '✅ تحویل داده شده' : '⏳ در انتظار'}
                </span>
                <button class="delete-archive" onclick="window.deleteArchiveItem(${notif.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    // ============ برنامه‌های مهاجرت ============
    async notifyProgram(programId, programName) {
        const messages = {
            'siv': 'تغییرات جدید در برنامه SIV: اولویت‌بندی مجدد',
            'p1': 'برنامه P1: مهلت ثبت‌نام تا ۳۰ جولای تمدید شد',
            'p2': 'برنامه P2: نتایج جدید منتشر شد',
            'asylum': 'تغییرات در روند پناهندگی: زمان رسیدگی کاهش یافت',
            'parole': 'برنامه Parole: دستورالعمل‌های جدید',
            'reparole': 'Re-Parole: تمدید خودکار برای متقاضیان واجد شرایط',
            'welcome': 'Welcome Corps: افزایش ظرفیت پذیرش تا ۱۰۰۰ نفر',
            'cr1': 'CR1: کاهش زمان پردازش به ۱۲ ماه',
            'cr2': 'CR2: به‌روزرسانی مدارک مورد نیاز',
            'k1': 'K1: تغییرات در فرم‌های درخواست',
            'dv': 'DV Lottery: تاریخ ثبت‌نام از ۱۵ اکتبر آغاز می‌شود',
            'i130_gc': 'I-130 با گرین کارت: افزایش تعرفه به ۵۳۵ دلار',
            'i130_us': 'I-130 با پاسپورت: تسریع در رسیدگی'
        };

        const title = `📢 برنامه ${programName}`;
        const body = messages[programId] || 'به‌روزرسانی جدید برای این برنامه موجود است';
        
        const result = await this.sendNotification(title, body, programId);
        this.updateBellBadge();
        return result;
    }

    // ============ دریافت لیست کاربران ============
    async getUsers() {
        const storedUsers = JSON.parse(localStorage.getItem('ntfy_users') || '[]');
        if (storedUsers.length === 0) {
            return [{ id: 'admin', name: 'مدیر سایت' }];
        }
        return storedUsers;
    }

    async addUser(userId, userName) {
        const users = await this.getUsers();
        users.push({ id: userId, name: userName });
        localStorage.setItem('ntfy_users', JSON.stringify(users));
    }

    async deleteArchiveItem(id) {
        await this.deleteNotification(id);
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.renderArchive();
        this.updateBellBadge();
    }

    // ============ هایلایت برنامه ============
    highlightProgram(programId) {
        const cards = document.querySelectorAll('.imm-card');
        cards.forEach(card => {
            const info = card.querySelector('.info h4');
            if (info && info.textContent.includes(programId)) {
                card.style.transition = 'all 0.3s ease';
                card.style.boxShadow = '0 0 0 4px #8b5cf6, 0 8px 30px rgba(139,92,246,0.3)';
                card.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    card.style.boxShadow = '';
                    card.style.transform = '';
                }, 3000);
            }
        });
    }
}

// ============ توابع سراسری ============
let notificationManager = null;

function initNotificationManager() {
    if (typeof window.notificationManager === 'undefined') {
        window.notificationManager = new NotificationManager();
        window.notificationManager.renderArchive();
    }
}

window.deleteArchiveItem = async function(id) {
    if (!confirm('آیا مطمئن هستید؟')) return;
    if (window.notificationManager) {
        await window.notificationManager.deleteArchiveItem(id);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotificationManager);
} else {
    initNotificationManager();
            }
