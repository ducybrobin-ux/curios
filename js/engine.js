/* engine.js — Moteur de jeu Curi🧭s (généré automatiquement depuis packages/game-engine/src/).
 * NE PAS ÉDITER DIRECTEMENT — modifier la source dans packages/game-engine/src/.
 * Régénérer : node tools/build-engine.mjs
 */
/* normalize.js — Normalisation d'une réponse textuelle.
 *
 * Minuscules, suppression des accents, normalisation des apostrophes
 * et des espaces. Fonction déterministe, pure, sans dépendance.
 *
 * Extrait de js/data.js (héritage Multi JDP).
 */

/**
 * Normalise une chaîne : minuscules, accents supprimés, espaces unifiés.
 * @param {*} s
 * @returns {string}
 */
function normalize(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''\u2019]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* answers.js — Vérification de réponse à une énigme.
 *
 * compare une réponse utilisateur aux réponses acceptées (normalisées),
 * en ignorant les articles initiaux (le/la/les/un/une/des/du/de/aux/l'/d'…),
 * ET en acceptant l'absence d'article côté joueur quand la référence en porte un
 * (et inversement). La tolérance aux articles est donc SYMÉTRIQUE.
 *
 * Extrait de js/data.js (héritage Multi JDP), corrigé CURIOS.
 */


/* Déterminants initiaux français tolérés (à appliquer APRÈS normalisation :
 * les apostrophes sont déjà converties en espaces par normalize, donc
 * "l'urgence" → "l urgence" et "d'école" → "d ecole").
 * L'ordre compte : on teste les déterminants multi-mots d'abord. */
const INITIAL_ARTICLES = [
  "de la ", "de l ", "de ",
  "le ", "la ", "les ", "l ",
  "un ", "une ", "des ", "du ", "aux ", "d ",
];

/**
 * Retire un déterminant initial éventuel (uniquement s'il est suivi d'un
 * espace, pour ne pas toucher aux mots "de", "des"… qui ne seraient pas des
 * articles). Ne modifie pas la chaîne si aucun article n'est présent.
 * @param {string} s chaîne normalisée
 * @returns {string}
 */
function stripInitialArticle(s) {
  for (const art of INITIAL_ARTICLES) {
    if (s.startsWith(art)) return s.slice(art.length).trim();
  }
  return s;
}

/**
 * Vérifie si `answer` correspond à l'une des réponses de `enigme`.
 * Compare de façon tolérante : normalisation (accents/casse/espaces),
 * articles initiaux ignorés des deux côtés, et prise en compte de l'un
 * ou l'autre des champs `reponses` / `answers` (sans ignorer un champ
 * renseigné au profit d'un champ vide).
 * @param {{ reponses?: string[], answers?: string[] }} enigme
 * @param {string} answer
 * @returns {boolean}
 */
function checkAnswer(enigme, answer) {
  const a = normalize(answer);
  if (!a) return false;
  const list =
    Array.isArray(enigme?.reponses) && enigme.reponses.length
      ? enigme.reponses
      : (enigme?.answers || []);
  return list.some((r) => {
    const rn = normalize(r);
    return (
      rn === a ||
      stripInitialArticle(rn) === a ||
      rn === stripInitialArticle(a) ||
      stripInitialArticle(rn) === stripInitialArticle(a)
    );
  });
}

/* quiz.js — Construction d'un quiz mélangé à partir d'une découverte.
 *
 * Mélange les options de chaque question, remappe l'index de la bonne
 * réponse. Accepte un générateur aléatoire injectable (`rng`) pour
 * permettre des tests déterministes.
 *
 * Extrait de js/data.js (héritage Multi JDP).
 */

/**
 * Construit un quiz mélangé pour une découverte donnée.
 * @param {{ id: string, quiz: { q: string, options: string[], reponse: number }[] }} bird
 * @param {() => number} [rng=Math.random]  Générateur aléatoire 0-1 (injectable pour tests)
 * @returns {{ bird: string, num: number, q: string, options: string[], reponse: number }[]}
 */
function makeQuiz(bird, rng = Math.random) {
  return bird.quiz.map((q, i) => {
    const entries = q.options.map((opt, j) => ({ opt, j }));
    entries.sort(() => rng() - 0.5);
    return {
      bird: bird.id,
      num: i,
      q: q.q,
      options: entries.map((e) => e.opt),
      reponse: entries.findIndex((e) => e.j === q.reponse),
    };
  });
}

