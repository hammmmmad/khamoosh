import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cfg = window.APP_ADMIN_SUPABASE_CONFIG;
const db = cfg?.url && cfg?.publishableKey ? createClient(cfg.url, cfg.publishableKey) : null;
let recoveryMode = window.location.hash.includes('type=recovery') || new URLSearchParams(window.location.search).get('type') === 'recovery' || new URLSearchParams(window.location.search).has('code');
const cases = '<option value="general">General</option><option value="siv">SIV</option><option value="p1">P-1</option><option value="p2">P-2</option><option value="i730">I-730</option><option value="parole">Humanitarian Parole</option><option value="re_parole">Re-Parole</option><option value="dv_lottery">DV Lottery</option><option value="sponsor_citizen">U.S. Citizen Sponsorship</option><option value="sponsor_greencard">Green Card / SIV Sponsorship</option><option value="k1">K-1 Visa</option><option value="cr1">CR-1 Visa</option><option value="lautenberg">Lautenberg Amendment</option><option value="scholarship">Scholarships</option>';
const PUBLISHER_NAME = 'Sarfraz Khamoosh';
const PUBLISHER_AVATAR_URL = 'https://sarfraz.abrdns.com/images/Khamoosh.jpg';
const PUBLISHER_ID = '00000000-0000-0000-0000-000000000001';

const categoryLabels = {
  general: { fa: 'عمومی', en: 'General' },
  siv: { fa: 'ویزای ویژه مهاجرتی', en: 'SIV' },
  p1: { fa: 'پی-۱', en: 'P-1' }, p2: { fa: 'پی-۲', en: 'P-2' },
  i730: { fa: 'آی-۷۳۰', en: 'I-730' },
  parole: { fa: 'پارول بشردوستانه', en: 'Humanitarian Parole' },
  re_parole: { fa: 'تمدید پارول', en: 'Re-Parole' },
  dv_lottery: { fa: 'لاتاری ویزای آمریکا', en: 'DV Lottery' },
  sponsor_citizen: { fa: 'اسپانسر شهروند آمریکا', en: 'U.S. Citizen Sponsorship' },
  sponsor_greencard: { fa: 'اسپانسر گرین‌کارت / SIV', en: 'Green Card / SIV Sponsorship' },
  k1: { fa: 'ویزای نامزدی K-1', en: 'K-1 Visa' },
  cr1: { fa: 'ویزای همسر CR-1', en: 'CR-1 Visa' },
  lautenberg: { fa: 'اصلاحیه لاتنبرگ', en: 'Lautenberg Amendment' },
  scholarship: { fa: 'بورسیه‌ها', en: 'Scholarships' }
};

function slugify(value) {
  const slug = value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
  return (slug || 'news') + '-' + Date.now().toString(36);
}

