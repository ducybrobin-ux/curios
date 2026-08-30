/* =========================================================
   Curi🧭s — Moteur audio
   Signatures sonores synthétiques (Web Audio API) + indices
   directionnels : plus on s'approche de la balise, plus la
   signature de la découverte recherchée est forte et rapide.
   ========================================================= */

const AudioSys = (function () {
  let ctx = null;
  let master = null;
  let birdGain = null;
  let loopTimer = null;
  let proximity = null;   // { balise, lat, lng, active }
  let proxTimer = null;
  let playingBird = null;
  let nextNoteAt = 0;
  let alertMode = null;   // null (= signature) | 'radar' | 'bip' | 'pulse' | 'custom'
  let customBuf = null;
  let customLoading = false;
  let customDur = 1;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = (Store.getSettings().volume || 80) / 100;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }

  function setVolume(v) {
    if (master) master.gain.value = (v || 80) / 100;
  }

  /* Jouer une note unique */
  function playNote(note, time, gainNode, speed) {
    const t = ctx.currentTime + time;
    const g = ctx.createGain();
    const dur = note.d / (speed || 1);
    const v = note.v * (note.type === "noise" ? 0.5 : 0.9);

    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + 0.02);
    g.gain.setValueAtTime(v, t + Math.max(0.02, dur - 0.03));
    g.gain.linearRampToValueAtTime(0.0001, t + dur);

    let src;
    if (note.type === "noise") {
      const len = Math.max(1, Math.round(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
      src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1500;
      bp.Q.value = 1.2;
      src.connect(bp); bp.connect(g);
    } else {
      src = ctx.createOscillator();
      src.type = note.type || "sine";
      const t0 = ctx.currentTime + time;
      const fEnd = note.fEnd ?? note.f;
      src.frequency.setValueAtTime(note.f, t0);
      src.frequency.exponentialRampToValueAtTime(Math.max(40, fEnd), t0 + dur);
      src.connect(g);
    }
    g.connect(gainNode || master);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  function scheduleBird(bird, speed) {
    if (!ctx || !bird || !bird.chant) return;
    const sp = (speed && speed > 0) ? speed : 0.5;
    const tempo = bird.chant.tempo || 120;
    const gap = 60 / tempo;
    let t = Math.max(0, nextNoteAt - ctx.currentTime);
    bird.chant.notes.forEach((note) => {
      playNote(note, t, birdGain, sp);
      t += (note.d + note.g) / sp * (120 / tempo);
    });
    /* La pause entre deux phrases suit la cadence : loin = espacé,
       tout près = rapproché (signal façon « radar »). */
    nextNoteAt = ctx.currentTime + t + gap / sp;
  }

  /* Démarrer la boucle sonore d'une découverte */
  function playBird(bird, speed) {
    stopLoop();
    const c = ensure();
    if (!c) return false;
    if (!Store.getSettings().sound) return false;

    playingBird = bird;
    if (!birdGain) { birdGain = ctx.createGain(); birdGain.gain.value = 1; birdGain.connect(master); }
    /* En mode balise, la vitesse est lue en continu depuis proximity.speed :
       la cadence suit la distance à chaque nouvelle phrase, sans redémarrer
       le chant (aucun chevauchement de notes). */
    const sp0 = (speed && speed > 0) ? speed : (proximity ? (proximity.speed || 0.5) : 1);
    scheduleBird(bird, sp0);
    loopTimer = setInterval(() => {
      if (!ctx || ctx.currentTime < nextNoteAt) return;
      const sp = (speed && speed > 0) ? speed : (proximity ? (proximity.speed || 0.5) : 1);
      scheduleBird(bird, sp);
    }, 250);
    return true;
  }

  /* ---------- Avertisseurs d'approche (radar, bip, pulsation, perso) ---------- */

  function ping(fStart, fEnd, delay, vol, dur) {
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(fStart, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(60, fEnd), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.55 * vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(birdGain || master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function beep(delay, freq, vol, dur) {
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.22 * vol, t + 0.01);
    g.gain.setValueAtTime(0.22 * vol, t + dur - 0.02);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(birdGain || master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function loadCustom() {
    const url = Store.getSettings().alertCustom;
    if (!url || customLoading || customBuf) return;
    customLoading = true;
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then((ab) => ctx.decodeAudioData(ab))
      .then((buf) => { customBuf = buf; customDur = buf.duration || 1; })
      .catch(() => {})
      .finally(() => { customLoading = false; });
  }

  function playCustomOnce(vol, rate) {
    if (!customBuf) { loadCustom(); return; }
    const src = ctx.createBufferSource();
    src.buffer = customBuf;
    src.playbackRate.value = rate || 1;
    const g = ctx.createGain();
    g.gain.value = Math.min(1, 0.9 * vol);
    src.connect(g); g.connect(birdGain || master);
    src.start();
  }

  /* Planifie UNE phrase de l'avertisseur choisi ; cadence selon speed
     (loin = espacé, tout près = rapproché), volume selon intensity (0..1). */
  function scheduleAlertPhrase(speed, intensity) {
    const sp = (speed && speed > 0) ? speed : 1;
    if (alertMode === "radar") {
      ping(1500, 650, 0, intensity, 0.32);
      ping(1500, 650, 0.42 / sp, intensity * 0.45, 0.28);   // écho façon radar
      nextNoteAt = ctx.currentTime + Math.max(0.35, 1.05 / sp);
    } else if (alertMode === "bip") {
      let d = 0;
      for (let i = 0; i < 3; i++) { beep(d, 880, intensity, 0.07); d += 0.15 / sp; }
      nextNoteAt = ctx.currentTime + d + Math.max(0.3, 0.6 / sp);
    } else if (alertMode === "pulse") {
      beep(0, 320, intensity * 1.4, 0.16);
      beep(0.24 / sp, 260, intensity * 1.1, 0.18);
      nextNoteAt = ctx.currentTime + Math.max(0.5, 1.2 / sp);
    } else if (alertMode === "custom") {
      playCustomOnce(intensity, 0.8 + 0.4 * sp);
      nextNoteAt = ctx.currentTime + Math.max(0.6, (customDur + 0.25) / sp);
    }
  }

  function resetCustom() { customBuf = null; customLoading = false; customDur = 1; }

  /* Test manuel depuis les réglages : une phrase à pleine intensité. */
  function testAlert() {
    const kind = Store.getSettings().alertSound || "signature";
    if (kind === "signature") return false;
    const c = ensure(); if (!c) return false;
    if (!Store.getSettings().sound) return false;
    if (kind === "custom" && !Store.getSettings().alertCustom) return false;
    if (!birdGain) { birdGain = ctx.createGain(); birdGain.gain.value = 1; birdGain.connect(master); }
    alertMode = kind;
    scheduleAlertPhrase(1, 1);
    return true;
  }

  /* Choisit le son d'approche : signature de la découverte ou avertisseur. */
  function startProxSound(bird, speed, intensity) {
    const kind = Store.getSettings().alertSound || "signature";
    const customOk = kind !== "custom" || !!Store.getSettings().alertCustom;
    if (kind !== "signature" && customOk) {
      if (playingBird) stopLoop();
      alertMode = kind;
      proximity.speed = speed;
      proximity.intensity = intensity;
      if (!loopTimer) {
        nextNoteAt = ctx.currentTime;
        loopTimer = setInterval(() => {
          if (!ctx || ctx.currentTime < nextNoteAt) return;
          scheduleAlertPhrase(proximity ? proximity.speed : 1, proximity ? proximity.intensity : 1);
        }, 250);
      }
    } else {
      alertMode = null;
      playBird(bird, speed);
    }
    if (birdGain) birdGain.gain.value = intensity;
  }

  /* Indices directionnels : intensité selon distance (m) */
  function startProximity(balise) {
    stopProximity();
    if (!balise || !Store.getSettings().hints || !Store.getSettings().sound) return;
    const c = ensure();
    if (!c) return;
    proximity = { balise, lat: balise.lat, lng: balise.lng, last: 10000, speed: 0.6, intensity: 0.12 };

    proxTimer = setInterval(() => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition((pos) => {
        if (!proximity) return;
        const dist = haversine(pos.coords.latitude, pos.coords.longitude, proximity.lat, proximity.lng);
        const hintR = SITE.hintRadius || 250;
        const proxR = SITE.proximityRadius || 30;
        if (dist > hintR) {
          stopLoop();
          return;
        }
        // intensité : 0 (lointain) → 1 (tout proche)
        const intensity = Math.max(0.12, Math.min(1, 1 - (dist - proxR) / (hintR - proxR)));
        const speed = 0.6 + intensity * 0.9;
        const bird = getBird(balise.bird);
        startProxSound(bird, speed, intensity);
        proximity.last = dist;
      }, null, { enableHighAccuracy: true, maximumAge: 2000, timeout: 8000 });
    }, 4000);
  }

  function stopProximity() {
    proximity = null;
    if (proxTimer) { clearInterval(proxTimer); proxTimer = null; }
  }

  function stopLoop() {
    if (loopTimer) { clearInterval(loopTimer); loopTimer = null; }
    playingBird = null;
    nextNoteAt = 0;
    if (birdGain) birdGain.gain.value = 1;
  }

  function stop() { stopProximity(); stopLoop(); }

  /* haversine déplacé dans packages/geolocation → window.GeoMath.haversine.
     On garde l'alias AudioSys.haversine pour compatibilité descendante. */
  const haversine = (...args) => window.GeoMath.haversine(...args);

  /* Jouer un son « signal » de validation */
  function blip(freq = 880) {
    const c = ensure(); if (!c) return;
    const g = ctx.createGain();
    g.connect(master);
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.connect(g); o.start(); o.stop(ctx.currentTime + 0.4);
  }

  return {
    ensure, setVolume, playBird, stop, startProximity, stopProximity, blip,
    get haversine() { return window.GeoMath.haversine; },
    testAlert, resetCustom,
    get isPlaying() { return !!playingBird; },
    get alertMode() { return alertMode; },
  };
})();
