/* ============================================================
   player.js — FULL-SONG music player (replaces the 30-second Spotify preview)
   Two supported sources, one set of controls:
     • type:'youtube' — official YouTube IFrame Player API (full track, no login needed).
     • type:'file'    — your own hosted audio file (HTML5 Audio). Only use audio you have rights to.
   Playing state, progress and duration are always READ from the real player; nothing is simulated.
   EDIT THE TRACK LIST BELOW. (Spotify stays as an "Open on Spotify" link: its embed only plays previews.)
   ============================================================ */
(function () {
    'use strict';
    var TRACKS = window.MUSIC_TRACKS || [
        { type: 'youtube', id: '0zGcUoRlhmw', title: 'Closer', artist: 'The Chainsmokers', spotify: 'https://open.spotify.com/track/7BKLCZ1jbUBVqRi2FVlTVw' }
        /* More examples (uncomment / edit):
        , { type: 'youtube', id: 'VIDEO_ID_FROM_A_YOUTUBE_URL', title: 'Song name', artist: 'Artist' }
        , { type: 'file', src: 'music/my-song.mp3', title: 'My Song', artist: 'Me', art: 'music/my-song.jpg' } */
    ];
    var $ = function (id) { return document.getElementById(id); };
    var card = $('musicCard'), embed = $('spotifyEmbed'), openBtn = $('mpOpen');
    if (!card || !embed || !TRACKS.length) return;
    var els = { toggle: $('mpToggle'), prev: $('mpPrev'), next: $('mpNext'), bar: $('mpBar'), fill: $('mpFill'), cur: $('mpCur'), dur: $('mpDur'), vol: $('mpVol'),
        note: $('mpNote'), src: $('mpSrc'), title: $('mpTitle'), artist: $('mpArtist'), art: $('mpArtBox'), stage: $('mpStage'), spotify: $('mpSpotify') };
    var ICO_PLAY = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
    var ICO_PAUSE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
    var fmt = function (s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

    var idx = 0, playing = false, curT = 0, durT = 0, vol = 70, ytP = null, ytReady = false, ytQueue = null, ytLoading = false, ytId = null, timer = 0, audio = null, hint = 0;
    try { var sv = parseInt(localStorage.getItem('mpVol'), 10); if (sv >= 0 && sv <= 100) vol = sv; } catch (e) {}
    els.vol.value = vol;
    var track = function () { return TRACKS[idx]; };

    /* ---------- mini player (floating) ---------- */
    var mini = document.createElement('div'); mini.className = 'mini';
    mini.innerHTML = '<button class="mini-orb" aria-label="Expand music player"><span class="viz" aria-hidden="true"><i></i><i></i><i></i><i></i></span></button>' +
        '<div class="mini-main"><div class="mini-meta"><strong></strong><span></span></div><button class="mp-btn mini-play" aria-label="Play"></button>' +
        '<button class="mini-x" data-act="min" aria-label="Minimize music player">&minus;</button><button class="mini-x" data-act="close" aria-label="Dismiss music player">&times;</button></div>';
    document.body.appendChild(mini);
    var miniPlay = mini.querySelector('.mini-play'), dismissed = false, minimized = false, cardVisible = false;

    /* ---------- UI ---------- */
    function setMeta() {
        var t = track();
        els.title.textContent = t.title; els.artist.textContent = t.artist;
        mini.querySelector('strong').textContent = t.title; mini.querySelector('.mini-meta span').textContent = t.artist;
        var art = t.art || (t.type === 'youtube' ? 'https://i.ytimg.com/vi/' + t.id + '/mqdefault.jpg' : null);
        if (art) { var im = new Image(); im.alt = ''; im.width = im.height = 56; im.onload = function () { els.art.replaceChildren(im); }; im.onerror = function () { els.art.innerHTML = '<span>♫</span>'; }; im.src = art; } else els.art.innerHTML = '<span>♫</span>';
        els.src.textContent = t.type === 'youtube' ? 'Full song · YouTube player' : 'Full song · hosted audio file';
        els.stage.hidden = t.type !== 'youtube';
        els.spotify.parentNode.hidden = !t.spotify; if (t.spotify) els.spotify.href = t.spotify;
    }
    function setProgress(c, d) {
        curT = c || 0; durT = d || 0; var p = durT > 0 ? Math.min(100, curT / durT * 100) : 0;
        els.fill.style.transform = 'scaleX(' + p / 100 + ')'; els.cur.textContent = fmt(curT); els.dur.textContent = durT ? fmt(durT) : '0:00';
        els.bar.setAttribute('aria-valuenow', Math.round(p)); els.bar.setAttribute('aria-valuetext', fmt(curT) + ' of ' + fmt(durT));
    }
    function note(t) { els.note.textContent = t; }
    function render() {
        card.classList.toggle('is-playing', playing); mini.classList.toggle('is-playing', playing);
        var l = playing ? 'Pause' : 'Play', i = playing ? ICO_PAUSE : ICO_PLAY;
        [els.toggle, miniPlay].forEach(function (b) { b.innerHTML = i; b.setAttribute('aria-label', l); });
        els.toggle.disabled = false; els.prev.disabled = false; els.next.disabled = idx >= TRACKS.length - 1;
        syncMini();
    }
    function syncMini() { mini.classList.toggle('show', embed.classList.contains('visible') && !dismissed && !cardVisible); mini.classList.toggle('min', minimized); }

    /* ---------- YouTube adapter ---------- */
    function loadYT(cb) {
        if (window.YT && YT.Player) return cb();
        if (ytLoading) { ytQueue = cb; return; }
        ytLoading = true; ytQueue = cb;
        window.onYouTubeIframeAPIReady = function () {
            var pv = { controls: 0, rel: 0, playsinline: 1, modestbranding: 1, iv_load_policy: 3, disablekb: 1 };
            if (/^https?:/.test(location.protocol)) pv.origin = location.origin;
            ytP = new YT.Player('ytHost', { host: 'https://www.youtube-nocookie.com', width: '100%', height: '100%', videoId: track().type === 'youtube' ? track().id : undefined, playerVars: pv,
                events: { onReady: function () { ytReady = true; ytId = track().type === 'youtube' ? track().id : null; ytP.setVolume(vol); var q = ytQueue; ytQueue = null; if (q) q(); render(); },
                    onStateChange: onYT, onError: onYTError } });
        };
        var s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.async = true;
        s.onerror = function () { ytLoading = false; note('Could not load the YouTube player (offline or blocked). Check your connection.'); };
        document.head.appendChild(s);
    }
    function ytReadyDo(cb) { if (ytP && ytReady) cb(); else loadYT(function () { if (ytP && ytReady) cb(); else ytQueue = cb; }); }
    function onYT(e) {
        var s = e.data;
        if (s === 1) { playing = true; clearTimeout(hint); note('Playing the full song.'); startPoll(); }
        else if (s === 2) { playing = false; stopPoll(); poll(); note('Paused.'); }
        else if (s === 0) { playing = false; stopPoll(); poll(); onEnded(); }
        else if (s === 3) { playing = false; note('Buffering…'); }
        render();
    }
    function onYTError(e) {
        playing = false; stopPoll(); render(); clearTimeout(hint);
        note('This video can’t play in an embedded player here (error ' + e.data + '). ' + (track().spotify ? 'Use “Open on Spotify” below, or add another source.' : 'Try another source.'));
    }
    function poll() { if (ytP && ytReady && track().type === 'youtube') setProgress(ytP.getCurrentTime(), ytP.getDuration()); }
    function startPoll() { if (!timer) timer = setInterval(poll, 500); poll(); }
    function stopPoll() { clearInterval(timer); timer = 0; }

    /* ---------- hosted-file adapter ---------- */
    function getAudio() {
        if (audio) return audio;
        audio = new Audio(); audio.preload = 'none'; audio.volume = vol / 100;
        audio.addEventListener('play', function () { playing = true; note('Playing the full song.'); render(); });
        audio.addEventListener('pause', function () { playing = false; note('Paused.'); render(); });
        audio.addEventListener('ended', function () { playing = false; render(); onEnded(); });
        audio.addEventListener('timeupdate', function () { setProgress(audio.currentTime, audio.duration); });
        audio.addEventListener('loadedmetadata', function () { setProgress(audio.currentTime, audio.duration); });
        audio.addEventListener('playing', function () { note('Playing the full song.'); });
        audio.addEventListener('waiting', function () { note('Buffering…'); });
        audio.addEventListener('error', function () { playing = false; note('Could not load “' + (track().src || 'audio file') + '”. Check the file path in player.js.'); render(); });
        return audio;
    }

    /* ---------- controls ---------- */
    function play() {
        var t = track();
        if (t.type === 'youtube') {
            if (audio) audio.pause();
            note('Loading the YouTube player…');
            ytReadyDo(function () {
                if (ytId !== t.id) { ytId = t.id; ytP.loadVideoById(t.id); } else ytP.playVideo();
                clearTimeout(hint); hint = setTimeout(function () { if (!playing) note('If nothing starts, tap the video once (some browsers require it).'); }, 2500);
            });
        } else { if (ytP && ytReady) ytP.pauseVideo(); var a = getAudio(); if (a.getAttribute('src') !== t.src) a.src = t.src; var p = a.play(); if (p && p.catch) p.catch(function (e) { if (e && e.name !== 'AbortError') note('Playback was blocked: ' + (e.message || e.name)); }); }
    }
    function pause() { if (track().type === 'youtube') { if (ytP && ytReady) ytP.pauseVideo(); } else if (audio) audio.pause(); }
    function seek(sec) { sec = Math.max(0, Math.min(sec, durT || sec)); if (track().type === 'youtube') { if (ytP && ytReady) { ytP.seekTo(sec, true); setProgress(sec, durT); } } else if (audio) { audio.currentTime = sec; } }
    function select(i, autoplay) {
        pause(); stopPoll(); idx = i; setProgress(0, 0); setMeta(); playing = false; render();
        if (track().type === 'youtube' && ytP && ytReady) { ytId = track().id; (autoplay ? ytP.loadVideoById : ytP.cueVideoById).call(ytP, track().id); }
        else if (track().type === 'file') { var a = getAudio(); a.src = track().src; }
        if (autoplay) play();
    }
    function onEnded() { if (idx < TRACKS.length - 1) select(idx + 1, true); else { setProgress(0, durT); note('Finished. Press play to listen again.'); } }
    var toggle = function () { playing ? pause() : play(); };
    els.toggle.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    miniPlay.addEventListener('click', toggle);
    els.prev.addEventListener('click', function (e) { e.stopPropagation(); if (curT > 3 || idx === 0) seek(0); else select(idx - 1, playing); });
    els.next.addEventListener('click', function (e) { e.stopPropagation(); if (idx < TRACKS.length - 1) select(idx + 1, playing); });
    els.vol.addEventListener('input', function () { vol = +els.vol.value; if (audio) audio.volume = vol / 100; if (ytP && ytReady) ytP.setVolume(vol); try { localStorage.setItem('mpVol', vol); } catch (e) {} });
    els.bar.addEventListener('click', function (e) { var r = els.bar.getBoundingClientRect(); if (durT) seek((e.clientX - r.left) / r.width * durT); });
    els.bar.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); seek(curT + 5); } else if (e.key === 'ArrowLeft') { e.preventDefault(); seek(curT - 5); } else if (e.key === 'Home') { e.preventDefault(); seek(0); } });
    mini.addEventListener('click', function (e) {
        var a = e.target.closest('[data-act]'), orb = e.target.closest('.mini-orb');
        if (a && a.dataset.act === 'min') minimized = true; if (a && a.dataset.act === 'close') dismissed = true; if (orb) minimized = false; syncMini();
    });

    /* ---------- open / close the panel ---------- */
    function setOpen(open) {
        embed.classList.toggle('visible', open); card.classList.toggle('playing', open);
        openBtn.setAttribute('aria-expanded', open); openBtn.textContent = open ? 'Close player' : 'Open player';
        if (open && track().type === 'youtube') ytReadyDo(function () {});          // preload only after the visitor opens the panel
        syncMini();
    }
    card.addEventListener('click', function (e) { if (e.target.closest('.music-player, .mp-open')) return; setOpen(!embed.classList.contains('visible')); });
    openBtn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(!embed.classList.contains('visible')); });
    new IntersectionObserver(function (en) { cardVisible = en[0].isIntersecting; syncMini(); }, { threshold: 0.3 }).observe(card);

    setMeta(); setProgress(0, 0); render();
    window.MusicPlayer = { state: function () { return { playing: playing, idx: idx, cur: curT, dur: durT, vol: vol, type: track().type }; } };
})();
