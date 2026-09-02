/* analytics.js — Analytics locales + adaptation Curi🧭s
 * (généré automatiquement depuis packages/analytics/src/).
 * NE PAS ÉDITER DIRECTEMENT — modifier la source dans packages/analytics/src/.
 * Régénérer : node tools/build-analytics.mjs
 */
/* tracker.js — Collecte locale des métriques de jeu
 *
 * Stockage : localStorage key `curios_analytics_v1`
 * Zéro dépendance externe.
 *
 * Métriques trackées :
 *   - Par balise : temps, tentatives énigme, indices utilisés, timestamp
 *   - Par quiz : questions, bonnes/mauvaises, tentatives
 *   - Global : progression, blocages, timeline
 */

const STORAGE_KEY = "curios_analytics_v1";

function createTracker(storage) {
  // storage : objet avec get(key) et set(key, value)
  // Par défaut, utilise localStorage (côté client)
  const store = storage || defaultStorage();

  function defaultStorage() {
    if (typeof localStorage === "undefined") {
      const mem = {};
      return {
        get: (k) => (mem[k] ? JSON.parse(mem[k]) : null),
        set: (k, v) => { mem[k] = JSON.stringify(v); },
      };
    }
    return {
      get: (k) => {
        try { return JSON.parse(localStorage.getItem(k)); } catch { return null; }
      },
      set: (k, v) => {
        localStorage.setItem(k, JSON.stringify(v));
      },
    };
  }

  function load() {
    return store.get(STORAGE_KEY) || {
      version: 1,
      startedAt: Date.now(),
      balises: {},
      quizzes: {},
      screens: [],
      hints: {},
    };
  }

  function save(data) {
    store.set(STORAGE_KEY, data);
  }

  // --- Balise tracking ---

  function startBalise(baliseId) {
    const data = load();
    if (!data.balises[baliseId]) {
      data.balises[baliseId] = {
        startedAt: Date.now(),
        completedAt: null,
        duration: 0,
        enigmeAttempts: 0,
        enigmeSuccess: false,
        hintsUsed: 0,
        quizAttempts: 0,
        quizScore: 0,
        quizMax: 0,
      };
    }
    data.balises[baliseId].startedAt = Date.now();
    save(data);
    return data.balises[baliseId];
  }

  function completeBalise(baliseId, stars) {
    const data = load();
    const b = data.balises[baliseId];
    if (b) {
      b.completedAt = Date.now();
      b.duration = Math.round((b.completedAt - b.startedAt) / 1000);
      b.stars = stars;
    }
    save(data);
  }

  function recordEnigmeAttempt(baliseId, correct) {
    const data = load();
    const b = data.balises[baliseId] || startBalise(baliseId);
    b.enigmeAttempts = (b.enigmeAttempts || 0) + 1;
    if (correct) b.enigmeSuccess = true;
    save(data);
    return b.enigmeAttempts;
  }

  function recordHintUsed(baliseId) {
    const data = load();
    const b = data.balises[baliseId] || startBalise(baliseId);
    b.hintsUsed = (b.hintsUsed || 0) + 1;
    save(data);
  }

  // --- Quiz tracking ---

  function startQuiz(baliseId, questionCount) {
    const data = load();
    data.quizzes[baliseId] = {
      startedAt: Date.now(),
      questions: questionCount,
      correct: 0,
      incorrect: 0,
      attempts: 0,
      completed: false,
    };
    save(data);
  }

  function recordQuizAnswer(baliseId, correct) {
    const data = load();
    const q = data.quizzes[baliseId];
    if (q) {
      if (correct) q.correct++;
      else q.incorrect++;
    }
    save(data);
  }

  function completeQuiz(baliseId, score, maxScore) {
    const data = load();
    const q = data.quizzes[baliseId];
    if (q) {
      q.completed = true;
      q.completedAt = Date.now();
      q.score = score;
      q.maxScore = maxScore;
      q.attempts = (q.attempts || 0) + 1;
    }
    save(data);
  }

  function retryQuiz(baliseId) {
    const data = load();
    const q = data.quizzes[baliseId];
    if (q) {
      q.attempts = (q.attempts || 0) + 1;
      q.correct = 0;
      q.incorrect = 0;
    }
    save(data);
  }

  // --- Screen tracking ---

  function recordScreen(screenId) {
    const data = load();
    const now = Date.now();
    if (data.screens.length > 0) {
      const last = data.screens[data.screens.length - 1];
      last.duration = Math.round((now - last.at) / 1000);
    }
    data.screens.push({ id: screenId, at: now, duration: 0 });
    // Garder les 200 derniers
    if (data.screens.length > 200) data.screens.splice(0, data.screens.length - 200);
    save(data);
  }

  // --- Hint tracking (indices gradués) ---

  function recordHintLevel(baliseId, level) {
    const data = load();
    if (!data.hints[baliseId]) data.hints[baliseId] = [];
    data.hints[baliseId].push({ level, at: Date.now() });
    save(data);
  }

  // --- Reporting ---

  function getReport() {
    const data = load();
    const balises = Object.entries(data.balises);
    const quizzes = Object.entries(data.quizzes);

    // Stats globales
    const totalBalises = balises.length;
    const completedBalises = balises.filter(([, b]) => b.completedAt).length;
    const totalDuration = balises.reduce((sum, [, b]) => sum + (b.duration || 0), 0);
    const totalEnigmeAttempts = balises.reduce((sum, [, b]) => sum + (b.enigmeAttempts || 0), 0);
    const totalHints = balises.reduce((sum, [, b]) => sum + (b.hintsUsed || 0), 0);

    // Quiz stats
    const totalQuizQuestions = quizzes.reduce((sum, [, q]) => sum + (q.questions || 0), 0);
    const totalQuizCorrect = quizzes.reduce((sum, [, q]) => sum + (q.correct || 0), 0);
    const totalQuizIncorrect = quizzes.reduce((sum, [, q]) => sum + (q.incorrect || 0), 0);

    // Détection de blocages (balise avec > 3 tentatives énigme)
    const blockages = balises
      .filter(([, b]) => (b.enigmeAttempts || 0) > 3)
      .map(([id, b]) => ({
        baliseId: id,
        attempts: b.enigmeAttempts,
        hintsUsed: b.hintsUsed || 0,
      }));

    // Top balises difficiles (par temps)
    const difficult = balises
      .filter(([, b]) => b.completedAt)
      .sort((a, b) => (b[1].duration || 0) - (a[1].duration || 0))
      .slice(0, 5)
      .map(([id, b]) => ({
        baliseId: id,
        duration: b.duration,
        enigmeAttempts: b.enigmeAttempts || 0,
      }));

    // Progression timeline
    const timeline = balises
      .filter(([, b]) => b.completedAt)
      .sort((a, b) => a[1].completedAt - b[1].completedAt)
      .map(([id, b]) => ({
        baliseId: id,
        at: b.completedAt,
        duration: b.duration,
        stars: b.stars,
      }));

    return {
      startedAt: data.startedAt,
      summary: {
        totalBalises,
        completedBalises,
        completionRate: totalBalises > 0 ? Math.round((completedBalises / totalBalises) * 100) : 0,
        totalDuration,
        totalEnigmeAttempts,
        totalHints,
        totalQuizQuestions,
        totalQuizCorrect,
        totalQuizIncorrect,
        quizAccuracy: totalQuizQuestions > 0
          ? Math.round((totalQuizCorrect / totalQuizQuestions) * 100)
          : 0,
      },
      blockages,
      difficult,
      timeline,
      screens: data.screens || [],
      balises: Object.fromEntries(balises.map(([id, b]) => [id, { ...b }])),
      quizzes: Object.fromEntries(quizzes.map(([id, q]) => [id, { ...q }])),
    };
  }

  function clear() {
    save({
      version: 1,
      startedAt: Date.now(),
      balises: {},
      quizzes: {},
      screens: [],
      hints: {},
    });
  }

  return {
    startBalise,
    completeBalise,
    recordEnigmeAttempt,
    recordHintUsed,
    startQuiz,
    recordQuizAnswer,
    completeQuiz,
    retryQuiz,
    recordScreen,
    recordHintLevel,
    getReport,
    clear,
  };
}

