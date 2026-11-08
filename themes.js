/* ============================================================
   themes.js — one portfolio, four themes.
   Switching = changing <html data-theme="...">. Every theme is a set of
   CSS tokens + component rules in themes.css; shared content never duplicates.
   Everything theme-specific that needs JS lives here:
   ThemeConfig · ThemeSwitcher · ThemeTransition · backgrounds · hero extras · terminal · swarm config
   ============================================================ */
(function () {
    'use strict';
    var html = document.documentElement;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var coarse = matchMedia('(hover: none), (pointer: coarse)').matches;
    var KEY = (window.THEME_CONFIG && window.THEME_CONFIG.storageKey) || 'portfolioTheme';
    var $ = function (s, r) { return (r || document).querySelector(s); };

    /* ---------- THEME CONFIG (edit me) ---------- */
    var fmtDefault = function (n) { return '&lt;' + n + ' /&gt;'; };
    var THEMES = {
        'default': {
            name: 'Default', tag: 'Futuristic', icon: '✨', swatch: ['#050508', '#00d4ff', '#8b5cf6'],
            swarm: { colors: ['#8b5cf6', '#3b82f6', '#22d3ee', '#60a5fa', '#a78bfa', '#6366f1'],
                msgs: ['INITIALIZING AI SWARM...', 'ASSEMBLING INTERFACE...', 'CONNECTING COMPONENTS...', 'VERIFYING BUILD...'], prog: 'BUILD' }
        },
        gaming: {
            name: 'Gaming', tag: 'Esports', icon: '🎮', swatch: ['#07070a', '#ff2d55', '#4d7cff'],
            swarm: { colors: ['#ff2d55', '#a855f7', '#3b82f6', '#ff6b81', '#7c3aed', '#38bdf8'],
                msgs: ['INITIALIZING GAME INTERFACE...', 'LOADING PLAYER PROFILE...', 'BUILDING MISSION CARDS...', 'HUD SYSTEM ONLINE...'], prog: 'MISSION',
                intro: 'CLASS: DEVELOPER &middot; STATUS: ONLINE', btns: ['Select Mission', 'Contact Me'], tags: ['HUD', 'MISSIONS', 'LOG'],
                fmt: function (n) { return '[ ' + n + ' ]'; },
                status: [['HUD SYSTEM', 'ONLINE'], ['SQUAD', null], ['MISSIONS', 'LOADED'], ['BUILD STATUS', 'SUCCESS']],
                extra: '<span class="sw-x sw-x-hud"></span><span class="sw-x sw-x-mission">PLAYER 01 // DEVELOPER MODE</span>' }
        },
        music: {
            name: 'Music', tag: 'Audio', icon: '🎧', swatch: ['#08050f', '#a855f7', '#22d3ee'],
            swarm: { colors: ['#a855f7', '#22d3ee', '#ec4899', '#c084fc', '#06b6d4', '#f472b6'],
                msgs: ['INITIALIZING AUDIO ENGINE...', 'GENERATING WAVEFORMS...', 'BUILDING MUSIC INTERFACE...', 'AUDIO VISUALIZER READY...'], prog: 'MIX',
                intro: 'Code has a rhythm. So does creativity.', btns: ['Play Projects', 'Contact Me'], tags: ['Studio', 'Playlist', 'Timeline'],
                fmt: function (n) { return '♪ ' + n; },
                status: [['AUDIO ENGINE', 'READY'], ['TRACKS', null], ['WAVEFORMS', 'GENERATED'], ['BUILD STATUS', 'SUCCESS']],
                extra: (function () { var h = ''; for (var i = 0; i < 25; i++) h += '<i style="--h:' + (30 + Math.round(Math.abs(Math.sin(i * 1.7) + Math.cos(i * 0.6)) * 32)) + '%"></i>'; return '<div class="sw-x sw-x-wave">' + h + '</div>'; })() }
        },
        coding: {
            name: 'Coding', tag: 'Developer', icon: '💻', swatch: ['#0d1014', '#4ade80', '#c792ea'],
            swarm: { colors: ['#c792ea', '#60a5fa', '#34d399', '#4ade80', '#818cf8', '#86efac'],
                names: ['ui_designer', 'frontend_dev', 'animation_eng', 'content_agent', 'code_architect', 'quality_tester'],
                msgs: ['INITIALIZING DEVELOPMENT ENVIRONMENT...', 'GENERATING COMPONENTS...', 'CONNECTING MODULES...', 'RUNNING TESTS...'], prog: '$ build',
                intro: 'const role = "Developer";', btns: ['npm run projects', 'git contact'], tags: ['Hero', 'Projects', 'Timeline'],
                fmt: function (n) { return '&lt;' + n + ' /&gt;'; },
                status: [['COMPILE', 'OK'], ['AGENTS', null], ['MODULES', 'CONNECTED'], ['BUILD', 'SUCCESSFUL.']],
                extra: '<div class="sw-x sw-x-bar">portfolio/index.jsx</div><div class="sw-x sw-x-code"><span>import { Skills } from "./modules";</span><span>const build = await compile();</span><span>export default Portfolio;</span></div>' }
        }
    };
    var ORDER = ['default', 'gaming', 'music', 'coding'];
    var cur = html.getAttribute('data-theme');
    if (!THEMES[cur]) { cur = 'default'; html.setAttribute('data-theme', cur); }

    /* ---------- Public API (used by swarm.js) ---------- */
    window.ThemeSystem = {
        get: function () { return cur; }, set: function (n) { setTheme(n, true); },
        swarm: function () { return THEMES[cur].swarm; }, themes: THEMES
    };

    /* ============ Hero extras: eyebrow lines, HUD panel, wave, code panel ============ */
    var textBlock = $('.hero-text-block'), visual = $('.hero-visual'), codeTimer = 0;
    if (textBlock && visual) {
        var title = $('.hero-title', textBlock);
        var mkEl = function (tag, cls, h, attrs) { var e = document.createElement(tag); e.className = cls; e.innerHTML = h; for (var k in (attrs || {})) e.setAttribute(k, attrs[k]); return e; };
        textBlock.insertBefore(mkEl('p', 'tx-eyebrow', 'PLAYER 01 // DEVELOPER MODE', { 'data-for': 'gaming' }), title);
        textBlock.insertBefore(mkEl('p', 'tx-eyebrow', 'Code has a rhythm. So does creativity.', { 'data-for': 'music' }), title);
        visual.appendChild(mkEl('div', 'tx-panel tx-hud', '<div class="hud-title"><span></span>PLAYER PROFILE</div><dl>' +
            '<div><dt>PLAYER</dt><dd>AKSHAT SHARMA</dd></div><div><dt>CLASS</dt><dd>DEVELOPER</dd></div>' +
            '<div><dt>SKILLS</dt><dd>PROGRAMMING</dd></div><div><dt>STATUS</dt><dd class="on">ONLINE</dd></div></dl><div class="hud-scan"></div>', { 'data-for': 'gaming' }));
        var bars = ''; for (var b = 0; b < 30; b++) bars += '<i style="--i:' + b + ';--h:' + (28 + Math.round(Math.abs(Math.sin(b * 1.7) + Math.cos(b * 0.6)) * 34)) + '%"></i>';
        visual.appendChild(mkEl('div', 'tx-wave', bars, { 'data-for': 'music', 'aria-hidden': 'true' }));
        var K = function (t) { return '<span class="k">' + t + '</span>'; }, S = function (t) { return '<span class="s">"' + t + '"</span>'; }, P = function (t) { return '<span class="p">' + t + '</span>'; };
        var CODE = [K('const') + ' <span class="v">developer</span> = {', '    ' + P('name') + ': ' + S('Akshat Sharma') + ',', '    ' + P('role') + ': ' + S('Developer') + ',',
            '    ' + P('interests') + ': [', '        ' + S('AI') + ',', '        ' + S('Programming') + ',', '        ' + S('Building Projects'), '    ],', '    ' + P('status') + ': ' + S('Building something new'), '};'];
        var code = mkEl('div', 'tx-panel tx-code', '<div class="code-bar"><i></i><i></i><i></i><span>developer.js</span></div><pre aria-label="developer object: name Akshat Sharma, role Developer, interests AI, Programming, Building Projects, status Building something new"></pre>', { 'data-for': 'coding' });
        visual.appendChild(code);
        var pre = $('pre', code);
        var typeCode = function () {
            clearTimeout(codeTimer); pre.innerHTML = '';
            if (reduce) { pre.innerHTML = CODE.join('\n'); return; }
            var i = 0;
            (function next() { if (i >= CODE.length) return; pre.innerHTML = CODE.slice(0, ++i).join('\n') + '<span class="caret"></span>'; codeTimer = setTimeout(next, 260); })();
        };
        window.__typeCode = typeCode;
    }

    /* ============ Skill cards: file names + decorative bars ============ */
    var FILES = { html: 'index.html', css: 'style.css', javascript: 'script.js', python: 'main.py', java: 'Main.java', 'c++': 'main.cpp' };
    document.querySelectorAll('.skill-card').forEach(function (c) {
        var n = ($('.skill-name', c) || {}).textContent || ''; c.dataset.file = FILES[n.trim().toLowerCase()] || (n.trim().toLowerCase() + '.js');
        var f = document.createElement('span'); f.className = 'freq'; f.setAttribute('aria-hidden', 'true');   // decorative: NOT a proficiency indicator
        for (var i = 0; i < 7; i++) f.innerHTML += '<i style="--i:' + i + '"></i>';
        ($('.skill-card-content', c) || c).appendChild(f);
    });

    /* ============ Background canvas (music + coding only) ============ */
    var cv = $('#themeBg'), ctx = cv.getContext('2d'), raf = 0, W = 0, H = 0, mx = -1, cols = [];
    var musicCard = document.getElementById('musicCard');
    function size() { var d = Math.min(devicePixelRatio || 1, 1.5); W = cv.width = innerWidth * d; H = cv.height = innerHeight * d; ctx.setTransform(1, 0, 0, 1, 0, 0); cols = []; }
    addEventListener('resize', size, { passive: true });
    addEventListener('pointermove', function (e) { mx = e.clientX / innerWidth; }, { passive: true });
    var lastDraw = 0;
    function draw(ts) {
        raf = 0;
        if (document.hidden || (cur !== 'music' && cur !== 'coding')) { ctx.clearRect(0, 0, W, H); return; }
        if (html.classList.contains('swarm-on')) { raf = requestAnimationFrame(draw); return; }     // idle while the intro plays
        if (!reduce) raf = requestAnimationFrame(draw);
        if (ts - lastDraw < 40) return; lastDraw = ts;                                // ~25fps cap
        ctx.clearRect(0, 0, W, H); var t = ts / 1000;
        if (cur === 'music') {                                                         // decorative waveform; louder only when Spotify REALLY reports playback
            var n = coarse ? 36 : 72, bw = W / n, amp = musicCard && musicCard.classList.contains('is-playing') ? 1 : 0.55;
            for (var i = 0; i < n; i++) {
                var x = i / n, near = mx < 0 ? 0 : Math.max(0, 1 - Math.abs(x - mx) * 5);
                var h = (0.1 + 0.09 * Math.sin(t * 1.3 + i * 0.35) + 0.07 * Math.sin(t * 2.1 + i * 0.9) + near * 0.12) * H * amp;
                var g = ctx.createLinearGradient(0, H, 0, H - h); g.addColorStop(0, 'rgba(168,85,247,.28)'); g.addColorStop(1, 'rgba(34,211,238,.02)');
                ctx.fillStyle = g; ctx.fillRect(i * bw + bw * 0.2, H - h, bw * 0.6, h);
            }
        } else {                                                                       // faint code stream
            var fs = Math.round(15 * (H / innerHeight)), cn = Math.floor(W / (fs * 2.2)), chars = '01{}[]<>/=;()=>const let';
            if (!cols.length) for (var c = 0; c < cn; c++) cols.push({ y: Math.random() * H, v: 0.25 + Math.random() * 0.45 });
            ctx.font = fs + 'px "JetBrains Mono", monospace';
            for (var k = 0; k < cn; k++) {
                var col = cols[k]; col.y += col.v * fs * 0.16; if (col.y > H + fs * 8) col.y = -fs * 4;
                for (var j = 0; j < 7; j++) { ctx.fillStyle = 'rgba(74,222,128,' + (0.11 - j * 0.014) + ')'; ctx.fillText(chars[(k * 7 + j + Math.floor(t * 0.8)) % chars.length], k * fs * 2.2, col.y - j * fs); }
            }
        }
    }
    function startBg() { cancelAnimationFrame(raf); size(); raf = requestAnimationFrame(draw); }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) startBg(); });

    /* ============ Switcher UI ============ */
    var sw = document.getElementById('themeSwitcher');
    sw.innerHTML = '<button type="button" class="ts-btn" id="tsBtn" aria-haspopup="listbox" aria-expanded="false" aria-controls="tsMenu" aria-label="Choose theme"><span class="ts-ico" aria-hidden="true"></span><span class="ts-lab"><small>THEME</small><b></b></span><span class="ts-caret" aria-hidden="true">▾</span></button>' +
        '<ul class="ts-menu" id="tsMenu" role="listbox" aria-label="Theme" hidden>' + ORDER.map(function (k) {
            var t = THEMES[k]; return '<li role="option" tabindex="-1" data-theme-opt="' + k + '"><span class="ts-oi" aria-hidden="true">' + t.icon + '</span><span class="ts-ot"><b>' + t.name + '</b><small>' + t.tag + '</small></span>' +
                '<span class="ts-sw" aria-hidden="true">' + t.swatch.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</span><span class="ts-ck" aria-hidden="true">✓</span></li>';
        }).join('') + '</ul>';
    var btn = $('#tsBtn'), menu = $('#tsMenu'), opts = [].slice.call(menu.children);
    function renderSwitcher() {
        $('.ts-ico', btn).textContent = THEMES[cur].icon; $('.ts-lab b', btn).textContent = THEMES[cur].name.toUpperCase();
        opts.forEach(function (o) { var on = o.dataset.themeOpt === cur; o.setAttribute('aria-selected', on); o.classList.toggle('active', on); });
    }
    function openMenu(o) { menu.hidden = !o; btn.setAttribute('aria-expanded', o); if (o) { var a = opts.filter(function (x) { return x.classList.contains('active'); })[0] || opts[0]; a.focus(); } }
    btn.addEventListener('click', function () { openMenu(menu.hidden); });
    document.addEventListener('click', function (e) { if (!sw.contains(e.target)) openMenu(false); });
    menu.addEventListener('click', function (e) { var o = e.target.closest('[data-theme-opt]'); if (o) { setTheme(o.dataset.themeOpt, true); openMenu(false); btn.focus(); } });
    menu.addEventListener('keydown', function (e) {
        var i = opts.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); opts[(i + 1) % opts.length].focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); opts[(i + opts.length - 1) % opts.length].focus(); }
        else if (e.key === 'Home') { e.preventDefault(); opts[0].focus(); } else if (e.key === 'End') { e.preventDefault(); opts[opts.length - 1].focus(); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.activeElement.click(); }
        else if (e.key === 'Escape' || e.key === 'Tab') { openMenu(false); btn.focus(); }
    });
    btn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); openMenu(true); } });

    /* ============ Theme switch + transition (keeps scroll position) ============ */
    var fx = document.getElementById('themeFx'), busy = false;
    function anchor() {
        var secs = document.querySelectorAll('section'), i, r;
        for (i = 0; i < secs.length; i++) { r = secs[i].getBoundingClientRect(); if (r.bottom > 120 && r.display !== 'none' && secs[i].offsetParent) return { el: secs[i], top: r.top }; }
        return null;
    }
    function apply(name, a) {
        cur = name; html.setAttribute('data-theme', name);
        try { localStorage.setItem(KEY, name); } catch (e) {}
        renderSwitcher(); startBg();
        if (name === 'coding' && window.__typeCode) window.__typeCode(); else clearTimeout(codeTimer);
        if (a) { var fix = function () { var r = a.el.getBoundingClientRect(); if (a.el.offsetParent) scrollBy({ top: r.top - a.top, behavior: 'instant' }); }; fix(); requestAnimationFrame(function () { fix(); requestAnimationFrame(fix); }); }
        var nav = $('.nav-link.active'); if (nav && nav.offsetParent === null) { var h = $('.nav-link[data-section="hero"]'); if (h) h.classList.add('active'); }
    }
    function setTheme(name, animate) {
        if (!THEMES[name] || name === cur || busy) return;
        var a = anchor();
        if (!animate || reduce) { apply(name, a); return; }
        busy = true; fx.style.setProperty('--fx', THEMES[name].swatch[1]); fx.style.setProperty('--fx2', THEMES[name].swatch[2]);
        fx.className = 'in'; html.classList.add('theme-fading');
        setTimeout(function () { apply(name, a); fx.className = 'out'; }, 260);
        setTimeout(function () { fx.className = ''; html.classList.remove('theme-fading'); busy = false; }, 800);
    }
    renderSwitcher(); startBg();
    if (cur === 'coding' && window.__typeCode) {                                          // wait for the swarm intro (if any) before typing
        if (html.classList.contains('swarm-on')) { var mo = new MutationObserver(function () { if (!html.classList.contains('swarm-on')) { mo.disconnect(); window.__typeCode(); } }); mo.observe(html, { attributes: true, attributeFilter: ['class'] }); }
        else window.__typeCode();
    }

    /* ============ Interactive terminal (Coding theme) ============ */
    var out = document.getElementById('termOut'), inp = document.getElementById('termIn'), hist = [], hp = 0;
    if (out && inp) {
        var P = function () { return window.PORTFOLIO || { PROJECTS: [], TIMELINE: [], CONFIG: {} }; };
        var say = function (t, cls) { var d = document.createElement('div'); d.className = 'tl ' + (cls || ''); d.textContent = t; out.appendChild(d); out.scrollTop = out.scrollHeight; };
        var CMDS = {
            help: function () { say('Available commands:'); [['about', 'who I am'], ['skills', 'languages & tools'], ['projects', 'things I\'ve built'], ['journey', 'education & milestones'], ['contact', 'how to reach me'], ['theme <name>', 'default | gaming | music | coding'], ['clear', 'clear the screen']].forEach(function (r) { say('  ' + r[0].padEnd(16) + r[1], 'dim'); }); },
            about: function () { var p = $('#about p'); say('Akshat Sharma: B.Tech student in Computer Science & AI at Newton School of Technology (Rishihood University).'); if (p) say(p.textContent.trim(), 'dim'); },
            skills: function () { var n = [].map.call(document.querySelectorAll('.skill-name'), function (e) { return e.textContent.trim(); }); say(n.join('  ·  ')); },
            projects: function () { var ps = P().PROJECTS; if (!ps.length) return say('No projects listed yet.', 'dim'); ps.forEach(function (p, i) { say((i + 1) + '. ' + p.title + ' [' + p.category + ']'); say('   ' + p.description, 'dim'); if (p.demo) say('   demo: ' + p.demo, 'dim'); if (p.github) say('   code: ' + p.github, 'dim'); }); },
            journey: function () { P().TIMELINE.forEach(function (t) { say('• ' + t.title + (t.date ? ' (' + t.date + ')' : '')); if (t.subtitle) say('   ' + t.subtitle, 'dim'); }); },
            contact: function () { var l = document.querySelectorAll('.contact-link'); if (!l.length) return say('See the Contact section below.', 'dim'); [].forEach.call(l, function (e) { var a = e.getAttribute('href'), lb = ($('.contact-link-label', e) || {}).textContent, v = ($('.contact-link-value', e) || {}).textContent; say((lb || 'link').trim() + ': ' + (v || a || '').trim()); }); },
            theme: function (a) { if (THEMES[a]) { say('switching to ' + a + '...'); setTimeout(function () { setTheme(a, true); }, 300); } else say('usage: theme <default|gaming|music|coding>', 'dim'); },
            clear: function () { out.textContent = ''; }
        };
        say('Welcome. Type "help" to see what I can do.', 'dim');
        inp.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                var v = inp.value.trim(); inp.value = ''; if (!v) return; hist.push(v); hp = hist.length; say('$ ' + v, 'cmd');
                var p = v.split(/\s+/), c = p[0].toLowerCase();
                if (CMDS[c]) CMDS[c](p[1] && p[1].toLowerCase()); else say('command not found: ' + c + '. Try "help".', 'err');
            } else if (e.key === 'ArrowUp') { e.preventDefault(); if (hp > 0) inp.value = hist[--hp]; }
            else if (e.key === 'ArrowDown') { e.preventDefault(); inp.value = hp < hist.length - 1 ? hist[++hp] : (hp = hist.length, ''); }
        });
        document.getElementById('term').addEventListener('click', function () { inp.focus(); });
    }
})();
