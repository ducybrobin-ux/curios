/* =========================================================
   Curi🧭s — Application principale
   Navigation, carte interactive, GPS, énigmes, fiches, quiz,
   carnet, palmarès, reconnaissance et réglages.
   ========================================================= */

(function () {
  "use strict";

  /* ---------- GeoMath (packages/geolocation → js/geo.js) ---------- */
  const { normDeg, cardinal, haversine: geoHaversine } = window.GeoMath;

  /* ---------- État ---------- */
  const App = {
    screen: "home",
    target: null,        // balise en cours
    activeBird: null,    // découverte affichée
    quiz: null,          // questions générées
    quizIndex: 0,
    quizScore: 0,
    watchId: null,
    lastPos: null,
    cameraOn: false,
    compassOn: false,
    currentEnigme: null, // énigme active (selon la difficulté choisie)
    backScreen: null,    // écran de retour pour les fiches (god, carnet…)
    riddleMode: "unlock", // "unlock" = débloque la fiche, "clue" = indice vers la prochaine balise
    mapUrl: "",
  };

  const $ = (id) => document.getElementById(id);

  // Icône du pack officiel (img/icons/*.svg).
  const ico = (name, cls) => `<img class="cur-icon${cls ? " " + cls : ""}" src="img/icons/${name}.svg" alt="">`;

  /* ---------- Event Engine ---------- */
  const {
    createEngine, createGameState,
    BALISE_FOUND, RIDDLE_SOLVED, QUIZ_COMPLETED, BIRD_REVEALED, RUN_FINISHED,
    DEFAULT_RULES,
  } = window.CURIOS_ENGINE;

  let gameState = createGameState();
  const engine = createEngine({
    rules: DEFAULT_RULES,
    getState: () => gameState,
    setState: (s) => { gameState = s; },
    ctx: { get balisesCount() { return typeof BALISES !== "undefined" ? BALISES.length : 0; } },
    log: console.log,
  });

  /* --- Engine → DOM bridge : listeners qui déclenchent les effets --- */
  engine.on(BALISE_FOUND, (state, payload) => {
    const { balise, mode } = payload;
    if (mode === "qr" || mode === "gps" || mode === "manual") {
      Store.unlockBalise(balise.id, balise.bird, 0);
      postValidation(Store.getActive().name, balise.id);
      AudioSys.blip(880);
    }
  });

  engine.on(BIRD_REVEALED, (state, payload) => {
    if (payload.playSong && payload.bird) {
      AudioSys.playBird(payload.bird, 1);
    }
  });

  engine.on(QUIZ_COMPLETED, (state, payload) => {
    Store.unlockBalise(payload.balise.id, payload.bird.id, payload.score);
  });

  engine.on(RIDDLE_SOLVED, (state, payload) => {
    const p = Store.getActive();
    Store.updateProfile(p.id, { riddles: Object.assign({}, p.riddles, { [payload.balise.id]: true }) });
  });

  engine.on(RUN_FINISHED, (state, payload) => {
    renderEndScreen(Store.getActive());
    if (Store.raceEnabled()) renderRaceEnd(Store.getActive());
    showScreen("end");
    AudioSys.blip(660);
    postFinish(Store.getActive());
  });

  /* ---------- Analytics locales (window.CurAnalytics) ----------
   * Collecte discrète des métriques de jeu dans le localStorage.
   * Optionnel : si le module n'est pas chargé, tout est no-op. */
  const analytics = (typeof window.CurAnalytics !== "undefined" && window.CurAnalytics.createTracker())
    || { startBalise(){}, recordEnigmeAttempt(){}, recordHintUsed(){}, recordHintLevel(){}, startQuiz(){}, recordQuizAnswer(){}, completeQuiz(){}, completeBalise(){}, recordScreen(){}, getReport(){ return { summary: {} }; } };

  function visibleBalise(b) { return (b && b.id) ? b.id : "?"; }

  /* Balise découverte → démarre le tracking de la balise (timing). */
  engine.on(BALISE_FOUND, (state, payload) => {
    if (payload && payload.balise) analytics.startBalise(payload.balise.id);
  });

  /* Enigme résolue → 1ère tentative réussie. */
  engine.on(RIDDLE_SOLVED, (state, payload) => {
    if (payload && payload.balise) analytics.recordEnigmeAttempt(payload.balise.id, true);
  });

  /* Quiz terminé → enregistre la session et le score. */
  engine.on(QUIZ_COMPLETED, (state, payload) => {
    if (!payload || !payload.balise) return;
    const bid = payload.balise.id;
    analytics.completeQuiz(bid, payload.score || 0, payload.total || 0);
  });

  /* Course terminée → fige la balise en cours comme complétée. */
  engine.on(RUN_FINISHED, (state, payload) => {
    const t = currentTarget();
    if (t) analytics.completeBalise(t.id, Store.getActive() ? Store.getActive().stars : 0);
  });

  /* --- Sync : synchronise le gameState du moteur avec le Store --- */
  function syncGameState() {
    const p = Store.getActive();
    const s = Store.getSettings();
    if (p) {
      gameState = createGameState({
        profileId: p.id,
        profileName: p.name,
        isAdmin: !!p.isAdmin,
        completed: p.completed || [],
        discovered: p.birds || [],
        riddles: p.riddles || {},
        seeds: p.seeds || 0,
        offered: p.offered || [],
        seconds: p.seconds || 0,
        startTime: p.startTime || null,
        playMode: s.race ? "race" : "classic",
      });
    }
  }

  /* ---------- Service Worker ---------- */
  function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js")
        .then((reg) => {
          /* Mise à jour propre : on NE force pas skipWaiting. La nouvelle
           * version reste "waiting" (l'ancienne reste active) jusqu'à ce que
           * l'utilisateur choisisse « Redémarrer » (voir updateApp / bandeau).
           */
          reg.addEventListener("updatefound", () => {
            const nw = reg.installing;
            if (!nw) return;
            nw.addEventListener("statechange", () => {
              if (nw.state === "installed" && reg.active) {
                const prompt = document.getElementById("update-prompt");
                if (prompt) prompt.classList.remove("hidden");
              }
            });
          });
          const btnNow = document.getElementById("btn-update-now");
          if (btnNow) btnNow.addEventListener("click", () => {
            if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
            reg.update().catch(() => {});
            location.reload();
          });
        })
        .catch(() => {});
    });
  }

  /* ---------- Routage (délègue à window.Router) ---------- */
  const router = window.Router.createRouter({
    $,
    t: (k) => I18N.t(k),
    state: App,
    effects: {
      stopCamera: () => QrScan.stop(),
      stopCompass,
      stopAudio: () => AudioSys.stop(),
      stopVoice,
      onIntro: applyIntroRules,
    },
  });
  function showScreen(name) { router.navigate(name); if (analytics && analytics.recordScreen) analytics.recordScreen(name); }

  /* Mode course / aléatoire : règles d'intro adaptées (pas de question ni de réponse). */
  function applyIntroRules() {
    const race = Store.raceEnabled();
    const random = Store.randomEnabled();
    const rules = {
      "rule-classic-1": !race && !random,
      "rule-classic-2": !race,
      "rule-classic-3": !race,
      "rule-classic-4": !race,
      "rule-classic-5": !race,
      "rule-random-1": random && !race,
      "rule-race-1": race,
      "rule-race-2": race,
      "rule-race-3": race,
    };
    Object.keys(rules).forEach((id) => {
      const el = $(id);
      if (el) el.classList.toggle("hidden", !rules[id]);
    });
  }

  function toast(msg, ms = 3200) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("show"), ms);
  }
  window.HermesToast = toast;

  /* ---------- Synthèse vocale (accessibilité : malvoyants, enfants) ---------- */
  function stopVoice() {
    if (!("speechSynthesis" in window)) return;
    try { window.speechSynthesis.cancel(); } catch (e) {}
    const b = $("btn-voice");
    if (b) b.classList.remove("on");
  }

  function readAloud() {
    if (!("speechSynthesis" in window)) { toast(I18N.t("voice_no_support")); return; }
    const active = document.querySelector(".screen.active");
    const text = normalizeSpeech(active ? active.innerText : "");
    if (!text) { toast(I18N.t("voice_no_support")); return; }
    stopVoice();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = I18N.region || "fr-FR";
    const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
    const prefix = u.lang.slice(0, 2).toLowerCase();
    const voice = voices.find((v) => v && v.lang && v.lang.slice(0, 2).toLowerCase() === prefix);
    if (voice) { try { u.voice = voice; } catch (e) {} }
    u.rate = 0.95;
    u.pitch = 1.05;
    u.onend = () => { const b = $("btn-voice"); if (b) b.classList.remove("on"); };
    try { window.speechSynthesis.speak(u); } catch (e) { toast(I18N.t("voice_no_support")); return; }
    const b = $("btn-voice");
    if (b) b.classList.add("on");
    toast(I18N.t("voice_reading"), 1600);
  }

  function normalizeSpeech(s) {
    return String(s || "").replace(/\s+/g, " ").trim().slice(0, 4000);
  }

  /* ---------- iOS (Safari) : l'audio est bloqué tant qu'aucun geste
     utilisateur n'a eu lieu. On « réveille » le contexte audio et la
     synthèse vocale au premier toucher, une seule fois. ---------- */
  function unlockOnFirstGesture() {
    const unlock = () => {
      try { if (window.AudioSys) AudioSys.ensure(); } catch (e) {}
      try {
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          if (window.speechSynthesis.getVoices) window.speechSynthesis.getVoices();
        }
      } catch (e) {}
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("keydown", unlock);
    };
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("touchstart", unlock);
    document.addEventListener("keydown", unlock);
  }

  /* ---------- Démarrage ---------- */
  async function init() {
    applySettings();
    syncGameState();
    bindEvents();
    unlockOnFirstGesture();
    await loadAdminData();
    loadMapUrl();
    renderHome();
    loadServerInfo();
    registerSW();
    updateOfflineUI();
    I18N.apply();
    setInterval(() => Store.tickTimer(), 20000);
    setInterval(updateRaceTimer, 1000);
    setInterval(reportPos, 10000);
    setInterval(() => syncValidations(false), 60000);
    if (window.Board) Board.start();
    window.addEventListener("beforeunload", () => Store.tickTimer());
    window.addEventListener("online", updateOfflineUI);
    window.addEventListener("offline", updateOfflineUI);
    document.addEventListener("jdp:lang", onLangChange);
    showScreen("home");
    syncValidations(true);
  }

  async function loadAdminData() {
    try {
      const res = await fetch("/admin-data.json", { cache: "no-store" });
      if (!res.ok) return;
      const admin = await res.json();
      if (admin && typeof admin === "object") applyAdminData(admin);
    } catch (e) {}
  }

  function loadMapUrl() {
    fetch("/api/map", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        App.mapUrl = (d && d.url) || "";
        updateMapButton();
      })
      .catch(() => {});
  }

  function updateMapButton() {
    const btn = $("btn-map-open");
    if (!btn) return;
    if (App.mapUrl) {
      btn.href = App.mapUrl;
      btn.classList.remove("hidden");
    } else {
      btn.classList.add("hidden");
    }
  }

  function onLangChange() {
    const s = App.screen;
    if (s === "home") renderHome();
    else if (s === "map") renderMap();
    else if (s === "settings") renderSettings();
    else if (s === "god") renderGod();
    else if (s === "guide") renderGuide();
    else if (s === "profile") renderProfiles();
    else if (s === "carnet") renderCarnet();
    else if (s === "palmares") renderPalmares();
    applyIntroRules();
    applySettings();
  }

  function isGodProfile(p) {
    return !!p && String(p.name || "").trim().toLowerCase() === "admin" && p.kids === 0;
  }

  function birdLabel(bird) {
    return bird ? I18N.birdName(bird.id) : "";
  }

  function currentTarget() {
    const p = Store.getActive();
    if (p && (Store.raceEnabled() || Store.randomEnabled())) {
      const id = Store.getRaceOrder(p).find((bid) => !Store.isDone(bid));
      return BALISES.find((b) => b.id === id) || null;
    }
    return BALISES.find((b) => !Store.isDone(b.id)) || null;
  }

  /* ---------- ACCUEIL ---------- */
  function renderHome() {
    const p = Store.getActive();
    const prog = $("home-progress");
    const tip = $("home-tip");
    const godTile = $("tile-god");
    const isGod = p && isGodProfile(p) && !Store.getSettings().adminOff;
    if (godTile) godTile.classList.toggle("hidden", !isGod);

    if (p) {
      const done = p.completed.length;
      const seeds = Store.seedsLeft(p.id);
      prog.innerHTML = `👨‍👩‍👧‍👦 <strong>${esc(p.name)}</strong> · ${done}/${BALISES.length} balises · ⭐ ${p.stars} · 🌱 ${seeds} graine${seeds > 1 ? "s" : ""}`;
      $("btn-play").textContent = done >= BALISES.length ? I18N.t("home_play_replay") : I18N.t("home_play_continue");
      if (isGod) {
        tip.textContent = "🛠️ Profil « Admin » : le mode admin est activé (codes, QR codes, navigation directe).";
      } else {
        const t = currentTarget();
        tip.innerHTML = done >= BALISES.length || !t
          ? "🎉 Parcours terminé ! Rejouez pour battre votre record, ou consultez le palmarès des familles."
          : `Prochaine balise : <strong>${esc(t.label)}</strong> — scannez son QR code sur place.`;
      }
    } else {
      prog.innerHTML = I18N.t("home_progress_noprofile");
      $("btn-play").textContent = I18N.t("home_play");
      tip.textContent = I18N.t("home_tip_offline");
    }
    renderHomeTheme();
    const outBtn = $("btn-home-logout");
    if (outBtn) outBtn.classList.toggle("hidden", !p);
    updateNightBadge();
  }

  /* Sélecteur de thème directement sur l'accueil (même protection que Réglages). */
  let homeThemeBound = false;
  function renderHomeTheme() {
    const sel = $("home-theme");
    if (!sel) return;
    if (!homeThemeBound) {
      homeThemeBound = true;
      sel.addEventListener("change", () => {
        const s = Store.getSettings();
        const id = sel.value;
        if (s.themePass && !themeUnlocked && id !== s.theme) {
          sel.value = s.theme || "defaut";
          themePending = id;
          const rowPass = $("row-home-theme-pass");
          if (rowPass) rowPass.classList.remove("hidden");
          $("home-theme-pass").value = "";
          toast(I18N.t("theme_locked_toast"));
          return;
        }
        Store.setSettings({ theme: id });
        applySettings();
        const t = findTheme(id);
        toast(I18N.fmt(I18N.t("theme_changed"), { nom: t ? ((t.emoji ? `${t.emoji  } ` : "") + t.nom) : id }));
      });
      $("btn-home-unlock").addEventListener("click", () => {
        const s = Store.getSettings();
        if (!s.themePass || $("home-theme-pass").value === s.themePass) {
          themeUnlocked = true;
          themePending = null;
          const rowPass = $("row-home-theme-pass");
          if (rowPass) rowPass.classList.add("hidden");
          toast(I18N.t("theme_pass_ok"));
        } else {
          toast(I18N.t("theme_pass_ko"));
        }
      });
      $("home-theme-pass").addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); $("btn-home-unlock").click(); }
      });
      $("btn-home-logout").addEventListener("click", () => {
        if (!Store.getActive()) { toast("Aucun profil actif."); return; }
        Store.logout();
        renderHome(); renderProfiles();
        showScreen("home");
        toast("Déconnecté. Rechoisissez un profil pour jouer.");
      });
    }
    const list = typeof THEMES !== "undefined" ? THEMES : [];
    sel.innerHTML = list.map((t) =>
      `<option value="${esc(t.id)}">${esc((t.emoji ? `${t.emoji  } ` : "") + t.nom)}</option>`).join("");
    sel.value = Store.getSettings().theme || "defaut";
    const s2 = Store.getSettings();
    const hintH = $("row-home-lock-hint");
    if (hintH) hintH.classList.toggle("hidden", !s2.themePass);
    const rowPassH = $("row-home-theme-pass");
    if (rowPassH) rowPassH.classList.toggle("hidden", !s2.themePass);
  }

  function updateNightBadge() {
    $("btn-night").classList.toggle("on", Store.getSettings().night);
  }

  /* ---------- Détection de l'adresse réseau du serveur ---------- */
  let netInfoLoaded = false;
  function loadServerInfo() {
    const panel = $("net-panel");
    if (!panel || netInfoLoaded) return;
    netInfoLoaded = true;
    fetch("api/ip", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("http"))))
      .then((info) => {
        if (!info || !info.url) return;
        const urlEl = $("net-url");
        const qrEl = $("net-qr");
        if (urlEl) urlEl.textContent = info.url;
        if (qrEl && typeof qrcode === "function") {
          try {
            const qr = qrcode(0, "M");
            qr.addData(info.url);
            qr.make();
            qrEl.innerHTML = qr.createSvgTag(3, 2);
          } catch (e) { /* QR indisponible : l'adresse suffit */ }
        }
        panel.classList.remove("hidden");
      })
      .catch(() => { /* pas de serveur réseau (hors-ligne) : panneau masqué */ });
  }

  /* Affiche l'emblème du profil : émoticône choisie, sinon initiale colorée. */
  function avatarHTML(p, extraCls) {
    const glyph = (p.emoji && p.emoji.trim()) ? p.emoji : esc((p.name[0] || "?").toUpperCase());
    return `<span class="avatar ${extraCls || ""}" style="background:${p.avatar}">${glyph}</span>`;
  }

  /* ---------- PROFIL ---------- */
  function renderProfiles() {
    const list = $("profile-list");
    const profiles = Store.getProfiles();
    const active = Store.getActive();
    if (!profiles.length) {
      list.innerHTML = '<p class="note">Aucun profil pour le moment.</p>';
      return;
    }
    list.innerHTML = profiles.map((p) => `
      <div class="profile-item ${active && active.id === p.id ? "selected" : ""}">
        ${avatarHTML(p)}
        <div class="profile-info">
          <strong>${esc(p.name)}</strong>
          <small>${p.completed.length}/${BALISES.length} balises · ⭐ ${p.stars}</small>
        </div>
        <button class="mini-btn" data-ren="${p.id}" title="${esc(I18N.t("prof_rename"))}" aria-label="${esc(I18N.t("prof_rename"))}">✏️</button>
        <button class="mini-btn" data-act="${p.id}">${active && active.id === p.id ? "Actif" : "Choisir"}</button>
        <button class="mini-btn mini-del" data-del="${p.id}" title="Supprimer">✕</button>
      </div>`).join("");

    list.querySelectorAll("[data-ren]").forEach((b) => {
      b.addEventListener("click", () => {
        const p = Store.getProfiles().find((x) => x.id === b.dataset.ren);
        if (!p) return;
        const name = prompt("Nouveau nom :", p.name);
        const trimmed = name ? name.trim() : "";
        if (trimmed && trimmed !== p.name) {
          Store.updateProfile(p.id, { name: trimmed });
          renderProfiles(); renderHome();
          toast("Nom modifié.");
        }
      });
    });

    list.querySelectorAll("[data-act]").forEach((b) => {
      b.addEventListener("click", () => {
        Store.setActive(b.dataset.act);
        syncGameState();
        renderProfiles(); renderHome(); applySettings(); toast("Profil actif sélectionné.");
        syncValidations(true);
      });
    });
    list.querySelectorAll("[data-del]").forEach((b) => {
      b.addEventListener("click", () => {
        if (confirm("Supprimer ce profil ?")) {
          Store.deleteProfile(b.dataset.del);
          renderProfiles(); renderHome();
        }
      });
    });
    const logoutBtn = $("btn-logout");
    if (logoutBtn) logoutBtn.classList.toggle("hidden", !active);
  }

  function buildAvatarRow() {
    const row = $("avatar-row");
    const colors = ["#0c8f4f", "#2f6fd0", "#d96c2b", "#a1338f", "#e0a800", "#e05b5b", "#3aa89e"];
    let chosen = colors[0];
    row.innerHTML = colors.map((c) =>
      `<button type="button" class="avatar-btn" data-c="${c}" style="background:${c}"></button>`).join("");
    row.querySelectorAll(".avatar-btn").forEach((b) => {
      b.addEventListener("click", () => {
        chosen = b.dataset.c;
        row.querySelectorAll(".avatar-btn").forEach((x) => x.classList.remove("sel"));
        b.classList.add("sel");
      });
    });
    row.querySelector(".avatar-btn").classList.add("sel");
    return () => chosen;
  }

  function buildEmojiRow() {
    const row = $("emoji-pick-row");
    const emojis = ["👨‍👩‍👧‍👦", "🧠", "💡", "🔍", "⭐", "🦊", "🌙", "🦋", "🚲", "🧭"];
    let chosen = emojis[0];
    row.innerHTML = emojis.map((e) =>
      `<button type="button" class="family-emoji-btn" data-e="${e}">${e}</button>`).join("");
    row.querySelectorAll(".family-emoji-btn").forEach((b) => {
      b.addEventListener("click", () => {
        chosen = b.dataset.e;
        row.querySelectorAll(".family-emoji-btn").forEach((x) => x.classList.remove("sel"));
        b.classList.add("sel");
      });
    });
    row.querySelector(".family-emoji-btn").classList.add("sel");
    return () => chosen;
  }

  function buildModeRow() {
    const row = $("mode-row");
    if (!row) return () => "classic";
    const hint = $("mode-hint");
    const hints = {
      classic: "prof_mode_hint_classic",
      random: "prof_mode_hint_random",
      race: "prof_mode_hint_race",
    };
    let chosen = "classic";
    const paint = (m) => {
      chosen = m;
      row.querySelectorAll(".mode-btn").forEach((x) => x.classList.toggle("sel", x.dataset.mode === m));
      if (hint) hint.textContent = I18N.t(hints[m]);
    };
    row.addEventListener("click", (e) => {
      const btn = e.target.closest(".mode-btn");
      if (btn) paint(btn.dataset.mode);
    });
    paint("classic");
    return () => chosen;
  }

  /* ---------- CARTE ---------- */
  function renderMap() {
    updateMapButton();
    const p = Store.getActive();
    const welcome = $("map-welcome");
    if (!p) {
      welcome.innerHTML = '<div class="banner-inner">Choisis d\'abord un profil pour jouer.</div>';
      $("map-note").textContent = "";
    } else {
      const target = currentTarget();
      welcome.innerHTML = target
        ? `<div class="banner-inner"><strong>Étape en cours</strong> : ${esc(target.label)}<br>
           <small>Scanne la balise <strong>${esc(target.id)}</strong> sur place (QR) ou valide par GPS.</small></div>`
        : '<div class="banner-inner">🎉 Parcours terminé ! Toutes les balises sont validées.</div>';
    }

    const svg = $("site-map");
    svg.innerHTML = buildSvgMap();
    updateRaceTimer();

    if (p && !currentTarget()) {
      $("map-note").textContent = "Bravo ! Votre famille est dans le palmarès de la semaine.";
    } else if (!Store.getSettings().night) {
      $("map-note").textContent = "🌙 Certaines balises nocturnes ne se révèlent qu'à la nuit tombée.";
    } else {
      $("map-note").textContent = "";
    }

    if (p) startGps();
    if (p && Store.getSettings().hints && Store.getSettings().sound) AudioSys.startProximity(currentTarget());

    const cp = $("compass-panel");
    if (cp) cp.classList.toggle("hidden", !(p && currentTarget()));
    if (p && currentTarget()) updateCompassTarget();
  }

  function buildSvgMap() {
    const p = Store.getActive();
    const parts = [];
    parts.push('<rect class="map-bg" x="0" y="0" width="480" height="620" rx="18"/>');
    // rivière / mare
    parts.push('<ellipse class="map-water" cx="210" cy="560" rx="150" ry="52"/>');
    parts.push('<ellipse class="map-water" cx="210" cy="560" rx="120" ry="34"/>');
    // prairies
    parts.push('<ellipse class="map-meadow" cx="430" cy="120" rx="120" ry="60"/>');
    parts.push('<ellipse class="map-meadow" cx="70" cy="190" rx="90" ry="50"/>');
    // arbres (forêt)
    const trees = [[60,70],[110,90],[160,80],[210,110],[260,90],[300,70],[350,120],[400,90],
      [50,240],[95,250],[430,240],[380,250],[450,300],[40,340],[90,330],[150,310],[430,340]];
    trees.forEach(([x, y]) => {
      parts.push(`<g class="map-tree"><circle cx="${x}" cy="${y}" r="20"/><circle cx="${x-10}" cy="${y+12}" r="14"/><circle cx="${x+10}" cy="${y+12}" r="14"/></g>`);
    });
    // sentier
    const d = TRAIL.path.map(([x, y], i) => `${(i ? "L" : "M") + x  } ${  y}`).join(" ");
    parts.push(`<path class="map-trail" d="${d}" />`);
    // balises
    BALISES.forEach((b, i) => {
      const bird = getBird(b.bird);
      const done = p && Store.isDone(b.id);
      const isTarget = p && currentTarget() && currentTarget().id === b.id;
      const cls = done ? "balise done" : (isTarget ? "balise target" : "balise locked");
      const night = bird.categorie === "nocturne";
      parts.push(`<g class="${cls}" data-balise="${b.id}">
        <circle cx="${b.x}" cy="${b.y}" r="16"/>
        <text class="balise-num" x="${b.x}" y="${b.y + 5}">${i + 1}</text>
        ${done ? `<text class="balise-check" x="${b.x}" y="${b.y + 5}">✓</text>` : ""}
        ${night ? `<text class="balise-moon" x="${b.x + 14}" y="${b.y - 14}">🌙</text>` : ""}
      </g>`);
      parts.push(`<text class="balise-label ${isTarget ? "lbl-target" : ""}" x="${b.x}" y="${b.y + 34}">${esc(b.label)}</text>`);
    });
    // point GPS
    parts.push('<g id="gps-dot" style="display:none"><circle cx="0" cy="0" r="9" class="gps-core"/><circle cx="0" cy="0" r="16" class="gps-ring"/></g>');
    return parts.join("");
  }

  function startGps() {
    if (!navigator.geolocation) {
      $("map-note").textContent += " (GPS indisponible sur cet appareil : utilisez le QR code.)";
      return;
    }
    if (!window.isSecureContext) return;
    if (App.watchId != null) return;
    App.watchId = navigator.geolocation.watchPosition(
      (pos) => { App.lastPos = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy }; reportPos(); },
      null,
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  }

  /* --- Télémétrie des familles (tableau de bord : réseau, batterie, photo, GPS) --- */
  const Telem = { bat: null, chg: null, cam: "" };
  function telemBody(p) {
    let net = "";
    try { net = (navigator.connection && navigator.connection.effectiveType) || ""; } catch (e) {}
    return {
      team: p.name,
      online: navigator.onLine ? 1 : 0,
      netType: net,
      bat: Telem.bat,
      chg: Telem.chg === true ? 1 : 0,
      cam: Telem.cam,
      acc: App.lastPos && App.lastPos.acc != null ? Math.round(App.lastPos.acc) : null,
    };
  }
  function postTelemetry(extra) {
    const p = Store.getActive();
    if (!p || isGodProfile(p)) return;
    const body = Object.assign(telemBody(p), extra || {});
    fetch("/api/pos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});
  }

  /* --- Suivi des équipes (tableau de bord organisateur) --- */
  let lastPosReport = 0;
  function reportPos() {
    const p = Store.getActive();
    if (!p || !App.lastPos || isGodProfile(p)) return;
    const now = Date.now();
    if (now - lastPosReport < 10000) return;
    lastPosReport = now;
    postTelemetry({ lat: App.lastPos.lat, lng: App.lastPos.lng });
  }
  (function initTelemetry() {
    try {
      if (navigator.getBattery) {
        navigator.getBattery().then((b) => {
          const upd = () => { Telem.bat = Math.round(b.level * 100); Telem.chg = !!b.charging; };
          upd();
          b.addEventListener("levelchange", upd);
          b.addEventListener("chargingchange", upd);
        }).catch(() => {});
      }
    } catch (e) {}
    try {
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: "camera" }).then((st) => {
          Telem.cam = st.state || "";
          st.onchange = () => { Telem.cam = st.state || ""; };
        }).catch(() => {});
      }
    } catch (e) {}
  })();
  setInterval(() => {
    const p = Store.getActive();
    if (p && !isGodProfile(p)) postTelemetry(App.lastPos ? { lat: App.lastPos.lat, lng: App.lastPos.lng } : null);
  }, 20000);

  /* --- Synchronisation des balises validées avec le tableau de bord --- */
  function postValidation(team, baliseId) {
    try {
      fetch("/api/validations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team, balise: baliseId }),
      }).catch(() => {});
    } catch (e) {}
  }

  let lastValSync = 0;
  function syncValidations(force) {
    const p = Store.getActive();
    if (!p || isGodProfile(p)) return;
    const now = Date.now();
    if (!force && now - lastValSync < 60000) return;
    lastValSync = now;
    fetch("/api/validations", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const all = (d && d.validations) || {};
        const serverList = [];
        Object.keys(all).forEach((k) => {
          if (String(k).toLowerCase() === p.name.toLowerCase()) serverList.push(...(all[k] || []));
        });
        const local = p.completed || [];
        const toApply = serverList.filter((id) => local.indexOf(id) < 0);
        if (toApply.length) {
          toApply.forEach((id) => {
            const bb = getBalise(id);
            Store.unlockBalise(id, bb ? bb.bird : null, 0);
          });
          toast(`✅ ${  toApply.length  } balise(s) validée(s) par l'organisateur.`);
          if (Store.getActive().completed.length >= BALISES.length) toast("🎉 Toutes les balises sont validées !");
          if (App.screen === "home") renderHome();
          if (App.screen === "map") renderMap();
        }
      })
      .catch(() => {});
  }

  /* ---------- Alerte Urgence (participant) ---------- */
  function openUrgencyModal() {
    const p = Store.getActive();
    if (!p) { toast(I18N.t("urgency_no_profile")); return; }
    const msg = $("urgency-msg");
    if (msg) msg.value = "";
    $("urgency-modal").classList.remove("hidden");
    $("urgency-emergency-panel").classList.add("hidden");
    $("urgency-status").textContent = "";
  }

  function closeUrgencyModal() {
    $("urgency-modal").classList.add("hidden");
  }

  function currentUrgencyPos(cb) {
    if (App.lastPos) { cb(App.lastPos.lat, App.lastPos.lng); return; }
    if (!navigator.geolocation) { cb(0, 0); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => cb(pos.coords.latitude, pos.coords.longitude),
      () => cb(0, 0),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 }
    );
  }

  function sendUrgency(type, message) {
    const p = Store.getActive();
    if (!p) { toast(I18N.t("urgency_no_profile")); return; }
    if (type === "message" && !(message || "").trim()) { return; }
    currentUrgencyPos((lat, lng) => {
      const st = $("urgency-status");
      st.textContent = I18N.t("urgency_sending");
      const body = { team: p.name, type, lat, lng };
      if (type === "message") {
        body.message = (message || "").trim();
        body.lang = ((I18N && I18N.region) || "fr").split("-")[0].toLowerCase();
      }
      fetch("/api/urgency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then((r) => r.json())
        .then((j) => {
          if (j && j.ok) {
            st.textContent = I18N.t("urgency_sent");
            AudioSys.blip(660);
            setTimeout(() => { closeUrgencyModal(); toast(I18N.t("urgency_sent")); }, 900);
          } else {
            st.textContent = I18N.t("urgency_failed");
          }
        })
        .catch(() => { st.textContent = I18N.t("urgency_failed"); });
    });
  }

  function onUrgLost() {
    sendUrgency("lost");
  }

  function onUrgEmergency() {
    $("urgency-emergency-panel").classList.remove("hidden");
    $("urgency-status").textContent = "";
  }

  function onUrgMessage() {
    const msg = $("urgency-msg");
    if (!(msg.value || "").trim()) {
      $("urgency-status").textContent = I18N.t("urgency_msg_empty");
      return;
    }
    sendUrgency("message", msg.value);
  }

  /* Garde la meilleure fixe GPS sur une fenêtre courte (précision maximale). */
  function gpsBestFix(maxMs, goodEnough, onAcc) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error("GPS indisponible")); return; }
      let best = null, done = false, watchId = null;
      const accOf = (p) => (p.coords.accuracy == null ? 9999 : p.coords.accuracy);
      const stop = () => { if (watchId != null) { navigator.geolocation.clearWatch(watchId); watchId = null; } };
      const finish = () => { if (done) return; done = true; stop(); if (best) resolve(best); else reject(new Error("aucune position")); };
      const t0 = Date.now();
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (!best || accOf(pos) < accOf(best)) best = pos;
          if (onAcc) { try { onAcc(accOf(pos)); } catch (e) {} }
          if (accOf(pos) <= goodEnough || Date.now() - t0 >= maxMs) finish();
        },
        (err) => { if (!done && !best) { done = true; stop(); reject(err); } },
        { enableHighAccuracy: true, maximumAge: 0, timeout: maxMs }
      );
      setTimeout(finish, maxMs + 1500);
    });
  }

  async function onGpsPressed() {
    const t = currentTarget();
    if (!t) { toast("Toutes les balises sont déjà validées. 🎉"); return; }
    if (!navigator.geolocation) { toast("GPS indisponible sur cet appareil."); return; }
    if (!window.isSecureContext) {
      toast("GPS bloqué : page chargée hors contexte sécurisé. Rechargez via https://localhost:8443 (ou l'adresse HTTPS affichée par le serveur).");
      return;
    }
    const r = Number.isFinite(t.radius) && t.radius > 0 ? t.radius : SITE.proximityRadius;
    toast("🎯 Recherche de la position la plus précise…");
    try {
      const pos = await gpsBestFix(10000, 5, null);
      const d = AudioSys.haversine(pos.coords.latitude, pos.coords.longitude, t.lat, t.lng);
      if (d <= r) {
        toast("Vous êtes sur la balise ! ✔");
        handleBaliseFound(t, "gps");
      } else {
        const m = Math.round(d);
        toast(`Encore ~${m} m pour rejoindre la balise ${t.id}. Les indices sonores t'aident ! 🔈`);
      }
    } catch (e) {
      toast("Position introuvable : vérifiez le GPS.");
    }
  }

  /* ---------- FLUX DE VALIDATION ---------- */
  function handleBaliseFound(balise, mode) {
    const p = Store.getActive();
    if (!p) { toast("Choisis d'abord un profil !"); showScreen("profile"); return; }

    const validation = GF.validateBaliseFound({
      balise,
      mode,
      ctx: {
        getActive: Store.getActive,
        isDone: Store.isDone,
        currentTarget,
      },
    });
    if (!validation.ok) {
      const messages = {
        already_done: "Cette balise est déjà validée. Bravo ! ✔",
        wrong_order: `Ce n'est pas encore votre étape. Cherchez la balise ${validation.target.id}.`,
      };
      toast(messages[validation.reason] || "Erreur.");
      return;
    }

    App.target = balise;
    const action = GF.resolveBaliseAction({
      balise,
      ctx: {
        raceEnabled: Store.raceEnabled,
        isRiddleSolved: (id) => p.riddles && p.riddles[id],
        getDifficulty: () => Store.getSettings().difficulty,
        getEnigme,
      },
    });

    if (action.action === "unlock_and_reveal") {
      engine.emit(BALISE_FOUND, { balise, mode: "race" });
      revealBird(balise, true);
    } else if (action.action === "show_riddle") {
      showRiddle(balise);
    } else {
      revealBird(balise);
    }
  }

  function showRiddle(balise) {
    App.riddleMode = "unlock";
    App.currentEnigme = getEnigme(balise, Store.getSettings().difficulty) || null;
    showScreen("riddle");
    $("riddle-text").textContent = App.currentEnigme ? App.currentEnigme.text : "";
    $("riddle-status").textContent = "";
    $("riddle-input").value = "";
    $("riddle-hint-box") && $("riddle-hint-box").remove();
    $("riddle-saviez") && $("riddle-saviez").classList.add("hidden");
    renderRiddleImg(balise);
    App.target = balise;
    $("riddle-input").focus();
    AudioSys.stop();
  }

  function renderRiddleImg(balise) {
    const wrap = $("riddle-img-wrap");
    if (!wrap) return;
    const img = $("riddle-img");
    if (balise && balise.hintImg) {
      img.src = balise.hintImg;
      img.alt = balise.label || "Énigme";
      wrap.classList.remove("hidden");
      img.onerror = () => wrap.classList.add("hidden");
    } else {
      img.removeAttribute("src");
      wrap.classList.add("hidden");
    }
  }

  function submitRiddle(e) {
    e.preventDefault();
    const b = App.target;
    const enigme = App.currentEnigme;
    if (!b || !enigme) return;
    const ans = $("riddle-input").value;
    if (GF.checkRiddleAnswer({ enigme, answer: ans, checkAnswer }).correct) {
      engine.emit(RIDDLE_SOLVED, { balise: b, answer: ans });
      const p = Store.getActive();
      Store.updateProfile(p.id, { riddles: Object.assign({}, p.riddles, { [b.id]: true }) });
      $("riddle-status").textContent = "✔ Bravo, c'est la bonne réponse !";
      $("riddle-status").style.color = "var(--ok)";
      AudioSys.blip(880);
      if (App.riddleMode === "clue") {
        setTimeout(() => { toast(`Balise ${  b.id  } déverrouillée. À vous de la trouver sur le terrain !`); showScreen("map"); renderMap(); }, 900);
      } else {
        setTimeout(() => revealBird(b), 900);
      }
    } else {
      $("riddle-status").textContent = "❌ Pas tout à fait… essaie encore ! (💡 indice si besoin)";
      $("riddle-status").style.color = "var(--err)";
      AudioSys.blip(220);
      analytics.recordEnigmeAttempt(visibleBalise(b), false);
    }
  }

  function revealBird(balise, race) {
    const bird = getBird(balise.bird);
    engine.emit(BIRD_REVEALED, { bird, balise, playSong: !race });
    const enigme = getEnigme(balise, Store.getSettings().difficulty);
    const saviez = enigme && enigme.saviez ? enigme.saviez : "";
    const done = Store.getActive().completed.length;
    App.activeBird = bird;
    showScreen("bird");
    const card = $("bird-card");
    card.innerHTML = `
      ${bird.img && !race
        ? `<img class="bird-illustration-img" src="${bird.img}" alt="${esc(bird.nom)}" loading="lazy">`
        : `<div class="bird-illustration" style="--bird:${bird.couleur}">${bird.emoji}</div>`}
      <h2 class="bird-name">${esc(birdLabel(bird))}</h2>
      <p class="bird-latin">${esc(bird.latin)}</p>
      <div class="bird-tags">
        <span class="tag">Taille : ${bird.taille}</span>
        <span class="tag ${bird.categorie === "nocturne" ? "tag-night" : ""}">${bird.categorie === "nocturne" ? I18N.t("bird_nocturne") : I18N.t("bird_diurne")}</span>
      </div>
      <div class="bird-anecdotes">
        <p class="kicker">${I18N.t("bird_stories")}</p>
        <ul>${bird.anecdotes.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
      </div>
      ${saviez && !race ? `<div class="saviez"><strong>${I18N.t("riddle_saviez")}</strong> ${esc(saviez)}</div>` : ""}
      <button class="btn btn-primary" id="btn-bird-sound">${I18N.t("bird_btn_sound")}</button>
      ${race ? "" : `<button class="btn btn-ghost" id="btn-bird-photo">${I18N.t("bird_btn_photo")}</button>`}
      ${race
        ? `<button class="btn btn-primary btn-big" id="btn-bird-next">${done >= BALISES.length ? "🏁 Voir le résultat final" : "→ Balise suivante (tirée au sort)"}</button>`
        : `<button class="btn btn-primary btn-big" id="btn-bird-quiz">${I18N.t("bird_btn_quiz")}</button>`}
      <div class="offer-box" id="offer-box"></div>`;

    $("btn-bird-sound").addEventListener("click", () => {
      if (bird.audioFile) {
        const a = new Audio(bird.audioFile);
        a.volume = (Store.getSettings().volume || 80) / 100;
        a.play().catch(() => toast("Audio non disponible."));
      } else {
        const ok = AudioSys.playBird(bird, 1);
        if (!ok) toast("Le son est désactivé dans les réglages.");
        else toast("🎵 Écoute bien… c'est cette signature que tu entendras sur le terrain !");
      }
    });
    const photoBtn = $("btn-bird-photo");
    if (photoBtn) photoBtn.addEventListener("click", () =>
      toast(bird.img ? "Photo en cours d'affichage." : "Ajoutez une photo dans le dossier img/ (champ img de data.js)."));
    if (race) {
      $("btn-bird-next").addEventListener("click", () => {
        if (done >= BALISES.length) { finishRun(); return; }
        const next = currentTarget();
        toast(`✔ Balise validée. Prochaine étape (ordre aléatoire) : ${  next ? next.label : "fin du parcours"  } !`);
        showScreen("map"); renderMap();
      });
      return;
    }
    $("btn-bird-quiz").addEventListener("click", () => startQuiz(bird));
    renderOffer(balise);
  }

  /* Graines : à chaque bonne réponse, la famille peut
     planter une graine (stock distribué en début de jeu). */
  function renderOffer(balise) {
    const box = $("offer-box");
    if (!box) return;
    const p = Store.getActive();
    const remaining = p ? Store.seedsLeft(p.id) : 0;
    const already = p && (p.offeredBirds || []).includes(balise.id);
    if (Store.canOffer(balise.id)) {
      box.innerHTML = `
        <p class="kicker">${I18N.t("seeds_kicker")}</p>
        <p class="offer-text">${I18N.fmt(I18N.t("seeds_stock"), { n: remaining })}</p>
        <button class="btn btn-ghost" id="btn-offer-seed">${I18N.t("seeds_btn")}</button>`;
      $("btn-offer-seed").addEventListener("click", () => {
        if (Store.offerSeed(balise.id)) {
          AudioSys.blip(720);
          toast(I18N.fmt(I18N.t("seeds_offered"), { n: Store.getActive().offered }));
          renderOffer(balise);
          renderHome();
        } else {
          toast(I18N.t("seeds_none"));
        }
      });
    } else if (already) {
      box.innerHTML = `<p class="offer-text">${I18N.t("seeds_all_offered")}</p>`;
    } else if (remaining <= 0) {
      box.innerHTML = `<p class="offer-text">${I18N.t("seeds_none")}</p>`;
    } else {
      box.innerHTML = "";
    }
  }

  /* ---------- QUIZ (logique pure → GameFlow) ---------- */
  const GF = window.GameFlow;

  function startQuiz(bird) {
    App.quiz = GF.createQuizSession({ bird, makeQuiz });
    if (App.target) analytics.startQuiz(App.target.id, App.quiz.questions.length);
    showScreen("quiz");
    renderQuiz();
  }

  function renderQuiz() {
    const card = $("quiz-card");
    const q = App.quiz.questions[App.quiz.index];
    if (!q) return endQuiz();
    const bird = getBird(q.bird);
    card.innerHTML = `
      <p class="kicker">${I18N.t("title_quiz")} ${App.quiz.index + 1} / ${App.quiz.questions.length} — ${esc(birdLabel(bird))}</p>
      <h3 class="quiz-q">${esc(q.q)}</h3>
      <div class="quiz-options">
        ${q.options.map((opt, i) => `<button class="quiz-opt" data-i="${i}">${esc(opt)}</button>`).join("")}
      </div>
      <p class="note" id="quiz-feedback"></p>`;
    card.querySelectorAll(".quiz-opt").forEach((b) => {
      b.addEventListener("click", () => {
        const result = GF.answerQuizQuestion({ session: App.quiz, selectedIndex: +b.dataset.i });
        App.quiz = result.session;
        if (App.target) analytics.recordQuizAnswer(App.target.id, result.correct);
        const fb = $("quiz-feedback");
        card.querySelectorAll(".quiz-opt").forEach((x) => x.disabled = true);
        b.classList.add(result.correct ? "good" : "bad");
        if (result.correct) {
          fb.textContent = "✔ Bien joué !";
          fb.style.color = "var(--ok)";
          AudioSys.blip(880);
        } else {
          card.querySelectorAll(".quiz-opt")[result.correctIndex].classList.add("good");
          fb.textContent = `❌ Pas grave, on retient : ${  q.options[result.correctIndex]}`;
          fb.style.color = "var(--err)";
          AudioSys.blip(220);
        }
        setTimeout(() => renderQuiz(), 1400);
      });
    });
  }

  function endQuiz() {
    const card = $("quiz-card");
    const b = App.target;
    const bird = App.activeBird || getBird(b.bird);
    const p = Store.getActive();
    const done = p.completed.length;

    const qr = GF.quizResult({ session: App.quiz });
    const qe = GF.resolveQuizEnd({
      session: App.quiz,
      balise: b,
      ctx: {
        balisesCount: BALISES.length,
        completedCount: done,
        nextBalise,
      },
    });

    engine.emit(QUIZ_COMPLETED, { bird, balise: b, score: qr.score, total: qr.total });
    postValidation(p.name, b.id);

    if (qr.perfect) {
      card.innerHTML = `
        <div class="quiz-end">
          <div class="big-emoji">🎉</div>
          <h3>${esc(birdLabel(bird))} est dans votre carnet !</h3>
          <p>Vous avez validé ${done}/${BALISES.length} balises.</p>
          <button class="btn btn-primary" id="btn-next-step">${done >= BALISES.length ? "🏁 Voir le résultat final" : "→ Enigme pour la suite"}</button>
          <button class="btn btn-ghost" id="btn-back-map">🗺️ Retour à la carte</button>
        </div>`;
      $("btn-next-step").addEventListener("click", () => {
        if (qe.action === "finish_run") {
          finishRun();
        } else {
          showNextRiddle(qe.next);
        }
      });
      $("btn-back-map").addEventListener("click", () => showScreen("map"));
      renderMap();
    } else {
      renderHome(); renderMap();
      if (qe.action === "finish_run") {
        finishRun();
      } else {
        toast(`Balise ${  b.id  } déverrouillée (⭐ ${  qr.score  }). Prochaine étape : ${  qe.next ? qe.next.label : "fin du parcours"  } !`);
        showScreen("map");
      }
    }
  }

  function showNextRiddle(next) {
    App.riddleMode = "clue";
    App.target = next;
    App.currentEnigme = getEnigme(next, Store.getSettings().difficulty) || null;
    showScreen("riddle");
    $("riddle-text").textContent = `Prochaine balise : ${  next.label  }.\n\n${  App.currentEnigme ? App.currentEnigme.text : ""}`;
    $("riddle-status").textContent = "Trouve la réponse pour déverrouiller la suite (ou scanne la balise sur place).";
    $("riddle-status").style.color = "var(--text-muted)";
    $("riddle-input").value = "";
    $("riddle-hint-box") && $("riddle-hint-box").remove();
    updateSaviez();
    renderRiddleImg(next);
    AudioSys.stop();
  }

  function postFinish(p) {
    try {
      fetch("/api/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team: p.name,
          stars: p.stars || 0,
          seconds: p.seconds || 0,
          balises: (p.completed || []).length,
          offered: p.offered || 0,
          message: p.message || "",
          selfie: p.selfie || ""
        })
      }).catch(() => {});
    } catch (e) {}
  }

  function finishRun() {
    const p = Store.getActive();
    Store.tickTimer();
    Store.finishWeek(p.id);
    engine.emit(RUN_FINISHED, { profile: p });
  }

  /* Récap du parcours terminé (écran de conclusion) */
  function renderEndScreen(p) {
    const box = $("end-stats");
    if (!box) return;
    const done = p.completed.length;
    const time = fmtTime(p.seconds);
    const stars = p.stars;
    const seeds = p.offered;
    const concl = done >= BALISES.length
      ? I18N.t("end_concl_great")
      : done >= Math.ceil(BALISES.length / 2)
        ? I18N.t("end_concl_good")
        : I18N.t("end_concl_ok");
    box.innerHTML = `
      <div class="end-stats-grid">
        <div class="end-stat"><span class="end-stat-icon">🧠</span><strong>${done}/${BALISES.length}</strong><small>${I18N.t("end_stat_birds")}</small></div>
        <div class="end-stat"><span class="end-stat-icon">⭐</span><strong>${stars}</strong><small>${I18N.t("end_stat_stars")}</small></div>
        <div class="end-stat"><span class="end-stat-icon">${ico("timer")}</span><strong>${time}</strong><small>${I18N.t("end_stat_time")}</small></div>
        <div class="end-stat"><span class="end-stat-icon">🌻</span><strong>${seeds}</strong><small>${I18N.t("end_stat_seeds")}</small></div>
      </div>
      <p class="end-conclusion">${concl}</p>`;
  }

  /* ---------- MODE COURSE ---------- */
  function raceConfigured() {
    const p = Store.getActive();
    return !!(p && Array.isArray(p.raceOrder) && p.raceOrder.length);
  }

  function openRaceSetup() {
    const p = Store.getActive();
    if (!p) { toast(I18N.t("race_need_profile")); return; }
    $("race-overlay").classList.remove("hidden");
    const box = $("race-opponents");
    box.innerHTML = `<p class="empty">${  I18N.t("race_opp_loading")  }</p>`;
    fetch("/api/pos").then((r) => r.json()).then((d) => {
      const list = d.positions || [];
      const names = [];
      list.forEach((t) => {
        const n = String(t.team || "").trim();
        if (n && n.toLowerCase() !== p.name.toLowerCase() && names.indexOf(n) < 0) names.push(n);
      });
      if (!names.length) {
        box.innerHTML = `<p class="empty">${  I18N.t("race_opp_none")  }</p>`;
      } else {
        box.innerHTML = names.map((n) =>
          `<label class="race-opp"><input type="checkbox" value="${  esc(n)  }" checked> <span>${  esc(n)  }</span></label>`
        ).join("");
      }
    }).catch(() => {
      box.innerHTML = `<p class="empty">${  I18N.t("race_opp_offline")  }</p>`;
    });
  }

  function closeRaceSetup() {
    $("race-overlay").classList.add("hidden");
  }

  function startRace() {
    const p = Store.getActive();
    if (!p) { toast(I18N.t("race_need_profile")); return; }
    const chosen = Array.from(document.querySelectorAll("#race-opponents input:checked")).map((c) => c.value);
    Store.setupRace(p.id, chosen, shuffle(BALISES.map((b) => b.id)));
    closeRaceSetup();
    toast(I18N.fmt(I18N.t("race_configured"), { opponents: chosen.length ? chosen.join(", ") : I18N.t("race_solo") }));
    showScreen("map"); renderMap();
  }

  function renderRaceEnd(p) {
    const wrap = $("end-race");
    const box = $("race-standings");
    if (!wrap || !box) return;
    wrap.classList.remove("hidden");
    const opponents = (p.raceOpponents || []).map((n) => n.toLowerCase());
    fetch("/api/finish").then((r) => r.json()).then((d) => {
      const fins = d.finishes || [];
      const rows = fins.filter((f) => {
        const n = String(f.team || "").toLowerCase();
        return n === p.name.toLowerCase() || opponents.indexOf(n) >= 0;
      }).filter((f) => Number(f.seconds || 0) > 0);
      if (!rows.length) {
        box.innerHTML = `<p class="empty">${  I18N.t("race_wait_others")  }</p>`;
        return;
      }
      rows.sort((a, b) => (Number(a.seconds || 0) - Number(b.seconds || 0)));
      box.innerHTML = rows.map((f, i) => {
        const me = f.team.toLowerCase() === p.name.toLowerCase();
        const medal = ["🥇", "🥈", "🥉"][i] || (i + 1);
        return `<div class="race-row ${  me ? "me" : ""  }">` +
          `<span class="race-medal">${  medal  }</span>` +
          `<b>${  esc(f.team)  }${me ? ` · ${  I18N.t("race_you")}` : ""  }</b>` +
          `<small>${ico("timer")} ${  fmtTime(Number(f.seconds || 0))  }</small>${ 
          f.message ? `<em class="palmares-msg">« ${  esc(f.message)  } »</em>` : "" 
          }</div>`;
      }).join("");
    }).catch(() => {
      box.innerHTML = `<p class="empty">${  I18N.t("race_offline")  }</p>`;
    });
  }

  /* ---------- LIVRE D'OR : selfie + note laissés en fin de parcours ---------- */
  let gbSelfie = "";
  let gbStream = null;

  function openGuestbook() {
    const p = Store.getActive();
    if (!p) { toast("Crée d'abord un profil."); return; }
    gbSelfie = p.selfie || "";
    $("gb-note").value = p.message || "";
    renderGuestbookSelfie();
    $("guestbook").classList.remove("hidden");
  }

  function closeGuestbook() {
    stopSelfieCam();
    $("guestbook").classList.add("hidden");
  }

  function renderGuestbookSelfie() {
    const ph = $("gb-placeholder"), pv = $("gb-preview"), im = $("gb-preview-img"), rm = $("gb-remove-btn");
    if (gbSelfie) {
      ph.classList.add("hidden");
      pv.classList.remove("hidden");
      im.src = gbSelfie;
      rm.classList.remove("hidden");
    } else {
      ph.classList.remove("hidden");
      pv.classList.add("hidden");
      im.src = "";
      rm.classList.add("hidden");
    }
  }

  async function startSelfieCam() {
    try {
      gbStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      const v = $("gb-video");
      v.srcObject = gbStream;
      v.setAttribute("playsinline", "true");
      await v.play();
      v.classList.remove("hidden");
      $("gb-placeholder").classList.add("hidden");
      $("gb-capture-btn").classList.remove("hidden");
      $("gb-selfie-btn").classList.add("hidden");
    } catch (e) {
      toast(I18N.t("guestbook_cam_denied"));
      $("gb-file").click();
    }
  }

  function stopSelfieCam() {
    if (gbStream) { gbStream.getTracks().forEach((t) => t.stop()); gbStream = null; }
    const v = $("gb-video");
    v.pause(); v.srcObject = null;
    v.classList.add("hidden");
    $("gb-capture-btn").classList.add("hidden");
    $("gb-selfie-btn").classList.remove("hidden");
  }

  function selfieFromCanvas(source) {
    const max = 640;
    const scale = Math.min(1, max / (source.width || max), max / (source.height || max));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round((source.width || max) * scale));
    c.height = Math.max(1, Math.round((source.height || max) * scale));
    c.getContext("2d").drawImage(source, 0, 0, c.width, c.height);
    gbSelfie = c.toDataURL("image/jpeg", 0.72);
  }

  function captureSelfie() {
    const v = $("gb-video");
    if (!v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    selfieFromCanvas(c);
    stopSelfieCam();
    renderGuestbookSelfie();
  }

  function onSelfieFile(e) {
    const f = e.target && e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth || img.width;
        c.height = img.naturalHeight || img.height;
        c.getContext("2d").drawImage(img, 0, 0);
        selfieFromCanvas(c);
        renderGuestbookSelfie();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  }

  function removeSelfie() {
    gbSelfie = "";
    stopSelfieCam();
    renderGuestbookSelfie();
  }

  function saveGuestbook() {
    const p = Store.getActive();
    if (!p) return;
    const note = $("gb-note").value.trim();
    Store.updateProfile(p.id, { message: note, selfie: gbSelfie || "" });
    postFinish(Store.getActive());
    closeGuestbook();
    renderPalmares();
    toast(I18N.t("guestbook_saved"));
  }

  /* ---------- CARNET (délègue à window.Screens.carnet) ---------- */
  function renderCarnet() {
    window.Screens.carnet.render({
      $, esc, I18N, Store, BIRDS, BALISES, birdLabel, getBird,
      App, showScreen, showBirdOnly,
    });
  }

  /* ---------- FICHE OISEAU (délègue à window.Screens.bird) ---------- */
  function showBirdOnly(bird) {
    showScreen("bird");
    window.Screens.bird.renderCard({
      $, showScreen, esc, I18N, AudioSys, App, bird, birdLabel, BALISES,
      renderGod, renderGuide, renderCarnet,
    });
  }

  /* ---------- PALMARÈS (délègue à Screens.palmares) ---------- */
  function renderPalmares() { window.Screens.palmares.render($, Store, I18N, esc); }
  function fmtTime(s) { return window.Screens.palmares.fmtTime(s); }

  /* --- Mode course : chronomètre sur la carte --- */
  function getElapsed(p) {
    if (!p) return 0;
    return (p.seconds || 0) + Math.round((Date.now() - (p.lastTickAt || p.startTime)) / 1000);
  }

  function fmtStopwatch(s) {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${String(m).padStart(2, "0")  }:${  String(sec).padStart(2, "0")}`;
  }

  function updateRaceTimer() {
    const el = $("race-timer");
    const p = Store.getActive();
    if (!el || !p) return;
    const on = Store.raceEnabled();
    const show = on && App.screen === "map";
    el.classList.toggle("hidden", !show);
    if (show) el.innerHTML = `${ico("timer")} ${  fmtStopwatch(getElapsed(p))}`;
  }

  function sharePalmares() {
    const active = Store.getActive();
    if (!active) { toast("Crée d'abord un profil."); return; }
    const txt = `🔥 ${active.name} — Multi Jeu de Piste\n${active.completed.length}/${BALISES.length} balises, ${active.birds.length} découvertes faites, ⭐ ${active.stars}.${active.offered ? ` 🌱 ${active.offered} graines plantées.` : ""}${active.message ? `\n« ${active.message} »` : ""}`;
    if (navigator.share) {
      navigator.share({ text: txt }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(txt).then(() => toast("Résultat copié !")).catch(() => toast("Copie impossible."));
    } else {
      toast("Partage non supporté ici.");
    }
  }

  /* ---------- RECONNAISSANCE ---------- */
  async function onRecoRecord() {
    const rec = $("btn-reco-record");
    const stop = $("btn-reco-stop");
    rec.disabled = true; stop.disabled = false;
    BirdReco.setStatus("🎙️ En écoute… approchez le micro de la source sonore !");
    try {
      const session = await BirdReco.startRecording();
      setTimeout(async () => {
        if (!session) { BirdReco.setStatus("❌ Enregistrement impossible."); rec.disabled = false; stop.disabled = true; return; }
        session.stop();
        BirdReco.setStatus("⏳ Analyse du son…");
        const blob = await session.blobPromise;
        BirdReco.stopRecording();
        const out = await BirdReco.analyze(blob);
        showRecoResult(out);
        rec.disabled = false; stop.disabled = true;
      }, CONFIG.RECORD_MS);
    } catch (e) {
      BirdReco.setStatus("❌ Micro refusé ou indisponible.");
      rec.disabled = false; stop.disabled = true;
    }
  }

  function showRecoResult(out) {
    const el = $("reco-result");
    if (out.offline) {
      el.innerHTML = `
        <div class="reco-result-card offline">
          <h4>${ico("offline")} Hors-ligne</h4>
          <p>La reconnaissance automatique a besoin du réseau.<br>
          Essayez en Wi-Fi sur le site, ou faites confiance à vos oreilles : réécoutez-la dans le quiz ! 🎤</p>
          <button class="btn btn-ghost" id="btn-reco-demo">🎬 Voir une démo</button>
        </div>`;
      $("btn-reco-demo").addEventListener("click", () => showRecoResult({ ok: true, result: BirdReco.demoResult() }));
      return;
    }
    if (out.ok && out.result) {
      const r = out.result;
      const found = BIRDS.find((b) => b.nom.toLowerCase().includes(r.name.toLowerCase().split(" ")[0]) || r.name.toLowerCase().includes(b.nom.toLowerCase().split(" ")[0]));
      const pct = Math.round(r.prob * 100);
      el.innerHTML = `
        <div class="reco-result-card">
          <h4>${r.demo ? "🎬 Démo — " : "🎉 "}Je pense avoir entendu :</h4>
          <div class="reco-bird">
            <span class="reco-emoji">${found ? found.emoji : "🧠"}</span>
            <div><strong>${esc(r.name)}</strong><br>
            <small>Confiance : ${pct}%${r.sci ? ` · ${  esc(r.sci)}` : ""}</small></div>
          </div>
          ${found ? `<button class="btn btn-ghost" data-open="${found.id}">Voir la fiche de ${esc(birdLabel(found))}</button>` : ""}
        </div>`;
      const open = el.querySelector("[data-open]");
      if (open) open.addEventListener("click", () => {
        const bird = getBird(open.dataset.open);
        App.target = BALISES.find((x) => x.bird === bird.id);
        App.activeBird = bird;
        showBirdOnly(bird);
      });
    } else {
      el.innerHTML = `<div class="reco-result-card"><h4>😕 Aucun son identifié</h4><p>${esc(out.message || "Réessayez avec un son plus proche.")}</p></div>`;
    }
  }

  /* ---------- RÉGLAGES ---------- */
  /* ---- Thèmes visuels (content/themes → THEMES dans data.js) ---- */
  let themeBound = false;
  let themeUnlocked = false;
  let themePending = null;
  function findTheme(id) {
    return (typeof THEMES !== "undefined" ? THEMES : []).find((t) => t.id === id) || null;
  }
  /* Applique les variables du thème en inline sur <body> (bat body.night,
     donc pas de flash au chargement grâce au cache jdp_theme_cache). */
  function applyTheme(id) {
    const t = findTheme(id) || findTheme("defaut");
    if (!t) return;
    const meta = document.getElementById("meta-theme");
    if (t.id === "defaut") {
      const all = {};
      (typeof THEMES !== "undefined" ? THEMES : []).forEach((th) => Object.assign(all, th.vars || {}));
      Object.keys(all).forEach((k) => document.body.style.removeProperty(k));
      try { localStorage.removeItem("jdp_theme_cache"); } catch (e) {}
      if (meta) meta.content = Store.getSettings().night ? "#101822" : "#0c3b2e";
      return;
    }
    Object.keys(t.vars).forEach((k) => document.body.style.setProperty(k, t.vars[k]));
    try { localStorage.setItem("jdp_theme_cache", JSON.stringify({ id: t.id, vars: t.vars, meta: t.meta || "" })); } catch (e) {}
    if (meta && t.meta) meta.content = t.meta;
  }

  function applySettings() {
    const s = Store.getSettings();
    document.body.classList.toggle("night", s.night);
    $("set-night").checked = s.night;
    $("set-sound").checked = s.sound;
    $("set-hints").checked = s.hints;
    $("set-race").checked = Store.raceEnabled();
    const raceWarn = $("race-warning-note");
    const raceSetup = $("btn-race-setup");
    if (raceWarn) raceWarn.classList.toggle("hidden", !Store.raceEnabled());
    if (raceSetup) raceSetup.classList.toggle("hidden", !Store.raceEnabled());
    $("set-volume").value = s.volume;
    AudioSys.setVolume(s.volume);
    const alertSel = $("set-alert");
    if (alertSel) {
      alertSel.value = s.alertSound || "signature";
      const rowActions = $("row-alert-actions");
      if (rowActions) rowActions.classList.toggle("hidden", alertSel.value === "signature");
    }
    applyTheme(s.theme);
    updateNightBadge();
  }

  /* Enregistrement d'un avertisseur personnalisé (5 s max, micro du téléphone). */
  let alertRecorder = null;
  function recordCustomAlert() {
    if (alertRecorder) return;
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      toast("❌ Enregistrement non supporté sur cet appareil.");
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const rec = new MediaRecorder(stream);
      const chunks = [];
      alertRecorder = rec;
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        alertRecorder = null;
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        if (blob.size > 500000) { toast("⚠️ Trop long : visez moins de 5 secondes."); return; }
        const fr = new FileReader();
        fr.onload = () => {
          AudioSys.resetCustom();
          Store.setSettings({ alertCustom: String(fr.result), alertSound: "custom" });
          applySettings();
          toast("✅ Votre avertisseur est enregistré !");
        };
        fr.readAsDataURL(blob);
      };
      toast("🎙️ Parlez ou sifflez… (5 s max)");
      rec.start();
      setTimeout(() => { if (rec.state !== "inactive") rec.stop(); }, 5000);
    }).catch(() => toast("❌ Micro indisponible (autorisation refusée ?)"));
  }

  function updateOfflineUI() {    const pill = $("home-offline");
    const st = $("offline-status");
    const on = navigator.onLine;
    if (pill) pill.classList.toggle("hidden", on);
    if (st) st.textContent = on ? "État : connecté — préparez le hors-ligne si besoin." : "État : hors-ligne — tout est déjà disponible.";
  }

  async function cacheNow() {
    $("btn-cache").disabled = true;
    try {
      if (!navigator.serviceWorker) throw new Error("PWA non supportée.");
      const reg = await navigator.serviceWorker.ready;
      if (reg.active) reg.active.postMessage({ type: "CACHE" });
      toast("Contenu préparé pour le mode hors-ligne. ✔");
      setTimeout(async () => {
        const keys = await caches.keys();
        $("offline-status").textContent = `État : ${keys.length} cache(s) prêt(s) pour la zone blanche.`;
        $("btn-cache").disabled = false;
      }, 1500);
    } catch (e) {
      toast("Service worker indisponible (serveur http(s) requis).");
      $("btn-cache").disabled = false;
    }
  }

  /* ---------- Mise à jour : récupère le contenu local (serveur) ---------- */
  async function updateApp() {
    const btn = $("btn-update");
    const st = $("update-status");
    const set = (msg) => { if (st) st.textContent = msg; };
    if (btn) btn.disabled = true;
    set(I18N.t("set_update_checking"));
    try {
      const probe = await fetch("sw.js", { cache: "no-store" });
      if (!probe.ok) throw new Error("offline");
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg.active) reg.active.postMessage({ type: "CACHE" });
        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
        reg.update().catch(() => {});
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k.startsWith("jdp-runtime") || k.startsWith("curios-runtime")).map((k) => caches.delete(k)));
      }
      set(I18N.t("set_update_ok"));
      setTimeout(() => location.reload(true), 700);
    } catch (e) {
      set(I18N.t("set_update_fail"));
      if (btn) btn.disabled = false;
    }
  }

  /* ---------- RÉSOLUTION DE PROBLÈME : auto-diagnostic + correctifs ---------- */
  async function runTroubleshoot() {
    const box = $("trouble-results");
    if (!box) return;
    box.classList.remove("hidden");
    box.innerHTML = `<p class="trouble-title">${esc(I18N.t("trouble_running"))}</p>`;

    const items = [];

    const online = navigator.onLine;
    items.push({ key: "trouble_net", ok: online, hint: online ? "" : I18N.t("trouble_net_hint") });

    let srv = false;
    let srvUrl = "";
    try {
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), 3000);
      const res = await fetch("api/ip", { cache: "no-store", signal: ctl.signal });
      clearTimeout(to);
      srv = res.ok;
      if (srv) {
        const j = await res.json().catch(() => null);
        srvUrl = j && j.url ? j.url : "";
      }
    } catch (e) { srv = false; }
    items.push({ key: "trouble_server", ok: srv, hint: srv ? srvUrl : I18N.t("trouble_server_hint") });

    let sw = false;
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        sw = !!(reg && (reg.active || reg.installing || reg.waiting));
      }
    } catch (e) { sw = false; }
    items.push({ key: "trouble_sw", ok: sw, hint: sw ? "" : I18N.t("trouble_sw_hint") });

    let cacheOk = false;
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        const core = keys.find((k) => k.indexOf("curios-core-") === 0 || k.indexOf("jdp-core-") === 0);
        if (core) {
          const hit = await caches.match(new Request("index.html"), { cacheName: core });
          cacheOk = !!hit;
        }
      }
    } catch (e) { cacheOk = false; }
    items.push({ key: "trouble_cache", ok: cacheOk, hint: cacheOk ? "" : I18N.t("trouble_cache_hint") });

    let storageOk = false;
    try {
      localStorage.setItem("__curios_diag", "1");
      storageOk = localStorage.getItem("__curios_diag") === "1";
      localStorage.removeItem("__curios_diag");
    } catch (e) { storageOk = false; }
    items.push({ key: "trouble_storage", ok: storageOk, hint: storageOk ? "" : I18N.t("trouble_storage_hint") });

    /* v2 — diagnostic téléphone : HTTPS, GPS, caméra, boussole */
    const secure = window.isSecureContext;
    items.push({ key: "trouble_https", ok: secure, hint: secure ? "" : I18N.t("trouble_https_hint") });

    let gpsOk = false;
    let gpsHint = "";
    if (navigator.geolocation) {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const st = await navigator.permissions.query({ name: "geolocation" });
          if (st.state === "denied") gpsHint = I18N.t("trouble_gps_denied");
        } catch (e) {}
      }
      if (!gpsHint) {
        gpsOk = await new Promise((resolve) => {
          const to = setTimeout(() => resolve(false), 6000);
          navigator.geolocation.getCurrentPosition(
            () => { clearTimeout(to); resolve(true); },
            () => { clearTimeout(to); resolve(false); },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        });
        if (!gpsOk) gpsHint = I18N.t("trouble_gps_hint");
      }
    } else {
      gpsHint = I18N.t("trouble_gps_hint");
    }
    items.push({ key: "trouble_gps", ok: gpsOk, hint: gpsOk ? "" : gpsHint });

    let camOk = false;
    let camHint = "";
    try { camOk = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia); } catch (e) { camOk = false; }
    if (camOk && navigator.permissions && navigator.permissions.query) {
      try {
        const st = await navigator.permissions.query({ name: "camera" });
        if (st.state === "denied") camHint = I18N.t("trouble_camera_denied");
      } catch (e) {}
    }
    if (!camOk) camHint = I18N.t("trouble_camera_hint");
    items.push({ key: "trouble_camera", ok: camOk, hint: camHint });

    const oriOk = "DeviceOrientationEvent" in window;
    items.push({ key: "trouble_orientation", ok: oriOk, hint: oriOk ? "" : I18N.t("trouble_orientation_hint") });

    const fails = items.filter((i) => !i.ok).length;
    const summary = fails
      ? I18N.t("trouble_summary_bad").replace("{n}", String(fails))
      : I18N.t("trouble_summary_ok");

    box.innerHTML =
      `<p class="trouble-title">${fails ? ico("warning") + " " : ico("check") + " "}${esc(summary)}</p>` +
      `<ul class="trouble-list">${ 
      items.map((i) =>
        `<li class="${i.ok ? "ok" : "ko"}"><span class="trouble-mark">${i.ok ? "✓" : "✗"}</span>` +
        `<span>${esc(I18N.t(i.key))}</span>${ 
        i.hint ? `<small>${esc(i.hint)}</small>` : "" 
        }</li>`).join("") 
      }</ul>` +
      `<div class="trouble-actions">` +
      `<button class="btn btn-outline" id="btn-fix-cache">${esc(I18N.t("trouble_btn_fix"))}</button>` +
      `<button class="btn btn-outline" id="btn-trouble-reload">${esc(I18N.t("trouble_btn_reload"))}</button>` +
      `</div>`;
    $("btn-trouble-reload").addEventListener("click", () => location.reload());
    $("btn-fix-cache").addEventListener("click", fixTroubleshoot);
  }

  async function fixTroubleshoot() {
    const btn = $("btn-fix-cache");
    if (btn) btn.disabled = true;
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) await reg.unregister();
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k.indexOf("jdp-") === 0 || k.indexOf("curios-") === 0).map((k) => caches.delete(k)));
      }
    } catch (e) {}
    toast(I18N.t("trouble_fixed"));
    setTimeout(() => location.reload(true), 600);
  }

  /* ---------- BOUSSOLE ---------- */
  const EMOJI_CHAINS = {
    faces:  ["😢", "🙁", "🙂", "😄", "🤩"],
    hearts: ["💔", "🖤", "💛", "💚", "💖"],
    cats:   ["😿", "😾", "🙂", "😺", "😻"],
    moons:  ["🌑", "🌘", "🌓", "🌖", "🌝"],
  };
  const EMOJI_ORDER = ["faces", "hearts", "cats", "moons"];

  /* --- Compass UI (délègue à window.CompassUI) --- */
  const compassUI = window.CompassUI.createCompassUI({
    $, normDeg, cardinal, Store, I18N,
  });

  function stopCompass() {
    App.compassOn = false;
    Compass.stop();
    compassUI.resetLight();
    const cal = $("btn-compass-cal");
    if (cal) cal.classList.add("hidden");
    const dest = $("compass-dest");
    if (dest) dest.style.transform = "rotate(0deg)";
    const btn = $("btn-compass");
    if (btn) btn.textContent = I18N.t("compass_on");
    const body = $("compass-body");
    if (body) body.classList.add("hidden");
  }

  function updateCompassTarget() {
    const t = currentTarget();
    if (!App.compassOn) return;
    if (t) Compass.start(t, onCompassUpdate);
    else stopCompass();
  }

  function onCompassToggle() {
    if (App.compassOn) { stopCompass(); return; }
    const t = currentTarget();
    if (!t) { toast("Toutes les balises sont déjà validées. 🎉"); return; }
    App.compassOn = true;
    compassUI.resetLight();
    const cal = $("btn-compass-cal");
    if (cal) cal.classList.remove("hidden");
    try { Compass.start(t, onCompassUpdate); } catch (e) {}
    $("btn-compass").textContent = I18N.t("compass_off");
    $("compass-body").classList.remove("hidden");
    // Autorisation d'orientation (iOS) demandée en arrière-plan : l'aiguille
    // se cale ensuite. Sans elle, la boussole reste utilisable (nord en haut).
    Promise.resolve(Compass.requestPermission()).catch(() => {});
  }

  function onCompassCalibrate() {
    const t = currentTarget();
    if (!t || !App.compassOn) return;
    // Redémarre la boussole (ré-écoute des capteurs) et re-demande l'autorisation iOS.
    try { Compass.start(t, onCompassUpdate); } catch (e) {}
    Promise.resolve(Compass.requestPermission()).catch(() => {});
    toast(I18N.t("compass_cal_hint"));
    const guide = $("compass-guide");
    if (guide) guide.textContent = I18N.t("compass_cal_hint");
  }

  function onCompassUpdate(out) { compassUI.onUpdate(out); }

  /* normDeg et cardinal → packages/geolocation (GeoMath) */

  /* État de proximité partagé (lumière + émoticône) : délégué à compassUI */

   /* ---------- MODE ADMIN (délègue à window.Screens.god) ---------- */

  /* ---------- Espaces Parcours / Administrer (Phase 2) ---------- */
  function renderParcours() {
    const list = $("parcours-list");
    if (!list) return;
    const p = Store.getActive();
    const total = BALISES.length;
    const done = p ? p.completed.length : 0;

    let html = '<div class="cur-parc-item parc-current">';
    html += '<span class="parc-name">\ud83d\uddfa\ufe0f Parcours actuel</span>';
    html += `<span class="parc-sub">${total} balises \u00e0 explorer \u00b7 un sentier regroupant les parcours actifs</span>`;
    if (p) {
      html += `<span class="parc-sub">\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d\udc66 ${esc(p.name)} \u00b7 ${done}/${total} valid\u00e9es \u00b7 \u2b50 ${p.stars} \u00e9toiles</span>`;
      html += '<div class="parc-actions"><button class="btn btn-primary" id="parc-play">\u25b6 Jouer / continuer</button></div>';
    } else {
      html += '<span class="parc-sub">\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d\udc66 Pas encore de profil famille pour cette tablette.</span>';
      html += '<div class="parc-actions"><button class="btn btn-primary" id="parc-create-profile">\ud83d\udcdd Cr\u00e9er le profil de ma famille</button></div>';
    }
    html += '</div>';
    html += '<h3 class="space-subtitle">\ud83d\udce6 Packs disponibles</h3>';
    html += '<div id="parc-catalog">Chargement des packs\u2026</div>';
    list.innerHTML = html;

    const play = $("parc-play");
    if (play) play.addEventListener("click", () => { renderMap(); showScreen("map"); });
    const create = $("parc-create-profile");
    if (create) create.addEventListener("click", () => { renderProfiles(); showScreen("profile"); });

    const badge = (st) => {
      const lib = { ACTIVE: "Actif", DISABLED: "D\u00e9sactiv\u00e9", AVAILABLE: "Disponible", ERROR: "Erreur" };
      return `<span class="parc-badge badge-${esc(st)}">${lib[st] || esc(st)}</span>`;
    };
    /* Affiche une liste de packs (servie par /api/packs, sinon reconstruite
       depuis les métadonnées embarquées catalogue-data.js + ACTIVE_PACKS). */
    const renderPackList = (cat, list) => {
      if (!cat) return;
      if (!list || !list.length) {
        cat.innerHTML = '<p class="note">Aucun pack install\u00e9 pour le moment.</p>';
        return;
      }
      let out = "";
      for (const pk of list) {
        let ages = "";
        if (pk.audience) {
          if (pk.audience.minAge !== undefined && pk.audience.maxAge !== undefined) ages = pk.audience.minAge + "\u2013" + pk.audience.maxAge + " ans";
          else if (Array.isArray(pk.audience) && pk.audience.length) ages = pk.audience[0] + "\u2013" + pk.audience[1] + " ans";
        }
        const nb = pk.stations ? pk.stations + " balises" : "";
        const missions = pk.missions ? pk.missions + " missions" : "";
        const meta = [nb, missions, ages].filter(Boolean).join(" \u00b7 ");
        out += '<div class="cur-parc-item">';
        out += '<div class="parc-head"><span class="parc-name">' + esc(pk.name) + '</span>' + badge(pk.state) + '</div>';
        if (meta) out += '<div class="parc-sub">' + esc(meta) + '</div>';
        if (pk.description) out += '<div class="parc-desc">' + esc(pk.description).slice(0, 140) + (pk.description.length > 140 ? "\u2026" : "") + '</div>';
        if (pk.state !== "ACTIVE") {
          out += '<div class="parc-actions"><button class="btn btn-outline" data-activate-pack="' + esc(pk.id) + '">\ud83d\udce6 Choisir ce parcours</button></div>';
        } else {
          out += '<div class="parc-actions"><span class="parc-badge badge-ACTIVE">\u2714 Parcours actif</span></div>';
        }
        out += '</div>';
      }
      cat.innerHTML = out;
      cat.querySelectorAll("[data-activate-pack]").forEach((btn) => {
        btn.addEventListener("click", () => activatePack(btn.dataset.activatePack));
      });
    };
    const cat0 = $("parc-catalog");
    if (cat0) {
      const catData =
        (typeof window !== "undefined" && window.CATALOGUE_DATA && window.CATALOGUE_DATA.packs) || [];
      const activePacks = new Set(typeof ACTIVE_PACKS !== "undefined" ? ACTIVE_PACKS : []);
      if (catData.length) {
        renderPackList(cat0, catData.map((pp) => ({
          id: pp.id,
          name: pp.nom,
          description: pp.tagline || "",
          state: activePacks.has(pp.id) ? "ACTIVE" : "AVAILABLE",
          stations: pp.nbBalises,
          missions: undefined,
          audience: null,
        })));
      } else {
        cat0.innerHTML = '<p class="note">Chargement des packs\u2026</p>';
      }
    }
    /* Enrichissement serveur (mode npm run serve) : remplace la liste locale par
       les états réels (actif, stations, missions) quand /api/packs répond. */
    fetch("/api/packs", { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error("http"); return r.json(); })
      .then((data) => {
        const cat = $("parc-catalog");
        if (!cat) return;
        if (!data || !Array.isArray(data.packs) || !data.packs.length) return;
        renderPackList(cat, data.packs);
      })
      .catch(() => { /* La liste locale reste affichée (offline / server.ps1 / Pages). */ });
  }

  /* Active un pack côté serveur (écrit content/manifest.json + régénère
     js/data.js) puis recharge pour servir le nouveau parcours à toutes les
     tablettes. Réservé à l'organisateur (token Hub ou admin). */
  async function activatePack(id) {
    try {
      const token = window.HubAuth && window.HubAuth.getToken ? window.HubAuth.getToken() : null;
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = "Bearer " + token;
      const res = await fetch("/api/packs/activate", {
        method: "POST",
        headers,
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        if (res.status === 401) toast("Sélection réservée à l'organisateur — connectez-vous en mode Admin.");
        else if (res.status === 403) toast("Votre compte ne permet pas de changer de parcours.");
        else toast("Activation impossible. Vérifiez la connexion au serveur.");
        return;
      }
      toast("Parcours activé — rechargement…");
      setTimeout(() => location.reload(true), 500);
    } catch (e) {
      toast("Hors ligne : activez le parcours depuis l'écran organisateur.");
    }
  }

  function renderAdmin() {
    /* Carte statique : les tuiles sont reliées par data-go. */
    const el = $("screen-admin");
    if (el) return;
  }

  function renderGod() {
    window.Screens.god.render({
      $, Store, I18N, esc, isGodProfile, BALISES, SITE,
      getBalise, getBird, showRiddle, showBirdOnly,
      App, toggleBalise, renderHome, toast,
    });
  }

  function toggleBalise(b) {
    const p = Store.getActive();
    if (!p) return;
    if (Store.isDone(b.id)) {
      Store.updateProfile(p.id, {
        completed: p.completed.filter((id) => id !== b.id),
        birds: p.birds.filter((id) => id !== b.bird),
      });
    } else {
      Store.unlockBalise(b.id, b.bird, 0);
    }
    renderGod(); renderHome();
  }

  function makeQR(code) {
    return window.Screens.god.makeQR(code);
  }

  /* ---------- GOD MODE : rapport complet par email ---------- */
  async function sendGodReport() {
    try {
      const r = await fetch("/api/report", { cache: "no-store" });
      const d = await r.json();
      if (!d.ok || !d.text) { toast(`❌ ${  I18N.t("god_report_error")}`); return; }
      window.location.href = `mailto:contact@exemple.fr?subject=${  encodeURIComponent(d.subject)  }&body=${  encodeURIComponent(d.text)}`;
      toast(`📧 ${  I18N.t("god_report_ok")}`);
    } catch (e) {
      toast(`❌ ${  I18N.t("god_report_error")}`);
    }
  }

  /* ---------- GUIDE DES OISEAUX (délègue à window.Screens.guide) ---------- */
  function openGuide(from) {
    App.guideBack = from || null;
    showScreen("guide");
    renderGuide();
  }

  function renderGuide() {
    window.Screens.guide.render({
      $, esc, allBirds, birdLabel, getBird, App, showBirdOnly,
    });
  }

  /* shuffle et birdSvg → screens/guide.js */
  function shuffle(arr) { return window.Screens.guide.shuffle(arr); }
  function shade(hex, amt) { return window.Screens.guide.shade(hex, amt); }
  function birdSvg(bird) { return window.Screens.guide.birdSvg(bird, esc); }

  /* ---------- ÉVÉNEMENTS ---------- */
  function bindEvents() {
    // Déverrouille l'audio sur mobile au premier contact
    const unlockAudio = () => { AudioSys.ensure(); document.removeEventListener("pointerdown", unlockAudio); };
    document.addEventListener("pointerdown", unlockAudio, { once: true });

    $("btn-home").addEventListener("click", () => { AudioSys.stop(); showScreen("home"); });
    $("btn-voice").addEventListener("click", () => {
      if ("speechSynthesis" in window && window.speechSynthesis.speaking) {
        stopVoice();
        toast(I18N.t("voice_stopped"));
      } else {
        readAloud();
      }
    });
    $("btn-night").addEventListener("click", () => {
      Store.setSettings({ night: !Store.getSettings().night });
      applySettings();
      renderMap();
      toast(Store.getSettings().night ? "🌙 Mode nuit activé — les espèces nocturnes vous attendent !" : "☀️ Mode jour.");
    });
    $("btn-play").addEventListener("click", () => {
      const p = Store.getActive();
      if (!p) { showScreen("profile"); renderProfiles(); return; }
      if (isGodProfile(p) && !Store.getSettings().adminOff) { showScreen("god"); renderGod(); return; }
      if (!p.introSeen) {
        showScreen("intro");
        return;
      }
      if (Store.raceEnabled() && !raceConfigured()) { openRaceSetup(); return; }
      showScreen("map"); renderMap();
    });

    $("btn-intro-start").addEventListener("click", () => {
      const p = Store.getActive();
      if (p) Store.updateProfile(p.id, { introSeen: true });
      if (Store.raceEnabled() && !raceConfigured()) { openRaceSetup(); return; }
      showScreen("map"); renderMap();
    });
    $("btn-end-palmares").addEventListener("click", () => {
      showScreen("palmares"); renderPalmares();
      const p = Store.getActive();
      if (p && !(p.message || "").trim() && !(p.selfie || "")) setTimeout(openGuestbook, 800);
    });
    $("btn-end-map").addEventListener("click", () => { showScreen("map"); renderMap(); });

    document.querySelectorAll(".home-tile, .nav-btn").forEach((b) => {
      b.addEventListener("click", () => {
        const go = b.dataset.go;
        if (!go) return;
        if (go === "carnet") renderCarnet();
        if (go === "palmares") renderPalmares();
        if (go === "settings") { renderSettings(); applySettings(); }
        if (go === "map") renderMap();
        if (go === "god") {
          if (isGodProfile(Store.getActive()) && !Store.getSettings().adminOff) { renderGod(); showScreen("god"); }
          else { showScreen("home"); renderHome(); }
          return;
        }
        if (go === "dashboard") {
          if (!window.open("dashboard.html", "_blank")) location.href = "dashboard.html";
          return;
        }
        if (go === "catalogue") {
          if (!window.open("catalogue.html", "_blank")) location.href = "catalogue.html";
          return;
        }
        if (go === "guide") renderGuide();
        showScreen(go);
      });
    });
    $("btn-open-carnet-home").addEventListener("click", () => { renderCarnet(); showScreen("carnet"); });

    // Profil
    const getAvatar = buildAvatarRow();
    const getEmoji = buildEmojiRow();
    const getMode = buildModeRow();
    $("profile-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("profile-name").value.trim();
      if (!name) { toast("Choisis un nom de famille !"); return; }
      const kids = +$("profile-kids").value || 0;
      const mode = getMode();
      const p = Store.createProfile(name, kids, getAvatar(), getEmoji());
      if (mode === "race") {
        Store.setSettings({ race: true });
        Store.updateProfile(p.id, { playMode: "race", raceOrder: null });
      } else if (mode === "random") {
        Store.setSettings({ race: false });
        Store.updateProfile(p.id, { playMode: "random", raceOrder: shuffle(BALISES.map((b) => b.id)) });
      } else {
        Store.setSettings({ race: false });
        Store.updateProfile(p.id, { playMode: "classic", raceOrder: null });
      }
      syncGameState();
      renderProfiles(); renderHome();
      showScreen("intro");
      toast(`Bienvenue ${name} ! 🎉`);
    });

    // Carte
    $("btn-scan").addEventListener("click", () => { showScreen("scan"); startScanner(); });
    $("btn-scan-back").addEventListener("click", () => showScreen("map"));
    $("btn-gps").addEventListener("click", onGpsPressed);
    $("btn-compass").addEventListener("click", onCompassToggle);
    $("btn-compass-cal").addEventListener("click", onCompassCalibrate);
    $("btn-god-back").addEventListener("click", () => { showScreen("home"); renderHome(); });
    $("btn-god-dashboard").addEventListener("click", () => { if (!window.open("dashboard.html", "_blank")) location.href = "dashboard.html"; });
    $("btn-god-edit").addEventListener("click", () => { if (!window.open("editeur.html", "_blank")) location.href = "editeur.html"; });
    $("btn-god-report").addEventListener("click", sendGodReport);
    $("btn-god-exit").addEventListener("click", () => {
      Store.setSettings({ adminOff: true });
      renderHome();
      showScreen("home");
      toast("Mode admin désactivé. Réglages → interrupteur admin pour le réactiver.");
    });
    $("btn-guide-back").addEventListener("click", () => {
      const from = App.guideBack;
      App.guideBack = null;
      if (from && $(from === "riddle" ? "screen-riddle" : `screen-${  from}`)) { showScreen(from); return; }
      showScreen("home"); renderHome();
    });

    // Espaces Parcours / Administrer (Phase 2)
    const goHomeFromSpace = () => { renderHome(); showScreen("home"); };
    $("btn-choose-parcours").addEventListener("click", () => { renderParcours(); showScreen("parcours"); });
    $("btn-catalogue").addEventListener("click", () => {
      if (!window.open("catalogue.html", "_blank")) location.href = "catalogue.html";
    });
    $("btn-administer").addEventListener("click", () => { renderAdmin(); showScreen("admin"); });
    $("btn-parcours-back").addEventListener("click", goHomeFromSpace);
    $("btn-admin-back").addEventListener("click", goHomeFromSpace);

    // Scan
    $("btn-start-camera").addEventListener("click", startScanner);
    $("btn-stop-camera").addEventListener("click", () => { QrScan.stop(); App.cameraOn = false; $("btn-start-camera").disabled = false; });
    $("code-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const code = $("code-input").value.trim();
      const b = QrScan.matchCode(code);
      if (b) { QrScan.setStatus(""); handleBaliseFound(b, "manual"); }
      else { QrScan.setStatus("❌ Code inconnu. Vérifiez le code inscrit sous le QR."); AudioSys.blip(220); }
    });

    // Énigme
    $("riddle-form").addEventListener("submit", submitRiddle);
    Dictation.attach($("riddle-input"), $("btn-dict-riddle"));
    Dictation.attach($("profile-name"), $("btn-dict-profile"));
    Dictation.attach($("code-input"), $("btn-dict-code"));
    Dictation.attach($("gb-note"), $("btn-dict-gb"));
    Dictation.attach($("challenge-answer"), $("btn-dict-chal"));
    Dictation.attach($("urgency-msg"), $("btn-dict-urgency"));
    $("btn-riddle-hint").addEventListener("click", () => {
      const b = App.target;
      const enigme = App.currentEnigme;
      if (!b || !enigme) return;
      let box = $("riddle-hint-box");
      if (!box) {
        box = document.createElement("div");
        box.id = "riddle-hint-box";
        box.className = "hint";
        $("riddle-status").after(box);
      }
      box.innerHTML = `<p class="hint-text">${ico("hint")} ${  esc(enigme.indice)  }</p>`
        + `<button class="btn btn-ghost btn-mini" id="btn-hint-guide">🧠 ${  esc(I18N.t("guide_open"))  }</button>`;
      const gb = $("btn-hint-guide");
      if (gb) gb.addEventListener("click", () => openGuide("riddle"));
      analytics.recordHintUsed(visibleBalise(b));
      analytics.recordHintLevel(visibleBalise(b), 1);
    });

    // Palmarès
    $("btn-share").addEventListener("click", sharePalmares);
    $("btn-message").addEventListener("click", openGuestbook);

    // Livre d'or (selfie + note)
    $("gb-close").addEventListener("click", closeGuestbook);
    $("gb-cancel").addEventListener("click", closeGuestbook);
    $("gb-save").addEventListener("click", saveGuestbook);
    $("gb-selfie-btn").addEventListener("click", startSelfieCam);
    $("gb-capture-btn").addEventListener("click", captureSelfie);
    $("gb-file-btn").addEventListener("click", () => $("gb-file").click());
    $("gb-file").addEventListener("change", onSelfieFile);
    $("gb-remove-btn").addEventListener("click", removeSelfie);

    // Reco
    $("btn-reco-record").addEventListener("click", onRecoRecord);
    $("btn-reco-stop").addEventListener("click", () => { BirdReco.stopRecording(); $("btn-reco-record").disabled = false; $("btn-reco-stop").disabled = true; BirdReco.setStatus("Enregistrement arrêté."); });

    // Réglages
    $("set-night").addEventListener("change", (e) => { Store.setSettings({ night: e.target.checked }); applySettings(); });
    $("set-sound").addEventListener("change", (e) => { Store.setSettings({ sound: e.target.checked }); applySettings(); if (!e.target.checked) AudioSys.stop(); });
    $("set-hints").addEventListener("change", (e) => { Store.setSettings({ hints: e.target.checked }); if (e.target.checked && App.screen === "map") startProxIfPossible(); });
    $("set-race").addEventListener("change", (e) => {
      Store.setSettings({ race: e.target.checked });
      const p = Store.getActive();
      if (p) {
        const next = e.target.checked ? "race" : (p.playMode === "random" ? "random" : "classic");
        Store.updateProfile(p.id, { playMode: next });
      }
      applySettings();
      updateRaceTimer();
      if (e.target.checked) toast(I18N.t("race_warn_points"));
    });
    $("set-volume").addEventListener("input", (e) => { Store.setSettings({ volume: +e.target.value }); AudioSys.setVolume(+e.target.value); });
    // Avertisseur d'approche : type + test + enregistrement perso
    $("set-alert").addEventListener("change", (e) => {
      Store.setSettings({ alertSound: e.target.value });
      applySettings();
      if ($("row-alert-actions")) $("row-alert-actions").classList.toggle("hidden", e.target.value === "signature");
      toast(`🔔 ${  e.target.options[e.target.selectedIndex].text}`);
    });
    $("btn-alert-test").addEventListener("click", () => {
      const ok = AudioSys.testAlert();
      if (!ok && $("set-alert").value === "custom") toast("⚠️ Enregistrez d'abord votre avertisseur.");
    });
    $("btn-alert-rec").addEventListener("click", recordCustomAlert);
    $("set-tester-q").addEventListener("change", (e) => {
      Store.setSettings({ testerQ: e.target.checked });
      const b = $("btn-tester-questionnaire");
      if (b) b.disabled = !e.target.checked;
    });
    $("set-admin-off").addEventListener("change", (e) => {
      const p = Store.getActive();
      if (!(p && isGodProfile(p))) {
        e.target.checked = false;
        renderSettings();
        toast("Mode admin réservé au profil « Admin » (0 enfant).");
        return;
      }
      Store.setSettings({ adminOff: !e.target.checked });
      renderHome();
      toast(e.target.checked ? "Mode admin activé." : "Mode admin désactivé (tuile masquée).");
    });
    document.querySelectorAll("#diff-row .diff-btn").forEach((b) => {
      b.addEventListener("click", () => {
        Store.setSettings({ difficulty: b.dataset.diff });
        renderSettings();
        toast(`Difficulté : ${  b.dataset.diff}`);
      });
    });
    $("btn-cache").addEventListener("click", cacheNow);
    $("btn-update").addEventListener("click", updateApp);
    const logoutFn = () => {
      if (!Store.getActive()) { toast("Aucun profil actif."); return; }
      Store.logout();
      renderHome(); renderProfiles();
      showScreen("home");
      toast("Déconnecté. Rechoisissez un profil pour jouer.");
    };
    $("btn-logout").addEventListener("click", logoutFn);
    $("btn-logout-settings").addEventListener("click", logoutFn);
    window.addEventListener("board:logout", () => {
      if (!Store.getActive()) return;
      renderHome(); renderProfiles(); applySettings();
      showScreen("home");
      toast(I18N.t("board_kicked"));
    });
    $("btn-reset").addEventListener("click", () => {
      const p = Store.getActive();
      if (!p) { toast("Aucun profil actif."); return; }
      if (confirm(`Recommencer le parcours pour ${p.name} ?`)) {
        Store.resetProgress(p.id);
        renderHome(); renderMap();
        toast("Parcours réinitialisé. Bonne chance ! 🧠");
      }
    });
    $("btn-intro-again").addEventListener("click", () => {
      if (!Store.getActive()) { showScreen("profile"); renderProfiles(); return; }
      showScreen("intro");
    });

    // Urgence
    $("btn-urgency").addEventListener("click", openUrgencyModal);
    $("urg-close").addEventListener("click", closeUrgencyModal);
    $("urg-cancel").addEventListener("click", closeUrgencyModal);
    $("urg-lost").addEventListener("click", onUrgLost);
    $("urg-emergency").addEventListener("click", onUrgEmergency);
    $("urg-message").addEventListener("click", onUrgMessage);

    // Mode course
    $("btn-race-setup").addEventListener("click", openRaceSetup);
    $("race-close").addEventListener("click", closeRaceSetup);
    $("btn-race-cancel").addEventListener("click", closeRaceSetup);
    $("btn-race-start").addEventListener("click", startRace);
    $("btn-race-refresh").addEventListener("click", () => renderRaceEnd(Store.getActive()));
    $("btn-race-guestbook").addEventListener("click", openGuestbook);

    // Réglages (panneaux statiques, liés une seule fois)
    $("btn-troubleshoot").addEventListener("click", runTroubleshoot);
    $("btn-tester").addEventListener("click", () => $("tester-panel").classList.toggle("hidden"));
    $("btn-tester-questionnaire").addEventListener("click", () => {
      if (!window.open("questionnaire.html", "_blank")) location.href = "questionnaire.html";
    });
    $("btn-tester-report").addEventListener("click", async () => {
      const pre = $("tester-report");
      pre.textContent = I18N.t("tester_report_gen");
      pre.classList.remove("hidden");
      pre.textContent = await generateTesterReport();
      $("btn-tester-copy").classList.remove("hidden");
      $("btn-tester-share").classList.remove("hidden");
    });
    $("btn-tester-copy").addEventListener("click", () => copyText($("tester-report").textContent));
    $("btn-tester-share").addEventListener("click", async () => {
      const text = $("tester-report").textContent;
      if (navigator.share) {
        try { await navigator.share({ title: "JDP", text }); return; } catch (e) {}
      }
      copyText(text);
    });
    $("btn-contact").addEventListener("click", () => {
      const email = "contact@exemple.fr";
      const status = $("contact-status");
      copyText(email);
      if (status) status.textContent = I18N.t("contact_copied");
      const subject = `Multi JDP - ${  Store.getActive() ? Store.getActive().name : ""}`;
      window.location.href = `mailto:${  email  }?subject=${  encodeURIComponent(subject)}`;
    });
  }

  function renderSettings() {
    $("info-version").textContent = I18N.t("set_version");
    // Sélecteur de pays / langue (drapeaux)
    const row = $("lang-row");
    if (row) {
      row.innerHTML = I18N.LANGUAGES.map((l) =>
        `<button type="button" class="flag-btn ${I18N.lang === l.code ? "sel" : ""}" data-lang-btn="${l.code}" data-lang="${l.code}" title="${esc(l.name)}" aria-label="${esc(l.name)}">
           <img src="${l.flag}" alt="${esc(l.name)}" class="flag-ico" width="40" height="28">
         </button>`).join("");
      row.querySelectorAll("[data-lang]").forEach((b) => {
        b.addEventListener("click", () => {
          I18N.setLang(b.dataset.lang);
          renderSettings();
          renderHome();
          I18N.apply();
        });
      });
    }
    // Thème visuel (protégé par le mot de passe organisateur, défaut « Sam »)
    const thSel = $("set-theme");
    if (thSel && !themeBound) {
      themeBound = true;
      thSel.addEventListener("change", () => {
        const s = Store.getSettings();
        const id = thSel.value;
        if (s.themePass && !themeUnlocked && id !== s.theme) {
          thSel.value = s.theme || "defaut";
          themePending = id;
          const rowPass = $("row-theme-pass");
          if (rowPass) rowPass.classList.remove("hidden");
          $("set-theme-pass").value = "";
          toast(I18N.t("theme_locked_toast"));
          return;
        }
        Store.setSettings({ theme: id });
        applySettings();
        const t = findTheme(id);
        toast(I18N.fmt(I18N.t("theme_changed"), { nom: t ? ((t.emoji ? `${t.emoji  } ` : "") + t.nom) : id }));
      });
      $("btn-theme-unlock").addEventListener("click", () => {
        const s = Store.getSettings();
        if (!s.themePass || $("set-theme-pass").value === s.themePass) {
          themeUnlocked = true;
          themePending = null;
          const rowPass = $("row-theme-pass");
          if (rowPass) rowPass.classList.add("hidden");
          toast(I18N.t("theme_pass_ok"));
        } else {
          toast(I18N.t("theme_pass_ko"));
        }
      });
      $("set-theme-pass").addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); $("btn-theme-unlock").click(); }
      });
      $("set-theme-newpass").addEventListener("change", (e) => {
        const v = e.target.value.trim();
        Store.setSettings({ themePass: v });
        if (!v) { themeUnlocked = true; }
        toast(I18N.t("theme_pass_saved"));
      });
    }
    if (thSel) {
      const list = typeof THEMES !== "undefined" ? THEMES : [];
      thSel.innerHTML = list.map((t) =>
        `<option value="${esc(t.id)}">${esc((t.emoji ? `${t.emoji  } ` : "") + t.nom)}</option>`).join("");
      thSel.value = Store.getSettings().theme || "defaut";
      const isSamT = !!Store.getActive() && isGodProfile(Store.getActive());
      const adminRowT = $("row-theme-admin");
      if (adminRowT) adminRowT.classList.toggle("hidden", !isSamT);
      const lockHint = $("row-theme-lock-hint");
      if (lockHint) lockHint.classList.toggle("hidden", !Store.getSettings().themePass);
      const rowPassT = $("row-theme-pass");
      if (rowPassT) rowPassT.classList.toggle("hidden", !Store.getSettings().themePass);
    }
    // Difficulté des énigmes
    const diff = Store.getSettings().difficulty || "facile";
    document.querySelectorAll("#diff-row .diff-btn").forEach((b) => {
      b.classList.toggle("sel", b.dataset.diff === diff);
    });
    // Emoji de proximité (boussole)
    const erow = $("emoji-row");
    if (erow) {
      const current = Store.getSettings().proximityEmoji || "faces";
      erow.innerHTML = EMOJI_ORDER.map((id) =>
        `<button type="button" class="emoji-btn ${id === current ? "sel" : ""}" data-emoji="${id}" title="${esc(I18N.t(`emoji_${  id}`))}">
           <span class="emoji-big">${EMOJI_CHAINS[id][4]}</span>
           <span class="emoji-name">${esc(I18N.t(`emoji_${  id}`))}</span>
         </button>`).join("");
      erow.querySelectorAll("[data-emoji]").forEach((b) => {
        b.addEventListener("click", () => {
          Store.setSettings({ proximityEmoji: b.dataset.emoji });
          renderSettings();
          const emoji = $("compass-emoji");
          if (emoji) { const chain = EMOJI_CHAINS[b.dataset.emoji] || EMOJI_CHAINS.faces; emoji.textContent = chain[chain.length - 1]; }
          toast(`Emoji de proximité : ${  I18N.t(`emoji_${  b.dataset.emoji}`)}`);
        });
      });
    }
    // Interrupteur admin (réservé au profil « Admin »)
    const adminRow = $("row-admin-toggle");
    const adminChk = $("set-admin-off");
    const isSam = !!Store.getActive() && isGodProfile(Store.getActive());
    if (adminRow) adminRow.classList.toggle("hidden", !isSam);
    if (adminChk) adminChk.checked = isSam ? !Store.getSettings().adminOff : false;
    // Espace testeur bêta (les clics sont liés une seule fois dans bindEvents)
    const tqChk = $("set-tester-q");
    if (tqChk) tqChk.checked = !!Store.getSettings().testerQ;
    const tqBtn = $("btn-tester-questionnaire");
    if (tqBtn) tqBtn.disabled = !tqChk || !tqChk.checked;
    updateOfflineUI();
  }

  async function generateTesterReport() {
    const T = (k) => I18N.t(k);
    const Y = () => T("tester_yes"), N = () => T("tester_no");
    const L = [];
    L.push(T("tester_report_title"));
    L.push(`${T("tester_report_date")  } : ${  new Date().toISOString()}`);
    L.push(`${T("tester_report_version")  } : ${  I18N.t("set_version")}`);
    L.push(`${T("tester_report_lang")  } : ${  I18N.lang}`);
    L.push(`${T("tester_report_url")  } : ${  location.href}`);
    L.push(`${T("tester_report_online")  } : ${  navigator.onLine ? Y() : N()}`);
    L.push(`${T("tester_report_device")  } : ${  navigator.userAgent}`);
    L.push(`${T("tester_report_screen")  } : ${  innerWidth  }x${  innerHeight  } (dpr=${  window.devicePixelRatio || 1  })`);
    L.push(`${T("tester_report_secure")  } : ${  window.isSecureContext ? Y() : N()  } (${  location.protocol  })`);
    try {
      const p = Store.getActive();
      if (p) {
        L.push(`${T("tester_report_profile")  } : ${  p.name}`);
        const done = BALISES.filter((b) => Store.isDone(b.id)).map((b) => b.id);
        L.push(`${T("tester_report_beacons")  } : ${  done.length ? done.join(", ") : T("tester_none")}`);
        L.push(`${T("tester_report_birds")  } : ${  p.birds.length}`);
        L.push(`${T("tester_report_stars")  } : ${  p.stars}`);
      } else {
        L.push(`${T("tester_report_profile")  } : ${  T("tester_none")}`);
      }
    } catch (e) {
      L.push(`${T("tester_report_profile")  } : ERROR ${  e.message}`);
    }
    L.push(`${T("tester_report_gps")  } : ${  "geolocation" in navigator ? Y() : N()}`);
    if (App.lastPos) L.push(`${T("tester_report_pos")  } : ${  App.lastPos.lat.toFixed(6)  }, ${  App.lastPos.lng.toFixed(6)}`);
    else L.push(`${T("tester_report_pos")  } : ${  T("tester_none")}`);
    try {
      L.push(`${T("tester_report_sw")  } : ${  "serviceWorker" in navigator && navigator.serviceWorker.controller
        ? navigator.serviceWorker.controller.state : T("tester_sw_none")}`);
    } catch (e) { L.push(`${T("tester_report_sw")  } : ERROR`); }
    try {
      const keys = await caches.keys();
      L.push(`${T("tester_report_caches")  } : ${  keys.length ? keys.join(", ") : T("tester_none")}`);
    } catch (e) { L.push(`${T("tester_report_caches")  } : ERROR`); }
    try {
      let bytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        bytes += (localStorage.getItem(k) || "").length * 2;
      }
      L.push(`${T("tester_report_ls")  } : ${  bytes  } octets`);
    } catch (e) {}
    return L.join("\n");
  }

  function copyText(text) {
    const done = () => toast(I18N.t("tester_copied"));
    const fail = () => toast(I18N.t("tester_copy_fail"));
    const fallback = () => (legacyCopy(text) ? done() : fail());
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else {
      fallback();
    }
  }

  function legacyCopy(text) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  function startScanner() {
    App.cameraOn = true;
    $("btn-start-camera").disabled = true;
    QrScan.start((raw) => {
      const b = QrScan.matchCode(raw);
      if (b) {
        QrScan.setStatus(`✔ Balise détectée : ${  b.id}`);
        QrScan.stop(); App.cameraOn = false;
        $("btn-start-camera").disabled = false;
        handleBaliseFound(b, "qr");
      }
    }).then((ok) => {
      if (!ok) $("btn-start-camera").disabled = false;
    });
  }

  function startProxIfPossible() {
    const t = currentTarget();
    if (t) AudioSys.startProximity(t);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- Démarrage ---------- */
  document.addEventListener("DOMContentLoaded", init);

  window.JDP = { showScreen, renderMap, renderCarnet, renderHome, renderPalmares, renderParcours, renderAdmin, finishRun, currentTarget, App, Store };
})();
