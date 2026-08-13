#!/bin/zsh
# Lofi pirate instrumentals for The Adventures of Monkey D. Lucas.
# Original compositions in an adventure-anime-adjacent lofi style — no
# existing themes referenced. Re-runnable: skips files that exist.
set -u
SKILL=~/rover/skills/elevenlabs-music/scripts/generate_music.py
export ELEVENLABS_API_KEY=$(grep '^ELEVENLABS_API_KEY_2=' ~/.openclaw/master.env | cut -d= -f2-)
cd "$(dirname "$0")"

typeset -a P
P=(
"Jaunty instrumental sea shanty, accordion and fiddle over a stomping work-song beat, bright morning sails leaving harbor, adventurous and rousing"
"Rolling instrumental sea shanty, concertina lead with tin whistle answers, steady heave-away halyard rhythm, wide open blue water"
"Storm-driven instrumental sea shanty in a minor key, urgent fiddle, pounding stomp-and-clap rhythm, waves crashing over the rail"
"Slow eerie instrumental sea shanty waltz, lone concertina over a low drone, ship timbers creaking in dead fog, haunting and sparse"
"Playful tropical instrumental sea shanty, fiddle and mandolin with hand drums, island port celebration, sun-drunk and lively"
"Dark driving instrumental sea shanty, deep war-drum stomps, menacing minor fiddle riffs, sailing past a burning volcano"
"Crisp bright instrumental sea shanty, tin whistle and mandolin, glittering icy waters, brisk clean gliding rhythm"
"Ghostly instrumental sea shanty, detuned accordion and low bowed strings, a funeral-march sway through a fleet of dead ships, spectral"
"Frantic instrumental sea shanty, racing fiddle reels, relentless accelerating drums, rowing hard against a giant whirlpool"
"Triumphant epic instrumental sea shanty finale, full folk band — accordion, fiddle, whistle, big drums — the last voyage to the treasure, victorious"
)

if [[ ! -s lobby.mp3 ]]; then
  uv run $SKILL "Warm gentle instrumental sea shanty, soft concertina and acoustic guitar, quiet swaying tavern-by-the-harbor rhythm at dusk, inviting and nostalgic, calm before the voyage" --length 90 --instrumental -o lobby.mp3 || echo "FAILED lobby"
else echo "skip lobby.mp3"; fi
for i in {1..10}; do
  n=$(printf "%02d" $i)
  out="level$n.mp3"
  if [[ -s $out ]]; then echo "skip $out"; continue; fi
  echo "=== level $n ==="
  uv run $SKILL "${P[$i]}" --length 90 --instrumental -o "$out" || echo "FAILED $n"
done
ls -la *.mp3 2>/dev/null
echo DONE
