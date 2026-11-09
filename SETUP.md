# Setup notes

## Music (full songs)
The Music card no longer uses the Spotify embed (it only plays 30-second previews for visitors who aren't logged in).
Edit the `TRACKS` list at the top of `player.js`:

    { type: 'youtube', id: 'VIDEO_ID', title: 'Song', artist: 'Artist' }       // official YouTube embed, full song
    { type: 'file', src: 'music/my-song.mp3', title: 'My Song', artist: 'Me' }  // your own audio file (you must own/license it)

- The YouTube ID is the part after `watch?v=` in the video URL. The default track uses the official "Closer" video ID
  (0zGcUoRlhmw) - open https://www.youtube.com/watch?v=0zGcUoRlhmw once to confirm it's the video you want.
- YouTube players do NOT work when you open index.html as a file (file://). Test on a web server (http://localhost) or your Vercel URL.
- Add 2+ tracks and the Previous/Next buttons become active.
- No API keys or secrets are needed for this setup.

## Files to deploy
index.html, style.css, script.js, features.css/js, swarm.css/js, themes.css/js, extras.css, player.js, piano.js, game.js,
plus the images (cloudark.jpg, cloudark-full.jpg, university.jpg, codm.jpg, valorant.jpg) and any /music files.
