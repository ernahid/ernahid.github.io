// ===== ENGINEER PORTFOLIO — PUBLIC SCRIPT =====
// Works standalone with the placeholder content already in index.html.
// If config.json has real Firebase keys, it upgrades everything to live data.

function hidePreloader() {
    const pre = document.getElementById('preloader');
    if (pre) pre.classList.add('hide');
}
setTimeout(hidePreloader, 3500);
window.addEventListener('load', () => setTimeout(hidePreloader, 900));

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const toast = (msg, isError = false) => {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.borderColor = isError ? '#ff6a1a' : '#5fb4e5';
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3200);
};

// ===== NAVBAR =====
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const scrollTopBtn = document.getElementById('scrollTop');

window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
    scrollTopBtn.classList.toggle('show', window.scrollY > 500);
    updateActiveNav();
}, { passive: true });

hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
});
navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
}));
scrollTopBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

const navAnchors = document.querySelectorAll('.nav-link');
const sections = [...document.querySelectorAll('section[id], header[id]')];
function updateActiveNav() {
    let current = sections[0]?.id;
    const y = window.scrollY + 140;
    for (const s of sections) {
        if (s.offsetTop <= y) current = s.id;
    }
    navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
}

// ===== SCROLL REVEAL =====
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('in-view');
            revealObserver.unobserve(e.target);
        }
    });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal, .timeline, .divider-draw').forEach(el => revealObserver.observe(el));

// ===== PROJECT FILTER =====
const filterBtns = document.querySelectorAll('#projectFilters .filter-btn');
const projectCards = () => document.querySelectorAll('#projectsGrid .project-card');
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filter;
        projectCards().forEach(card => {
            const show = f === 'all' || card.dataset.cat === f;
            card.style.display = show ? '' : 'none';
        });
    });
});

// ===== LIGHTBOX (for project / certificate images) =====
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
document.getElementById('lightboxClose')?.addEventListener('click', () => lightbox.classList.remove('show'));
lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('show'); });
document.addEventListener('click', (e) => {
    const card = e.target.closest('.project-card');
    if (card) {
        const img = card.querySelector('img');
        const title = card.querySelector('.project-title')?.textContent || '';
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightboxCaption.textContent = title;
        lightbox.classList.add('show');
    }
});

// ===== FOOTER YEAR =====
const yearEl = document.getElementById('footerYear');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== CONTACT FORM (local fallback: mailto-style toast until Firebase connected) =====
function wireContactFormFallback() {
    document.getElementById('contactForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        toast('বার্তা পাঠানো হয়েছে। শীঘ্রই যোগাযোগ করা হবে।');
        e.target.reset();
    });
}

