/* ============================================================
   piano.js — playable 2-octave piano (Music theme). Sound = Web Audio API synthesis, no samples.
   Mouse (hold / drag-glide) · touch (multi-finger) · computer keyboard · chord presets · volume · octave · mute.
   AudioContext is created lazily on the first user gesture and reused.
   ============================================================ */
(function () {
    'use strict';
    var root = document.getElementById('pianoKeys');
    if (!root) return;
    var html = document.documentElement;
    var $ = function (id) { return document.getElementById(id); };
    var NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    var BLACK = { 1: 1, 3: 1, 6: 1, 8: 1, 10: 1 };
    var KEYS = 25, BASE_DEFAULT = 48;                                   // C3 .. C5
    var base = BASE_DEFAULT, muted = false, level = 0.7;

    /* computer-keyboard layout (physical key positions, so it works on any layout): semitone offset from the lowest C */
    var KEYMAP = { KeyZ: 0, KeyS: 1, KeyX: 2, KeyD: 3, KeyC: 4, KeyV: 5, KeyG: 6, KeyB: 7, KeyH: 8, KeyN: 9, KeyJ: 10, KeyM: 11, Comma: 12,
        KeyQ: 12, Digit2: 13, KeyW: 14, Digit3: 15, KeyE: 16, KeyR: 17, Digit5: 18, KeyT: 19, Digit6: 20, KeyY: 21, Digit7: 22, KeyU: 23, KeyI: 24 };
    var LABEL = { 0: 'Z', 1: 'S', 2: 'X', 3: 'D', 4: 'C', 5: 'V', 6: 'G', 7: 'B', 8: 'H', 9: 'N', 10: 'J', 11: 'M', 12: 'Q', 13: '2', 14: 'W', 15: '3', 16: 'E', 17: 'R', 18: '5', 19: 'T', 20: '6', 21: 'Y', 22: '7', 23: 'U', 24: 'I' };
    var CHORDS = { C: [60, 64, 67], G: [55, 59, 62], Am: [57, 60, 64], F: [53, 57, 60] };   // absolute MIDI notes

    /* ---------- audio engine ---------- */
    var AC = null, master = null, comp = null, analyser = null, noise = null, voices = {}, order = [];
    var freq = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
    function ensure() {
        if (!AC) {
            var Ctor = window.AudioContext || window.webkitAudioContext; if (!Ctor) return null;
            AC = new Ctor();
            comp = AC.createDynamicsCompressor(); comp.threshold.value = -20; comp.knee.value = 14; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.25;   // prevents clipping with many notes
            master = AC.createGain(); master.gain.value = level * level;
            analyser = AC.createAnalyser(); analyser.fftSize = 8192;
            master.connect(comp); comp.connect(AC.destination); comp.connect(analyser);
            var n = Math.floor(AC.sampleRate * 0.06), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
            for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
            noise = b;                                                  // short decaying noise = hammer strike
        }
        if (AC.state === 'suspended') AC.resume();
        return AC;
    }
    function noteOn(m, vel) {
        if (muted || !ensure()) return;
        if (voices[m]) release(m, 0.04);
        while (order.length >= 28) release(order[0], 0.05);             // polyphony cap
        vel = vel || 0.85;
        var t = AC.currentTime, f = freq(m), out = AC.createGain(), lp = AC.createBiquadFilter(), mix = AC.createGain(), oscs = [];
        var peak = 0.3 * vel * (m < 60 ? 1 : 1 - (m - 60) * 0.008);    // upper notes a touch quieter
        var tau = Math.max(0.35, 1.7 - (m - 36) * 0.022);               // higher notes decay faster, like real strings
        out.gain.setValueAtTime(0.0001, t); out.gain.linearRampToValueAtTime(peak, t + 0.006);
        out.gain.setTargetAtTime(peak * 0.04, t + 0.012, tau);          // natural decay even while the key is held
        lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(f * 10, 12000), t); lp.frequency.setTargetAtTime(Math.max(f * 2.5, 700), t + 0.01, 0.35); lp.Q.value = 0.4;
        [[1, 1], [2, 0.5], [3, 0.27], [4, 0.17], [5, 0.09], [6, 0.05], [7, 0.025]].forEach(function (p) {
            var o = AC.createOscillator(), g = AC.createGain(), n = p[0];
            o.type = 'sine'; o.frequency.value = f * n * (1 + 0.00035 * n * n);   // slight string inharmonicity
            g.gain.value = p[1]; o.connect(g); g.connect(mix); o.start(t); oscs.push(o);
        });
        var o2 = AC.createOscillator(), g2 = AC.createGain(); o2.type = 'triangle'; o2.frequency.value = f; o2.detune.value = 4; g2.gain.value = 0.22; o2.connect(g2); g2.connect(mix); o2.start(t); oscs.push(o2);   // warmth / chorus
        var ns = AC.createBufferSource(), bp = AC.createBiquadFilter(), ng = AC.createGain(); ns.buffer = noise; bp.type = 'bandpass'; bp.frequency.value = Math.min(f * 3, 5000); bp.Q.value = 0.8; ng.gain.value = 0.16 * vel;
        ns.connect(bp); bp.connect(ng); ng.connect(out); ns.start(t);
        mix.gain.value = 0.55; mix.connect(lp); lp.connect(out); out.connect(master);
        voices[m] = { out: out, oscs: oscs }; order.push(m);
        mark(m, true);
    }
    function release(m, tc) {
        var v = voices[m]; if (!v) return;
        delete voices[m]; order.splice(order.indexOf(m), 1); mark(m, false);
        var t = AC.currentTime; tc = tc || 0.12;
        v.out.gain.cancelScheduledValues(t); v.out.gain.setValueAtTime(Math.max(v.out.gain.value, 0.0001), t); v.out.gain.setTargetAtTime(0, t, tc);
        var end = t + tc * 8 + 0.1;
        v.oscs.forEach(function (o) { try { o.stop(end); } catch (e) {} });
        v.oscs[0].onended = function () { try { v.out.disconnect(); } catch (e) {} };          // free the voice's nodes
    }
    function allOff() { order.slice().forEach(function (m) { release(m); }); heldKeys = {}; ptr = {}; }

    /* ---------- keyboard rendering ---------- */
    var row = document.createElement('div'); row.className = 'pk-row'; root.appendChild(row);
    var keyEls = [], whites = 0;
    for (var i = 0; i < KEYS; i++) if (!BLACK[i % 12]) whites++;
    var wIdx = 0;
    for (var s = 0; s < KEYS; s++) {
        var k = document.createElement('button'); k.type = 'button'; k.tabIndex = -1; var isB = !!BLACK[s % 12];
        k.className = 'pk ' + (isB ? 'pk-b' : 'pk-w'); k.dataset.semi = s;
        k.innerHTML = '<span class="pk-key">' + (LABEL[s] || '') + '</span>' + (isB ? '' : '<span class="pk-note"></span>');
        if (isB) { k.style.left = 'calc(' + (wIdx * 100 / whites) + '% - ' + (100 / whites * 0.3) + '%)'; k.style.width = (100 / whites * 0.6) + '%'; }
        else { k.style.width = (100 / whites) + '%'; wIdx++; }
        row.appendChild(k); keyEls.push(k);
    }
    function midiOf(semi) { return base + semi; }
    function labelNotes() {
        keyEls.forEach(function (k, s) { var n = k.querySelector('.pk-note'), m = midiOf(s); k.setAttribute('aria-label', NAMES[m % 12] + (Math.floor(m / 12) - 1) + (LABEL[s] ? ', computer key ' + LABEL[s] : '')); if (n && m % 12 === 0) n.textContent = 'C' + (Math.floor(m / 12) - 1); else if (n) n.textContent = ''; });
        $('pnOctLabel').textContent = 'C' + (Math.floor(base / 12) - 1) + '–C' + (Math.floor(base / 12) + 1);
    }
    function mark(m, on) { var e = keyEls[m - base]; if (e) e.classList.toggle('down', on); }
    labelNotes();

    /* ---------- pointer (mouse + touch) ---------- */
    var ptr = {};                                                       // pointerId -> midi
    function keyFrom(t) { return t && t.closest ? t.closest('.pk') : null; }
    root.addEventListener('pointerdown', function (e) {
        var k = keyFrom(e.target); if (!k || (e.pointerType === 'mouse' && e.button !== 0)) return;
        e.preventDefault(); var m = midiOf(+k.dataset.semi); ptr[e.pointerId] = m; noteOn(m);
    });
    root.addEventListener('pointerover', function (e) {                 // mouse glide while the button is held
        if (e.pointerType !== 'mouse' || !(e.buttons & 1) || ptr[e.pointerId] === undefined) return;
        var k = keyFrom(e.target); if (!k) return; var m = midiOf(+k.dataset.semi);
        if (m !== ptr[e.pointerId]) { release(ptr[e.pointerId]); ptr[e.pointerId] = m; noteOn(m); }
    });
    function up(e) { var m = ptr[e.pointerId]; if (m !== undefined) { delete ptr[e.pointerId]; release(m); } }
    document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
    root.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    /* ---------- computer keyboard ---------- */
    var heldKeys = {}, visible = false;
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (!visible) allOff(); }, { threshold: 0.15 }).observe($('pianoWrap'));
    var typing = function (t) { return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable) && t.type !== 'range'; };
    document.addEventListener('keydown', function (e) {
        if (!visible || html.getAttribute('data-theme') !== 'music' || html.classList.contains('swarm-on')) return;
        if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return;
        var s = KEYMAP[e.code]; if (s === undefined) return;
        e.preventDefault(); if (e.repeat || heldKeys[e.code] !== undefined) return;       // no re-trigger from key repeat
        var m = midiOf(s); heldKeys[e.code] = m; noteOn(m);
    });
    document.addEventListener('keyup', function (e) { var m = heldKeys[e.code]; if (m !== undefined) { delete heldKeys[e.code]; release(m); } });
    addEventListener('blur', allOff); document.addEventListener('visibilitychange', function () { if (document.hidden) allOff(); });

    /* ---------- controls ---------- */
    $('pnVol').addEventListener('input', function (e) { level = e.target.value / 100; if (master) master.gain.setTargetAtTime(level * level, AC.currentTime, 0.02); });
    $('pnSound').addEventListener('click', function (e) { muted = !muted; if (muted) allOff(); e.target.textContent = 'Sound: ' + (muted ? 'OFF' : 'ON'); e.target.setAttribute('aria-pressed', !muted); });
    function octave(d) { var nb = base + d * 12; if (nb < 24 || nb > 72) return; allOff(); base = nb; labelNotes(); }
    $('pnOctDown').addEventListener('click', function () { octave(-1); }); $('pnOctUp').addEventListener('click', function () { octave(1); });
    document.querySelectorAll('[data-chord]').forEach(function (b) {
        b.addEventListener('click', function () {
            if (muted) return; var notes = CHORDS[b.dataset.chord]; notes.forEach(function (m, i) { setTimeout(function () { noteOn(m, 0.75); }, i * 18); });
            setTimeout(function () { notes.forEach(function (m) { release(m, 0.3); }); }, 1700);
        });
    });

    /* test/diagnostic hook */
    window.Piano = {
        noteOn: noteOn, noteOff: release, active: function () { return order.slice(); }, state: function () { return AC ? AC.state : 'none'; },
        peakHz: function () { if (!analyser) return 0; var d = new Float32Array(analyser.frequencyBinCount); analyser.getFloatFrequencyData(d); var mi = 0; for (var i = 1; i < d.length; i++) if (d[i] > d[mi]) mi = i; return mi * AC.sampleRate / analyser.fftSize; },
        pitch: function () {                                           // autocorrelation pitch estimate of the live output (diagnostic)
            if (!analyser) return 0; var d = new Float32Array(analyser.fftSize), N = 4096, c = [], mx = 0, lag, i, sum;
            analyser.getFloatTimeDomainData(d);
            for (lag = 30; lag < 1500; lag++) { sum = 0; for (i = 0; i < N; i++) sum += d[i] * d[i + lag]; c[lag] = sum; if (sum > mx) mx = sum; }
            for (lag = 31; lag < 1499; lag++) if (c[lag] > 0.85 * mx && c[lag] >= c[lag - 1] && c[lag] >= c[lag + 1]) return AC.sampleRate / lag; return 0;
        },
        rms: function () { if (!analyser) return 0; var d = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(d); var s = 0; for (var i = 0; i < d.length; i++) s += d[i] * d[i]; return Math.sqrt(s / d.length); }
    };
})();
