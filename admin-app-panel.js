// Admin App Panel — Afghan in USA (schema v11)
// Aligned with the current Supabase schema used by the Flutter app:
//   * admin authorization     -> public.admin_users (checked server-side via RLS)
//   * news                    -> public.news (title_fa/en, content_fa/en jsonb, status)
//   * public notifications    -> public.public_notifications (title_i18n/body_i18n jsonb)
//   * case notifications      -> public.notify_case_subscribers(...) RPC; rows land in
//                                special_notifications per subscriber (bell required)
//   * documents               -> public.documents (title_i18n, storage_path, size_bytes)
// Only the publishable key lives in the browser; RLS is the real guard.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cfg = window.APP_ADMIN_SUPABASE_CONFIG;
const db = cfg?.url && cfg?.publishableKey ? createClient(cfg.url, cfg.publishableKey) : null;
let recoveryMode = window.location.hash.includes('type=recovery') || new URLSearchParams(window.location.search).get('type') === 'recovery' || new URLSearchParams(window.location.search).has('code');

// Every case the app ships, Afghan and Iranian. The `type` prefix keeps the
// two sections apart exactly like the Flutter assets (ir_ ids = iranian).
const CASES = [
  { id: 'siv', type: 'afghan', fa: 'SIV', en: 'SIV' },
  { id: 'p1', type: 'afghan', fa: 'P-1', en: 'P-1' },
  { id: 'p2', type: 'afghan', fa: 'P-2', en: 'P-2' },
  { id: 'i730', type: 'afghan', fa: 'I-730 (پیوستن خانواده)', en: 'I-730 (Family Reunification)' },
  { id: 'parole', type: 'afghan', fa: 'پارول بشردوستانه', en: 'Humanitarian Parole' },
  { id: 're_parole', type: 'afghan', fa: 'تمدید پارول', en: 'Re-Parole' },
  { id: 'dv_lottery', type: 'afghan', fa: 'لاتاری DV', en: 'DV Lottery' },
  { id: 'sponsor_citizen', type: 'afghan', fa: 'اسپانسری شهروند آمریکا', en: 'U.S. Citizen Sponsorship' },
  { id: 'sponsor_greencard', type: 'afghan', fa: 'اسپانسری گرین‌کارت / SIV', en: 'Green Card / SIV Sponsorship' },
  { id: 'k1', type: 'afghan', fa: 'ویزای K-1', en: 'K-1 Visa' },
  { id: 'cr1', type: 'afghan', fa: 'ویزای CR-1', en: 'CR-1 Visa' },
  { id: 'lautenberg', type: 'afghan', fa: 'اصلاحیه لاتنبرگ', en: 'Lautenberg Amendment' },
  { id: 'scholarship', type: 'afghan', fa: 'بورسیه‌ها', en: 'Scholarships' },
  { id: 'ir_b1_b2', type: 'iranian', fa: 'B-1 / B-2', en: 'B-1 / B-2' },
  { id: 'ir_f1_f2', type: 'iranian', fa: 'F-1 / F-2', en: 'F-1 / F-2' },
  { id: 'ir_j1_j2', type: 'iranian', fa: 'J-1 / J-2', en: 'J-1 / J-2' },
  { id: 'ir_m1_m2', type: 'iranian', fa: 'M-1 / M-2', en: 'M-1 / M-2' },
  { id: 'ir_h1b_h4', type: 'iranian', fa: 'H-1B / H-4', en: 'H-1B / H-4' },
  { id: 'ir_l1_l2', type: 'iranian', fa: 'L-1 / L-2', en: 'L-1 / L-2' },
  { id: 'ir_o', type: 'iranian', fa: 'ویزای O', en: 'O Visa' },
  { id: 'ir_p_q_r', type: 'iranian', fa: 'P / Q / R', en: 'P / Q / R Visas' },
  { id: 'ir_c1_d', type: 'iranian', fa: 'C-1 / D', en: 'C-1 / D' },
  { id: 'ir_k1', type: 'iranian', fa: 'K-1', en: 'K-1' },
  { id: 'ir_immediate_relatives', type: 'iranian', fa: 'بستگان درجه یک (IR)', en: 'Immediate Relatives (IR)' },
  { id: 'ir_family_preference', type: 'iranian', fa: 'اولویت خانوادگی (F)', en: 'Family Preference' },
  { id: 'ir_employment_based', type: 'iranian', fa: 'مهاجرت کاری (EB)', en: 'Employment Based' },
  { id: 'ir_eb4_eb5', type: 'iranian', fa: 'EB-4 / EB-5', en: 'EB-4 / EB-5' },
  { id: 'ir_adjustment_of_status', type: 'iranian', fa: 'تغییر وضعیت (AOS)', en: 'Adjustment of Status' },
  { id: 'ir_t_u', type: 'iranian', fa: 'ویزای T / U', en: 'T / U Visas' },
  { id: 'ir_humanitarian_parole', type: 'iranian', fa: 'پارول بشردوستانه', en: 'Humanitarian Parole' }
];

