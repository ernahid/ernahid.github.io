// ===== ENGINEER PORTFOLIO — PUBLIC SCRIPT =====
// Works standalone with the placeholder content already in index.html.
// If config.json has real Firebase keys, it upgrades everything to live data.

function hidePreloader() {
    const pre = document.getElementById('preloader');
    if (pre) pre.classList.add('hide');
    document.body.classList.add('loaded');
}

// ===== SMART ANIMATED PRELOADER (percent counter + cycling status text) =====
function runPreloader() {
    const pre = document.getElementById('preloader');
    if (!pre) { document.body.classList.add('loaded'); return; }
    const percentEl = document.getElementById('prePercent');
    const barFill = document.getElementById('preBarFill');
    const labelEl = document.getElementById('preLabel');
    const messages = ['ব্লুপ্রিন্ট লোড হচ্ছে…', 'স্ট্রাকচার আঁকা হচ্ছে…', 'অ্যাসেট যাচাই হচ্ছে…', 'প্রায় প্রস্তুত…'];
    let progress = 0;
    let msgIndex = 0;
    let done = false;

    function step() {
        if (done) return;
        const remaining = 100 - progress;
        progress += Math.max(0.6, remaining * 0.10);
        if (progress >= 99.3) progress = 100;
        if (percentEl) percentEl.textContent = Math.floor(progress) + '%';
        if (barFill) barFill.style.width = progress + '%';
        const newMsgIndex = Math.min(messages.length - 1, Math.floor((progress / 100) * messages.length));
        if (newMsgIndex !== msgIndex && labelEl) { msgIndex = newMsgIndex; labelEl.textContent = messages[msgIndex]; }
        if (progress < 100) {
            setTimeout(() => requestAnimationFrame(step), 55);
        } else {
            done = true;
            setTimeout(hidePreloader, 300);
        }
    }
    step();

    // safety net: never keep the preloader up for more than 4.5s
    setTimeout(() => { done = true; hidePreloader(); }, 4500);
}
runPreloader();

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
const navClose = document.getElementById('navClose');
const navBackdrop = document.getElementById('navBackdrop');
const scrollTopBtn = document.getElementById('scrollTop');

let lastScrollY = window.scrollY;
window.addEventListener('scroll', () => {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 40);
    // smart hide-on-scroll-down, show-on-scroll-up (but never hide near top or while menu is open)
    if (!navLinks.classList.contains('open')) {
        if (y > lastScrollY && y > 160) navbar.classList.add('nav-hidden');
        else navbar.classList.remove('nav-hidden');
    }
    lastScrollY = y;
    scrollTopBtn.classList.toggle('show', y > 500);
    updateActiveNav();
}, { passive: true });

function openMobileNav() {
    hamburger.classList.add('open');
    navLinks.classList.add('open');
    navBackdrop.classList.add('show');
    document.body.style.overflow = 'hidden';
}
function closeMobileNav() {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    navBackdrop.classList.remove('show');
    document.body.style.overflow = '';
}
hamburger?.addEventListener('click', () => {
    navLinks.classList.contains('open') ? closeMobileNav() : openMobileNav();
});
navClose?.addEventListener('click', closeMobileNav);
navBackdrop?.addEventListener('click', closeMobileNav);
navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileNav));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMobileNav(); });

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

// ===== FUTURISTIC CURSOR GLOW (desktop only) =====
const cursorGlow = document.getElementById('cursorGlow');
if (cursorGlow && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('mousemove', (e) => {
        cursorGlow.classList.add('active');
        cursorGlow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
    }, { passive: true });
    document.addEventListener('mouseleave', () => cursorGlow.classList.remove('active'));
}

// ===== SCROLL REVEAL (per-section animation variants + staggered grids) =====
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('in-view');
            revealObserver.unobserve(e.target);
        }
    });
}, { threshold: 0.15 });

function observeReveal(el) {
    const grid = el.closest('.stagger-grid');
    if (grid) {
        const idx = [...grid.children].indexOf(el);
        el.style.setProperty('--stagger-delay', Math.max(0, idx) * 90 + 'ms');
    }
    revealObserver.observe(el);
}
document.querySelectorAll('.reveal, .timeline, .divider-draw').forEach(observeReveal);

// ===== SCROLL PROGRESS BAR =====
const scrollProgressEl = document.getElementById('scrollProgress');
function updateScrollProgress() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    if (scrollProgressEl) scrollProgressEl.style.width = pct + '%';
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