/* enigmes.js — Sélection d'une énigme par difficulté.
 *
 * Priorité au contenu modulaire (enigmes.{difficulty}),
 * fallback sur l'ancien champ `balise.enigme`.
 *
 * Extrait de js/data.js (héritage Multi JDP).
 */

/**
 * Retourne l'énigme d'une balise selon la difficulté choisie.
 * @param {{ enigmes?: Record<string, unknown>, enigme?: unknown }|null} balise
 * @param {string} [difficulty="facile"]
 * @returns {object|null}
 */
function getEnigme(balise, difficulty) {
  if (!balise) return null;
  const d = difficulty || "facile";
  if (balise.enigmes && balise.enigmes[d]) return balise.enigmes[d];
  return balise.enigme || null;
}

/* events.js — Types d'événements du jeu.
 *
 * Constantes string-based pour éviter les fautes de frappe.
 * Chaque événement porte un payload décrit dans le JSDoc.
 */

/** Balise trouvée (QR, GPS ou manuel). Payload: { balise, mode } */
const BALISE_FOUND = "balise:found";

/** Énigme réussie. Payload: { balise, answer } */
const RIDDLE_SOLVED = "riddle:solved";

/** Quiz terminé (toutes les questions répondues). Payload: { bird, score, total } */
const QUIZ_COMPLETED = "quiz:completed";

/** Découverte révélée (carte oiseau affichée). Payload: { bird, balise } */
const BIRD_REVEALED = "bird:revealed";

/** Graine offerte à un coéquipier. Payload: { baliseId, targetProfileId } */
const SEED_OFFERED = "seed:offered";

/** Parcours terminé (toutes les balises validées). Payload: { profile } */
const RUN_FINISHED = "run:finished";

/** Changement de profil. Payload: { profile } */
const PROFILE_CHANGED = "profile:changed";

/** Changement de settings. Payload: { settings } */
const SETTINGS_CHANGED = "settings:changed";

/** Sync serveur terminée. Payload: { ok, count } */
const SYNC_DONE = "sync:done";

/* conditions.js — Conditions évaluables par le moteur.
 *
 * Chaque condition est une fonction pure : (state, payload) -> boolean.
 * Le state est l'objet game state courant.
 * Le payload est celui de l'événement déclencheur.
 *
 * Conditions composites : NOT, AND, OR pour combiner les conditions.
 */

/**
 * La balise est déjà validée.
 */
function isBaliseDone(state, payload) {
  return state.completed.includes(payload?.balise?.id);
}

/**
 * La balise n'est PAS encore validée.
 */
function isBalisePending(state, payload) {
  return !isBaliseDone(state, payload);
}

/**
 * Mode course activé.
 */
function isRaceMode(state) {
  return state.playMode === "race";
}

/**
 * Mode classique (pas course, pas aléatoire).
 */
function isClassicMode(state) {
  return state.playMode === "classic";
}

/**
 * Mode aléatoire activé.
 */
function isRandomMode(state) {
  return state.playMode === "random";
}

/**
 * L'énigme a déjà été résolue pour cette balise.
 */
function isRiddleSolved(state, payload) {
  const id = payload?.balise?.id;
  return !!(state.riddles && state.riddles[id]);
}

/**
 * L'énigme n'a pas encore été résolue.
 */
function isRiddlePending(state, payload) {
  return !isRiddleSolved(state, payload);
}

/**
 * Le quiz a été réussi (score parfait).
 */
function isQuizPerfect(state, payload) {
  return payload?.score === payload?.total && payload?.total > 0;
}

/**
 * Le profil est admin (god mode).
 */
function isAdmin(state) {
  return state.isAdmin;
}

/**
 * Mode nuit activé.
 */
function isNightMode(state) {
  return state.night;
}

/**
 * Le joueur est hors-ligne.
 */
function isOffline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

/**
 * Des graines sont disponibles pour ce profil.
 */
function hasSeeds(state) {
  return (state.seeds ?? 0) > 0;
}

/**
 * Toutes les balises sont validées.
 */
function allBalisesDone(state, _payload, ctx) {
  const total = ctx?.balisesCount ?? 0;
  return total > 0 && state.completed.length >= total;
}