const categoryLabels = Object.assign(
  { general: { fa: 'عمومی', en: 'General' } },
  Object.fromEntries(CASES.map((c) => [c.id, { fa: c.fa || c.id, en: c.en || c.id }]))
);

function optGroup(items, label, valueOf, textOf) {
  return '<optgroup label="' + label + '">' + items.map((c) =>
    '<option value="' + valueOf(c) + '">' + textOf(c) + '</option>').join('') + '</optgroup>';
}

// News category dropdown: plain case ids (the app matches news by category_id).
function categoryOptions() {
  const afghan = CASES.filter((c) => c.type === 'afghan');
  const iranian = CASES.filter((c) => c.type === 'iranian');
  return '<option value="general">عمومی / General</option>' +
    optGroup(afghan, 'پرونده‌های افغان‌ها', (c) => c.id, (c) => c.fa || c.en) +
    optGroup(iranian, 'پرونده‌های ایرانیان', (c) => c.id, (c) => c.fa || c.en);
}

// Case notification dropdown: value = "type:id" so the RPC receives both.
function caseOptions() {
  const afghan = CASES.filter((c) => c.type === 'afghan');
  const iranian = CASES.filter((c) => c.type === 'iranian');
  return optGroup(afghan, 'پرونده‌های افغان‌ها', (c) => c.type + ':' + c.id, (c) => c.fa || c.en) +
    optGroup(iranian, 'پرونده‌های ایرانیان', (c) => c.type + ':' + c.id, (c) => c.fa || c.en);
}