// ===== PARALLAX SECTION BACKGROUNDS (photos move gently with scroll) =====
const parallaxImgs = [...document.querySelectorAll('.section-bg img, .hero-bg img, .skills-bg img')];
let parallaxTicking = false;
function updateParallax() {
    const vh = window.innerHeight;
    parallaxImgs.forEach(img => {
        const wrap = img.parentElement;
        const rect = wrap.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const offset = Math.max(-60, Math.min(60, (center - vh / 2) * -0.06));
        img.style.transform = `translateY(${offset}px)`;
    });
    parallaxTicking = false;
}
window.addEventListener('scroll', () => {
    if (!parallaxTicking) { requestAnimationFrame(updateParallax); parallaxTicking = true; }
}, { passive: true });
updateParallax();

// ===== 3D TILT HOVER (projects / certificates / skills) =====
function initTilt(selector, max = 6) {
    document.querySelectorAll(selector).forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            const rx = (0.5 - py) * max;
            const ry = (px - 0.5) * max;
            card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-5px)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
}
initTilt('.project-card', 6);
initTilt('.cert-card', 5);
initTilt('.skill-card', 4);

// ===== MAGNETIC GLOW ON BUTTONS / FILTERS =====
document.querySelectorAll('.btn, .nav-cta, .filter-btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
        btn.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
    });
});

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
                list.map((it, i) => `
                <div class="tl-item reveal" data-reveal="${i % 2 === 0 ? 'left' : 'right'}">
                    <div class="tl-dot"></div>
                    <div class="tl-year">${esc(it.year)}</div>
                    <div class="tl-degree">${esc(it.degree)}</div>
                    <div class="tl-inst">${esc(it.institution)}</div>
                    <div class="tl-note">${esc(it.note || '')}</div>
                </div>`).join('');
            observeReveal(wrap);
        });

        // --- skills ---
        onValue(ref(db, 'skills'), (snap) => {
            const data = snap.val();
            if (!data) return;
            const list = Object.values(data);
            const grid = document.getElementById('skillsGrid');
            grid.innerHTML = list.map(sk => `
                <div class="skill-card reveal" data-reveal="scale" style="--lvl:${esc(sk.level || 70)}%">
                    <div class="skill-icon"><i class="fas ${esc(sk.icon || 'fa-gear')}"></i></div>
                    <div><div class="skill-name">${esc(sk.name)}</div><div class="skill-cat">${esc(sk.category || '')}</div></div>
                    <div class="skill-bar"><div class="skill-bar-fill"></div></div>
                </div>`).join('');
            grid.querySelectorAll('.skill-card').forEach(observeReveal);
        });

        // --- projects ---
        onValue(ref(db, 'projects'), (snap) => {
            const data = snap.val();
            if (!data) return;
            const list = Object.values(data);
            const grid = document.getElementById('projectsGrid');
            grid.innerHTML = list.map(pr => `
                <div class="project-card reveal" data-reveal="clip" data-cat="${esc(pr.category || 'residential')}">
                    <img src="${esc(pr.image)}" alt="${esc(pr.title)}" />
                    <div class="project-overlay">
                        <div class="project-tag">${esc(pr.category || '')} · ${esc(pr.year || '')}</div>
                        <div class="project-title">${esc(pr.title)}</div>
                        <div class="project-loc">${esc(pr.location || '')}</div>
                    </div>
                    <div class="project-corner"><i class="fas fa-arrow-up-right-from-square"></i></div>
                </div>`).join('');
            grid.querySelectorAll('.project-card').forEach(observeReveal);
        });

        // --- certificates ---
        onValue(ref(db, 'certificates'), (snap) => {
            const data = snap.val();
            if (!data) return;
            const list = Object.values(data);
            const grid = document.getElementById('certGrid');
            grid.innerHTML = list.map(c => `
                <div class="cert-card reveal" data-reveal="rotate">
                    <div class="cert-thumb"><img src="${esc(c.image)}" alt="${esc(c.title)}" /></div>
                    <div><div class="cert-title">${esc(c.title)}</div><div class="cert-issuer">${esc(c.issuer)}</div><div class="cert-year">${esc(c.year)}</div></div>
                </div>`).join('');
            grid.querySelectorAll('.cert-card').forEach(observeReveal);
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
