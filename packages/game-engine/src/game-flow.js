/* game-flow.js — Logique de jeu pure (source de vérité pour le moteur).
 *
 * Fonctions pures, sans dépendance DOM. Toutes les dépendances
 * (Store, AudioSys, BALISES, etc.) sont injectées via un objet `ctx`.
 *
 * Ce fichier est la source de vérité : il sert à la fois
 *  - aux tests unitaires (import ESM direct),
 *  - au bundle navigateur js/game-flow.js (via tools/build-game-flow.mjs),
 *    qui expose window.GameFlow pour usage dans app.js.
 */

/**
 * Vérifie si une balise peut être trouvée.
 * @param {object} params
 * @param {object} params.balise
 * @param {string} params.mode — "qr" | "gps" | "manual"
 * @param {object} params.ctx — { isDone, getActive, currentTarget }
 * @returns {{ ok: boolean, reason?: string, balise?: object }}
 */
export function validateBaliseFound({ balise, mode, ctx }) {
  if (!ctx.getActive()) {
    return { ok: false, reason: "no_profile" };
  }
  if (ctx.isDone(balise.id)) {
    return { ok: false, reason: "already_done", balise };
  }
  const target = ctx.currentTarget();
  if (target && balise.id !== target.id) {
    return { ok: false, reason: "wrong_order", target, balise };
  }
  return { ok: true, balise, mode };
}

/**
 * Détermine l'action à prendre lorsqu'une balise est trouvée.
 * @param {object} params
 * @param {object} params.balise
 * @param {object} params.ctx — { raceEnabled, isRiddleSolved, getDifficulty, getEnigme }
 * @returns {{ action: string, enigme?: object|null }}
 */
export function resolveBaliseAction({ balise, ctx }) {
  if (ctx.raceEnabled()) {
    return { action: "unlock_and_reveal" };
  }
  const solved = ctx.isRiddleSolved(balise.id);
  const enigme = ctx.getEnigme(balise, ctx.getDifficulty());
  if (enigme && !solved) {
    return { action: "show_riddle", enigme };
  }
  return { action: "reveal_bird" };
}

/**
 * Vérifie une réponse à une énigme.
 * @param {object} params
 * @param {object} params.enigme
 * @param {string} params.answer
 * @param {Function} params.checkAnswer
 * @returns {{ correct: boolean }}
 */
export function checkRiddleAnswer({ enigme, answer, checkAnswer }) {
  return { correct: checkAnswer(enigme, answer) };
}

/**
 * Crée une session de quiz.
 * @param {object} params
 * @param {object} params.bird — découverte (contient .quiz)
 * @param {Function} params.makeQuiz
 * @param {Function} [params.rng]
 * @returns {{ questions: Array, index: number, score: number, birdId: string }}
 */
export function createQuizSession({ bird, makeQuiz, rng }) {
  return {
    questions: makeQuiz(bird, rng),
    index: 0,
    score: 0,
    birdId: bird.id,
  };
}

/**
 * Traite une réponse au quiz.
 * @param {object} params
 * @param {object} params.session
 * @param {number} params.selectedIndex
 * @returns {{ correct: boolean, correctIndex: number, done: boolean, session: object }}
 */
export function answerQuizQuestion({ session, selectedIndex }) {
  const q = session.questions[session.index];
  if (!q) return { correct: false, correctIndex: -1, done: true, session };

  const correct = selectedIndex === q.reponse;
  const newSession = {
    ...session,
    score: correct ? session.score + 1 : session.score,
    index: session.index + 1,
  };
  const done = newSession.index >= newSession.questions.length;

  return { correct, correctIndex: q.reponse, done, session: newSession };
}

/**
 * Résultat du quiz : détermine si le score est parfait.
 * @param {object} params
 * @param {object} params.session
 * @returns {{ perfect: boolean, score: number, total: number }}
 */
export function quizResult({ session }) {
  const total = session.questions.length;
  const perfect = session.score >= total;
  return { perfect, score: session.score, total };
}

/**
 * Détermine l'action de fin de quiz.
 * @param {object} params
 * @param {object} params.session
 * @param {object} params.balise
 * @param {object} params.ctx — { balisesCount, completedCount, nextBalise }
 * @returns {{ action: string, nextBalise?: object|null, stars?: number }}
 */
export function resolveQuizEnd({ session, balise, ctx }) {
  const { perfect, score, total } = quizResult({ session });
  const done = ctx.completedCount;
  const allDone = done >= ctx.balisesCount;
  const stars = perfect ? total : score;
  const next = ctx.nextBalise(balise.id);

  if (perfect) {
    if (allDone) {
      return { action: "finish_run", stars };
    }
    return { action: "next_riddle", next, stars };
  }

  if (allDone) {
    return { action: "finish_run", stars };
  }
  return { action: "unlock_and_continue", next, stars };
}

/**
 * Calcule le palmarès (classement).
 * @param {object} params
 * @param {Array} params.profiles
 * @param {number} params.balisesCount
 * @param {string} params.currentWeek
 * @returns {Array}
 */
export function computePalmares({ profiles, balisesCount, currentWeek }) {
  return profiles
    .filter(
      (p) =>
        p.finishedWeek === currentWeek ||
        (p.completed && p.completed.length >= balisesCount)
    )
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
    .sort((a, b) => b.stars - a.stars || a.seconds - b.seconds);
}

/**
 * Formate un temps en secondes vers HH:MM:SS ou MM:SS.
 * @param {number} seconds
 * @returns {string}
 */
export function formatTime(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
