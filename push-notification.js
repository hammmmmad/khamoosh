// ============================================================
// push-notification.js - مدیریت کامل Notification
// ============================================================

class PushNotificationManager {
  constructor() {
    this.vapidPublicKey = 'BEl62JiU0R9M6cL9nXZx7Qy8WpNfJkLmQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYz';
    this.swRegistration = null;
    this.subscription = null;
    this.notifications = [];
    this.db = null;
    this.dbName = 'KhamooshNotificationsDB';
    this.dbVersion = 1;
    this.isSubscribed = false;
    
    this.initDB();
    this.registerSW();
    this.checkSubscription();
    this.loadStoredNotifications();
    this.setupMessageListener();
  }

  // ============ IndexedDB ============
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('notifications')) {
          const store = db.createObjectStore('notifications', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('programId', 'programId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('isRead', 'isRead', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('subscriptions')) {
          const subStore = db.createObjectStore('subscriptions', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          subStore.createIndex('endpoint', 'endpoint', { unique: true });
        }
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };
      
      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async saveNotification(notification) {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      
      const data = {
        ...notification,
        timestamp: notification.timestamp || Date.now(),
        isRead: notification.isRead || false,
        isSynced: notification.isSynced || false
      };
      
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getNotifications() {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
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
      
      request.onerror = () => reject(request.error);
    });
  }

  async getNotificationsByProgram(programId) {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notifications'], 'readonly');
      const store = transaction.objectStore('notifications');
      const index = store.index('programId');
      const request = index.openCursor(IDBKeyRange.only(programId));
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
      
      request.onerror = () => reject(request.error);
    });
  }

  async markAsRead(notificationId) {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      const request = store.get(notificationId);
      
      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          data.isRead = true;
          const updateRequest = store.put(data);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async deleteNotification(notificationId) {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      const request = store.delete(notificationId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveSubscription(subscription) {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['subscriptions'], 'readwrite');
      const store = transaction.objectStore('subscriptions');
      
      const data = {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        createdAt: Date.now()
      };
      
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async loadStoredNotifications() {
    try {
      const notifications = await this.getNotifications();
      this.notifications = notifications;
      return notifications;
    } catch (error) {
      console.error('Error loading stored notifications:', error);
      return [];
    }
  }

  // ============ Service Worker ============
  async registerSW() {
    try {
      if ('serviceWorker' in navigator) {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        console.log('✅ Service Worker registered successfully');
        
        this.swRegistration.addEventListener('updatefound', () => {
          const newSW = this.swRegistration.installing;
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New Service Worker installed, refreshing...');
              if (confirm('نسخه جدید موجود است. آیا می‌خواهید به‌روزرسانی کنید؟')) {
                window.location.reload();
              }
            }
          });
        });
        
        return this.swRegistration;
      } else {
        console.warn('Service Worker not supported');
        return null;
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  setupMessageListener() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'highlight-program') {
          this.highlightProgram(event.data.programId);
        }
      });
    }
  }

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

  // ============ Push Notification ============
  async checkSubscription() {
    try {
      if (!this.swRegistration) await this.registerSW();
      if (!this.swRegistration) return false;
      
      this.subscription = await this.swRegistration.pushManager.getSubscription();
      this.isSubscribed = !!this.subscription;
      
      if (this.isSubscribed) {
        console.log('✅ Already subscribed to push notifications');
        await this.saveSubscription(this.subscription);
      }
      
      return this.isSubscribed;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  async subscribe() {
    try {
      if (!this.swRegistration) {
        await this.registerSW();
      }
      if (!this.swRegistration) {
        throw new Error('Service Worker not registered');
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      this.subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.vapidPublicKey
      });

      this.isSubscribed = true;
      await this.saveSubscription(this.subscription);
      await this.sendSubscriptionToServer(this.subscription);
      
      console.log('✅ Push subscription successful');
      return this.subscription;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      throw error;
    }
  }

  async unsubscribe() {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();
        this.isSubscribed = false;
        this.subscription = null;
        console.log('Unsubscribed from push notifications');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  }

  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
      if (!response.ok) {
        console.warn('Failed to send subscription to server');
      }
    } catch (error) {
      console.warn('Server not available, subscription stored locally');
    }
  }

  // ============ مدیریت Notification ============
  async sendLocalNotification(programId, title, body, icon = '/images/Kham.png') {
    const notification = {
      programId,
      title,
      body,
      timestamp: Date.now(),
      isRead: false,
      isSynced: false
    };
    
    const id = await this.saveNotification(notification);
    this.notifications.unshift({ ...notification, id });
    
    if (Notification.permission === 'granted') {
      const options = {
        body: body,
        icon: icon,
        badge: icon,
        vibrate: [200, 100, 200],
        data: {
          programId: programId,
          url: `/?page=immigration&highlight=${programId}`
        },
        requireInteraction: true,
        dir: 'rtl',
        lang: 'fa'
      };
      
      const notif = new Notification(title, options);
      
      notif.onclick = () => {
        window.focus();
        if (typeof navigateTo !== 'undefined') {
          navigateTo('immigration');
        }
        setTimeout(() => this.highlightProgram(programId), 500);
        this.markAsRead(id);
      };
    }
    
    return id;
  }

  // ============ Notification Center UI ============
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
        const allNotifs = await this.getNotifications();
        for (const notif of allNotifs) {
          await this.deleteNotification(notif.id);
        }
        this.notifications = [];
        this.renderNotifications();
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
    if (!center) {
      center = this.createNotificationCenter();
    }
    
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
        <div class="notif-icon">
          <i class="fas fa-bell"></i>
        </div>
        <div class="notif-content">
          <div class="notif-title">${notif.title}</div>
          <div class="notif-body">${notif.body}</div>
          <div class="notif-time">${this.formatTime(notif.timestamp)}</div>
        </div>
        <button class="notif-delete-btn" data-id="${notif.id}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `).join('');
    
    list.querySelectorAll('.notif-delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        await this.deleteNotification(id);
        this.renderNotifications();
        this.updateBellBadge();
      });
    });
    
    list.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', async () => {
        const id = parseInt(item.dataset.id);
        await this.markAsRead(id);
        const programId = this.notifications.find(n => n.id === id)?.programId;
        if (programId) {
          if (typeof navigateTo !== 'undefined') {
            navigateTo('immigration');
          }
          setTimeout(() => this.highlightProgram(programId), 500);
        }
        this.renderNotifications();
        this.updateBellBadge();
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

  // ============ برنامه‌های مهاجرت - Notification ============
  async notifyProgram(programId, programName) {
    const messages = {
      'siv': { fa: 'تغییرات جدید در برنامه SIV: اولویت‌بندی مجدد و افزایش ظرفیت', en: 'New SIV changes: Re-prioritization and capacity increase' },
      'p1': { fa: 'برنامه P1: مهلت ثبت‌نام تا ۳۰ جولای تمدید شد', en: 'P1: Registration deadline extended to July 30' },
      'p2': { fa: 'برنامه P2: نتایج جدید منتشر شد، ۵۰۰ نفر جدید پذیرفته شدند', en: 'P2: New results published, 500 new applicants accepted' },
      'asylum': { fa: 'تغییرات در روند پناهندگی: زمان رسیدگی کاهش یافت', en: 'Asylum process changes: Processing time reduced' },
      'parole': { fa: 'برنامه Parole: دستورالعمل‌های جدید برای متقاضیان', en: 'Parole: New guidelines for applicants' },
      'reparole': { fa: 'Re-Parole: تمدید خودکار برای متقاضیان واجد شرایط', en: 'Re-Parole: Auto-extension for eligible applicants' },
      'welcome': { fa: 'Welcome Corps: افزایش ظرفیت پذیرش تا ۱۰۰۰ نفر', en: 'Welcome Corps: Capacity increased to 1000' },
      'cr1': { fa: 'CR1: کاهش زمان پردازش به ۱۲ ماه', en: 'CR1: Processing time reduced to 12 months' },
      'cr2': { fa: 'CR2: به‌روزرسانی مدارک مورد نیاز', en: 'CR2: Required documents updated' },
      'k1': { fa: 'K1: تغییرات در فرم‌های درخواست', en: 'K1: Application form changes' },
      'dv': { fa: 'DV Lottery: تاریخ ثبت‌نام از ۱۵ اکتبر آغاز می‌شود', en: 'DV Lottery: Registration starts October 15' },
      'i130_gc': { fa: 'I-130 با گرین کارت: افزایش تعرفه به ۵۳۵ دلار', en: 'I-130 with GC: Fee increased to $535' },
      'i130_us': { fa: 'I-130 با پاسپورت: تسریع در رسیدگی به درخواست‌ها', en: 'I-130 with US Passport: Expedited processing' }
    };

    const msg = messages[programId];
    if (!msg) {
      const title = `برنامه ${programName}`;
      const body = 'به‌روزرسانی جدید برای این برنامه موجود است';
      await this.sendLocalNotification(programId, title, body);
      return;
    }

    const lang = document.documentElement.lang === 'fa' ? 'fa' : 'en';
    const title = `برنامه ${programName}`;
    const body = msg[lang] || msg.fa;
    
    await this.sendLocalNotification(programId, title, body);
    
    if (this.isSubscribed) {
      try {
        await this.sendPushNotification(programId, title, body);
      } catch (error) {
        console.warn('Push notification failed, using local notification:', error);
      }
    }
    
    this.updateBellBadge();
  }

  async sendPushNotification(programId, title, body) {
    if (!this.subscription) {
      await this.checkSubscription();
    }
    if (!this.subscription) return;
    
    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: this.subscription,
          payload: {
            title: title,
            body: body,
            programId: programId,
            icon: '/images/Kham.png',
            url: `/?page=immigration&highlight=${programId}`
          }
        }),
      });
      if (!response.ok) {
        console.warn('Failed to send push notification via server');
      }
    } catch (error) {
      console.warn('Push server not available, using local notification');
    }
  }

  // ============ مقداردهی اولیه ============
  async init() {
    await this.registerSW();
    await this.checkSubscription();
    await this.loadStoredNotifications();
    this.createBellButton();
    this.updateBellBadge();
    
    if (Notification.permission === 'default') {
      setTimeout(async () => {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await this.subscribe();
        }
      }, 5000);
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
}

// ============ راه‌اندازی ============
function initPushNotifications() {
  if (typeof window.pushManager === 'undefined') {
    window.pushManager = new PushNotificationManager();
    window.pushManager.init();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPushNotifications);
} else {
  initPushNotifications();
}
