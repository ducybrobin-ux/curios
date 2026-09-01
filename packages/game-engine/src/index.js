/* @curios/game-engine — point d'entrée unique. */

// Utilitaires existants
export { normalize } from "./normalize.js";
export { checkAnswer } from "./answers.js";
export { makeQuiz } from "./quiz.js";
export { getEnigme } from "./enigmes.js";

// Event engine
export {
  BALISE_FOUND, RIDDLE_SOLVED, QUIZ_COMPLETED,
  BIRD_REVEALED, SEED_OFFERED, RUN_FINISHED,
  PROFILE_CHANGED, SETTINGS_CHANGED, SYNC_DONE,
} from "./events.js";

export {
  isBaliseDone, isBalisePending,
  isRaceMode, isClassicMode, isRandomMode,
  isRiddleSolved, isRiddlePending,
  isQuizPerfect, isAdmin, isNightMode, isOffline,
  hasSeeds, allBalisesDone,
  not, and, or,
} from "./conditions.js";

export {
  createGameState,
  reduceBaliseDone, reduceRiddleSolved, reduceQuizScore,
  reduceProfileChange, reduceSeedOffered, reduceSettingsChange,
  reduceTimerTick, reduceRunFinished,
} from "./state.js";

export { createEngine } from "./engine.js";

// Logique de jeu pure (quant à GameFlow)
export {
  validateBaliseFound, resolveBaliseAction, checkRiddleAnswer,
  createQuizSession, answerQuizQuestion, quizResult,
  resolveQuizEnd, computePalmares, formatTime,
} from "./game-flow.js";
export {
  DEFAULT_RULES,
  actionRevealBird, actionUnlockBalise, actionSolveRiddle,
  actionUpdateQuizScore, actionPlayBirdSong, actionPostValidation,
} from "./rules.js";
