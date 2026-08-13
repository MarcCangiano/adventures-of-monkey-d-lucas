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
"Bright warm lofi hip hop, lazy ukulele and melodica over a relaxed dusty beat, sunny harbor morning, seagulls-and-rope-creak seaside feeling, nostalgic and adventurous"
"Breezy lofi hip hop with acoustic guitar and soft accordion, open blue ocean sailing, easy swaying groove, hopeful and free"
"Moody lofi beat with low piano chords and tape hiss, rolling thunderstorm at sea, heavy swaying rhythm, determined push through rain"
"Sparse eerie lofi, muted trumpet and soft vibraphone over a slow beat, drifting through thick sea fog, mysterious calm"
"Upbeat tropical lofi with hand percussion, marimba and flute, jungle island cove, playful adventurous energy"
"Mellow night-sailing lofi jazz, warm electric piano and soft double bass, moonlit deck, starry calm confidence"
"Chilly lofi with glassy chimes and soft pads over a crisp beat, sailing an icy sea between glaciers, crystalline and serene"
"Dark haunted lofi, detuned music box and deep sub bass, a graveyard of ghost ships, spooky but groovy"
"Intense driving lofi with urgent strings and hard-swung drums, sailing into a giant whirlpool, rising danger and adrenaline"
"Triumphant adventurous lofi finale, soaring melodica lead, ukulele, big warm chords and confident beat, the last sea before the treasure, victorious spirit"
)

if [[ ! -s lobby.mp3 ]]; then
  uv run $SKILL "Cozy nostalgic lofi hip hop overture, gentle ukulele, accordion and soft flute melody, a pirate crew resting in port at sunset, warm tape crackle, inviting main menu calm with a spirit of grand adventure" --length 90 --instrumental -o lobby.mp3 || echo "FAILED lobby"
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
