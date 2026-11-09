/* ============================================================
   Akshat Sharma — Portfolio Features (vanilla JS)
   Hero effects · Projects · Journey timeline · Music player
   EDIT THE THREE CONFIG BLOCKS BELOW TO CHANGE CONTENT.
   ============================================================ */
(function () {
    'use strict';

    /* ---------- 1. SITE CONFIG (edit me) ---------- */
    const CONFIG = {
        // Set show:false to hide the availability badge entirely.
        availability: { show: true, text: 'Open to Opportunities' },
        music: { uri: 'spotify:track:7BKLCZ1jbUBVqRi2FVlTVw', title: 'Closer', artist: 'The Chainsmokers' }
    };

    /* ---------- 2. PROJECTS (edit me) ----------
       Set image to a file path (e.g. 'cloud-gaming.jpg') once you have a real screenshot.
       github / demo: use a real URL, or null to show a disabled "coming soon" button.
       Remove `placeholder: true` once the entry holds real information. */
    const PROJECTS = [
        {
            title: 'CloudArk',
            category: 'Cloud Gaming',
            // Description below is taken from the site's own tagline.
            description: 'Play premium games instantly from your browser. No downloads, no installs, no storage required.',
            details: 'CloudArk is a cloud gaming web app: play premium games instantly from your browser, with no downloads, no installs and no storage required.',
            tech: [],            // TODO: add your stack, e.g. ['Python', 'JavaScript']
            image: 'cloudark.jpg',          // 16:9 card preview
            imageFull: 'cloudark-full.jpg', // optional: full-width image shown in the modal
            imageFullSize: [1600, 489],
            github: null,        // TODO: add the repo URL (leave null to hide the button)
            demo: 'https://cloud-ark.vercel.app/',
            status: null,        // Gaming theme label, ONLY if true: 'MISSION COMPLETED' | 'CURRENT PROJECT' | 'EXPERIMENTAL BUILD'
            placeholder: false   // true = shows "draft" label and "add me" hints
        }
    ];

    /* ---------- 3. TIMELINE (edit me) ----------
       type: education | learning | project | hackathon | achievement
       Only add dates, results or achievements that are true.
       Hackathon template:
       { type:'hackathon', date:'Month Year', title:'Event name', subtitle:'Result / role', text:'What you built', tags:['Tech'] } */
    const TIMELINE = [
        {
            type: 'education', date: 'Currently Pursuing', title: 'Newton School of Technology',
            subtitle: 'Rishihood University · B.Tech, Computer Science & Artificial Intelligence',
            text: 'First-year B.Tech student.', tags: ['CS', 'AI'],
            image: 'university.jpg', progress: { value: 25, label: 'Year 1 of 4' }
        },
        {
            type: 'learning', date: 'Technical Skills', title: 'Programming foundations',
            subtitle: 'Languages and web fundamentals',
            text: 'Web structure, styling and interactivity, plus problem-solving and object-oriented programming.',
            tags: ['HTML', 'CSS', 'JavaScript', 'Python', 'Java', 'C++']
        },
        {
            type: 'project', date: 'Project', title: 'CloudArk',
            subtitle: 'Cloud gaming web app · cloud-ark.vercel.app',
            text: 'Play premium games instantly from your browser, with no downloads or installs.', tags: ['Cloud Gaming']
        },
        {
            type: 'hackathon', date: 'Participant', title: '12-Hour MLH Hacktoberfest',
            subtitle: 'Organised by DevClub',
            text: 'Took part in a 12-hour hackathon.', tags: ['Hackathon']
        }
    ];

    /* ---------- helpers ---------- */
    const coarse = matchMedia('(hover: none), (pointer: coarse)').matches;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $ = (id) => document.getElementById(id);
    const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const tags = (arr) => arr.map((t, i) => `<span class="tag" style="--i:${i}">${esc(t)}</span>`).join('');

    const revealIO = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('visible'); revealIO.unobserve(en.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.section-sub').forEach((n) => revealIO.observe(n));

    /* ============ 1. HERO ============ */
    const title = document.querySelector('.hero-title');
    if (title) {
        title.setAttribute('aria-label', 'Akshat Sharma');
        title.querySelectorAll('.hero-title-line').forEach((line, li) => {
            const text = line.textContent;
            line.textContent = '';
            [...text].forEach((ch, i) => {
                const s = el('span', 'char'); s.setAttribute('aria-hidden', 'true'); s.textContent = ch;
                s.style.animationDelay = (0.2 + li * 0.45 + i * 0.06) + 's';
                line.appendChild(s);
            });
        });
    }

    const avail = $('availability');
    if (avail) { if (CONFIG.availability.show) $('availabilityText').textContent = CONFIG.availability.text; else avail.remove(); }

    const hero = document.querySelector('.hero-section');
    if (hero && !coarse) {
        const glow = hero.querySelector('.hero-glow');
        const grid = hero.querySelector('.hero-grid-bg');
        hero.addEventListener('pointermove', (e) => {
            const r = hero.getBoundingClientRect();
            const x = e.clientX - r.left, y = e.clientY - r.top;
            glow.style.setProperty('--gx', x + 'px'); glow.style.setProperty('--gy', y + 'px');
            if (!reduce) grid.style.transform = `translate(${(x / r.width - 0.5) * -14}px, ${(y / r.height - 0.5) * -14}px)`;
        }, { passive: true });
        if (!reduce) {
            document.querySelectorAll('.magnetic').forEach((b) => {
                b.addEventListener('pointermove', (e) => {
                    const r = b.getBoundingClientRect();
                    b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
                });
                b.addEventListener('pointerleave', () => { b.style.transform = ''; });
            });
        }
    }

    const bar = $('scrollProgress');
    let ticking = false;
    const onScroll = () => {
        if (ticking) return; ticking = true;
        requestAnimationFrame(() => {
            const max = document.documentElement.scrollHeight - innerHeight;
            bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
            updateJourney();
            ticking = false;
        });
    };

    /* ============ 2. PROJECTS ============ */
    const grid = $('projectsGrid');
    const linkBtn = (url, label, cls, draft) => url
        ? `<a class="pbtn ${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`
        : (draft ? `<span class="pbtn pbtn--off" aria-disabled="true">${label} · soon</span>` : '');
    const techHTML = (p) => p.tech.length ? tags(p.tech) : (p.placeholder ? '<span class="tag tag--empty">Tech stack: add in features.js</span>' : '');

    // Modal
    const modal = el('div', 'pmodal', `
        <div class="pmodal-backdrop" data-close></div>
        <div class="pmodal-panel" role="dialog" aria-modal="true" aria-labelledby="pmTitle">
            <button class="pmodal-close" data-close aria-label="Close project details">&times;</button>
            <div class="pmodal-media" id="pmMedia"></div>
            <div class="pmodal-body">
                <span class="pcat" id="pmCat"></span>
                <h3 id="pmTitle"></h3>
                <p id="pmDesc"></p>
                <div class="tags" id="pmTags"></div>
                <div class="pbtns" id="pmBtns"></div>
            </div>
        </div>`);
    document.body.appendChild(modal);
    let lastFocus = null;

    const imgHTML = (p, big) => p.image
        ? (big && p.imageFull
            ? `<img class="full" src="${esc(p.imageFull)}" alt="${esc(p.title)} website screenshot" decoding="async" width="${p.imageFullSize[0]}" height="${p.imageFullSize[1]}">`
            : `<img src="${esc(p.image)}" alt="${esc(p.title)} website screenshot" loading="lazy" decoding="async" width="${big ? 960 : 640}" height="${big ? 540 : 360}">`)
        : `<div class="pimg-empty"><span>Preview coming soon</span></div>`;

    function openModal(p) {
        lastFocus = document.activeElement;
        $('pmMedia').innerHTML = imgHTML(p, true);
        $('pmMedia').classList.toggle('auto', !!(p.image && p.imageFull));
        $('pmCat').textContent = p.category;
        $('pmTitle').textContent = p.title;
        $('pmDesc').textContent = p.details || p.description;
        $('pmTags').innerHTML = techHTML(p);
        $('pmBtns').innerHTML = linkBtn(p.github, 'GitHub', '', p.placeholder) + linkBtn(p.demo, 'Live Demo', 'pbtn--main', p.placeholder);
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        modal.querySelector('.pmodal-close').focus();
    }
    function closeModal() {
        if (!modal.classList.contains('open')) return;
        modal.classList.remove('open');
        document.body.style.overflow = '';
        if (lastFocus) lastFocus.focus();
    }
    modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeModal(); }
        if (e.key === 'Tab' && modal.classList.contains('open')) {          // simple focus trap
            const f = [...modal.querySelectorAll('a[href], button')];
            const first = f[0], last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    });

    PROJECTS.forEach((p, i) => {
        const card = el('article', 'project-card reveal-up', `
            <div class="pimg">${imgHTML(p, false)}</div>
            <div class="pbody">
                ${p.status ? `<span class="pstatus">${esc(p.status)}</span>` : ''}
                <span class="pcat">${esc(p.category)}${p.placeholder ? ' · draft' : ''}</span>
                <h3>${esc(p.title)}</h3>
                <p>${esc(p.description)}</p>
                <div class="tags">${techHTML(p)}</div>
                <div class="pbtns">${linkBtn(p.github, 'GitHub', '', p.placeholder)}${linkBtn(p.demo, 'Live Demo', 'pbtn--main', p.placeholder)}</div>
            </div>`);
        card.dataset.file = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.project.js'; card.dataset.track = String(i + 1).padStart(2, '0');
        card.tabIndex = 0; card.setAttribute('role', 'button'); card.setAttribute('aria-haspopup', 'dialog');
        card.setAttribute('aria-label', `${p.title}: view details`);
        card.style.transitionDelay = (i * 0.08) + 's';
        card.addEventListener('click', (e) => { if (!e.target.closest('a')) openModal(p); });
        card.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === card) { e.preventDefault(); openModal(p); } });
        if (!coarse && !reduce) {                                             // 3D tilt: desktop only
            card.addEventListener('pointermove', (e) => {
                const r = card.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
                card.style.setProperty('--rx', (-y * 8) + 'deg'); card.style.setProperty('--ry', (x * 8) + 'deg');
                card.style.setProperty('--mx', (x + 0.5) * 100 + '%'); card.style.setProperty('--my', (y + 0.5) * 100 + '%');
            });
            card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
        }
        grid.appendChild(card);
        revealIO.observe(card);
    });

    /* ============ 3. JOURNEY TIMELINE ============ */
    const journey = $('journey'), jFill = $('journeyFill');
    const ICON = { education: '🎓', learning: '💻', project: '🚀', hackathon: '🏆', achievement: '⭐' };
    const LABEL = { education: 'Education', learning: 'Technical learning', project: 'Project', hackathon: 'Hackathon', achievement: 'Achievement' };
    const jItems = TIMELINE.map((it, i) => {
        const li = el('li', `jitem ${i % 2 ? 'right' : 'left'}`, `
            <span class="jnode" aria-hidden="true"></span>
            <article class="jcard">
                ${it.image ? `<div class="jcard-bg" style="background-image:url('${esc(it.image)}')"></div>` : ''}
                <div class="jcard-in">
                    <div class="jmeta"><span class="jicon" aria-hidden="true">${ICON[it.type] || '•'}</span>${esc(LABEL[it.type] || '')}<span class="jdate">${esc(it.date || '')}</span></div>
                    <h3>${esc(it.title)}</h3>
                    ${it.subtitle ? `<p class="jsub">${esc(it.subtitle)}</p>` : ''}
                    ${it.text ? `<p>${esc(it.text)}</p>` : ''}
                    ${it.tags && it.tags.length ? `<div class="tags">${tags(it.tags)}</div>` : ''}
                    ${it.progress ? `<div class="jprog"><div class="jprog-track"><i style="--w:${it.progress.value}%"></i></div><span>${esc(it.progress.label)}</span></div>` : ''}
                </div>
            </article>`);
        journey.appendChild(li); revealIO.observe(li);
        return li;
    });
    function updateJourney() {
        if (!journey) return;
        const r = journey.getBoundingClientRect(), mid = innerHeight * 0.55;
        const p = Math.min(1, Math.max(0, (mid - r.top) / r.height));
        jFill.style.transform = `scaleY(${p})`;
        jItems.forEach((li) => { li.classList.toggle('active', li.querySelector('.jnode').getBoundingClientRect().top < mid); });
    }
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    onScroll();

    /* ============ 5. SKILL CARD TILT (one implementation for ALL cards) ============
       Root cause of the old bug: the scroll-in stagger put transition-delay (0.08s..0.4s) on cards 2-6,
       which also delayed every tilt update, so those cards barely moved. `.tilt-ready` removes the delay once a card is touched. */
    document.querySelectorAll('.skill-card').forEach(function (c) {
        c.classList.add('tilt');
        if (reduce) return;
        var set = function (e) {
            var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
            c.style.setProperty('--rx', ((0.5 - y) * 11).toFixed(2) + 'deg'); c.style.setProperty('--ry', ((x - 0.5) * 11).toFixed(2) + 'deg');
            c.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); c.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        };
        var reset = function () { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); c.classList.remove('touching'); };
        c.addEventListener('pointerenter', function () { c.classList.add('tilt-ready'); });
        c.addEventListener('pointermove', function (e) { if (e.pointerType !== 'touch') set(e); else if (c.classList.contains('touching')) set(e); });
        c.addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch') { c.classList.add('tilt-ready', 'touching'); set(e); } });   // touch: tilt toward the finger
        ['pointerleave', 'pointerup', 'pointercancel'].forEach(function (ev) { c.addEventListener(ev, reset); });
    });

    window.PORTFOLIO = { PROJECTS: PROJECTS, TIMELINE: TIMELINE, CONFIG: CONFIG };   // shared data for themes.js (terminal etc.)
})();
