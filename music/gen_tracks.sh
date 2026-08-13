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
"Epic swashbuckling orchestral pirate adventure, bright heroic strings over a driving 6/8 ostinato, bold horns, morning voyage setting out, rousing cinematic score"
"Fast driving orchestral pirate adventure in 6/8, relentless cello ostinato, soaring heroic string melody, full-sail momentum, daring and free, cinematic"
"Dark furious orchestral storm battle score, pounding low strings and timpani, brass stabs, driving 6/8 rhythm, waves crashing, dangerous and thrilling"
"Tense mysterious orchestral piece, quiet tremolo strings and sparse percussion slowly building, drifting through fog, suspenseful cinematic adventure"
"Playful jaunty orchestral pirate adventure, skipping 6/8 rhythm, light percussion, mischievous woodwind and string melody, tropical island escapade, fun and daring"
"Menacing epic orchestral score, low brass war theme, thundering drums, urgent string ostinato, sailing past a burning volcano, dark heroic power"
"Shimmering noble orchestral adventure, brisk glittering strings, proud french horn melody, icy seas sparkling, majestic and swift, cinematic"
"Eerie ghostly orchestral piece, low mournful strings, funeral-march percussion, haunted grandeur swelling to dark heroic passages, spectral fleet"
"Frantic epic orchestral battle score, relentless galloping ostinato, huge percussion hits, desperate soaring strings, fighting a whirlpool, climactic intensity"
"Triumphant epic orchestral pirate finale, soaring heroic theme over driving 6/8 strings, blazing brass, thundering drums, the treasure found, glorious victory"
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
