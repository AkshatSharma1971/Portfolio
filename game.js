/* ============================================================
   game.js — NEON DODGE (Gaming theme). Lightweight canvas game, one rAF loop.
   Dodge falling blocks, grab cyan orbs (+50). Score = survival + dodged blocks + orbs. Level up every 400 pts.
   States: idle → run ⇄ paused → over → (Play again) run.   Best score saved in localStorage ("neonDodgeBest").
   ============================================================ */
(function () {
    'use strict';
    var cvs = document.getElementById('gameCanvas');
    if (!cvs) return;
    var $ = function (id) { return document.getElementById(id); };
    var html = document.documentElement, ctx = cvs.getContext('2d');
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var W = 360, H = 540, dpr = Math.min(window.devicePixelRatio || 1, 2);
    cvs.width = W * dpr; cvs.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var el = { score: $('gScore'), best: $('gBest'), level: $('gLevel'), overlay: $('gOverlay'), title: $('gTitle'), text: $('gText'), btn: $('gBtn'), pause: $('gPause') };
    var state = 'idle', score = 0, best = 0, level = 1, dodged = 0, t = 0, spawnT = 0, orbT = 3, raf = 0, last = 0, visible = false, shake = 0, gridY = 0;
    var P = { x: W / 2, w: 30, h: 34, vx: 0 }, obs = [], orbs = [], parts = [], trail = [];
    var keys = { l: false, r: false }, dragX = null, C = {};
    try { best = parseInt(localStorage.getItem('neonDodgeBest'), 10) || 0; } catch (e) {}
    var shown = {}; function hud() {
        var s = Math.floor(score); if (shown.s !== s) { shown.s = s; el.score.textContent = s; }
        if (shown.b !== best) { shown.b = best; el.best.textContent = best; } if (shown.l !== level) { shown.l = level; el.level.textContent = level; }
    }
    function colors() { var cs = getComputedStyle(html); var g = function (n, d) { return (cs.getPropertyValue(n) || '').trim() || d; }; C = { a: g('--accent', '#ff2d55'), b: g('--accent-alt', '#4d7cff'), p: g('--accent-purple', '#a855f7'), bg: g('--bg-void', '#07070a') }; }

    /* ---------- state changes ---------- */
    function overlay(title, text, btn, show) { el.title.textContent = title; el.text.innerHTML = text; el.btn.firstElementChild.textContent = btn; el.overlay.classList.toggle('show', show !== false); el.overlay.classList.toggle('over', state === 'over'); }
    function reset() { score = 0; level = 1; dodged = 0; t = 0; spawnT = 0.4; orbT = 3; obs.length = 0; orbs.length = 0; parts.length = 0; trail.length = 0; P.x = W / 2; P.vx = 0; shake = 0; dragX = null; shown = {}; }
    function start() { colors(); reset(); state = 'run'; el.overlay.classList.remove('show', 'over'); el.pause.disabled = false; el.pause.textContent = 'Pause'; hud(); loop(); }
    function pause() { if (state !== 'run') return; state = 'paused'; overlay('PAUSED', 'Your score is safe.', 'RESUME'); el.pause.textContent = 'Resume'; el.btn.focus({ preventScroll: true }); }
    function resume() { if (state !== 'paused') return; state = 'run'; el.overlay.classList.remove('show'); el.pause.textContent = 'Pause'; last = 0; loop(); }
    function die() {
        state = 'over'; var rec = Math.floor(score) > best; if (rec) { best = Math.floor(score); try { localStorage.setItem('neonDodgeBest', best); } catch (e) {} }
        var n = reduce ? 0 : 22; for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, v = 60 + Math.random() * 180; parts.push({ x: P.x, y: H - 60, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.7 + Math.random() * 0.4 }); }
        if (!reduce) shake = 0.35; el.pause.disabled = true; el.pause.textContent = 'Pause'; hud();
        overlay('GAME OVER', 'SCORE <b>' + Math.floor(score) + '</b> &nbsp;·&nbsp; BEST <b>' + best + '</b>' + (rec ? '<br><span class="rec">NEW RECORD!</span>' : ''), 'PLAY AGAIN');
        el.btn.focus({ preventScroll: true });
    }
    el.btn.addEventListener('click', function () { if (state === 'paused') resume(); else start(); });          // START / PLAY AGAIN / RESUME
    el.pause.addEventListener('click', function () { state === 'run' ? pause() : resume(); });

    /* ---------- input ---------- */
    var typing = function (e) { var t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); };
    function onKey(down) {
        return function (e) {
            if (!visible || html.getAttribute('data-theme') !== 'gaming' || html.classList.contains('swarm-on') || typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
            var c = e.code;
            if (c === 'ArrowLeft' || c === 'KeyA') { keys.l = down; e.preventDefault(); }
            else if (c === 'ArrowRight' || c === 'KeyD') { keys.r = down; e.preventDefault(); }
            else if (c === 'Space') { if (e.target.tagName === 'BUTTON') return; e.preventDefault(); if (down && !e.repeat) { if (state === 'idle' || state === 'over') start(); else if (state === 'paused') resume(); } }
            else if (down && !e.repeat && (c === 'KeyP' || c === 'Escape')) { state === 'run' ? pause() : resume(); }
        };
    }
    document.addEventListener('keydown', onKey(true)); document.addEventListener('keyup', onKey(false));
    function hold(id, k) { var b = $(id); var on = function (e) { e.preventDefault(); keys[k] = true; }, off = function () { keys[k] = false; }; b.addEventListener('pointerdown', on); ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, off); }); }
    hold('gLeft', 'l'); hold('gRight', 'r');
    var px = function (e) { var r = cvs.getBoundingClientRect(); return (e.clientX - r.left) / r.width * W; };
    cvs.addEventListener('pointerdown', function (e) { if (state === 'run') { dragX = px(e); cvs.setPointerCapture(e.pointerId); } });          // drag on the canvas to steer
    cvs.addEventListener('pointermove', function (e) { if (dragX !== null) dragX = px(e); });
    ['pointerup', 'pointercancel'].forEach(function (ev) { cvs.addEventListener(ev, function () { dragX = null; }); });
    addEventListener('blur', function () { keys.l = keys.r = false; pause(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });

    /* ---------- simulation ---------- */
    function update(dt) {
        t += dt; level = 1 + Math.floor(score / 400);
        var speed = Math.min(150 + level * 30, 520), every = Math.max(0.3, 0.85 - level * 0.055);
        var target = dragX !== null ? Math.max(-1, Math.min(1, (dragX - P.x) / 30)) : (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
        P.vx += (target * 360 - P.vx) * Math.min(1, dt * 14); P.x = Math.max(P.w / 2 + 4, Math.min(W - P.w / 2 - 4, P.x + P.vx * dt));
        score += dt * 10;
        if ((spawnT -= dt) <= 0) {
            spawnT = every * (0.7 + Math.random() * 0.6); var w = 28 + Math.random() * 56;
            obs.push({ x: Math.random() * (W - w), y: -30, w: w, h: 16 + Math.random() * 14, vy: speed * (0.85 + Math.random() * 0.4), sway: level >= 3 && Math.random() < 0.35 ? 30 + Math.random() * 30 : 0, ph: Math.random() * 6, x0: 0 });
            obs[obs.length - 1].x0 = obs[obs.length - 1].x;
        }
        if ((orbT -= dt) <= 0) { orbT = 5 + Math.random() * 3; orbs.push({ x: 20 + Math.random() * (W - 40), y: -20, vy: speed * 0.7 }); }
        var hx = P.x - P.w * 0.36, hw = P.w * 0.72, hy = H - 60 - P.h * 0.45, hh = P.h * 0.85, i, o;
        for (i = obs.length - 1; i >= 0; i--) {
            o = obs[i]; o.y += o.vy * dt; if (o.sway) o.x = Math.max(0, Math.min(W - o.w, o.x0 + Math.sin(t * 2 + o.ph) * o.sway));
            if (o.x < hx + hw && o.x + o.w > hx && o.y < hy + hh && o.y + o.h > hy) { die(); return; }
            if (o.y > H) { obs.splice(i, 1); dodged++; score += 10; }
        }
        for (i = orbs.length - 1; i >= 0; i--) {
            o = orbs[i]; o.y += o.vy * dt; var dx = o.x - P.x, dy = o.y - (H - 60);
            if (dx * dx + dy * dy < 24 * 24) { orbs.splice(i, 1); score += 50; for (var k = 0; k < (reduce ? 0 : 8); k++) parts.push({ x: o.x, y: o.y, vx: (Math.random() - 0.5) * 160, vy: (Math.random() - 0.5) * 160, life: 0.35, c: 1 }); }
            else if (o.y > H + 20) orbs.splice(i, 1);
        }
        if (!reduce) { trail.unshift(P.x); if (trail.length > 6) trail.pop(); }
        hud();
    }
    function draw() {
        var sx = shake > 0 ? (Math.random() - 0.5) * 8 * shake / 0.35 : 0;
        ctx.save(); ctx.translate(sx, 0); ctx.fillStyle = C.bg; ctx.fillRect(-10, 0, W + 20, H);
        ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1; ctx.beginPath();                      // scrolling grid
        for (var x = 0; x <= W; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (var y = gridY % 40; y <= H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
        var i, o;
        for (i = 0; i < obs.length; i++) { o = obs[i]; ctx.fillStyle = C.a; ctx.globalAlpha = 0.9; ctx.fillRect(o.x, o.y, o.w, o.h); ctx.globalAlpha = 1; ctx.strokeStyle = '#fff'; ctx.globalAlpha = 0.5; ctx.strokeRect(o.x + 0.5, o.y + 0.5, o.w - 1, o.h - 1); ctx.globalAlpha = 1; }
        ctx.fillStyle = '#22d3ee'; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 12;
        for (i = 0; i < orbs.length; i++) { ctx.beginPath(); ctx.arc(orbs[i].x, orbs[i].y, 8, 0, 6.283); ctx.fill(); }
        ctx.shadowBlur = 0;
        if (state === 'run' || state === 'paused') {
            for (i = trail.length - 1; i > 0; i--) { ctx.globalAlpha = 0.07 * (7 - i); ctx.fillStyle = C.b; ctx.fillRect(trail[i] - 4, H - 60 + i * 5, 8, 12); } ctx.globalAlpha = 1;
            ctx.fillStyle = C.b; ctx.shadowColor = C.b; ctx.shadowBlur = 14; ctx.beginPath();            // ship
            ctx.moveTo(P.x, H - 60 - P.h * 0.55); ctx.lineTo(P.x + P.w / 2, H - 60 + P.h * 0.45); ctx.lineTo(P.x, H - 60 + P.h * 0.22); ctx.lineTo(P.x - P.w / 2, H - 60 + P.h * 0.45); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
        }
        for (i = 0; i < parts.length; i++) { o = parts[i]; ctx.globalAlpha = Math.max(0, o.life * 1.6); ctx.fillStyle = o.c ? '#22d3ee' : C.a; ctx.fillRect(o.x - 2, o.y - 2, 4, 4); } ctx.globalAlpha = 1;
        ctx.restore();
    }
    function loop(ts) {
        if (raf && ts === undefined) return;                                // never run two loops at once
        raf = requestAnimationFrame(frame);
    }
    function frame(ts) {
        raf = 0; if (!visible && state === 'run') pause();
        var dt = last ? Math.min((ts - last) / 1000, 0.05) : 0; last = ts;
        if (state === 'run') { gridY += dt * (60 + level * 12); update(dt); }
        for (var i = parts.length - 1; i >= 0; i--) { var p = parts[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; if (p.life <= 0) parts.splice(i, 1); }
        if (shake > 0) shake -= dt;
        draw();
        if (state === 'run' || parts.length || shake > 0) raf = requestAnimationFrame(frame); else last = 0;        // loop sleeps when nothing is moving
    }
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (!visible && state === 'run') pause(); if (visible && state !== 'run') { colors(); draw(); } }, { threshold: 0.25 }).observe($('gameWrap'));
    colors(); hud(); draw();
    overlay('NEON DODGE', matchMedia('(hover: none)').matches ? 'Use the arrows below (or drag the ship). Tap START.' : 'Move with &larr; &rarr; or A / D. Space to start, P to pause.', 'START');
    window.NeonDodge = { state: function () { return state; }, score: function () { return Math.floor(score); }, best: function () { return best; }, level: function () { return level; },
        spawnOnPlayer: function () { obs.push({ x: P.x - 20, y: H - 80, w: 40, h: 20, vy: 100, sway: 0, ph: 0, x0: 0 }); }, playerX: function () { return P.x; }, obstacles: function () { return obs.length; } };
})();
