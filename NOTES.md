# Skullwind Cove — pure HTML+CSS rail shooter

## Current state (2026-08-11)
Full game loop WORKS end to end AND art pass is done, both verified with
Playwright + eyeballed screenshots. Playable and presentable.

Art pass shipped: gradient-art pirates (bandana/eyepatch/cutlass, green and
blue crew variants, captain with hat/coat/beard), dock harbor with anchored
ship + bollards, deck wall with door + portholes, cabin with stern window,
wall map, rug + treasure chest, corner pistol with recoil + muzzle flash on
:active, vignette, waving title flag, bobbing advance buttons.

- Files: index.html + style.css only. No JS anywhere (constraint is the point).
- Theme: original pirates. Ship "Gilded Gull", villain "Snagglebeard", level
  "Skullwind Cove". No franchise references.

## Engine (all working)
- Camera rail: radio inputs #wp-title/#wp-dock/#wp-deck/#wp-cabin drive
  .scene translateZ (areas sit at z -600/-1800/-3000, camera transitions 1.6s).
- Enemies e1 (dock/barrel), e2 (deck/mast), e3 (deck/crate), e4 (cabin/desk,
  boss). Pop-out via `pop-attack` keyframes with per-enemy --pop-x/--pop-y/--z
  vars; durations 7 / 6.5 / 9.5 / 8s. Attack lunge at 96%.
- Shooting: label.shoot (z-index 5 — MUST stay above ::before/::after art or
  clicks hit the pseudo-elements and die) toggles hidden #kill-eN checkbox.
- Lose: per-enemy .go-eN overlay armed by `doom` animation matching the enemy
  duration; canceled by #kill-eN:checked ~ (animation: none). Keyframes hold
  `visibility: hidden` 0-99.9% so the overlay can't eat clicks early.
- Score: #kill-eN:checked counter-increment; inputs stay renderable (1px,
  opacity 0, NOT display:none) or counters break.
- Advance gating: .adv-deck / .adv-cabin labels shown by chained
  #wp-X:checked ~ #kill-Y:checked selectors.
- Win: 4-way :checked chain shows .win. Restart: button type=reset.

## Verified (all green)
Script: scratchpad verify.js (session temp — recreate if gone; run with
`cd ~/Documents/wp-e2e-kit && NODE_PATH=$PWD/node_modules node verify.js`).
Checks: kill registers x4, advance gating, win screen, game over fires when
e1 ignored, no game over after timely kill, reset from win AND game over.
Screenshots of title/dock/deck/cabin/win/gameover all eyeballed.

## Possible next steps (all optional, none started)
1. More enemies per stop + varied timing for difficulty.
2. A below-deck 4th combat stop.
3. Water/cloud motion in the dock backdrop.
4. Sound is impossible without JS — do not chase it.

## Gotchas learned
- Pseudo-element art paints over the label -> label needs z-index.
- Enemies must step OUT from cover (--pop-x), not rise behind it; cover
  planes are closer on z and swallow clicks.
- visibility animates "visible during interpolation" — keep both keyframe
  endpoints hidden until the final frame or the overlay blocks input.
