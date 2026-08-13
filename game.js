/* The Adventures of Monkey D. Lucas — a pirate aim trainer.
   Cutthroats pop up across ten seas: click them before their timer ring
   closes and they fire. Each sea ends with a captain who must be TRACKED —
   keep the crosshair on him while he runs; he only gets faster. */

(() => {
  'use strict';

  const cv = document.getElementById('game');
  const cx = cv.getContext('2d', { alpha: false, desynchronized: true });
  const W = cv.width, H = cv.height;
  const GR = {};              // cached gradients

  // ------------------------------------------------------------- levels
  const LEVELS = [
    { name: 'Sunrise Harbor', skyTop: '#ffb36b', skyMid: '#ff7e5f', horizon: '#d95d63',
      sea: '#274a63', seaHi: '#3a6b8a', prop: 'docks', part: null,
      sun: { x: 980, y: 208, r: 54, c: '#ffe9b0' } },
    { name: 'The Azure Run', skyTop: '#7fc4e8', skyMid: '#4a9fd8', horizon: '#2f7bb5',
      sea: '#1d5e8a', seaHi: '#2f7fb5', prop: 'ships', part: null,
      sun: { x: 220, y: 120, r: 48, c: '#fff6d8' } },
    { name: "Squall's Teeth", skyTop: '#3a4453', skyMid: '#2a3140', horizon: '#1d2430',
      sea: '#16222e', seaHi: '#203243', prop: 'ships', part: 'rain', sun: null },
    { name: 'The White Veil', skyTop: '#cfd8dc', skyMid: '#aebfc7', horizon: '#93a7b0',
      sea: '#6d8894', seaHi: '#7f9aa6', prop: null, part: 'fog', sun: null },
    { name: 'Parrot Cay', skyTop: '#9fdce8', skyMid: '#66c2b0', horizon: '#3fa08a',
      sea: '#1f6e5e', seaHi: '#2f8f7a', prop: 'island', part: null,
      sun: { x: 1040, y: 110, r: 44, c: '#fffbe0' } },
    { name: 'Ember Reef', skyTop: '#3d1b28', skyMid: '#57202a', horizon: '#7a2a24',
      sea: '#2a1420', seaHi: '#3d1f2b', prop: 'volcano', part: 'embers', sun: null },
    { name: 'The Glass Sea', skyTop: '#cfeaf5', skyMid: '#9fd0e8', horizon: '#6fb0d5',
      sea: '#4a8ab0', seaHi: '#5f9fc5', prop: 'ice', part: 'snow',
      sun: { x: 640, y: 90, r: 36, c: '#ffffff' } },
    { name: 'Gallows Fleet', skyTop: '#14201c', skyMid: '#0e1815', horizon: '#0a110e',
      sea: '#0c1613', seaHi: '#132019', prop: 'ghosts', part: 'fog',
      sun: { x: 300, y: 110, r: 40, c: '#b8ffd9' } },
    { name: "The Devil's Gullet", skyTop: '#1d3340', skyMid: '#152836', horizon: '#0e1d28',
      sea: '#0e2430', seaHi: '#16323f', prop: 'maelstrom', part: 'spray', sun: null },
    { name: 'The Last Meridian', skyTop: '#ffd98c', skyMid: '#ffb45f', horizon: '#e88a4a',
      sea: '#35496b', seaHi: '#4a5f85', prop: 'gold', part: null,
      sun: { x: 640, y: 196, r: 66, c: '#fff2c0' } },
  ];
  function diff(i) {
    return {
      phaseTime: 60,               // the pop-up gauntlet: one minute
      bossTime: 60,                // then a full minute tracking the captain
      killWindow: 2.4 - i * 0.09,
      bossSpeed: (1.5 + i * 0.42) * 1.25,  // path-speed multiplier, +25%
      trackNeed: 2.8 + i * 0.35,
      bossR: 54 - i * 1.6,
      volleyEvery: 6.5 - i * 0.35,
    };
  }

  // ------------------------------------------------------------- sound
  let AC = null;
  function ac() {
    if (!AC) {
      try { AC = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { AC = null; }
    }
    if (AC && AC.state === 'suspended') AC.resume();
    return AC;
  }
  function tone(freq, dur, type, vol, slideTo, delay) {
    const a = ac(); if (!a) return;
    const t0 = a.currentTime + (delay || 0);
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol || 0.12, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function hiss(dur, vol, freq) {
    const a = ac(); if (!a) return;
    const n = (a.sampleRate * dur) | 0;
    const buf = a.createBuffer(1, n, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = a.createBufferSource(); src.buffer = buf;
    const flt = a.createBiquadFilter();
    flt.type = 'bandpass'; flt.frequency.value = freq || 2000; flt.Q.value = 0.8;
    const g = a.createGain(); g.gain.value = vol || 0.2;
    src.connect(flt); flt.connect(g); g.connect(a.destination);
    src.start();
  }
  const SFX = {
    shot: () => { hiss(0.07, 0.28, 2600); tone(150, 0.1, 'square', 0.11, 55); },
    hit: () => { tone(320, 0.09, 'square', 0.1, 130); hiss(0.05, 0.2, 1700); },
    volley: () => { tone(95, 0.28, 'sawtooth', 0.17, 48); hiss(0.14, 0.26, 850); },
    tick: (q) => tone(660 + q * 160, 0.08, 'triangle', 0.09),
    bossShow: () => { tone(196, 0.35, 'sawtooth', 0.09, 165); tone(147, 0.45, 'sawtooth', 0.08, 110, 0.3); },
    bossDown: () => { hiss(0.3, 0.3, 1100); tone(520, 0.5, 'triangle', 0.14, 130); tone(880, 0.7, 'sine', 0.1, null, 0.15); },
    levelup: () => [392, 494, 587, 784].forEach((f, i) => tone(f, 0.16, 'triangle', 0.1, null, i * 0.09)),
    win: () => [392, 494, 587, 659, 784, 988].forEach((f, i) => tone(f, 0.22, 'triangle', 0.1, null, i * 0.11)),
    over: () => tone(300, 0.8, 'sawtooth', 0.1, 78),
  };

  // music: produced lofi tracks per sea + lobby overture
  let musicEl = null;
  function stopMusic() { if (musicEl) { musicEl.pause(); musicEl = null; } }
  function playTrack(src) {
    stopMusic();
    const el = new Audio(src);
    el.loop = true;
    el.volume = 0.12;
    const pr = el.play();
    // browsers may refuse audio before the first gesture — clear the slot
    // so armLobby can retry on the first click/key
    if (pr && pr.catch) pr.catch(() => { if (musicEl === el) musicEl = null; });
    musicEl = el;
  }
  const startLobby = () => playTrack('music/lobby.mp3');
  // boss laugh: plays only if music/boss-laugh.mp3 exists (licensed asset
  // Boss downloads separately — see NOTES)
  let laughEl = null, laughOk = true;
  function playLaugh() {
    if (!laughOk) return;
    if (!laughEl) {
      laughEl = new Audio('music/boss-laugh.mp3');
      laughEl.volume = 0.5;
      laughEl.onerror = () => { laughOk = false; };
    }
    laughEl.currentTime = 0;
    const pr = laughEl.play();
    if (pr && pr.catch) pr.catch(() => {});
  }
  const startMusic = (li) => playTrack('music/level' + String(li + 1).padStart(2, '0') + '.mp3');

  // ------------------------------------------------------------- state
  let S;
  const TOT = { hits: 0, shots: 0, kills: 0, bosses: 0 };
  function reset(levelIdx) {
    if (levelIdx === 0) { TOT.hits = 0; TOT.shots = 0; TOT.kills = 0; TOT.bosses = 0; TOT.onPct = 0; TOT.seas = 0; }
    const L = LEVELS[levelIdx];
    S = {
      t: 0, level: levelIdx, pal: L, d: diff(levelIdx),
      hearts: 3, kills: 0, hits: 0, shots: 0,
      foes: [], phaseT: 60, bossT: 30,
      bossPhase: false, boss: null,
      aim: { x: W / 2, y: H / 2 },
      recoil: 0, hurtT: 0, shake: 0,
      parts: [],                     // weather particles
      over: false, won: false, levelDone: false, bossWait: false,
      cap: L.name, capT: 3,
      skyG: null, seaG: null,        // cached per level
      lightningT: 5,
      flashA: 0,
    };
    if (L.part) {
      const n = L.part === 'fog' ? 5 : 70;
      for (let i = 0; i < n; i++) {
        S.parts.push({
          x: Math.random() * W, y: Math.random() * H,
          v: 0.5 + Math.random(), ph: Math.random() * 6.28,
        });
      }
    }
  }

  // ------------------------------------------------------------- foes
  let lastSpawn = { x: 640, y: 400 };
  function spawnFoe() {
    // one at a time — put the next one a real flick away from the last
    let x, y, tries = 0;
    do {
      x = 150 + Math.random() * 980;
      y = 285 + Math.random() * 275;
      tries++;
    } while (tries < 14 &&
      (Math.hypot(x - lastSpawn.x, y - lastSpawn.y) < 260 ||
       S.foes.some(f => f.alive && Math.hypot(f.x - x, f.y - y) < 200)));
    lastSpawn = { x, y };
    S.foes.push({
      x, y, t: 0, window: S.d.killWindow, alive: true,
      kind: (Math.random() * 4) | 0, flip: Math.random() < 0.5 ? -1 : 1,
      pop: 0, sc: 0.55 + ((y - 160) / 400) * 0.6,
    });
  }

  function makeBoss() {
    S.bossPhase = true;
    S.bossT = S.d.bossTime;
    S.boss = { tt: Math.random() * 10, x: 640, y: 400, onT: 0,
               spd: 1, spdTarget: 1, spdT: 0, laughT: 5 + Math.random() * 5 };
    S.cap = 'the captain shows himself — stay on him for the minute';
    S.capT = 3;
    SFX.bossShow();
  }

  // ------------------------------------------------------------- input
  function canvasPos(e) {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (W / r.width),
             y: (e.clientY - r.top) * (H / r.height) };
  }
  cv.addEventListener('mousemove', (e) => {
    const p = canvasPos(e);
    S.aim.x = p.x; S.aim.y = p.y;
  });
  cv.addEventListener('mousedown', (e) => {
    if (S.over || S.won || S.levelDone) return;
    const p = canvasPos(e);
    if (p.x < 210 && p.y > H - 40) { quitRun(); return; }
    S.aim.x = p.x; S.aim.y = p.y;
    shoot(p.x, p.y);
  });

  function shoot(x, y) {
    S.recoil = 1;
    if (S.bossPhase) return;         // the captain falls to tracking, not lead
    S.shots++;
    let best = null, bd = 1e9;
    for (const f of S.foes) {
      if (!f.alive) continue;
      const d = Math.hypot(f.x - x, f.y - (y + 10));
      if (d < 56 * f.sc && d < bd) { bd = d; best = f; }
    }
    if (best) {
      best.alive = false;
      best.deadT = 0.0001;
      S.hits++;
      S.kills++;
      SFX.hit();
    }
  }

  // ------------------------------------------------------------- update
  function update(dt) {
    S.t += dt;
    const d = S.d;

    // pop-up phase — 60-second gauntlet, ONE target at a time; the moment
    // it drops the next appears
    if (!S.bossPhase) {
      S.phaseT -= dt;
      if (S.phaseT <= 0) {
        S.foes = [];
        S.bossWait = true;
        const acc = S.shots ? Math.round(100 * S.hits / S.shots) : 100;
        document.getElementById('br-line').textContent =
          `${S.kills} cutthroats down at ${acc}% accuracy. The captain of ` +
          `${S.pal.name} wants a word — hold your aim on him for a full minute.`;
        SFX.bossShow();
        showOverlay('bossready');
        return;
      }
      while (S.foes.filter(f => f.alive).length < 3) spawnFoe();
      for (const f of S.foes) {
        if (!f.alive) { f.deadT += dt; continue; }
        f.pop = Math.min(1, f.pop + dt * 9);
        f.t += dt;

      }
      S.foes = S.foes.filter(f => f.alive || f.deadT < 0.32);
    } else if (S.boss) {
      const B = S.boss;
      S.bossT -= dt;
      if (S.bossT <= 0) {
        // the bell rings — level done, scored on time-on-target
        TOT.hits += S.hits; TOT.shots += S.shots; TOT.kills += S.kills;
        const acc = S.shots ? Math.round(100 * S.hits / S.shots) : 100;
        const onPct = Math.round(100 * B.onT / S.d.bossTime);
        TOT.onPct = ((TOT.onPct || 0) + onPct);
        TOT.seas = (TOT.seas || 0) + 1;
        if (S.level < LEVELS.length - 1) {
          S.levelDone = true;
          document.getElementById('lv-kicker').textContent =
            S.pal.name.toLowerCase() + ' — cleared';
          document.getElementById('lv-line').textContent =
            `${S.kills} cutthroats at ${acc}% accuracy, and you held the ` +
            `captain ${onPct}% of his minute. Next: ${LEVELS[S.level + 1].name}.`;
          stopMusic();
          SFX.levelup();
          showOverlay('levelup');
        } else {
          S.won = true;
          stopMusic();
          SFX.win();
          const tacc = TOT.shots ? Math.round(100 * TOT.hits / TOT.shots) : 100;
          document.querySelector('#win .kicker').textContent = 'ten seas, crossed';
          document.querySelector('#win h1').textContent = 'Pirate King of the Meridian';
          document.getElementById('win-line').textContent =
            `${TOT.kills} cutthroats across ten seas · ${tacc}% accuracy · ` +
            `average captain-tracking ${Math.round(TOT.onPct / Math.max(1, TOT.seas))}%.`;
          hsAutoSubmit(TOT.seas);
          showOverlay('win');
        }
        return;
      }
      // he sails a weaving course, quicker as his minute burns down —
      // and his pace lurches at random between drifts and sprints
      B.spdT -= dt;
      if (B.spdT <= 0) {
        B.spdTarget = 0.35 + Math.random() * 2.15;
        B.spdT = 0.5 + Math.random() * 1.2;
      }
      B.spd += (B.spdTarget - B.spd) * Math.min(1, dt * 4);
      const ramp = 1 + (1 - S.bossT / S.d.bossTime) * 0.9;
      B.tt += dt * d.bossSpeed * B.spd * ramp;
      B.x = 640 + Math.sin(B.tt * 0.9) * 320 + Math.sin(B.tt * 0.37 + 2) * 140;
      B.y = 390 + Math.sin(B.tt * 0.7 + 1) * 110 + Math.sin(B.tt * 1.31) * 40;
      B.x = Math.max(130, Math.min(1150, B.x));
      B.y = Math.max(285, Math.min(535, B.y));
      const on = Math.hypot(S.aim.x - B.x, S.aim.y - B.y) < d.bossR;
      if (on) B.onT += dt;
      B.laughT -= dt;
      if (B.laughT <= 0) {
        B.laughT = 8 + Math.random() * 6;
        playLaugh();
      }
    }

    // fx timers
    S.recoil = Math.max(0, S.recoil - dt * 6);
    S.hurtT = Math.max(0, S.hurtT - dt);
    S.shake = Math.max(0, S.shake - dt);
    S.capT = Math.max(0, S.capT - dt);
    if (S.pal.part === 'rain') {
      S.lightningT -= dt;
      if (S.lightningT <= 0) { S.flashA = 0.55; S.lightningT = 5 + Math.random() * 5; }
    }
    S.flashA = Math.max(0, S.flashA - dt * 2.2);
  }

  // ------------------------------------------------------------- drawing
  const HOR = 230;   // horizon line — most of the view is open sea
  function draw() {
    const pal = S.pal;
    const shx = S.shake > 0 ? (Math.random() - 0.5) * 12 * S.shake : 0;
    const shy = S.shake > 0 ? (Math.random() - 0.5) * 8 * S.shake : 0;
    cx.save();
    cx.translate(shx, shy);

    // sky
    if (!S.skyG) {
      S.skyG = cx.createLinearGradient(0, 0, 0, HOR);
      S.skyG.addColorStop(0, pal.skyTop);
      S.skyG.addColorStop(0.72, pal.skyMid);
      S.skyG.addColorStop(1, pal.horizon);
    }
    cx.fillStyle = S.skyG;
    cx.fillRect(-20, -20, W + 40, HOR + 20);

    // sun / moon / lantern glow
    if (pal.sun) {
      const s = pal.sun;
      const key = 'sun' + S.level;
      if (!GR[key]) {
        GR[key] = cx.createRadialGradient(s.x, s.y, 4, s.x, s.y, s.r * 2.6);
        GR[key].addColorStop(0, s.c);
        GR[key].addColorStop(0.35, s.c + 'cc');
        GR[key].addColorStop(1, s.c + '00');
      }
      cx.fillStyle = GR[key];
      cx.beginPath(); cx.arc(s.x, s.y, s.r * 2.6, 0, 7); cx.fill();
    }

    // slow clouds
    cx.fillStyle = 'rgba(255,255,255,.10)';
    for (let i = 0; i < 5; i++) {
      const cxp = ((S.t * (6 + i * 2) + i * 300) % (W + 300)) - 150;
      const cyp = 60 + i * 68;
      cx.beginPath();
      cx.ellipse(cxp, cyp, 90 + i * 14, 17 + i * 2, 0, 0, 7);
      cx.ellipse(cxp + 55, cyp + 7, 55, 13, 0, 0, 7);
      cx.fill();
    }

    drawProps(pal);

    // sea
    if (!S.seaG) {
      S.seaG = cx.createLinearGradient(0, HOR, 0, H);
      S.seaG.addColorStop(0, pal.seaHi);
      S.seaG.addColorStop(1, pal.sea);
    }
    cx.fillStyle = S.seaG;
    cx.fillRect(-20, HOR, W + 40, H - HOR + 20);
    // moving swell lines
    cx.strokeStyle = 'rgba(255,255,255,.14)';
    cx.lineWidth = 2;
    for (let row = 0; row < 8; row++) {
      const y = HOR + 24 + row * row * 4 + row * 26;
      cx.globalAlpha = 0.5 + row * 0.06;
      cx.beginPath();
      for (let x = -20; x <= W + 20; x += 26) {
        const yy = y + Math.sin(x * (0.02 - row * 0.001) + S.t * (0.9 + row * 0.22) + row * 2) * (2 + row * 1.3);
        x === -20 ? cx.moveTo(x, yy) : cx.lineTo(x, yy);
      }
      cx.stroke();
    }
    cx.globalAlpha = 1;

    // foes + boss live between sea and deck
    for (const f of S.foes) drawFoe(f);
    if (S.boss) drawBoss(S.boss);

    drawWeather(pal);

    // deck rail foreground
    if (!GR.deck) {
      GR.deck = cx.createLinearGradient(0, H - 74, 0, H);
      GR.deck.addColorStop(0, '#6d4526');
      GR.deck.addColorStop(0.25, '#54331b');
      GR.deck.addColorStop(1, '#3a2211');
    }
    cx.fillStyle = GR.deck;
    cx.fillRect(-20, H - 64, W + 40, 84);
    cx.strokeStyle = 'rgba(30,17,8,.65)';
    cx.lineWidth = 2;
    for (let x = 40; x < W; x += 120) {
      cx.beginPath(); cx.moveTo(x + ((x * 7) % 30), H - 64); cx.lineTo(x + ((x * 7) % 30) - 6, H); cx.stroke();
    }
    cx.strokeStyle = 'rgba(255,220,170,.12)';
    cx.beginPath(); cx.moveTo(-20, H - 62); cx.lineTo(W + 20, H - 62); cx.stroke();
    const SPd = window.PSPRITES;
    if (SPd && SPd.barrel.ready) cx.drawImage(SPd.barrel.img, 44, H - 128, 66, 84);
    if (SPd && SPd.crate.ready) cx.drawImage(SPd.crate.img, 1140, H - 116, 86, 74);

    drawGun();

    cx.restore();

    // lightning / hurt / vignette overlays (screen space)
    if (S.flashA > 0) {
      cx.fillStyle = `rgba(240,248,255,${S.flashA})`;
      cx.fillRect(0, 0, W, H);
    }
    if (S.hurtT > 0) {
      cx.fillStyle = `rgba(190,20,20,${S.hurtT * 0.55})`;
      cx.fillRect(0, 0, W, H);
    }
    if (!GR.vig) {
      GR.vig = cx.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, H);
      GR.vig.addColorStop(0, 'rgba(0,0,0,0)');
      GR.vig.addColorStop(1, 'rgba(10,5,0,.34)');
    }
    cx.fillStyle = GR.vig;
    cx.fillRect(0, 0, W, H);

    drawHud();
    drawCrosshair();
  }

  function drawProps(pal) {
    const p = pal.prop;
    cx.save();
    if (p === 'docks') {
      cx.fillStyle = 'rgba(40,22,20,.85)';
      for (let i = 0; i < 4; i++) {
        const x = 60 + i * 90;
        cx.fillRect(x, HOR - 60 - i * 6, 8, 60 + i * 6);
        cx.fillRect(x - 18, HOR - 60 - i * 6, 44, 6);
      }
      // moored sloop silhouette
      cx.beginPath();
      cx.moveTo(1050, HOR); cx.quadraticCurveTo(1120, HOR - 26, 1210, HOR - 8);
      cx.lineTo(1210, HOR); cx.closePath(); cx.fill();
      cx.fillRect(1120, HOR - 95, 5, 90);
      cx.beginPath();
      cx.moveTo(1125, HOR - 92); cx.lineTo(1178, HOR - 60); cx.lineTo(1125, HOR - 42);
      cx.closePath(); cx.fill();
    } else if (p === 'ships') {
      const SPg = window.PSPRITES;
      if (SPg && SPg.galleon.ready) {
        for (const [sx, sc, fl] of [[230, 0.42, 1], [890, 0.3, -1], [560, 0.2, 1]]) {
          cx.save();
          cx.translate(sx, HOR + 6 + Math.sin(S.t * 0.8 + sx) * 2);
          cx.scale(sc * fl, sc);
          cx.globalAlpha = 0.55 + sc;
          cx.drawImage(SPg.galleon.img, -260, -320, 520, 340);
          cx.restore();
        }
      }
    } else if (p === 'island') {
      cx.fillStyle = 'rgba(20,60,42,.85)';
      cx.beginPath();
      cx.moveTo(760, HOR);
      cx.quadraticCurveTo(880, HOR - 130, 1000, HOR - 60);
      cx.quadraticCurveTo(1120, HOR - 150, 1290, HOR);
      cx.closePath(); cx.fill();
      // palms
      cx.strokeStyle = 'rgba(14,44,30,.9)';
      cx.lineWidth = 5;
      for (const px of [880, 1060]) {
        cx.beginPath();
        cx.moveTo(px, HOR - 60);
        cx.quadraticCurveTo(px + 10, HOR - 110, px + 26, HOR - 128);
        cx.stroke();
        cx.lineWidth = 3;
        for (let a = -2; a <= 2; a++) {
          cx.beginPath();
          cx.moveTo(px + 26, HOR - 128);
          cx.quadraticCurveTo(px + 26 + a * 18, HOR - 138, px + 26 + a * 30, HOR - 122 + Math.abs(a) * 6);
          cx.stroke();
        }
        cx.lineWidth = 5;
      }
    } else if (p === 'volcano') {
      cx.fillStyle = 'rgba(28,10,14,.9)';
      cx.beginPath();
      cx.moveTo(700, HOR); cx.lineTo(900, HOR - 190); cx.lineTo(940, HOR - 190);
      cx.lineTo(1160, HOR); cx.closePath(); cx.fill();
      const g = cx.createRadialGradient(920, HOR - 195, 2, 920, HOR - 195, 60);
      g.addColorStop(0, 'rgba(255,120,50,.9)'); g.addColorStop(1, 'rgba(255,120,50,0)');
      cx.fillStyle = g;
      cx.beginPath(); cx.arc(920, HOR - 195, 60, 0, 7); cx.fill();
    } else if (p === 'ice') {
      cx.fillStyle = 'rgba(235,248,252,.8)';
      for (const [bx, bw, bh] of [[160, 130, 60], [520, 90, 40], [980, 170, 75]]) {
        cx.beginPath();
        cx.moveTo(bx, HOR); cx.lineTo(bx + bw * 0.3, HOR - bh);
        cx.lineTo(bx + bw * 0.62, HOR - bh * 0.55); cx.lineTo(bx + bw * 0.8, HOR - bh * 0.8);
        cx.lineTo(bx + bw, HOR); cx.closePath(); cx.fill();
      }
    } else if (p === 'ghosts') {
      const SPh = window.PSPRITES;
      if (SPh && SPh.galleon.ready) {
        for (const [sx, sc, fl] of [[290, 0.36, 1], [760, 0.28, -1], [1080, 0.2, 1]]) {
          cx.save();
          cx.translate(sx, HOR + 6);
          cx.scale(sc * fl, sc);
          cx.globalAlpha = 0.16;
          cx.drawImage(SPh.galleon.img, -260, -320, 520, 340);
          cx.restore();
        }
      }
    } else if (p === 'maelstrom') {
      cx.strokeStyle = 'rgba(160,210,230,.2)';
      cx.lineWidth = 5;
      for (let i = 0; i < 3; i++) {
        cx.beginPath();
        cx.ellipse(640, HOR - 10, 240 - i * 70, 26 - i * 7, 0, 0.2 + S.t * 0.6 + i, 3.6 + S.t * 0.6 + i);
        cx.stroke();
      }
    } else if (p === 'gold') {
      cx.fillStyle = 'rgba(60,36,20,.85)';
      cx.beginPath();
      cx.moveTo(480, HOR);
      cx.quadraticCurveTo(640, HOR - 120, 800, HOR);
      cx.closePath(); cx.fill();
      // god rays from the island
      cx.fillStyle = 'rgba(255,220,140,.10)';
      for (let i = -2; i <= 2; i++) {
        cx.beginPath();
        cx.moveTo(640, HOR - 90);
        cx.lineTo(640 + i * 160 - 34, 0);
        cx.lineTo(640 + i * 160 + 34, 0);
        cx.closePath(); cx.fill();
      }
    }
    cx.restore();
  }

  function drawWeather(pal) {
    if (!pal.part) return;
    if (pal.part === 'rain') {
      cx.strokeStyle = 'rgba(190,210,230,.4)';
      cx.lineWidth = 1.5;
      cx.beginPath();
      for (const p of S.parts) {
        p.y += (16 + p.v * 10);
        p.x -= 4;
        if (p.y > H) { p.y = -12; p.x = Math.random() * (W + 100); }
        cx.moveTo(p.x, p.y);
        cx.lineTo(p.x - 4, p.y + 16);
      }
      cx.stroke();
    } else if (pal.part === 'snow') {
      cx.fillStyle = 'rgba(255,255,255,.75)';
      for (const p of S.parts) {
        p.y += p.v * 0.9;
        p.x += Math.sin(S.t * 1.4 + p.ph) * 0.5;
        if (p.y > H) { p.y = -6; p.x = Math.random() * W; }
        cx.beginPath(); cx.arc(p.x, p.y, 1.6 + p.v, 0, 7); cx.fill();
      }
    } else if (pal.part === 'embers') {
      cx.fillStyle = 'rgba(255,140,60,.8)';
      for (const p of S.parts) {
        p.y -= p.v * 1.1;
        p.x += Math.sin(S.t * 2 + p.ph) * 0.6;
        if (p.y < 0) { p.y = H + 6; p.x = Math.random() * W; }
        cx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(S.t * 3 + p.ph));
        cx.beginPath(); cx.arc(p.x, p.y, 1.4 + p.v * 0.8, 0, 7); cx.fill();
      }
      cx.globalAlpha = 1;
    } else if (pal.part === 'fog') {
      for (const [i, p] of S.parts.entries()) {
        const y = 110 + i * 105;
        const x = ((S.t * (8 + i * 3) + p.ph * 200) % (W + 700)) - 350;
        const g = GR['fog' + i] || (GR['fog' + i] = (() => {
          const gg = cx.createRadialGradient(0, 0, 10, 0, 0, 260);
          gg.addColorStop(0, 'rgba(235,240,244,.16)');
          gg.addColorStop(1, 'rgba(235,240,244,0)');
          return gg;
        })());
        cx.save();
        cx.translate(x, y);
        cx.scale(1.9, 0.5);
        cx.fillStyle = g;
        cx.beginPath(); cx.arc(0, 0, 260, 0, 7); cx.fill();
        cx.restore();
      }
    } else if (pal.part === 'spray') {
      cx.fillStyle = 'rgba(210,235,245,.5)';
      for (const p of S.parts) {
        p.y -= p.v * 2.4;
        p.x += Math.sin(S.t * 3 + p.ph) * 1.2;
        if (p.y < HOR - 120) { p.y = H - 40; p.x = Math.random() * W; }
        cx.beginPath(); cx.arc(p.x, p.y, 1.3 + p.v * 0.6, 0, 7); cx.fill();
      }
    }
  }

  // a cutthroat popping up in his rowboat — the ORIGINAL SVG pirates,
  // rasterized. No timer circle: he blinks red-hot just before he fires.
  function drawFoe(f) {
    const SP = window.PSPRITES;
    cx.save();
    cx.translate(f.x, f.y);
    if (!f.alive) {
      const k = f.deadT / 0.32;
      cx.globalAlpha = Math.max(0, 1 - k);
      cx.translate(0, k * 40);
      cx.rotate(f.flip * k * 0.5);
    } else {
      const pop = 1 - Math.pow(1 - f.pop, 3);
      cx.scale(pop, pop);
    }
    cx.scale(f.sc, f.sc);

    // rowboat
    if (!GR.boat) {
      GR.boat = cx.createLinearGradient(0, 26, 0, 50);
      GR.boat.addColorStop(0, '#7a4d28'); GR.boat.addColorStop(1, '#4a2c14');
    }
    cx.fillStyle = GR.boat;
    cx.beginPath();
    cx.moveTo(-52, 30);
    cx.quadraticCurveTo(0, 52, 52, 30);
    cx.lineTo(41, 44); cx.quadraticCurveTo(0, 58, -41, 44);
    cx.closePath(); cx.fill();
    cx.strokeStyle = 'rgba(30,17,8,.6)';
    cx.lineWidth = 2;
    cx.beginPath();
    cx.moveTo(-52, 30); cx.quadraticCurveTo(0, 52, 52, 30);
    cx.stroke();

    // the pirate himself (bob with the boat)
    const spr = SP && SP.pirates[f.kind];
    if (spr && spr.ready) {
      const hgt = 104, w = hgt * (120 / 170);
      cx.save();
      cx.scale(f.flip, 1);
      cx.translate(0, Math.sin(S.t * 2.2 + f.x) * 2);
      cx.drawImage(spr.img, -w / 2, -hgt + 34, w, hgt);
      cx.restore();
    }
    cx.restore();

  }

  // the enemy captain — bigger, in a sloop, always on the move
  function drawBoss(B) {
    const SP = window.PSPRITES;
    const d = S.d;
    cx.save();
    cx.translate(B.x, B.y);
    const sc = d.bossR / 66;
    cx.scale(sc, sc);
    cx.rotate(Math.sin(B.tt * 2) * 0.06);

    // hover = lock: gold aura says "just hold it here"
    if (Math.hypot(S.aim.x - B.x, S.aim.y - B.y) < d.bossR * sc * (66 / d.bossR)) {
      if (!GR.bossLock) {
        GR.bossLock = cx.createRadialGradient(0, -10, 20, 0, -10, 130);
        GR.bossLock.addColorStop(0, 'rgba(255,201,77,.32)');
        GR.bossLock.addColorStop(1, 'rgba(255,201,77,0)');
      }
      cx.fillStyle = GR.bossLock;
      cx.beginPath(); cx.arc(0, -10, 130, 0, 7); cx.fill();
    }

    // sloop
    if (!GR.sloop) {
      GR.sloop = cx.createLinearGradient(0, 40, 0, 82);
      GR.sloop.addColorStop(0, '#5e3a1e'); GR.sloop.addColorStop(1, '#33200f');
    }
    cx.fillStyle = GR.sloop;
    cx.beginPath();
    cx.moveTo(-78, 46);
    cx.quadraticCurveTo(0, 78, 78, 46);
    cx.lineTo(62, 66); cx.quadraticCurveTo(0, 88, -62, 66);
    cx.closePath(); cx.fill();
    // mast + black colors behind him
    cx.fillStyle = '#2b1c10';
    cx.fillRect(-44, -100, 5, 148);
    cx.fillStyle = '#151013';
    cx.beginPath();
    cx.moveTo(-39, -98); cx.lineTo(18, -70); cx.lineTo(-39, -44);
    cx.closePath(); cx.fill();
    cx.fillStyle = '#e8e2d4';
    cx.beginPath(); cx.arc(-16, -70, 7, 0, 7); cx.fill();
    cx.fillStyle = '#151013';
    cx.beginPath(); cx.arc(-18.5, -71, 1.6, 0, 7); cx.fill();
    cx.beginPath(); cx.arc(-13.5, -71, 1.6, 0, 7); cx.fill();
    cx.strokeStyle = '#e8e2d4';
    cx.lineWidth = 1.8;
    cx.beginPath();
    cx.moveTo(-25, -62); cx.lineTo(-7, -78);
    cx.moveTo(-25, -78); cx.lineTo(-7, -62);
    cx.stroke();

    // the captain himself — the original SVG boss art
    if (SP && SP.boss.ready) {
      const hgt = 150, w = hgt * (150 / 210);
      const face = Math.sign(S.aim.x - B.x) || 1;
      cx.save();
      cx.scale(face, 1);
      cx.translate(0, Math.sin(B.tt * 3) * 2.5);
      cx.drawImage(SP.boss.img, -w / 2, -hgt + 52, w, hgt);
      cx.restore();
    }
    cx.restore();

  }

  function drawGun() {
    const SP = window.PSPRITES;
    const a = S.aim;
    const gx = W - 245, gy = H - 40;
    const ang = Math.atan2(a.y - gy, a.x - gx);
    const left = Math.cos(ang) < 0;   // aiming into the left half-plane
    const rec = S.recoil * 11;
    const gw = 240, gh = 172;      // drawn size of the flintlock sprite
    const gripX = 0.76, gripY = 0.66;
    const muzX = gw * 0.66, muzY = -gh * 0.28;
    cx.save();
    cx.translate(gx - Math.cos(ang) * rec, gy - Math.sin(ang) * rec);
    cx.rotate(ang);
    if (left) cx.scale(1, -1);     // keep the pistol right side up
    if (SP && SP.flintlock.ready) {
      cx.save();
      cx.scale(-1, 1);             // sprite barrel points left; flip to aim
      cx.drawImage(SP.flintlock.img, -gw * gripX, -gh * gripY, gw, gh);
      cx.restore();
    }
    // muzzle flash
    if (S.recoil > 0.55) {
      cx.fillStyle = 'rgba(255,214,110,.92)';
      cx.beginPath();
      for (let i = 0; i < 10; i++) {
        const aa = i / 10 * 6.28;
        const rr = i % 2 ? 10 : 30;
        const px = muzX + Math.cos(aa) * rr * S.recoil;
        const py = muzY + Math.sin(aa) * rr * S.recoil;
        i ? cx.lineTo(px, py) : cx.moveTo(px, py);
      }
      cx.closePath(); cx.fill();
      cx.fillStyle = 'rgba(255,245,200,.95)';
      cx.beginPath(); cx.arc(muzX, muzY, 9 * S.recoil, 0, 7); cx.fill();
    }
    cx.restore();
  }

  function drawCrosshair() {
    const a = S.aim;
    const onBoss = S.bossPhase && S.boss &&
      Math.hypot(a.x - S.boss.x, a.y - S.boss.y) < S.d.bossR;
    cx.save();
    cx.strokeStyle = onBoss ? '#ffc94d' : 'rgba(255,255,255,.9)';
    cx.lineWidth = 2;
    const r = onBoss ? 14 : 11;
    cx.beginPath(); cx.arc(a.x, a.y, r, 0, 7); cx.stroke();
    cx.beginPath();
    cx.moveTo(a.x - r - 7, a.y); cx.lineTo(a.x - r + 2, a.y);
    cx.moveTo(a.x + r - 2, a.y); cx.lineTo(a.x + r + 7, a.y);
    cx.moveTo(a.x, a.y - r - 7); cx.lineTo(a.x, a.y - r + 2);
    cx.moveTo(a.x, a.y + r - 2); cx.lineTo(a.x, a.y + r + 7);
    cx.stroke();
    cx.fillStyle = onBoss ? '#ffc94d' : 'rgba(255,255,255,.9)';
    cx.beginPath(); cx.arc(a.x, a.y, 1.6, 0, 7); cx.fill();
    cx.restore();
  }

  function drawHud() {
    // sea name only — no counter, no bar (Boss stripped both)
    cx.save();
    cx.font = '600 13px ui-monospace, Menlo, monospace';
    cx.fillStyle = 'rgba(243,230,207,.8)';
    cx.textAlign = 'right';
    cx.fillText(S.pal.name, W - 24, 36);
    cx.restore();
    const tLeft = S.bossPhase ? S.bossT : S.phaseT;
    // countdown + kills + live accuracy
    cx.save();
    cx.font = '600 17px ui-monospace, Menlo, monospace';
    cx.fillStyle = tLeft < 10 ? 'rgba(255,140,110,.95)' : 'rgba(243,230,207,.9)';
    cx.textAlign = 'center';
    const secs = Math.max(0, Math.ceil(tLeft));
    const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    const acc = S.shots ? Math.round(100 * S.hits / S.shots) : 100;
    const onPctLive = S.bossPhase && S.boss
      ? Math.round(100 * S.boss.onT / Math.max(0.001, S.d.bossTime - S.bossT))
      : 0;
    cx.fillText(S.bossPhase
      ? `TRACK THE CAPTAIN · ${clock} · on him ${onPctLive}%`
      : `${clock} · ${S.kills} down · ${acc}%`, W / 2, 34);
    cx.restore();
    // quit control, bottom-left
    cx.save();
    cx.font = '600 13px ui-monospace, Menlo, monospace';
    cx.fillStyle = 'rgba(243,230,207,.55)';
    cx.textAlign = 'left';
    cx.fillText('\u2691 strike colors (Esc)', 22, H - 18);
    cx.restore();

    // caption
    if (S.capT > 0) {
      cx.save();
      cx.globalAlpha = Math.min(1, S.capT);
      cx.font = 'italic 22px Georgia, serif';
      cx.fillStyle = 'rgba(243,230,207,.95)';
      cx.textAlign = 'center';
      cx.fillText(S.cap, W / 2, 84);
      cx.restore();
    }
  }

  // strike your colors: end the run early and take your score to the board
  function quitRun() {
    if (!running || S.won || S.over) return;
    if (!S.levelDone) {
      TOT.hits += S.hits; TOT.shots += S.shots; TOT.kills += S.kills;
    }
    S.levelDone = false;
    S.bossWait = false;
    hideOverlays();
    let seas = TOT.seas || 0;
    if (S.bossPhase && S.boss) {
      const elapsed = S.d.bossTime - S.bossT;
      if (elapsed > 3) {
        TOT.onPct = (TOT.onPct || 0) + Math.round(100 * S.boss.onT / elapsed);
        seas += 1;
      }
    }
    S.won = true;
    stopMusic();
    SFX.over();
    const tacc = TOT.shots ? Math.round(100 * TOT.hits / TOT.shots) : 100;
    document.querySelector('#win .kicker').textContent = 'colors struck';
    document.querySelector('#win h1').textContent = 'The Run Ends';
    document.getElementById('win-line').textContent =
      `${TOT.kills} cutthroats across ${TOT.seas || 0} of ten seas · ` +
      `${tacc}% accuracy · captain-tracking ${Math.round((TOT.onPct || 0) / Math.max(1, seas))}%.`;
    hsAutoSubmit(seas);
    showOverlay('win');
  }
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') quitRun();
  });

  // ------------------------------------------------------------- loop
  function showOverlay(id) { document.getElementById(id).classList.remove('hidden'); }
  function hideOverlays() {
    for (const id of ['title', 'gameover', 'win', 'levelup', 'bossready'])
      document.getElementById(id).classList.add('hidden');
  }

  let last = 0, running = false;
  function frame(ts) {
    const dt = Math.min(0.033, (ts - last) / 1000 || 0.016);
    last = ts;
    if (running && !S.over && !S.won && !S.levelDone && !S.bossWait) update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function armLobby() {
    if (running || musicEl) return;
    startLobby();
  }
  addEventListener('pointerdown', armLobby);
  addEventListener('keydown', armLobby);
  addEventListener('mousemove', armLobby);   // free retry; some browsers allow

  document.getElementById('start').addEventListener('click', () => {
    ac();
    hideOverlays(); running = true;
    startMusic(S.level);
  });
  document.getElementById('face').addEventListener('click', () => {
    hideOverlays();
    S.bossWait = false;
    makeBoss();
    playTrack('music/boss.mp3');   // the duel gets its own theme
  });
  document.getElementById('next').addEventListener('click', () => {
    reset(S.level + 1); hideOverlays(); running = true;
    startMusic(S.level);
  });
  document.querySelector('#gameover .retry').addEventListener('click', () => {
    reset(S.level); hideOverlays(); running = true;
    startMusic(S.level);
  });
  document.querySelector('#win .retry').addEventListener('click', () => {
    reset(0); hideOverlays(); running = true;
    startMusic(S.level);
  });

  reset(0);
  requestAnimationFrame(frame);
  startLobby();   // instant where the browser allows; else first gesture

  // ---- high scores: GLOBAL, two boards, via Supabase (public read +
  // insert only; a DB trigger keeps just the top 10 per board).
  //   'kills' board: total cutthroats in a finished run (tie: accuracy)
  //   'boss'  board: average captain-tracking % across the run
  const SB_URL = 'https://uaprljmhdbjymqlxaezo.supabase.co';
  const SB_KEY = 'sb_publishable_ejanCO8WYDc07AOJf5Jklg_BZ1ULs3I';
  async function hsFetch(board) {
    const r = await fetch(SB_URL + '/rest/v1/scores?board=eq.' + board +
      '&select=name,value,extra&order=value.desc,extra.desc,created_at.asc&limit=10',
      { headers: { apikey: SB_KEY } });
    if (!r.ok) throw new Error('fetch ' + r.status);
    return r.json();
  }
  async function hsSubmit(board, row) {
    const r = await fetch(SB_URL + '/rest/v1/scores', {
      method: 'POST',
      headers: { apikey: SB_KEY, 'Content-Type': 'application/json',
                 Prefer: 'return=minimal' },
      body: JSON.stringify(Object.assign({ board }, row)),
    });
    if (!r.ok) throw new Error('submit ' + r.status);
  }
  function hsRender(el, list, board, mine) {
    if (!el) return;
    el.innerHTML = '';
    if (!list.length) {
      const li = document.createElement('li');
      li.textContent = 'no scores carved yet';
      el.appendChild(li);
      return;
    }
    for (const s of list) {
      const li = document.createElement('li');
      if (mine && s.name === mine.name && s.value === mine.value) li.className = 'me';
      const n = document.createElement('span');
      n.className = 'n';
      n.textContent = s.name;
      const v = document.createElement('span');
      v.textContent = board === 'kills'
        ? s.value + ' kills · ' + s.extra + '%'
        : s.value + '% tracked';
      li.append(n, v);
      el.appendChild(li);
    }
  }
  async function hsRefresh(where, mine) {
    for (const board of ['kills', 'boss']) {
      const el = document.getElementById('hs-' + board + '-' + where);
      try {
        hsRender(el, await hsFetch(board), board,
          mine && (board === 'kills' ? mine.kills : mine.boss));
      } catch (e) {
        if (el) el.innerHTML = '<li>the board is unreachable</li>';
      }
    }
  }
  const hsInput = document.getElementById('hs-name');
  const startBtn = document.getElementById('start');
  function cleanName() {
    return hsInput.value.replace(/[^A-Za-z0-9 _\-\.]/g, '').trim().slice(0, 16);
  }
  function nameGate() { startBtn.disabled = cleanName() === ''; }
  hsInput.addEventListener('input', nameGate);
  try { hsInput.value = localStorage.getItem('mdl-name') || ''; } catch (e) {}
  nameGate();
  hsRefresh('lobby');

  // a finished run carves itself onto both boards under the entered name
  async function hsAutoSubmit(seas) {
    const name = cleanName() || 'Nameless Pirate';
    try { localStorage.setItem('mdl-name', name); } catch (e) {}
    const st = document.getElementById('hs-status');
    const acc = TOT.shots ? Math.round(100 * TOT.hits / TOT.shots) : 100;
    const track = Math.round((TOT.onPct || 0) / Math.max(1, seas || 0));
    const mine = {};
    if (TOT.kills > 0) mine.kills = { name, value: TOT.kills, extra: acc };
    if (seas > 0 && track > 0) mine.boss = { name, value: track };
    if (!mine.kills && !mine.boss) {
      st.textContent = 'nothing to carve this time';
      hsRefresh('win');
      return;
    }
    st.textContent = 'carving your score into the board\u2026';
    try {
      if (mine.kills) await hsSubmit('kills', mine.kills);
      if (mine.boss) await hsSubmit('boss', mine.boss);
      st.textContent = 'carved in as ' + name;
    } catch (e) {
      st.textContent = 'the board is unreachable \u2014 score not saved';
    }
    await hsRefresh('win', mine);
    hsRefresh('lobby');
  }


  // test hooks  // test hooks
  window.__pirate = {
    get state() { return S; },
    get levels() { return LEVELS.length; },
    get music() { return !!musicEl; },
    aim(x, y) { S.aim.x = x; S.aim.y = y; },
    shoot(x, y) { shoot(x, y); },
    level(i) { reset(i); },
    start() { hideOverlays(); running = true; },
  };
})();
