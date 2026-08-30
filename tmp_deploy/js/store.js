/* =========================================================
   Curi🧭s — Persistance locale (localStorage)
   Profils de familles, progression, palmarès et réglages.
   ========================================================= */

const Store = (function () {
  const KEY = "jdp_data_v1";

  const DEFAULTS = {
    settings: { night: false, sound: true, hints: true, volume: 80, lang: "fr", difficulty: "facile", adminOff: false, proximityEmoji: "faces", race: false, testerQ: false, alertSound: "signature", alertCustom: "", theme: "defaut", themePass: "Sam" },
    profiles: [],
    activeProfileId: null,
  };

  const data = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULTS));
      const parsed = JSON.parse(raw);
      return Object.assign(JSON.parse(JSON.stringify(DEFAULTS)), parsed);
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULTS));
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      toast("⚠️ Impossible de sauvegarder (stockage plein ?)");
    }
  }

  /* --- Réglages --- */
  function getSettings() { return data.settings; }
  function setSettings(patch) {
    Object.assign(data.settings, patch);
    save();
  }

  /* --- Profils --- */
  function getProfiles() { return data.profiles; }

  function getActive() {
    return data.profiles.find((p) => p.id === data.activeProfileId) || null;
  }

  function setActive(id) {
    data.activeProfileId = id;
    save();
  }

  function logout() {
    data.activeProfileId = null;
    save();
  }

  function createProfile(name, kids, avatar, emoji) {
    const profile = {
      id: `p${  Date.now()}`,
      name: name.trim(),
      kids: kids,
      avatar: avatar,
      emoji: emoji || "",
      introSeen: false,       // introduction (histoire/règles/sécurité) déjà affichée
      created: Date.now(),
      completed: [],      // ids de balises validées
      birds: [],          // ids de découvertes validées
      stars: 0,           // points de quiz
      seconds: 0,         // temps total (s)
      startTime: Date.now(),
      week: weekKey(),
      seeds: BALISES.length,      // synapses distribuées au début du jeu
      offered: 0,                 // synapses déjà connectées
      offeredBirds: [],           // balises où la connexion a été faite
      message: "",                // message à la postérité (palmarès)
      selfie: "",                 // selfie souvenir (dataURL, palmarès)
      raceOpponents: [],          // mode course : équipes adverses choisies
      raceOrder: null,            // mode course : ordre aléatoire des balises
    };
    data.profiles.push(profile);
    data.activeProfileId = profile.id;
    save();
    return profile;
  }

  function deleteProfile(id) {
    data.profiles = data.profiles.filter((p) => p.id !== id);
    if (data.activeProfileId === id) data.activeProfileId = data.profiles[0]?.id || null;
    save();
  }

  function updateProfile(id, patch) {
    const p = data.profiles.find((x) => x.id === id);
    if (p) Object.assign(p, patch);
    save();
  }

  function resetProgress(id) {
    const p = data.profiles.find((x) => x.id === id);
    if (p) {
      p.completed = [];
      p.birds = [];
      p.stars = 0;
      p.seconds = 0;
      p.startTime = Date.now();
      p.seeds = BALISES.length;
      p.offered = 0;
      p.offeredBirds = [];
    }
    save();
  }

  /* --- Progression --- */
  function isDone(baliseId) {
    const p = getActive();
    return p ? p.completed.includes(baliseId) : false;
  }

  function unlockBalise(baliseId, birdId, stars) {
    const p = getActive();
    if (!p) return;
    if (!p.completed.includes(baliseId)) p.completed.push(baliseId);
    if (birdId && !p.birds.includes(birdId)) p.birds.push(birdId);
    p.stars = (p.stars || 0) + stars;
    save();
  }

  function tickTimer() {
    const p = getActive();
    if (!p) return;
    const now = Date.now();
    const el = Math.round((now - (p.lastTickAt || p.startTime)) / 1000);
    p.seconds = (p.seconds || 0) + el;
    p.lastTickAt = now;
    save();
  }

  function finishWeek(profileId) {
    const p = data.profiles.find((x) => x.id === profileId);
    if (p) { p.finishedWeek = weekKey(); p.finishedAt = Date.now(); }
    save();
  }

  /* --- Connexion de synapses --- */
  function seedsLeft(id) {
    const p = data.profiles.find((x) => x.id === id);
    return typeof p?.seeds === "number" ? p.seeds : BALISES.length;
  }

  function canOffer(baliseId) {
    const p = getActive();
    return !!p && seedsLeft(p.id) > 0 && !(p.offeredBirds || []).includes(baliseId);
  }

  function offerSeed(baliseId) {
    const p = getActive();
    if (!canOffer(baliseId)) return false;
    p.seeds = seedsLeft(p.id) - 1;
    p.offeredBirds = p.offeredBirds || [];
    p.offeredBirds.push(baliseId);
    p.offered = (p.offered || 0) + 1;
    save();
    return true;
  }

  function weekKey() {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
    return start.toISOString().slice(0, 10);
  }

  /* --- Modes de jeu : "classic" | "race" | "random" (par profil) --- */
  function raceEnabled() {
    const p = getActive();
    if (p) {
      if (p.playMode === "race") return true;
      if (p.playMode === "random" || p.playMode === "classic") return false;
    }
    return !!data.settings.race; // héritage : réglage global
  }

  function randomEnabled() {
    const p = getActive();
    return !!(p && p.playMode === "random" && Array.isArray(p.raceOrder) && p.raceOrder.length);
  }

  function getRaceOrder(p) {
    if (p && Array.isArray(p.raceOrder) && p.raceOrder.length) return p.raceOrder;
    return BALISES.map((b) => b.id);
  }

  function setupRace(profileId, opponents, order) {
    const p = data.profiles.find((x) => x.id === profileId);
    if (!p) return;
    p.raceOpponents = (opponents || []).slice();
    p.raceOrder = (order && order.length ? order : BALISES.map((b) => b.id)).slice();
    save();
  }

  function palmares() {
    const wk = weekKey();
    return data.profiles
      .filter((p) => p.finishedWeek === wk || (p.completed && p.completed.length === BALISES.length))
      .map((p) => ({
        name: p.name,
        avatar: p.avatar,
        emoji: p.emoji || "",
        stars: p.stars || 0,
        seconds: p.seconds || 0,
        birds: (p.birds || []).length,
        offered: p.offered || 0,
        message: p.message || "",
        selfie: p.selfie || "",
      }))
      .sort((a, b) => (b.stars - a.stars) || (a.seconds - b.seconds));
  }

  return {
    getSettings, setSettings,
    getProfiles, getActive, setActive, logout, createProfile, deleteProfile, updateProfile, resetProgress,
    isDone, unlockBalise, tickTimer, finishWeek, weekKey, palmares,
    raceEnabled, randomEnabled, getRaceOrder, setupRace,
    canOffer, offerSeed, seedsLeft,
  };
})();
