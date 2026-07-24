// ===== ENGINEER PORTFOLIO — ADMIN PANEL SCRIPT =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, set, push, onValue, remove, get, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

(async () => {
    // ===== 1. LOAD CONFIG =====
    let config;
    try {
        config = await fetch('./config.json').then(r => r.json());
    } catch {
        document.getElementById('loginPage').innerHTML =
            '<div class="login-card"><h1>config.json পাওয়া যায়নি</h1><p style="color:#fff;margin-top:1rem;">প্রথমে config.json এ তোমার Firebase ও Cloudinary তথ্য বসাও।</p></div>';
        return;
    }
    if (!config?.firebase?.apiKey || config.firebase.apiKey.includes('YOUR_')) {
        document.getElementById('loginPage').innerHTML =
            '<div class="login-card"><h1>Firebase কনফিগার করা হয়নি</h1><p style="color:#fff;margin-top:1rem;">config.json ফাইলে তোমার আসল Firebase প্রজেক্টের keys বসাও, তারপর এই পেজ রিলোড করো। সাথে দেওয়া SETUP.md ফাইলে ধাপগুলো লেখা আছে।</p></div>';
        return;
    }

    // ===== 2. INIT FIREBASE =====
    const app = initializeApp(config.firebase);
    const auth = getAuth(app);
    const db = getDatabase(app);

    // ===== 3. DOM REFS =====
    const loginPage = document.getElementById('loginPage');
    const adminLayout = document.getElementById('adminLayout');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminSidebar = document.getElementById('adminSidebar');
    const adminOverlay = document.getElementById('adminOverlay');
    const adminHamburger = document.getElementById('adminHamburger');
    const topbarTitle = document.getElementById('topbarTitle');

    // ===== 4. TOAST =====
    function showToast(msg, isError = false) {
        const t = document.getElementById('adminToast');
        t.textContent = msg;
        t.style.borderColor = isError ? '#ff6a1a' : '#5fb4e5';
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    }

    // ===== 5. CONFIRM MODAL =====
    let confirmCallback = null;
    const confirmModal = document.getElementById('confirmModal');
    const confirmText = document.getElementById('confirmText');
    document.getElementById('confirmYes').addEventListener('click', () => {
        confirmModal.classList.remove('show');
        if (confirmCallback) confirmCallback();
        confirmCallback = null;
    });
    document.getElementById('confirmNo').addEventListener('click', () => {
        confirmModal.classList.remove('show');
        confirmCallback = null;
    });
    function showConfirm(text, cb) {
        confirmText.textContent = text;
        confirmCallback = cb;
        confirmModal.classList.add('show');
    }

    // ===== 6. AUTH STATE =====
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginPage.style.display = 'none';
            adminLayout.classList.add('show');
            initDashboardData();
        } else {
            loginPage.style.display = 'flex';
            adminLayout.classList.remove('show');
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.classList.remove('show');
        try {
            await signInWithEmailAndPassword(auth, document.getElementById('loginEmail').value.trim(), document.getElementById('loginPassword').value);
        } catch {
            loginError.classList.add('show');
        }
    });

    logoutBtn.addEventListener('click', () => signOut(auth));

    // ===== 7. SIDEBAR NAV =====
    const navItems = document.querySelectorAll('.admin-nav-item');
    const panelTitles = {
        dashboard: 'ড্যাশবোর্ড', profile: 'প্রোফাইল ও যোগাযোগ', stats: 'Hero স্ট্যাটস',
        education: 'শিক্ষা', skills: 'দক্ষতা', projects: 'প্রজেক্ট', certificates: 'সার্টিফিকেট', messages: 'বার্তা'
    };
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            document.getElementById('panel-' + item.dataset.panel).classList.add('active');
            topbarTitle.textContent = panelTitles[item.dataset.panel];
            adminSidebar.classList.remove('open');
            adminOverlay.classList.remove('show');
        });
    });
    adminHamburger.addEventListener('click', () => { adminSidebar.classList.add('open'); adminOverlay.classList.add('show'); });
    adminOverlay.addEventListener('click', () => { adminSidebar.classList.remove('open'); adminOverlay.classList.remove('show'); });

    // ===== 8. CLOUDINARY UPLOAD =====
    async function uploadToCloudinary(file, onProgress) {
        const { cloudName, uploadPreset } = config.cloudinary;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
        xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); };
        return new Promise((resolve, reject) => {
            xhr.onload = () => {
                try {
                    const res = JSON.parse(xhr.responseText);
                    if (res.secure_url) resolve(res.secure_url); else reject(res);
                } catch (err) { reject(err); }
            };
            xhr.onerror = reject;
            xhr.send(formData);
        });
    }

    // ===== 9. COLLECTION SCHEMAS =====
    const schemas = {
        education: {
            label: 'শিক্ষা এন্ট্রি',
            fields: [
                { id: 'year', label: 'সাল (যেমন: ২০১৪ — ২০১৮)', type: 'text', required: true },
                { id: 'degree', label: 'ডিগ্রি / কোর্সের নাম', type: 'text', required: true },
                { id: 'institution', label: 'প্রতিষ্ঠান', type: 'text', required: true },
                { id: 'note', label: 'নোট (ঐচ্ছিক)', type: 'text' },
                { id: 'order', label: 'ক্রম (সংখ্যা — ছোট আগে দেখাবে)', type: 'number' }
            ],
            titleField: 'degree', subField: 'institution'
        },
        skills: {
            label: 'দক্ষতা',
            fields: [
                { id: 'name', label: 'নাম', type: 'text', required: true },
                { id: 'category', label: 'ক্যাটাগরি', type: 'text' },
                { id: 'icon', label: 'Font Awesome ক্লাস (যেমন: fa-drafting-compass)', type: 'text' },
                { id: 'level', label: 'দক্ষতা লেভেল (0–100)', type: 'number' }
            ],
            titleField: 'name', subField: 'category'
        },
        projects: {
            label: 'প্রজেক্ট',
            fields: [
                { id: 'title', label: 'শিরোনাম', type: 'text', required: true },
                { id: 'category', label: 'ক্যাটাগরি (residential / commercial / infrastructure)', type: 'text' },
                { id: 'year', label: 'সাল', type: 'text' },
                { id: 'location', label: 'অবস্থান', type: 'text' },
                { id: 'image', label: 'ছবি', type: 'image' }
            ],
            titleField: 'title', subField: 'location', imageField: 'image'
        },
        certificates: {
            label: 'সার্টিফিকেট',
            fields: [
                { id: 'title', label: 'শিরোনাম', type: 'text', required: true },
                { id: 'issuer', label: 'ইস্যুয়ার', type: 'text' },
                { id: 'year', label: 'সাল', type: 'text' },
                { id: 'image', label: 'ছবি', type: 'image' }
            ],
            titleField: 'title', subField: 'issuer', imageField: 'image'
        }
    };

    // ===== 10. GENERIC MODAL (add/edit) =====
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modalTitle = document.getElementById('modalTitle');
    const modalForm = document.getElementById('modalForm');
    let currentUploadUrl = '';

    function openModal(collection, id = null, existing = {}) {
        const schema = schemas[collection];
        modalTitle.textContent = (id ? 'সম্পাদনা — ' : 'নতুন — ') + schema.label;
        currentUploadUrl = existing[schema.imageField] || '';
        modalForm.innerHTML = schema.fields.map(f => {
            if (f.type === 'image') {
                return `<div class="form-group"><label>${f.label}</label>
                    <div class="upload-zone">
                        ${existing[f.id] ? `<img src="${existing[f.id]}" id="uploadPreview">` : `<img src="" id="uploadPreview" style="display:none">`}
                        <input type="file" accept="image/*" id="field_${f.id}_file">
                        <div class="upload-progress" id="uploadProgress"><div class="upload-progress-bar" id="uploadProgressBar"></div></div>
                    </div></div>`;
            }
            return `<div class="form-group"><label>${f.label}</label>
                <input type="${f.type === 'number' ? 'number' : 'text'}" id="field_${f.id}" value="${existing[f.id] !== undefined ? String(existing[f.id]).replace(/"/g, '&quot;') : ''}" ${f.required ? 'required' : ''}></div>`;
        }).join('') + `<div class="modal-actions"><button type="button" class="btn btn-outline" id="modalCancel" style="flex:1;justify-content:center;">বাতিল</button><button type="submit" class="btn btn-primary" style="flex:1;justify-content:center;"><i class="fas fa-floppy-disk"></i> সেভ করুন</button></div>`;

        const imgField = schema.fields.find(f => f.type === 'image');
        if (imgField) {
            const fileInput = document.getElementById(`field_${imgField.id}_file`);
            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const progress = document.getElementById('uploadProgress');
                const bar = document.getElementById('uploadProgressBar');
                progress.classList.add('show');
                try {
                    const url = await uploadToCloudinary(file, (pct) => { bar.style.width = pct + '%'; });
                    currentUploadUrl = url;
                    const preview = document.getElementById('uploadPreview');
                    preview.src = url;
                    preview.style.display = 'block';
                    showToast('ছবি আপলোড সম্পন্ন');
                } catch {
                    showToast('ছবি আপলোড ব্যর্থ হয়েছে', true);
                } finally {
                    progress.classList.remove('show');
                    bar.style.width = '0%';
                }
            });
        }

        document.getElementById('modalCancel').addEventListener('click', closeModal);
        modalForm.onsubmit = async (e) => {
            e.preventDefault();
            const payload = {};
            schema.fields.forEach(f => {
                if (f.type === 'image') { payload[f.id] = currentUploadUrl; return; }
                const val = document.getElementById(`field_${f.id}`).value;
                payload[f.id] = f.type === 'number' ? Number(val || 0) : val;
            });
            try {
                if (id) await update(ref(db, `${collection}/${id}`), payload);
                else await set(push(ref(db, collection)), payload);
                showToast('সেভ করা হয়েছে');
                closeModal();
            } catch {
                showToast('সেভ করতে সমস্যা হয়েছে', true);
            }
        };

        modalBackdrop.classList.add('show');
    }
    function closeModal() { modalBackdrop.classList.remove('show'); currentUploadUrl = ''; }
    modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeModal(); });

    document.querySelectorAll('[data-add]').forEach(btn => {
        btn.addEventListener('click', () => openModal(btn.dataset.add));
    });

    // ===== 11. RENDER + LIVE SYNC FOR EACH COLLECTION =====
    const counts = { education: 0, skills: 0, projects: 0, certificates: 0, messages: 0 };

    function renderList(collection, data) {
        const schema = schemas[collection];
        const wrap = document.getElementById('list-' + collection);
        const entries = data ? Object.entries(data) : [];
        counts[collection] = entries.length;
        updateDashboard();
        if (!entries.length) {
            wrap.innerHTML = `<div class="empty-state"><i class="fas fa-inbox" style="font-size:1.6rem;display:block;margin-bottom:.6rem;"></i>এখনও কিছু যোগ করা হয়নি</div>`;
            return;
        }
        wrap.innerHTML = entries.map(([id, item]) => `
            <div class="item-row" data-id="${id}">
                ${schema.imageField ? `<div class="item-thumb">${item[schema.imageField] ? `<img src="${item[schema.imageField]}">` : ''}</div>` : ''}
                <div class="item-main">
                    <div class="item-title">${escapeHtml(item[schema.titleField] || '(নাম নেই)')}</div>
                    <div class="item-sub">${escapeHtml(item[schema.subField] || '')}</div>
                </div>
                <div class="item-actions">
                    <button class="icon-btn edit-btn"><i class="fas fa-pen"></i></button>
                    <button class="icon-btn danger del-btn"><i class="fas fa-trash"></i></button>
                </div>
            </div>`).join('');

        wrap.querySelectorAll('.item-row').forEach(row => {
            const id = row.dataset.id;
            row.querySelector('.edit-btn').addEventListener('click', () => openModal(collection, id, data[id]));
            row.querySelector('.del-btn').addEventListener('click', () => {
                showConfirm(`"${data[id][schema.titleField] || 'এই আইটেম'}" মুছে ফেলতে চাও?`, async () => {
                    await remove(ref(db, `${collection}/${id}`));
                    showToast('মুছে ফেলা হয়েছে');
                });
            });
        });
    }

    function escapeHtml(s = '') { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    ['education', 'skills', 'projects', 'certificates'].forEach(collection => {
        onValue(ref(db, collection), (snap) => renderList(collection, snap.val()));
    });

    // ===== 12. MESSAGES =====
    onValue(ref(db, 'messages'), (snap) => {
        const data = snap.val();
        const wrap = document.getElementById('list-messages');
        const entries = data ? Object.entries(data).sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0)) : [];
        counts.messages = entries.filter(([, m]) => !m.read).length;
        document.getElementById('msgBadge').textContent = counts.messages ? ` (${counts.messages})` : '';
        updateDashboard();
        if (!entries.length) {
            wrap.innerHTML = `<div class="empty-state"><i class="fas fa-inbox" style="font-size:1.6rem;display:block;margin-bottom:.6rem;"></i>কোনো বার্তা নেই</div>`;
            return;
        }
        wrap.innerHTML = entries.map(([id, m]) => `
            <div class="item-row msg-row ${m.read ? '' : 'unread'}" data-id="${id}" style="align-items:flex-start; flex-direction:column;">
                <div style="display:flex; width:100%; justify-content:space-between; gap:1rem;">
                    <div class="item-main">
                        <div class="item-title">${escapeHtml(m.name)} — ${escapeHtml(m.subject || '')}</div>
                        <div class="item-sub">${escapeHtml(m.phone || '')} ${m.email ? '· ' + escapeHtml(m.email) : ''}</div>
                    </div>
                    <div class="item-actions">
                        ${!m.read ? '<button class="icon-btn read-btn" title="পঠিত করুন"><i class="fas fa-envelope-open"></i></button>' : ''}
                        <button class="icon-btn danger del-msg-btn"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="msg-body">${escapeHtml(m.body || '')}</div>
            </div>`).join('');

        wrap.querySelectorAll('.msg-row').forEach(row => {
            const id = row.dataset.id;
            row.querySelector('.read-btn')?.addEventListener('click', () => update(ref(db, `messages/${id}`), { read: true }));
            row.querySelector('.del-msg-btn').addEventListener('click', () => {
                showConfirm('এই বার্তাটি মুছে ফেলতে চাও?', async () => {
                    await remove(ref(db, `messages/${id}`));
                    showToast('বার্তা মুছে ফেলা হয়েছে');
                });
            });
        });
    });

    function updateDashboard() {
        document.getElementById('dashEdu').textContent = counts.education;
        document.getElementById('dashSkills').textContent = counts.skills;
        document.getElementById('dashProjects').textContent = counts.projects;
        document.getElementById('dashCerts').textContent = counts.certificates;
        document.getElementById('dashMsgs').textContent = counts.messages;
    }

    // ===== 13. PROFILE FORM =====
    function initDashboardData() {
        get(ref(db, 'profile')).then(snap => {
            const p = snap.val() || {};
            const map = { name: 'p_name', role: 'p_role', desc: 'p_desc', aboutP1: 'p_aboutP1', aboutP2: 'p_aboutP2',
                location: 'p_location', experience: 'p_experience', specialization: 'p_specialization', availability: 'p_availability',
                address: 'p_address', phone: 'p_phone', email: 'p_email', hours: 'p_hours', mapEmbedUrl: 'p_mapEmbedUrl',
                facebook: 'p_facebook', linkedin: 'p_linkedin', whatsapp: 'p_whatsapp' };
            Object.entries(map).forEach(([key, elId]) => { const el = document.getElementById(elId); if (el && p[key] !== undefined) el.value = p[key]; });
        });
        get(ref(db, 'stats')).then(snap => {
            const s = snap.val() || {};
            ['experience', 'projects', 'certifications', 'clients'].forEach(k => {
                const el = document.getElementById('s_' + k);
                if (el && s[k] !== undefined) el.value = s[k];
            });
        });
    }

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const ids = ['name', 'role', 'desc', 'aboutP1', 'aboutP2', 'location', 'experience', 'specialization', 'availability', 'address', 'phone', 'email', 'hours', 'mapEmbedUrl', 'facebook', 'linkedin', 'whatsapp'];
        const payload = {};
        ids.forEach(k => { payload[k] = document.getElementById('p_' + k).value; });
        try {
            await set(ref(db, 'profile'), payload);
            showToast('প্রোফাইল সেভ করা হয়েছে');
        } catch { showToast('সেভ করতে সমস্যা হয়েছে', true); }
    });

    document.getElementById('statsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            experience: document.getElementById('s_experience').value,
            projects: document.getElementById('s_projects').value,
            certifications: document.getElementById('s_certifications').value,
            clients: document.getElementById('s_clients').value
        };
        try {
            await set(ref(db, 'stats'), payload);
            showToast('স্ট্যাটস সেভ করা হয়েছে');
        } catch { showToast('সেভ করতে সমস্যা হয়েছে', true); }
    });

})();