const PUBLISHER_NAME = 'Sarfraz Khamoosh';
const PUBLISHER_AVATAR_URL = 'https://sarfraz.abrdns.com/images/Khamoosh.jpg';
const PUBLISHER_ID = '00000000-0000-0000-0000-000000000001';

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
  style.textContent = '.app-admin-shell{max-width:960px;margin:auto}.app-admin-card{background:#fff;border-radius:22px;padding:22px;margin:16px 0;box-shadow:0 8px 28px #00000012}.app-admin-hero{background:#5b21b6;color:#fff;border-radius:22px;padding:24px}.app-admin-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.app-admin-field{display:flex;flex-direction:column;gap:6px}.app-admin-field.full{grid-column:1/-1}.app-admin-field input,.app-admin-field textarea,.app-admin-field select{padding:10px;border:1px solid #d1d5db;border-radius:10px;font:inherit}.app-admin-field textarea{min-height:110px}.app-admin-btn{border:0;border-radius:10px;padding:10px 16px;background:#6d28d9;color:white;font:inherit;cursor:pointer;margin-top:15px}.app-admin-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.app-admin-tab{border:1px solid #c4b5fd;border-radius:20px;padding:8px 12px;background:white;cursor:pointer}.app-admin-tab.active{background:#6d28d9;color:white}.app-admin-panel{display:none}.app-admin-panel.active{display:block}.app-admin-message{padding:12px;border-radius:10px;margin-top:12px}.success{background:#dcfce7;color:#166534}.error{background:#fee2e2;color:#991b1b}.app-file-picker{border:2px dashed #a78bfa;border-radius:14px;background:#faf5ff;padding:14px;text-align:center}.app-file-picker button{margin:0;background:#5b21b6}.app-file-picker small{display:block;margin-top:8px;color:#475569}@media(max-width:600px){.app-admin-grid{grid-template-columns:1fr}.app-admin-field.full{grid-column:auto}}';
  document.head.appendChild(style);
  const html = '<div class="page" id="page-admin-app"><div class="container app-admin-shell"><div class="app-admin-hero"><h2>Admin App Panel</h2><p>مدیریت مستقل اپلیکیشن با Supabase. OneSignal و پنل قبلی وب‌سایت تغییر نمی‌کنند.</p></div><section class="app-admin-card" id="appAdminLogin"><h3>ورود مدیر</h3><div class="app-admin-grid"><label class="app-admin-field">ایمیل مدیر<input id="adminEmail" type="email"></label><label class="app-admin-field">رمز عبور<input id="adminPassword" type="password"></label></div><button class="app-admin-btn" id="adminLogin">ورود امن</button><div id="appAdminMessage" hidden></div></section><section class="app-admin-card" id="appAdminWork" hidden><div id="adminIdentity"></div><button class="app-admin-btn" id="adminLogout">خروج</button><div id="appAdminMessage" hidden></div><div class="app-admin-tabs"><button class="app-admin-tab active" data-tab="news">📰 News</button><button class="app-admin-tab" data-tab="public">🔔 Public</button><button class="app-admin-tab" data-tab="special">🎯 Special</button><button class="app-admin-tab" data-tab="documents">📄 Documents</button></div><form class="app-admin-panel active" id="newsForm"><div class="app-admin-grid"><label class="app-admin-field">عنوان پارسی<input name="fa" required></label><label class="app-admin-field">English title<input name="en" required></label><label class="app-admin-field full">متن پارسی<textarea name="contentFa" required></textarea></label><label class="app-admin-field full">English content<textarea name="contentEn" required></textarea></label><label class="app-admin-field">Category<select name="category">' + categoryOptions() + '</select></label><label class="app-admin-field">Source URL<input name="source" type="url"></label><label class="app-admin-field">Image (optional)<input name="image" type="file" accept="image/*"></label></div><button class="app-admin-btn">Publish News</button></form><form class="app-admin-panel" id="publicForm"><div class="app-admin-grid"><label class="app-admin-field">عنوان پارسی<input name="fa" required></label><label class="app-admin-field">English title<input name="en" required></label><label class="app-admin-field full">متن پارسی<textarea name="bodyFa" required></textarea></label><label class="app-admin-field full">English message<textarea name="bodyEn" required></textarea></label><label class="app-admin-field full">Link (optional)<input name="url" type="url"></label></div><button class="app-admin-btn">Save Public Notification</button></form><form class="app-admin-panel" id="specialForm"><div class="app-admin-grid"><label class="app-admin-field">Case<select name="case" required>' + caseOptions() + '</select></label><label class="app-admin-field">Link (optional)<input name="url" type="url"></label><label class="app-admin-field">عنوان پارسی<input name="fa" required></label><label class="app-admin-field">English title<input name="en" required></label><label class="app-admin-field full">متن پارسی<textarea name="bodyFa" required></textarea></label><label class="app-admin-field full">English message<textarea name="bodyEn" required></textarea></label></div><button class="app-admin-btn">Send Case Notification</button></form><form class="app-admin-panel" id="documentsForm"><div class="app-admin-grid"><label class="app-admin-field">عنوان پارسی<input name="fa" required></label><label class="app-admin-field">English title<input name="en" required></label><label class="app-admin-field full">توضیحات پارسی<textarea name="descriptionFa"></textarea></label><label class="app-admin-field full">English description<textarea name="descriptionEn"></textarea></label><label class="app-admin-field full">برای دانلود، ورود کاربر لازم باشد<input type="checkbox" name="requiresLogin" checked style="align-self:flex-start"></label><label class="app-admin-field">فایل<input name="file" type="file" required></label></div><button class="app-admin-btn">Upload Document</button></form></section></div></div>';
  document.querySelector('.bottom-nav-wrapper').insertAdjacentHTML('beforebegin', html);
  const newsForm = document.querySelector('#page-admin-app #newsForm');
  const publisher = document.createElement('div');
  publisher.className = 'app-admin-field full';
  publisher.innerHTML = '<span>Publisher / ناشر (خودکار)</span><div style="display:flex;align-items:center;gap:10px;border:1px solid #ddd6fe;background:#f5f3ff;border-radius:12px;padding:10px"><img src="' + PUBLISHER_AVATAR_URL + '" alt="Sarfraz Khamoosh" style="width:42px;height:42px;border-radius:50%;object-fit:cover" onerror="this.style.display=\'none\'"><div><strong>By ' + PUBLISHER_NAME + '</strong><br><small>این مورد ثابت است و همراه هر خبر نشر می‌شود.</small></div></div>';
  newsForm.querySelector('.app-admin-grid').prepend(publisher);
  const documentsForm = document.querySelector('#page-admin-app #documentsForm');
  documentsForm.querySelector('[name="file"]').accept = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const documentFile = documentsForm.querySelector('[name="file"]');
  documentFile.id = 'adminDocumentFile';
  documentFile.style.display = 'none';
  const documentPicker = document.createElement('div');
  documentPicker.className = 'app-file-picker';
  documentPicker.innerHTML = '<strong>فایل Document را انتخاب کنید</strong><br><button class="app-admin-btn" type="button">انتخاب فایل</button><small id="adminDocumentFileName">هنوز فایلی انتخاب نشده است</small><small>PDF، Word، Excel، PowerPoint، CSV، TXT یا ZIP — حداکثر ۲۵ مگابایت</small>';
  documentFile.parentElement.appendChild(documentPicker);
  documentPicker.querySelector('button').onclick = () => documentFile.click();
  documentFile.onchange = () => {
    const file = documentFile.files?.[0];
    documentPicker.querySelector('#adminDocumentFileName').textContent = file ? ('فایل انتخاب‌شده: ' + file.name) : 'هنوز فایلی انتخاب نشده است';
  };
  documentsForm.querySelector('button').textContent = 'Attach & Publish Document';
  document.querySelector('#appAdminLogin').insertAdjacentHTML('afterend', '<section class="app-admin-card" id="appAdminRecovery" hidden><h3>تغییر رمز مدیر</h3><p>رمز جدید را وارد کنید. این صفحه فقط از طریق لینک بازیابی Supabase فعال می‌شود.</p><div class="app-admin-grid"><label class="app-admin-field">رمز جدید<input id="adminNewPassword" type="password" autocomplete="new-password"></label><label class="app-admin-field">تکرار رمز جدید<input id="adminNewPasswordConfirm" type="password" autocomplete="new-password"></label></div><button class="app-admin-btn" id="adminPasswordUpdate">ذخیره رمز جدید</button><div id="appAdminMessage" hidden></div></section>');
  const nav = document.querySelector('#bottomNav');
  if (nav) nav.insertAdjacentHTML('beforeend', '<button class="nav-item" data-page="admin-app" onclick="navigateTo(\'admin-app\')"><i class="fas fa-mobile-screen-button"></i><span>Admin App</span></button>');
}