/**
 * Negation d'une condition.
 * @param {Function} cond — condition à inverser
 * @returns {Function}
 */
function not(cond) {
  return (state, payload, ctx) => !cond(state, payload, ctx);
}

/**
 * Toutes les conditions doivent être vraies (ET logique).
 * @param  {...Function} conds — conditions à combiner
 * @returns {Function}
 */
function and(...conds) {
  return (state, payload, ctx) => conds.every((c) => c(state, payload, ctx));
}

/**
 * Au moins une condition doit être vraie (OU logique).
 * @param  {...Function} conds — conditions à combiner
 * @returns {Function}
 */
function or(...conds) {
  return (state, payload, ctx) => conds.some((c) => c(state, payload, ctx));
}

/* state.js — État global du jeu.
 *
 * GameState est un objet pur, sans effet de bord.
 * Les mutations se font via des fonctions dédiées (state-reducer pattern).
 * Le state est sérialisable en JSON (pour sauvegarde / migration).
 */

/**
 * Crée un GameState vide avec des valeurs par défaut.
 * @param {object} [defaults] — surcharge des valeurs par défaut
 * @returns {object}
 */
function createGameState(defaults = {}) {
  return {
    /* ---- Profil ---- */
    profileId: null,
    profileName: "",
    isAdmin: false,

    /* ---- Progression ---- */
    completed: [],       // IDs des balises validées
    discovered: [],      // IDs des oiseaux découverts
    riddles: {},         // { baliseId: true } énigmes résolues

    /* ---- Quiz ---- */
    quizScore: 0,
    quizTotal: 0,

    /* ---- Mode de jeu ---- */
    playMode: "classic", // "classic" | "race" | "random"
    night: false,
    sound: true,
    difficulty: "facile",

    /* ---- Graines ---- */
    seeds: 0,
    offered: [],

    /* ---- Timer ---- */
    seconds: 0,
    startTime: null,

    /* ---- Sync ---- */
    lastSync: null,

    ...defaults,
  };
}

/* ---- Reducers : fonctions pures qui retournent un NOUVEAU state ---- */

/**
 * Valider une balise.
 */
function reduceBaliseDone(state, baliseId, birdId) {
  if (state.completed.includes(baliseId)) return state;
  return {
    ...state,
    completed: [...state.completed, baliseId],
    discovered: birdId && !state.discovered.includes(birdId)
      ? [...state.discovered, birdId]
      : state.discovered,
  };
}

/**
 * Résoudre une énigme.
 */
function reduceRiddleSolved(state, baliseId) {
  if (state.riddles?.[baliseId]) return state;
  return {
    ...state,
    riddles: { ...state.riddles, [baliseId]: true },
  };
}

/**
 * Mettre à jour le score du quiz.
 */
function reduceQuizScore(state, score, total) {
  return { ...state, quizScore: score, quizTotal: total };
}

/**
 * Changer de profil.
 */
function reduceProfileChange(state, profile) {
  return {
    ...state,
    profileId: profile?.id ?? null,
    profileName: profile?.name ?? "",
    isAdmin: !!profile?.isAdmin,
    completed: profile?.completed ?? [],
    discovered: profile?.birds ?? [],
    riddles: profile?.riddles ?? {},
    seeds: profile?.seeds ?? 0,
    offered: profile?.offered ?? [],
    seconds: profile?.seconds ?? 0,
    startTime: profile?.startTime ?? null,
    playMode: profile?.playMode ?? "classic",
  };
}

/**
 * Offrir une graine.
 */
function reduceSeedOffered(state) {
  if (state.seeds <= 0) return state;
  return { ...state, seeds: state.seeds - 1 };
}

/**
 * Changer les settings.
 */
function reduceSettingsChange(state, settings) {
  return {
    ...state,
    night: settings?.night ?? state.night,
    sound: settings?.sound ?? state.sound,
    difficulty: settings?.difficulty ?? state.difficulty,
    playMode: settings?.race ? "race" : state.playMode,
  };
}

/**
 * Ticker du timer (toutes les N secondes).
 */
function reduceTimerTick(state) {
  return { ...state, seconds: state.seconds + 20 };
}

/**
 * Marquer la fin du run.
 */