/* adaptation.js — Module d'adaptation configurable
 *
 * Système d'indices gradués et de missions bonus.
 * L'adaptation se base sur les analytics locales pour ajuster la difficulté.
 *
 * Niveaux d'indice :
 *   1. Indice léger (description contextuelle)
 *   2. Indice moyen (piste plus précise)
 *   3. Indice fort (réponse presque donnée)
 *
 * Missions bonus :
 *   - Débloquées après un certain score ou un certain temps
 *   - Enrichissent le parcours sans le bloquer
 */

function createAdaptation(analytics, config = {}) {
  const defaults = {
    // Seuils de déclenchement des indices
    hintThresholds: {
      facile: { afterAttempts: 2, afterSeconds: 30 },
      moyen: { afterAttempts: 1, afterSeconds: 45 },
      difficile: { afterAttempts: 1, afterSeconds: 60 },
    },

    // Missions bonus débloquées par score
    bonusThresholds: [
      { minStars: 3, bonusId: "bonus-decouverte" },
      { minStars: 6, bonusId: "bonus-observation" },
      { minStars: 9, bonusId: "bonus-enquete" },
    ],

    // Missions bonus débloquées par temps (secondes)
    timeBonusThresholds: [
      { maxSeconds: 600, bonusId: "bonus-rapidite" },
    ],

    // Nombre max d'indices par balise
    maxHintsPerBalise: 3,

    // Seuil de blocage (nombre de tentatives avant aide renforcée)
    blockageThreshold: 3,
  };

  const cfg = { ...defaults, ...config };

  function shouldShowHint(baliseId, difficulty, attemptCount, elapsedSeconds) {
    const threshold = cfg.hintThresholds[difficulty] || cfg.hintThresholds.moyen;

    if (attemptCount >= threshold.afterAttempts) return true;
    if (elapsedSeconds >= threshold.afterSeconds) return true;

    return false;
  }

  function getHintLevel(baliseId, hintsUsed) {
    if (hintsUsed >= cfg.maxHintsPerBalise) return null;
    return hintsUsed + 1;
  }

  function getAvailableHints(enigme) {
    if (!enigme) return [];
    const hints = [];

    // Niveau 1 : première lettre ou catégorie
    if (enigme.indice) {
      hints.push({
        level: 1,
        text: enigme.indice,
        type: "description",
      });
    }

    // Niveau 2 : plus de contexte
    if (enigme.saviez) {
      hints.push({
        level: 2,
        text: enigme.saviez,
        type: "context",
      });
    }

    // Niveau 3 : réponse partielle
    if (enigme.answers && enigme.answers.length > 0) {
      const answer = enigme.answers[0];
      const firstLetter = answer.charAt(0).toUpperCase();
      hints.push({
        level: 3,
        text: `La réponse commence par "${firstLetter}" (${answer.length} lettres)`,
        type: "partial",
      });
    }

    return hints;
  }

  function getBonusMissions(totalStars, elapsedSeconds) {
    const bonuses = [];

    // Missions bonus par score
    for (const threshold of cfg.bonusThresholds) {
      if (totalStars >= threshold.minStars) {
        bonuses.push({
          id: threshold.bonusId,
          type: "score",
          threshold: threshold.minStars,
        });
      }
    }

    // Missions bonus par temps
    for (const threshold of cfg.timeBonusThresholds) {
      if (elapsedSeconds <= threshold.maxSeconds) {
        bonuses.push({
          id: threshold.bonusId,
          type: "time",
          threshold: threshold.maxSeconds,
        });
      }
    }

    return bonuses;
  }

  function isBlockage(baliseId) {
    if (!analytics) return false;
    const report = analytics.getReport();
    const baliseData = report.balises[baliseId];
    if (!baliseData) return false;

    return (baliseData.enigmeAttempts || 0) >= cfg.blockageThreshold;
  }

  function getSuggestedDifficulty(baliseId) {
    if (!analytics) return "moyen";
    const report = analytics.getReport();
    const baliseData = report.balises[baliseId];
    if (!baliseData) return "moyen";

    const attempts = baliseData.enigmeAttempts || 0;
    const hints = baliseData.hintsUsed || 0;
    const score = baliseData.stars || 0;

    // Si beaucoup de tentatives et d'indices → difficulté plus facile
    if (attempts > 3 || hints > 2) return "facile";
    // Si tout va bien → garder la difficulté demandée
    if (attempts <= 1 && hints === 0 && score > 0) return "difficile";
    return "moyen";
  }

  return {
    shouldShowHint,
    getHintLevel,
    getAvailableHints,
    getBonusMissions,
    isBlockage,
    getSuggestedDifficulty,
    config: cfg,
  };
}


window.CurAnalytics = { createTracker, createAdaptation };