// Returns { path, url } so the documents row can store its storage_path.
async function upload(file, folder, maxMb = 10) {
  if (!file?.name) return null;
  if (file.size > maxMb * 1024 * 1024) throw new Error('اندازه فایل باید حداکثر ' + maxMb + ' مگابایت باشد.');
  const path = folder + '/' + Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const result = await db.storage.from('app-assets').upload(path, file, { contentType: file.type || 'application/octet-stream' });
  if (result.error) throw result.error;
  return { path: path, url: db.storage.from('app-assets').getPublicUrl(path).data.publicUrl };
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
  // Current schema: public.admin_users (user_id). RLS lets a user read only
  // their own row, so this is a presence check, not a secret.
  const role = await db.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
  if (role.error) {
    await db.auth.signOut();
    return note('بررسی دسترسی مدیر ناموفق بود: ' + role.error.message, true);
  }
  if (!role.data) {
    await db.auth.signOut();
    return note('این حساب در فهرست مدیران (admin_users) نیست.', true);
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
    const result = await db.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname });
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
        content_fa: paragraphs(fa), content_en: paragraphs(en), image_url: image?.url || '',
        source: sourceUrl, source_url: sourceUrl, featured: false,
        status: 'published', published_at: now.toISOString()
      });
      if (out.error) throw out.error; form.reset(); note('خبر با موفقیت منتشر شد.');
    } catch (error) { note(error.message || 'ثبت خبر ناموفق بود.', true); }
  };
  document.querySelector('#publicForm').onsubmit = (e) => savePublicNotice(e);
  document.querySelector('#specialForm').onsubmit = (e) => saveCaseNotice(e);
  document.querySelector('#documentsForm').onsubmit = async (e) => {
    e.preventDefault(); const form = e.currentTarget; const f = new FormData(form);
    try {
      const file = f.get('file');
      if (!(file instanceof File) || !file.name) throw new Error('ابتدا یک فایل را با دکمه «انتخاب فایل» انتخاب کنید.');
      const uploaded = await upload(file, 'documents', 25);
      const extension = (file.name.split('.').pop() || '').toLowerCase();
      const out = await db.from('documents').insert({
        title_i18n: { fa: f.get('fa').trim(), en: f.get('en').trim() },
        description_i18n: { fa: f.get('descriptionFa').trim(), en: f.get('descriptionEn').trim() },
        storage_path: uploaded.path,
        file_url: uploaded.url,
        file_type: extension,
        size_bytes: file.size,
        requires_login: f.get('requiresLogin') === 'on',
        status: 'published',
        published_at: new Date().toISOString()
      });
      if (out.error) throw out.error;
      form.reset();
      document.querySelector('#adminDocumentFileName').textContent = 'هنوز فایلی انتخاب نشده است';
      note('فایل با موفقیت آپلود و منتشر شد.');
    } catch (error) { note(error.message || 'آپلود فایل ناموفق بود.', true); }
  };
}