function reduceRunFinished(state) {
  return { ...state, finishedAt: Date.now() };
}

/* engine.js — Moteur d'événements EVENT→CONDITION→ACTION→STATE.
 *
 * Architecture :
 *   event → rules matching → conditions evaluated → actions executed → state updated
 *
 * Le moteur est un bus d'événements avec :
 * - Des RÈGLES (rules) : { event, conditions[], actions[] }
 * - Un STATE courant (game state)
 * - Un LOGGER optionnel pour le debug
 *
 * Tout est injectable : les conditions, les actions, le state.
 * Le moteur ne connait PAS le DOM, le Store, ni AudioSys.
 *
 * Usage :
 *   const engine = createEngine({ rules, getState, setState, ctx });
 *   engine.on(BALISE_FOUND, (state, payload) => { ... });
 *   engine.emit(BALISE_FOUND, { balise, mode: "qr" });
 */

/**
 * Crée un moteur d'événements.
 * @param {object} config
 * @param {Array} config.rules — [{ event, conditions[], actions[], priority? }]
 * @param {Function} config.getState — retourne le game state courant
 * @param {Function} config.setState — applique un nouveau game state
 * @param {object} [config.ctx] — contexte supplémentaire (balisesCount, etc.)
 * @param {Function} [config.log] — fonction de log (debug)
 * @returns {{ emit, on, off, getRules, addRule, removeRule }}
 */
function createEngine({ rules = [], getState, setState, ctx = {}, log } = {}) {
  /** @type {Map<string, Set<Function>>} */
  const listeners = new Map();
  const _rules = [...rules];

  function _log(msg, ...args) {
    if (log) log(`[Engine] ${msg}`, ...args);
  }

  /**
   * Émettre un événement.
   * 1. Exécute les listeners enregistrés via on()
   * 2. Évalue les règles matching cet événement
   * 3. Pour chaque règle : vérifie les conditions, exécute les actions
   *
   * @param {string} event — type d'événement
   * @param {*} payload — données de l'événement
   * @returns {{ matched: number, actionsExecuted: number }}
   */
  function emit(event, payload) {
    const state = getState();
    let matched = 0;
    let actionsExecuted = 0;

    // 1. Listeners enregistrés
    const fns = listeners.get(event);
    if (fns) {
      for (const fn of fns) {
        try {
          fn(state, payload);
        } catch (err) {
          _log(`Listener error on "${event}":`, err);
        }
      }
    }

    // 2. Règles matching
    for (const rule of _rules) {
      if (rule.event !== event) continue;
      matched++;

      // 3. Évaluer les conditions
      const conditionsMet = rule.conditions.every((cond) => {
        try {
          return cond(state, payload, ctx);
        } catch (err) {
          _log(`Condition error in rule "${rule.event}":`, err);
          return false;
        }
      });

      if (!conditionsMet) {
        _log(`Rule "${rule.event}" skipped (conditions not met)`);
        continue;
      }

      // 4. Exécuter les actions
      for (const action of rule.actions) {
        try {
          const result = action(state, payload, ctx);
          // Si l'action retourne un nouveau state, l'appliquer
          if (result && typeof result === "object" && result.completed !== undefined) {
            setState(result);
          }
          actionsExecuted++;
        } catch (err) {
          _log(`Action error in rule "${rule.event}":`, err);
        }
      }

      _log(`Rule "${rule.event}" executed (${rule.actions.length} actions)`);
    }

    return { matched, actionsExecuted };
  }

  /**
   * S'abonner à un événement (listener direct, pas une règle).
   * @param {string} event
   * @param {Function} fn — (state, payload) => void
   * @returns {Function} désabonnement
   */
  function on(event, fn) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(fn);
    return () => listeners.get(event)?.delete(fn);
  }

  /**
   * Se désabonner.
   */
  function off(event, fn) {
    listeners.get(event)?.delete(fn);
  }

  /**
   * Ajouter une règle dynamiquement.
   * @param {object} rule
   */
  function addRule(rule) {
    _rules.push(rule);
  }

  /**
   * Supprimer une règle par index.
   * @param {number} index
   */
  function removeRule(index) {
    if (index >= 0 && index < _rules.length) _rules.splice(index, 1);
  }

  /**
   * Retourne les règles courantes (pour debug/introspection).
   */
  function getRules() {
    return [..._rules];
  }

  return { emit, on, off, addRule, removeRule, getRules };
}

