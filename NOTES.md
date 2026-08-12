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
- NINE enemies (2026-08-12 expansion): dock e1 barrel / e2 crate stack /
  e3 second barrel; deck e4 mast / e5 crate / e6 hatch (climbs out) /
  e7 cabin door; cabin e8 chest / e9 desk boss. Pop-out via `pop-attack`
  keyframes with per-enemy --pop-x/--pop-y/--z/--hide vars. Durations:
  7/9.5/12s dock, 6.5/8.5/10.5/13s deck, 7.5/10s cabin. Attack at 96%.
  Pop lanes are tuned so no two popped enemies overlap click centers —
  check screenshots after moving anyone.
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

## 2026-08-12 session, round 2 (art v3)
- Gun grip kink fixed: .wrist ellipse smooths the stock-to-grip bend; whole
  .gun gets a silhouette outline via 4-way drop-shadow filter (outlines the
  UNION, hides seams between overlapping parts — reuse this trick).
- Pirates v3: 3px outlines, brows/nose/toothy grin, bandana knots, boot
  cuffs, belt buckles, ground shadows (.enemy::after). Boss: epaulettes,
  double button row, angry brows, mustache+beard, skull-and-bones hat.
- Ambience: animated waterline glints (.waves) + drifting clouds (.clouds)
  at the dock — both animate background-position only, NEVER transform
  (transform keyframes would fight the translateZ plane placement).
- Deck: rigging shrouds, brass porthole rims, "The Gilded Gull" plaque
  (.sign) — plaque must sit at top -302px; higher projects behind the HUD.
- Cabin: lantern glow, coins by the chest, red X on the map.
- Title: sunset gradient, ship silhouette, proper skull+crossbones flag.
- Go screens: big skull glyph via .go::before.

## 2026-08-12 session
- Boss feedback: gun didn't read as a gun; wanted many more villains.
- Rebuilt pistol as proper flintlock (barrel/hammer/grip/trigger guard/
  muzzle flash divs inside .gun, one rotation on the container).
- Expanded 4 -> 9 enemies + new cover (crate stack, 2nd barrel, hatch).
- Score now /9; advance + win chains extended; 9 game-over overlays.

## Possible next steps (all optional, none started)
1. A below-deck 4th combat stop.
2. Water/cloud motion in the dock backdrop.
3. Difficulty: shorten timers, or a hard mode via a :target variant.
4. Sound is impossible without JS — do not chase it.

## Gotchas learned
- Pseudo-element art paints over the label -> label needs z-index.
- Enemies must step OUT from cover (--pop-x), not rise behind it; cover
  planes are closer on z and swallow clicks.
- visibility animates "visible during interpolation" — keep both keyframe
  endpoints hidden until the final frame or the overlay blocks input.
