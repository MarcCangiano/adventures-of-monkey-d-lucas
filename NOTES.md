# The Adventures of Monkey D. Lucas — notes

Pirate AIM TRAINER (canvas/JS). Renamed + rebuilt 2026-08-13 on Boss's
overnight order; JS explicitly allowed now ("no restrictions").
The ORIGINAL pure-CSS rail shooter lives in css-version/ — untouched, its
own NOTES history is in git. Do not delete it; it is a portfolio piece.

## Game
- Flick training: cutthroats pop up in rowboats on a big perspective sea
  (horizon y=230, far foes draw smaller — f.sc). Each has a shrinking
  timer ring; ring closes -> he fires -> -1 heart. Click (radius 56*sc)
  to drop him.
- Boss per sea: tracked, not clicked. He weaves (dual-sine path, tt
  advanced by speedMul * (1 + track*0.9) — faster each sea AND faster as
  you pin him). Hold aim inside his ring to fill track; off-aim decays
  at 0.45/s. Quarter-fill ticks; volley timer costs a heart if you are
  slow. track=1 -> down.
- diff(i): kills 10+2i, spawn 1.45-0.085i, maxAlive 2+i/2, window
  3.2-0.15i, bossSpeed 1+0.33i, trackNeed 2.8+0.35i, bossR 66-2i,
  volley 6.5-0.35i.
- 3 hearts; gameover retries the same sea; win after 10 with TOT stats
  (kills, captains, accuracy). Boss-phase clicks don't count vs accuracy.

## Ten seas (LEVELS array: palette + prop + weather)
1 Sunrise Harbor (docks) / 2 The Azure Run (ships) / 3 Squall's Teeth
(rain + lightning flashes) / 4 The White Veil (fog) / 5 Parrot Cay
(island+palms) / 6 Ember Reef (volcano + embers) / 7 The Glass Sea
(icebergs + snow) / 8 Gallows Fleet (ghost ships + fog) / 9 The Devil's
Gullet (maelstrom + spray) / 10 The Last Meridian (gold isle + god rays).

## Sound
SFX synthesized (shot/hit/volley/tick/bossShow/bossDown/levelup/win/over).
MUSIC: 11 produced LOFI tracks via elevenlabs-music skill
(music/level01..10.mp3 + lobby.mp3, regen: music/gen_tracks.sh). Prompts
are original "nautical adventure lofi" — deliberately NO franchise names
(the API rejects copyrighted references and we stay clean). Lobby cues on
first gesture (armLobby), volume 0.12 everywhere.

## Art/perf notes
- Deck rail + foreshortened flintlock drawn AFTER deck (was hidden);
  gun anchored W/2,H-26, scale 1.5, rotates to aim, star muzzle flash.
- Gradients cached in GR; sky/sea cached per level (S.skyG/S.seaG);
  ctx {alpha:false,desynchronized:true}; weather particles reuse pools.
- Custom crosshair (cursor:none), gold + larger when locked on boss.

## Verify
scratchpad/pirate-verify.js via wp-e2e-kit NODE_PATH. Hooks:
window.__pirate {state, levels, music, aim(x,y), shoot(x,y), level(i),
start()}. Checks: spawn, click-kill, expiry damage, boss appear/track/
decay/death, levelup flow, all-10-seas screenshots.

## Status / pending
All checks pass 2026-08-13, committed. NOT pushed: Boss creates GitHub
repos for BOTH games tomorrow (this one + snapclaw). Suggested names:
adventures-of-monkey-d-lucas, shrimpys-ocean-odyssey (snapclaw origin
already preset). After push + Pages: add both thumbnails to
marccangiano.com linking OUT to the Pages URLs (site stays lightweight —
Boss's rule; shrimpy thumb already in WP media, id 93).
