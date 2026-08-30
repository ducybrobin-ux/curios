/* game-flow-export.mjs — Exports ESM pour Node.js (tests).
 *
 * Même logique que js/game-flow.js (IIFE browser).
 * Ce fichier est la source de vérité pour les tests unitaires.
 */

function validateBaliseFound({ balise, mode, ctx }) {
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

function resolveBaliseAction({ balise, ctx }) {
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

function checkRiddleAnswer({ enigme, answer, checkAnswer }) {
  return { correct: checkAnswer(enigme, answer) };
}

function createQuizSession({ bird, makeQuiz, rng }) {
  return {
    questions: makeQuiz(bird, rng),
    index: 0,
    score: 0,
    birdId: bird.id,
  };
}

function answerQuizQuestion({ session, selectedIndex }) {
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

function quizResult({ session }) {
  const total = session.questions.length;
  const perfect = session.score >= total;
  return { perfect, score: session.score, total };
}

function resolveQuizEnd({ session, balise, ctx }) {
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

function computePalmares({ profiles, balisesCount, currentWeek }) {
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

function formatTime(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export {
  validateBaliseFound,
  resolveBaliseAction,
  checkRiddleAnswer,
  createQuizSession,
  answerQuizQuestion,
  quizResult,
  resolveQuizEnd,
  computePalmares,
  formatTime,
};