function paragraphs(value) {
  return value.split(/\r?\n\s*\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function note(text, error) {
  document.querySelectorAll('#appAdminMessage').forEach((box) => {
    box.textContent = text;
    box.hidden = false;
    box.className = error ? 'app-admin-message error' : 'app-admin-message success';
  });
}

function install() {
  const style = document.createElement('style');
  style.textContent = '.app-admin-shell{max-width:960px;margin:auto}.app-admin-card{background:#fff;border-radius:22px;padding:22px;margin:16px 0;box-shadow:0 8px 28px #00000012}.app-admin-hero{background:#5b21b6;color:#fff;border-radius:22px;padding:24px}.app-admin-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.app-admin-field{display:flex;flex-direction:column;gap:6px}.app-admin-field.full{grid-column:1/-1}.app-admin-field input,.app-admin-field textarea,.app-admin-field select{padding:10px;border:1px solid #d1d5db;border-radius:10px;font:inherit}.app-admin-field textarea{min-height:110px}.app-admin-btn{border:0;border-radius:10px;padding:10px 16px;background:#6d28d9;color:white;font:inherit;cursor:pointer;margin-top:15px}.app-admin-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.app-admin-tab{border:1px solid #c4b5fd;border-radius:20px;padding:8px 12px;background:white;cursor:pointer}.app-admin-tab.active{background:#6d28d9;color:white}.app-admin-panel{display:none}.app-admin-panel.active{display:block}.app-admin-message{padding:12px;border-radius:10px;margin-top:12px}.success{background:#dcfce7;color:#166534}.error{background:#fee2e2;color:#991b1b}@media(max-width:600px){.app-admin-grid{grid-template-columns:1fr}.app-admin-field.full{grid-column:auto}}';
  document.head.appendChild(style);
  const html = '<div class="page" id="page-admin-app"><div class="container app-admin-shell"><div class="app-admin-hero"><h2>Admin App Panel</h2><p>مدیریت مستقل اپلیکیشن با Supabase. OneSignal و پنل قبلی وب‌سایت تغییر نمی‌کنند.</p></div><section class="app-admin-card" id="appAdminLogin"><h3>ورود مدیر</h3><div class="app-admin-grid"><label class="app-admin-field">ایمیل مدیر<input id="adminEmail" type="email"></label><label class="app-admin-field">رمز عبور<input id="adminPassword" type="password"></label></div><button class="app-admin-btn" id="adminLogin">ورود امن</button><div id="appAdminMessage" hidden></div></section><section class="app-admin-card" id="appAdminWork" hidden><div id="adminIdentity"></div><button class="app-admin-btn" id="adminLogout">خروج</button><div id="appAdminMessage" hidden></div><div class="app-admin-tabs"><button class="app-admin-tab active" data-tab="news">📰 News</button><button class="app-admin-tab" data-tab="public">🔔 Public</button><button class="app-admin-tab" data-tab="special">🎯 Special</button><button class="app-admin-tab" data-tab="documents">📄 Documents</button></div><form class="app-admin-panel active" id="newsForm"><div class="app-admin-grid"><label class="app-admin-field">عنوان پارسی<input name="fa" required></label><label class="app-admin-field">English title<input name="en" required></label><label class="app-admin-field full">متن پارسی<textarea name="contentFa" required></textarea></label><label class="app-admin-field full">English content<textarea name="contentEn" required></textarea></label><label class="app-admin-field">Category<select name="category">' + cases + '</select></label><label class="app-admin-field">Source URL<input name="source" type="url"></label><label class="app-admin-field">Image (optional)<input name="image" type="file" accept="image/*"></label></div><button class="app-admin-btn">Publish News</button></form><form class="app-admin-panel" id="publicForm"><div class="app-admin-grid"><label class="app-admin-field">عنوان پارسی<input name="fa" required></label><label class="app-admin-field">English title<input name="en" required></label><label class="app-admin-field full">متن پارسی<textarea name="bodyFa" required></textarea></label><label class="app-admin-field full">English message<textarea name="bodyEn" required></textarea></label><label class="app-admin-field full">Link (optional)<input name="url" type="url"></label></div><button class="app-admin-btn">Save Public Notification</button></form><form class="app-admin-panel" id="specialForm"><div class="app-admin-grid"><label class="app-admin-field">Case<select name="case">' + cases + '</select></label><label class="app-admin-field">Link (optional)<input name="url" type="url"></label><label class="app-admin-field">عنوان پارسی<input name="fa" required></label><label class="app-admin-field">English title<input name="en" required></label><label class="app-admin-field full">متن پارسی<textarea name="bodyFa" required></textarea></label><label class="app-admin-field full">English message<textarea name="bodyEn" required></textarea></label></div><button class="app-admin-btn">Save Special Notification</button></form><form class="app-admin-panel" id="documentForm"><div class="app-admin-grid"><label class="app-admin-field">عنوان پارسی<input name="fa" required></label><label class="app-admin-field">English title<input name="en" required></label><label class="app-admin-field full">توضیحات پارسی<textarea name="descriptionFa"></textarea></label><label class="app-admin-field full">English description<textarea name="descriptionEn"></textarea></label><label class="app-admin-field">Category<select name="category">' + cases + '</select></label><label class="app-admin-field">فایل<input name="file" type="file" required></label></div><button class="app-admin-btn">Upload Document</button></form></section></div></div>';
  document.querySelector('.bottom-nav-wrapper').insertAdjacentHTML('beforebegin', html);
  const documentsForm = document.querySelector('#page-admin-app #documentForm');
  documentsForm.id = 'documentsForm';
  const newsForm = document.querySelector('#page-admin-app #newsForm');
  const publisher = document.createElement('div');
  publisher.className = 'app-admin-field full';
  publisher.innerHTML = '<span>Publisher / ناشر (خودکار)</span><div style="display:flex;align-items:center;gap:10px;border:1px solid #ddd6fe;background:#f5f3ff;border-radius:12px;padding:10px"><img src="' + PUBLISHER_AVATAR_URL + '" alt="Sarfraz Khamoosh" style="width:42px;height:42px;border-radius:50%;object-fit:cover" onerror="this.style.display=\'none\'"><div><strong>By ' + PUBLISHER_NAME + '</strong><br><small>این مورد ثابت است و همراه هر خبر نشر می‌شود.</small></div></div>';
  newsForm.querySelector('.app-admin-grid').prepend(publisher);
  documentsForm.querySelector('[name="file"]').accept = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  documentsForm.querySelector('button').textContent = 'Attach & Publish Document';
  document.querySelector('#appAdminLogin').insertAdjacentHTML('afterend', '<section class="app-admin-card" id="appAdminRecovery" hidden><h3>تغییر رمز مدیر</h3><p>رمز جدید را وارد کنید. این صفحه فقط از طریق لینک بازیابی Supabase فعال می‌شود.</p><div class="app-admin-grid"><label class="app-admin-field">رمز جدید<input id="adminNewPassword" type="password" autocomplete="new-password"></label><label class="app-admin-field">تکرار رمز جدید<input id="adminNewPasswordConfirm" type="password" autocomplete="new-password"></label></div><button class="app-admin-btn" id="adminPasswordUpdate">ذخیره رمز جدید</button><div id="appAdminMessage" hidden></div></section>');
  const nav = document.querySelector('#bottomNav');
  if (nav) nav.insertAdjacentHTML('beforeend', '<button class="nav-item" data-page="admin-app" onclick="navigateTo(\'admin-app\')"><i class="fas fa-mobile-screen-button"></i><span>Admin App</span></button>');
}

async function upload(file, folder) {
  if (!file?.name) return null;
  if (file.size > 10 * 1024 * 1024) throw new Error('اندازه فایل باید کمتر از ۱۰ مگابایت باشد.');
  const path = folder + '/' + Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const result = await db.storage.from('app-assets').upload(path, file, { contentType: file.type || 'application/octet-stream' });
  if (result.error) throw result.error;
  return db.storage.from('app-assets').getPublicUrl(path).data.publicUrl;
}

async function session(sessionData) {
  const user = sessionData?.user;
  const recoveryCard = document.querySelector('#appAdminRecovery');
  if (recoveryMode && user) {
    document.querySelector('#appAdminLogin').hidden = true;
    document.querySelector('#appAdminWork').hidden = true;
    recoveryCard.hidden = false;
    return;
  }
  recoveryCard.hidden = true;
  document.querySelector('#appAdminLogin').hidden = Boolean(user);
  document.querySelector('#appAdminWork').hidden = !user;
  if (!user) return;
  const role = await db.from('app_admins').select('active').eq('user_id', user.id).maybeSingle();
  if (role.error || !role.data?.active) {
    await db.auth.signOut();
    return note('این حساب دسترسی مدیر ندارد.', true);
  }
  document.querySelector('#adminIdentity').textContent = 'مدیر واردشده: ' + user.email;
}

function bind() {
  const panel = document.querySelector('#page-admin-app');
  panel.querySelector('#adminLogin').insertAdjacentHTML('afterend', '<button class="app-admin-btn" style="background:#64748b;margin-inline-start:8px" id="adminForgotPassword">رمز را فراموش کرده‌ام</button>');
  panel.querySelector('#adminLogin').onclick = async () => {
    const result = await db.auth.signInWithPassword({ email: panel.querySelector('#adminEmail').value.trim(), password: panel.querySelector('#adminPassword').value });
    if (result.error) note('ورود Supabase ناموفق بود: ' + result.error.message, true);
  };
  panel.querySelector('#adminForgotPassword').onclick = async () => {
    const email = panel.querySelector('#adminEmail').value.trim();
    if (!email) return note('ابتدا ایمیل همان حساب Supabase را وارد کنید.', true);
    const result = await db.auth.resetPasswordForEmail(email, { redirectTo: 'http://localhost:8080/index.html' });
    if (result.error) return note(result.error.message || 'ارسال لینک بازیابی ناموفق بود.', true);
    note('لینک بازیابی جدید به ایمیل شما فرستاده شد. فقط جدیدترین ایمیل را باز کنید.');
  };
  document.querySelector('#adminLogout').onclick = () => db.auth.signOut();
  document.querySelector('#adminPasswordUpdate').onclick = async () => {
    const password = document.querySelector('#adminNewPassword').value;
    const confirmation = document.querySelector('#adminNewPasswordConfirm').value;
    if (password.length < 12) return note('رمز جدید باید حداقل ۱۲ حرف باشد.', true);
    if (password !== confirmation) return note('دو رمز یکسان نیستند.', true);
    const result = await db.auth.updateUser({ password: password });
    if (result.error) return note(result.error.message || 'تغییر رمز ناموفق بود.', true);
    recoveryMode = false;
    window.history.replaceState({}, document.title, window.location.pathname);
    await db.auth.signOut();
    note('رمز با موفقیت تغییر کرد. اکنون با رمز جدید وارد شوید.');
  };
  document.querySelectorAll('[data-tab]').forEach((button) => button.onclick = () => {
    document.querySelectorAll('[data-tab]').forEach((item) => item.classList.toggle('active', item === button));
    document.querySelectorAll('.app-admin-panel').forEach((item) => item.classList.toggle('active', item.id === button.dataset.tab + 'Form'));
  });
  document.querySelector('#newsForm').onsubmit = async (e) => {
    e.preventDefault(); const form = e.currentTarget; const f = new FormData(form);
    try {
      const image = await upload(f.get('image'), 'news-images');
      const fa = f.get('contentFa').trim(), en = f.get('contentEn').trim();
      const titleFa = f.get('fa').trim(), titleEn = f.get('en').trim();
      const categoryId = f.get('category');
      const labels = categoryLabels[categoryId] || categoryLabels.general;
      const now = new Date();
      const sourceUrl = f.get('source').trim();
      const out = await db.from('news').insert({
        slug: slugify(titleEn || titleFa),
        publisher_id: PUBLISHER_ID,
        category_id: categoryId, category_fa: labels.fa, category_en: labels.en,
        date_iso: now.toISOString().slice(0, 10),
        date_fa: new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' }).format(now),
        date_en: new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(now),
        title_fa: titleFa, title_en: titleEn,
        summary_fa: fa.slice(0, 220), summary_en: en.slice(0, 220),
        content_fa: paragraphs(fa), content_en: paragraphs(en), image_url: image || '',
        source: sourceUrl, source_url: sourceUrl, featured: false,
        status: 'published', published_at: now.toISOString()
      });
      if (out.error) throw out.error; form.reset(); note('خبر با موفقیت منتشر شد.');
    } catch (error) { note(error.message || 'ثبت خبر ناموفق بود.', true); }
  };
  document.querySelector('#publicForm').onsubmit = (e) => saveNotice(e, 'public_notifications', false);
  document.querySelector('#specialForm').onsubmit = (e) => saveNotice(e, 'special_notifications', true);
  document.querySelector('#documentsForm').onsubmit = async (e) => {
    e.preventDefault(); const form = e.currentTarget; const f = new FormData(form);
    try {
      const file = f.get('file'), url = await upload(file, 'documents');
      const out = await db.from('documents').insert({ title_fa:f.get('fa').trim(), title_en:f.get('en').trim(), description_fa:f.get('descriptionFa').trim() || null, description_en:f.get('descriptionEn').trim() || null, category:f.get('category'), file_url:url, file_name:file.name, file_type:file.type || null, published:true });
      if (out.error) throw out.error; form.reset(); note('فایل با موفقیت آپلود شد.');
    } catch (error) { note(error.message || 'آپلود فایل ناموفق بود.', true); }
  };
}

async function saveNotice(e, table, special) {
  e.preventDefault(); const form = e.currentTarget; const f = new FormData(form);
  const data = { title_fa:f.get('fa').trim(), title_en:f.get('en').trim(), body_fa:f.get('bodyFa').trim(), body_en:f.get('bodyEn').trim(), target_url:f.get('url').trim() || null, published:true };
  if (special) { data.target_type = 'case'; data.target_id = f.get('case'); }
  const out = await db.from(table).insert(data);
  if (out.error) return note(out.error.message || 'ذخیره اعلان ناموفق بود.', true);
  form.reset(); note('اعلان برای اپلیکیشن ذخیره شد.');
}

document.addEventListener('DOMContentLoaded', () => {
  install();
  if (!db) return note('تنظیمات Supabase یافت نشد.', true);
  bind();
  const code = new URLSearchParams(window.location.search).get('code');
  const initialSession = code ? db.auth.exchangeCodeForSession(code) : db.auth.getSession();
  initialSession.then(({ data }) => session(data.session));
  db.auth.onAuthStateChange((event, current) => {
    if (event === 'PASSWORD_RECOVERY') recoveryMode = true;
    session(current);
  });
});
