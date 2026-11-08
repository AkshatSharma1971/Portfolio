/* ============================================================
   swarm.js — "AI Swarm Build" intro.
   A VISUAL SIMULATION: six scripted cursors assemble a miniature
   of this portfolio. No real AI agents, no network calls.
   Deterministic timeline driven by one requestAnimationFrame loop.
   Edit AGENTS / STEPS below to change who does what, and when.
   ============================================================ */
(function () {
    'use strict';
    var root = document.getElementById('swarm');
    var replayBtn = document.getElementById('replayIntro');
    if (!root) return;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var html = document.documentElement;
    if (replayBtn) { if (reduce) replayBtn.hidden = true; else replayBtn.addEventListener('click', function () { if (!running) { scrollTo(0, 0); html.classList.add('swarm-on'); start(true); } }); }

    var AGENTS = [
        { n: 'UI Designer', c: '#8b5cf6', off: [-22, -12] }, { n: 'Frontend Developer', c: '#3b82f6', off: [22, -12] },
        { n: 'Animation Engineer', c: '#22d3ee', off: [-22, 16] }, { n: 'Content Agent', c: '#22c55e', off: [22, 16] },
        { n: 'Code Architect', c: '#f59e0b', off: [0, -26] }, { n: 'Quality Tester', c: '#ec4899', off: [0, 26] }
    ];
    AGENTS.forEach(function (a) { a.c0 = a.c; a.n0 = a.n; });
    var MOBILE_SET = [0, 1, 3, 5];                       // fewer cursors on small screens
    // [agent, block, startMs (after init), activity text, action]
    var STEPS = [
        [0, 'nav', 0, 'drawing navbar'], [0, 'hero', 700, 'laying out hero'], [3, 'name', 1000, 'writing headline'],
        [3, 'intro', 1400, 'adding intro'], [1, 'btns', 1500, 'placing buttons'], [2, 'glow', 1700, 'adding glow'],
        [1, 'skills', 1900, 'building skills'], [0, 'proj', 2000, 'placing cards'], [4, 'tl', 2200, 'wiring timeline'],
        [2, 'music', 2500, 'animating player'], [1, 'contact', 2900, 'linking contact'], [4, 'proj', 3000, 'adding components', 'tags'],
        [5, 'hero', 3000, 'verifying', 'check'], [5, 'skills', 3300, 'verifying', 'check'], [5, 'tl', 3600, 'verifying', 'check']
    ];
    var INIT = 1500, TRAVEL = 520, BUILD_END = INIT + 4150;

    var T = function () { return (window.ThemeSystem && window.ThemeSystem.swarm()) || {}; };
    var running = false, raf = 0, el = 0, last = 0, ev = [], ei = 0, cursors = [], mini, inerted = [], isReplay = false;

    function $(s) { return root.querySelector(s); }
    function mk(c, h) { var d = document.createElement('div'); d.className = c; if (h) d.innerHTML = h; return d; }

    function build(small) {
        var cfg = T(); AGENTS.forEach(function (a, i) { a.c = (cfg.colors && cfg.colors[i]) || a.c0 || a.c; a.n = (cfg.names && cfg.names[i]) || a.n0 || a.n; });
        var msgs = cfg.msgs || ['INITIALIZING AI SWARM...', 'ASSEMBLING INTERFACE...', 'CONNECTING COMPONENTS...', 'VERIFYING BUILD...'];
        var stat = cfg.status || [['SYSTEM STATUS', 'OPTIMAL'], ['AGENTS', null], ['COMPONENTS', 'VERIFIED'], ['BUILD STATUS', 'SUCCESS']];
        var tx = { intro: cfg.intro || 'Developer &middot; AI Enthusiast &middot; Creative Builder', b1: (cfg.btns || [])[0] || 'Explore My Projects', b2: (cfg.btns || [])[1] || 'Contact Me', tags: cfg.tags || ['Hero', 'Projects', 'Timeline'] };
        var set = small ? MOBILE_SET : [0, 1, 2, 3, 4, 5];
        root.innerHTML =
            '<div class="sw-grid"></div>' +
            '<div class="sw-ticker"><span id="swMsg">' + msgs[0] + '</span><div class="sw-prog"><span>' + (cfg.prog || 'BUILD') + '</span><div><i id="swProg"></i></div></div></div>' +
            '<div class="sw-scanlines"></div>' +
            '<button type="button" class="sw-skip" id="swSkip">Skip intro &rarr;</button>' +
            '<div class="sw-term"><h2>' + msgs[0] + '</h2>' + set.map(function (i) {
                return '<div class="sw-row" style="--c:' + AGENTS[i].c + '"><i></i><b>' + AGENTS[i].n + '</b><em>INITIALIZING</em></div>';
            }).join('') + '</div>' +
            '<div class="sw-mini" aria-hidden="true">' +
            '<div class="sw-b sw-nav" data-b="nav"><b>&lt;AS /&gt;</b><span><i>Home</i><i>About</i><i>Skills</i><i>Projects</i><i>Journey</i><i>Contact</i></span></div>' +
            '<div class="sw-b sw-hero" data-b="hero"></div><div class="sw-b sw-glow" data-b="glow"></div>' +
            '<div class="sw-b sw-name" data-b="name">AKSHAT<br><em>SHARMA</em></div>' +
            '<div class="sw-b sw-intro" data-b="intro">' + tx.intro + '</div>' +
            '<div class="sw-b sw-btns" data-b="btns"><span>' + tx.b1 + '</span><span>' + tx.b2 + '</span></div>' +
            '<div class="sw-b sw-skills" data-b="skills">Skills<div><span>HTML</span><span>CSS</span><span>JavaScript</span><span>Python</span><span>Java</span><span>C++</span></div></div>' +
            '<div class="sw-b sw-proj" data-b="proj"><img src="cloudark.jpg" alt="" width="1024" height="576"><small>Cloud Gaming</small><br>CloudArk</div>' +
            '<div class="sw-b sw-tl" data-b="tl">Journey<p>Newton School of Technology</p><p>Programming foundations</p><p>CloudArk</p><p>MLH Hacktoberfest</p></div>' +
            '<div class="sw-b sw-music" data-b="music"><i><s></s><s></s><s></s></i>Closer &middot; The Chainsmokers</div>' +
            '<div class="sw-b sw-contact" data-b="contact">Contact Me</div>' +
            '<span class="sw-tag" style="left:4%;top:11%">' + (cfg.fmt ? cfg.fmt(tx.tags[0]) : '&lt;' + tx.tags[0] + ' /&gt;') + '</span><span class="sw-tag" style="left:36%;top:44.5%">' + (cfg.fmt ? cfg.fmt(tx.tags[1]) : '&lt;' + tx.tags[1] + ' /&gt;') + '</span><span class="sw-tag" style="left:67%;top:44.5%">' + (cfg.fmt ? cfg.fmt(tx.tags[2]) : '&lt;' + tx.tags[2] + ' /&gt;') + '</span>' + (cfg.extra || '') +
            '<div class="sw-scan"></div></div>' +
            '<div class="sw-status" id="swStatus">' + stat.map(function (r) { return '<div>' + r[0] + ' <b>' + (r[1] || set.length + '/' + set.length + ' ACTIVE') + '</b></div>'; }).join('') + '</div>';
        root.msgs = msgs;
        mini = $('.sw-mini');
        cursors = [];
        var W = innerWidth, H = innerHeight, sx = [.05, .95, .1, .9, .5, .5], sy = [.1, .1, .9, .9, -.06, 1.06];
        set.forEach(function (i) {
            var a = AGENTS[i], node = mk('sw-cur', '<svg width="18" height="22" viewBox="0 0 18 22" aria-hidden="true"><path d="M1 1v17l4.6-4.2 3.2 7.2 3-1.4-3.1-6.9H16z" fill="' + a.c + '" stroke="#fff" stroke-width="1"/></svg><div class="sw-lab"><span>' + a.n + '</span><small>idle</small></div>');
            node.style.setProperty('--c', a.c); root.appendChild(node);
            var c = { i: i, a: a, node: node, say: node.querySelector('small'), x: W * sx[i], y: H * sy[i], tb: null, tx: 0, ty: 0, ph: i * 1.3, hist: [], dots: [] };
            if (!small) for (var k = 0; k < 4; k++) { var d = mk('sw-dot'); d.style.setProperty('--c', a.c); d.style.opacity = (0.28 - k * 0.05); root.appendChild(d); c.dots.push(d); }
            cursors.push(c);
        });
        return set;
    }
    function cur(i) { for (var k = 0; k < cursors.length; k++) if (cursors[k].i === i) return cursors[k]; return null; }
    function blk(n) { return $('[data-b="' + n + '"]'); }
    function at(t, f) { ev.push({ t: t, f: f }); }

    function schedule(set, small) {
        var rows = root.querySelectorAll('.sw-row');
        rows.forEach(function (r, k) {
            at(300 + k * 150, function () { r.classList.add('in'); });
            at(560 + k * 150, function () { var e = r.querySelector('em'); e.textContent = 'ACTIVE'; r.classList.add('act'); });
        });
        at(1250, function () { mini.classList.add('show'); });
        [1, 2, 3].forEach(function (k) { at(INIT + k * 1250, function () { var m = $('#swMsg'); if (m) m.textContent = root.msgs[k]; }); });
        at(200, function () { $('.sw-ticker').classList.add('in'); });
        at(INIT, function () { $('.sw-term').classList.add('off'); cursors.forEach(function (c) { c.node.classList.add('on'); });
            var q = cur(5); if (q) { q.tx = innerWidth * 0.27; q.ty = innerHeight * 0.8; q.say.textContent = 'watching'; } });
        STEPS.forEach(function (s) {
            var t0 = INIT + s[2], c = cur(s[0]), b = blk(s[1]), act = s[4];
            at(t0, function () { if (c) { c.tb = b; c.say.textContent = s[3]; } });
            at(t0 + TRAVEL, function () {
                if (act === 'tags') root.querySelectorAll('.sw-tag').forEach(function (t, k) { setTimeout(function () { t.classList.add('in'); }, k * 140); });
                else if (act === 'check') b.classList.add('ok');
                else b.classList.add('built');
                b.style.setProperty('--hc', AGENTS[s[0]].c); b.classList.add('flash');
                setTimeout(function () { b.classList.remove('flash'); }, 700);
                if (c) { ripple(c); c.say.textContent = act === 'check' ? 'verified ✓' : 'done ✓'; }
            });
        });
        var V = BUILD_END;
        at(V, function () {                                          // Scene 4: converge, scan, status
            var n = cursors.length;
            var rx = Math.min(340, innerWidth * (small ? 0.26 : 0.4)), ry = small ? 210 : 175;     // ring sits outside the status panel so its text stays readable
            cursors.forEach(function (c, k) { var ang = (k / n) * 6.283 - 1.57 + 0.4; c.tb = null; c.tx = innerWidth / 2 + Math.cos(ang) * rx - (small ? 75 : 60); c.ty = innerHeight / 2 + Math.sin(ang) * ry; c.say.textContent = 'standing by'; });
        });
        at(V + 400, function () { $('.sw-scan').classList.add('run'); });
        at(V + 700, function () { $('#swStatus').classList.add('show'); root.querySelectorAll('#swStatus div').forEach(function (d, k) { setTimeout(function () { d.classList.add('in'); }, k * 140); }); });
        at(V + 1600, function () {                                    // Scene 5: reveal
            mini.classList.add('reveal'); root.classList.add('fade'); html.classList.remove('swarm-on');
            cursors.forEach(function (c) { c.node.classList.add('out'); c.dots.forEach(function (d) { d.style.opacity = 0; }); });
            if (isReplay) restartChars();
        });
        at(V + 2500, function () { finish(); });
    }
    function ripple(c) { var r = mk('sw-click'); r.style.setProperty('--c', c.a.c); r.style.left = c.x + 'px'; r.style.top = c.y + 'px'; r.addEventListener('animationend', function () { r.remove(); }); root.appendChild(r); }
    function restartChars() { document.querySelectorAll('.hero-title .char').forEach(function (c) { c.style.animation = 'none'; void c.offsetWidth; c.style.animation = ''; }); }

    function frame(ts) {
        if (!running) return;
        try {
            var dt = Math.min(ts - last, 120); last = ts; el += dt;
            while (ei < ev.length && ev[ei].t <= el) ev[ei++].f();
            var f = 1 - Math.exp(-dt * 0.0065), n = cursors.length, k, j, c, d;
            for (k = 0; k < n; k++) {
                c = cursors[k];
                if (c.tb) { var r = c.tb.getBoundingClientRect(); c.tx = r.left + r.width / 2 + c.a.off[0]; c.ty = r.top + r.height / 2 + c.a.off[1]; }
                var wx = Math.sin(el / 520 + c.ph) * 4, wy = Math.cos(el / 430 + c.ph) * 3;
                c.x += (c.tx + wx - c.x) * f; c.y += (c.ty + wy - c.y) * f;
            }
            for (k = 0; k < n; k++) for (j = k + 1; j < n; j++) {         // gentle repulsion: avoid overlapping cursors
                var dx = cursors[j].x - cursors[k].x, dy = cursors[j].y - cursors[k].y, dist = Math.sqrt(dx * dx + dy * dy) || 1;
                if (dist < 44) { var p = (44 - dist) * 0.06, ux = dx / dist * p, uy = dy / dist * p; cursors[k].x -= ux; cursors[k].y -= uy; cursors[j].x += ux; cursors[j].y += uy; }
            }
            for (k = 0; k < n; k++) {
                c = cursors[k]; c.node.style.transform = 'translate3d(' + c.x.toFixed(1) + 'px,' + c.y.toFixed(1) + 'px,0)';
                if (c.dots.length) { c.hist.unshift(c.x, c.y); if (c.hist.length > 40) c.hist.length = 40;
                    for (d = 0; d < c.dots.length; d++) { var h = (d + 1) * 6; if (c.hist.length > h + 1) c.dots[d].style.transform = 'translate3d(' + c.hist[h].toFixed(1) + 'px,' + c.hist[h + 1].toFixed(1) + 'px,0)'; } }
            }
            var pg = $('#swProg'); if (pg) pg.style.transform = 'scaleX(' + Math.min(1, el / (BUILD_END + 1500)) + ')';
            raf = requestAnimationFrame(frame);
        } catch (e) { finish(); }                                     // never leave the visitor stuck behind the intro
    }

    function onKey(e) { if (e.key === 'Escape') finish(); }
    function start(replay) {
        try {
            running = true; isReplay = !!replay; el = 0; ei = 0; ev = [];
            var small = matchMedia('(max-width: 700px)').matches;
            root.hidden = false; root.classList.remove('fade');
            var set = build(small);
            schedule(set, small);
            ev.sort(function (a, b) { return a.t - b.t; });
            document.body.style.overflow = 'hidden';
            Array.prototype.forEach.call(document.body.children, function (n) { if (n !== root && !/^(SCRIPT|LINK|STYLE)$/.test(n.tagName) && !n.inert) { n.inert = true; inerted.push(n); } });
            $('#swSkip').addEventListener('click', finish); $('#swSkip').focus();
            document.addEventListener('keydown', onKey);
            last = performance.now(); raf = requestAnimationFrame(frame);
        } catch (e) { finish(); }
    }
    function finish() {
        if (!running && root.hidden) return;
        running = false; cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey);
        html.classList.remove('swarm-on'); document.body.style.overflow = '';
        inerted.forEach(function (n) { n.inert = false; }); inerted = [];
        root.hidden = true; root.innerHTML = ''; cursors = [];
        try { sessionStorage.setItem('swarmSeen', '1'); } catch (e) {}
        if (isReplay && replayBtn) replayBtn.focus();
    }

    if (html.classList.contains('swarm-on')) start(false); else { root.hidden = true; }
})();