async function savePublicNotice(e) {
  e.preventDefault(); const form = e.currentTarget; const f = new FormData(form);
  const url = f.get('url').trim();
  const out = await db.from('public_notifications').insert({
    title_i18n: { fa: f.get('fa').trim(), en: f.get('en').trim() },
    body_i18n: { fa: f.get('bodyFa').trim(), en: f.get('bodyEn').trim() },
    data: url ? { target_url: url } : {},
    status: 'published',
    published_at: new Date().toISOString()
  });
  if (out.error) return note(out.error.message || 'ذخیره اعلان ناموفق بود.', true);
  form.reset(); note('اعلان عمومی برای همه کاربران اپلیکیشن منتشر شد.');
}

// Case notifications are delivered by the notify_case_subscribers RPC: the
// database itself inserts one row per subscriber whose bell is ON for that
// exact case, so no user data is exposed to the browser.
async function saveCaseNotice(e) {
  e.preventDefault(); const form = e.currentTarget; const f = new FormData(form);
  try {
    const [caseType, caseId] = String(f.get('case') || '').split(':');
    if (!caseType || !caseId) throw new Error('ابتدا یک پرونده را انتخاب کنید.');
    const url = f.get('url').trim();
    const out = await db.rpc('notify_case_subscribers', {
      p_case_id: caseId,
      p_case_type: caseType,
      p_title_i18n: { fa: f.get('fa').trim(), en: f.get('en').trim() },
      p_body_i18n: { fa: f.get('bodyFa').trim(), en: f.get('bodyEn').trim() },
      p_data: url ? { target_url: url } : { case_id: caseId }
    });
    if (out.error) throw out.error;
    form.reset();
    note('اعلان برای ' + (out.data ?? 0) + ' مشترکِ فعالِ همین پرونده ارسال شد.');
  } catch (error) {
    note(error.message || 'ارسال اعلان پرونده ناموفق بود. (مایگریشن notify_case_subscribers اجرا شده باشد)', true);
  }
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