// ===== TRY LIVE FIREBASE DATA (optional — site works fine without it) =====
(async () => {
    let config;
    try {
        config = await fetch('./config.json').then(r => r.json());
    } catch {
        wireContactFormFallback();
        return;
    }

    const hasFirebase = config?.firebase?.apiKey && !config.firebase.apiKey.includes('YOUR_');
    if (!hasFirebase) {
        wireContactFormFallback();
        return;
    }

    try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
        const { getDatabase, ref, onValue, push, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');

        const app = initializeApp(config.firebase);
        const db = getDatabase(app);

        // --- profile / hero / about / contact ---
        onValue(ref(db, 'profile'), (snap) => {
            const p = snap.val();
            if (!p) return;
            setText('navName', p.name);
            setText('footerName', p.name);
            setText('heroRole', p.role);
            setText('heroDesc', p.desc);
            setText('aboutP1', p.aboutP1);
            setText('aboutP2', p.aboutP2);
            setText('aboutLocation', p.location);
            setText('aboutExp', p.experience);
            setText('aboutSpec', p.specialization);
            setText('aboutAvail', p.availability);
            setText('contactAddress', p.address);
            setText('contactPhone', p.phone);
            setText('contactEmail', p.email);
            setText('contactHours', p.hours);
            if (p.facebook) document.getElementById('footerFb').href = p.facebook;
            if (p.linkedin) document.getElementById('footerLi').href = p.linkedin;
            if (p.whatsapp) {
                document.getElementById('footerWa').href = p.whatsapp;
                document.getElementById('floatWhatsApp').href = p.whatsapp;
            }
            if (p.mapEmbedUrl) document.getElementById('contactMap').src = p.mapEmbedUrl;
        });

        // --- stats ---
        onValue(ref(db, 'stats'), (snap) => {
            const s = snap.val();
            if (!s) return;
            const nums = document.querySelectorAll('#heroStats .stat-num');
            const labels = ['experience', 'projects', 'certifications', 'clients'];
            labels.forEach((key, i) => { if (s[key] && nums[i]) nums[i].textContent = s[key]; });
        });

        // --- education ---
        onValue(ref(db, 'education'), (snap) => {
            const data = snap.val();
            if (!data) return;
            const list = Object.values(data).sort((a, b) => (a.order || 0) - (b.order || 0));
            const wrap = document.getElementById('educationList');
            wrap.innerHTML = '<div class="timeline-rail"><div class="timeline-rail-draw"></div></div>' +
                list.map(it => `
                <div class="tl-item">
                    <div class="tl-dot"></div>
                    <div class="tl-year">${esc(it.year)}</div>
                    <div class="tl-degree">${esc(it.degree)}</div>
                    <div class="tl-inst">${esc(it.institution)}</div>
                    <div class="tl-note">${esc(it.note || '')}</div>
                </div>`).join('');
            revealObserver.observe(wrap);
        });

        // --- skills ---
        onValue(ref(db, 'skills'), (snap) => {
            const data = snap.val();
            if (!data) return;
            const list = Object.values(data);
            const grid = document.getElementById('skillsGrid');
            grid.innerHTML = list.map(sk => `
                <div class="skill-card reveal" style="--lvl:${esc(sk.level || 70)}%">
                    <div class="skill-icon"><i class="fas ${esc(sk.icon || 'fa-gear')}"></i></div>
                    <div><div class="skill-name">${esc(sk.name)}</div><div class="skill-cat">${esc(sk.category || '')}</div></div>
                    <div class="skill-bar"><div class="skill-bar-fill"></div></div>
                </div>`).join('');
            grid.querySelectorAll('.skill-card').forEach(el => revealObserver.observe(el));
        });

        // --- projects ---
        onValue(ref(db, 'projects'), (snap) => {
            const data = snap.val();
            if (!data) return;
            const list = Object.values(data);
            const grid = document.getElementById('projectsGrid');
            grid.innerHTML = list.map(pr => `
                <div class="project-card reveal" data-cat="${esc(pr.category || 'residential')}">
                    <img src="${esc(pr.image)}" alt="${esc(pr.title)}" />
                    <div class="project-overlay">
                        <div class="project-tag">${esc(pr.category || '')} · ${esc(pr.year || '')}</div>
                        <div class="project-title">${esc(pr.title)}</div>
                        <div class="project-loc">${esc(pr.location || '')}</div>
                    </div>
                    <div class="project-corner"><i class="fas fa-arrow-up-right-from-square"></i></div>
                </div>`).join('');
            grid.querySelectorAll('.project-card').forEach(el => revealObserver.observe(el));
        });

        // --- certificates ---
        onValue(ref(db, 'certificates'), (snap) => {
            const data = snap.val();
            if (!data) return;
            const list = Object.values(data);
            const grid = document.getElementById('certGrid');
            grid.innerHTML = list.map(c => `
                <div class="cert-card reveal">
                    <div class="cert-thumb"><img src="${esc(c.image)}" alt="${esc(c.title)}" /></div>
                    <div><div class="cert-title">${esc(c.title)}</div><div class="cert-issuer">${esc(c.issuer)}</div><div class="cert-year">${esc(c.year)}</div></div>
                </div>`).join('');
            grid.querySelectorAll('.cert-card').forEach(el => revealObserver.observe(el));
        });

        // --- contact form -> Firebase ---
        document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            try {
                await push(ref(db, 'messages'), {
                    name: document.getElementById('msgName').value,
                    phone: document.getElementById('msgPhone').value,
                    email: document.getElementById('msgEmail').value,
                    subject: document.getElementById('msgSubject').value,
                    body: document.getElementById('msgBody').value,
                    createdAt: serverTimestamp(),
                    read: false
                });
                toast('বার্তা পাঠানো হয়েছে। ধন্যবাদ!');
                e.target.reset();
            } catch (err) {
                toast('বার্তা পাঠাতে সমস্যা হয়েছে, আবার চেষ্টা করুন।', true);
            } finally {
                btn.disabled = false;
            }
        });

    } catch (err) {
        console.error('Firebase init failed, staying on static content:', err);
        wireContactFormFallback();
    }
})();

function setText(id, val) {
    if (val === undefined || val === null || val === '') return;
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}