/* rules.js — Règles de jeu par défaut.
 *
 * Chaque règle lie un type d'événement à des conditions et des actions.
 * Les actions sont des fonctions pures : (state, payload, ctx) => newState | void.
 *
 * Ces règles modélisent le flux de jeu standard :
 *   BALISE_FOUND → (pending? show riddle or reveal bird)
 *   RIDDLE_SOLVED → (reveal bird)
 *   QUIZ_COMPLETED → (validate balise)
 *   BIRD_REVEALED → (play sound, track discovery)
 *   RUN_FINISHED → (congratulate)
 */


/* ---- Actions ---- */

/**
 * Révèle la découverte (carte oiseau).
 * Retourne un payload enrichi pour les règles suivantes.
 */
function actionRevealBird(state, payload) {
  // Le reveal est un signal — le DOM gère l'affichage
  return { ...payload, revealed: true };
}

/**
 * Marque la balise comme validée dans le state.
 */
function actionUnlockBalise(state, payload) {
  return reduceBaliseDone(state, payload?.balise?.id, payload?.balise?.bird);
}

/**
 * Marque l'énigme comme résolue.
 */
function actionSolveRiddle(state, payload) {
  return reduceRiddleSolved(state, payload?.balise?.id);
}

/**
 * Met à jour le score du quiz.
 */
function actionUpdateQuizScore(state, payload) {
  return reduceQuizScore(state, payload?.score, payload?.total);
}

/**
 * Joue le chant de l'oiseau (signal au DOM).
 */
function actionPlayBirdSong(state, payload) {
  // Signal pour AudioSys — le DOM écoute via le listener
  return { ...payload, playSong: true };
}

/**
 * Envoie la validation au serveur.
 */
function actionPostValidation(state, payload, _ctx) {
  // Signal pour le sync manager
  return { ...payload, postValidation: true };
}

/* ---- Règles par défaut ---- */

const DEFAULT_RULES = [
  {
    event: BALISE_FOUND,
    conditions: [isBalisePending, isRaceMode],
    actions: [actionUnlockBalise, actionPostValidation, actionRevealBird],
    priority: 10,
  },
  {
    event: BALISE_FOUND,
    conditions: [isBalisePending, (s) => !isRaceMode(s)],
    actions: [actionRevealBird],
    priority: 20,
  },
  {
    event: RIDDLE_SOLVED,
    conditions: [isRiddlePending],
    actions: [actionSolveRiddle, actionUnlockBalise, actionRevealBird, actionPostValidation],
    priority: 10,
  },
  {
    event: QUIZ_COMPLETED,
    conditions: [isQuizPerfect],
    actions: [actionUpdateQuizScore, actionUnlockBalise, actionRevealBird],
    priority: 10,
  },
  {
    event: QUIZ_COMPLETED,
    conditions: [(s, p) => !isQuizPerfect(s, p)],
    actions: [actionUpdateQuizScore, actionUnlockBalise],
    priority: 20,
  },
  {
    event: BIRD_REVEALED,
    conditions: [],
    actions: [actionPlayBirdSong],
    priority: 10,
  },
  {
    event: RUN_FINISHED,
    conditions: [],
    actions: [],
    priority: 10,
  },
];


window.CURIOS_ENGINE = { normalize, checkAnswer, makeQuiz, getEnigme, BALISE_FOUND, RIDDLE_SOLVED, QUIZ_COMPLETED, BIRD_REVEALED, SEED_OFFERED, RUN_FINISHED, PROFILE_CHANGED, SETTINGS_CHANGED, SYNC_DONE, isBaliseDone, isBalisePending, isRaceMode, isClassicMode, isRandomMode, isRiddleSolved, isRiddlePending, isQuizPerfect, isAdmin, isNightMode, isOffline, hasSeeds, allBalisesDone, not, and, or, createGameState, reduceBaliseDone, reduceRiddleSolved, reduceQuizScore, reduceProfileChange, reduceSeedOffered, reduceSettingsChange, reduceTimerTick, reduceRunFinished, createEngine, DEFAULT_RULES, actionRevealBird, actionUnlockBalise, actionSolveRiddle, actionUpdateQuizScore, actionPlayBirdSong, actionPostValidation };
