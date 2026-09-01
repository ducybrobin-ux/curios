import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateBaliseFound,
  resolveBaliseAction,
  checkRiddleAnswer,
  createQuizSession,
  answerQuizQuestion,
  quizResult,
  resolveQuizEnd,
  computePalmares,
  formatTime,
} from "../../packages/game-engine/src/index.js";

/* ---- validateBaliseFound ---- */
describe("validateBaliseFound", () => {
  const ctx = {
    getActive: () => ({ name: "Team" }),
    isDone: (id) => id === "B3",
    currentTarget: () => ({ id: "B1" }),
  };
  it("rejette si pas de profil actif", () => {
    const r = validateBaliseFound({
      balise: { id: "B1" },
      mode: "qr",
      ctx: { getActive: () => null, isDone: () => false, currentTarget: () => null },
    });
    assert.equal(r.ok, false);
    assert.equal(r.reason, "no_profile");
  });
  it("rejette une balise déjà faite", () => {
    const r = validateBaliseFound({ balise: { id: "B3" }, mode: "qr", ctx });
    assert.equal(r.ok, false);
    assert.equal(r.reason, "already_done");
  });
  it("rejette hors-ordre si cible imposée", () => {
    const r = validateBaliseFound({ balise: { id: "B2" }, mode: "qr", ctx });
    assert.equal(r.ok, false);
    assert.equal(r.reason, "wrong_order");
  });
  it("accepte la bonne balise", () => {
    const r = validateBaliseFound({ balise: { id: "B1" }, mode: "qr", ctx });
    assert.equal(r.ok, true);
    assert.equal(r.balise.id, "B1");
  });
  it("accepte sans cible imposée", () => {
    const ctxNoTarget = { ...ctx, currentTarget: () => null };
    const r = validateBaliseFound({ balise: { id: "B2" }, mode: "gps", ctx: ctxNoTarget });
    assert.equal(r.ok, true);
  });
});

/* ---- resolveBaliseAction ---- */
describe("resolveBaliseAction", () => {
  const ctxRace = { raceEnabled: () => true, isRiddleSolved: () => false, getDifficulty: () => "easy", getEnigme: () => null };
  const ctxNoRace = { raceEnabled: () => false, isRiddleSolved: () => false, getDifficulty: () => "easy" };
  it("mode course → unlock_and_reveal", () => {
    const r = resolveBaliseAction({ balise: { id: "B1" }, ctx: ctxRace });
    assert.equal(r.action, "unlock_and_reveal");
  });
  it("énigme disponible → show_riddle", () => {
    const enigme = { text: "Quelle espèce ?" };
    const ctx = { ...ctxNoRace, getEnigme: () => enigme };
    const r = resolveBaliseAction({ balise: { id: "B1" }, ctx });
    assert.equal(r.action, "show_riddle");
    assert.equal(r.enigme, enigme);
  });
  it("pas d'énigme → reveal_bird", () => {
    const ctx = { ...ctxNoRace, getEnigme: () => null };
    const r = resolveBaliseAction({ balise: { id: "B1" }, ctx });
    assert.equal(r.action, "reveal_bird");
  });
  it("énigme déjà résolue → reveal_bird", () => {
    const ctx = { raceEnabled: () => false, isRiddleSolved: () => true, getDifficulty: () => "easy", getEnigme: () => ({}) };
    const r = resolveBaliseAction({ balise: { id: "B1" }, ctx });
    assert.equal(r.action, "reveal_bird");
  });
});

/* ---- checkRiddleAnswer ---- */
describe("checkRiddleAnswer", () => {
  const enigme = { reponses: ["rouge-gorge", "rouge gorge"] };
  it("réponse correcte", () => {
    const r = checkRiddleAnswer({ enigme, answer: "rouge-gorge", checkAnswer: (e, a) => a.toLowerCase().replace(/[- ]/g, "") === "rougegorge" });
    assert.equal(r.correct, true);
  });
  it("réponse incorrecte", () => {
    const r = checkRiddleAnswer({ enigme, answer: "merle", checkAnswer: () => false });
    assert.equal(r.correct, false);
  });
});

/* ---- createQuizSession ---- */
describe("createQuizSession", () => {
  it("crée une session avec 0 index et 0 score", () => {
    const bird = { id: "merle", quiz: [{ q: "Q1" }, { q: "Q2" }] };
    const makeQuiz = (b) => b.quiz;
    const s = createQuizSession({ bird, makeQuiz });
    assert.equal(s.index, 0);
    assert.equal(s.score, 0);
    assert.equal(s.birdId, "merle");
    assert.equal(s.questions.length, 2);
  });
});

/* ---- answerQuizQuestion ---- */
describe("answerQuizQuestion", () => {
  const session = { questions: [{ reponse: 1 }, { reponse: 0 }], index: 0, score: 0, birdId: "merle" };
  it("bonne réponse", () => {
    const r = answerQuizQuestion({ session, selectedIndex: 1 });
    assert.equal(r.correct, true);
    assert.equal(r.session.score, 1);
    assert.equal(r.session.index, 1);
    assert.equal(r.done, false);
  });
  it("mauvaise réponse", () => {
    const r = answerQuizQuestion({ session, selectedIndex: 0 });
    assert.equal(r.correct, false);
    assert.equal(r.session.score, 0);
    assert.equal(r.session.index, 1);
  });
  it("dernière question", () => {
    const lastSession = { ...session, index: 1 };
    const r = answerQuizQuestion({ session: lastSession, selectedIndex: 0 });
    assert.equal(r.done, true);
  });
  it("session vide", () => {
    const r = answerQuizQuestion({ session: { questions: [], index: 0, score: 0 }, selectedIndex: 0 });
    assert.equal(r.done, true);
  });
});

/* ---- quizResult ---- */
describe("quizResult", () => {
  it("score parfait", () => {
    const s = { questions: [{}, {}, {}], score: 3, index: 3 };
    const r = quizResult({ session: s });
    assert.equal(r.perfect, true);
    assert.equal(r.total, 3);
  });
  it("score imparfait", () => {
    const s = { questions: [{}, {}, {}], score: 2, index: 3 };
    const r = quizResult({ session: s });
    assert.equal(r.perfect, false);
  });
});

/* ---- resolveQuizEnd ---- */
describe("resolveQuizEnd", () => {
  const balise = { id: "B1" };
  const ctx = {
    balisesCount: 5,
    completedCount: 3,
    nextBalise: (id) => ({ id: "B2" }),
  };
  it("parfait, pas fin → next_riddle", () => {
    const session = { questions: [{}, {}], score: 2, index: 2 };
    const r = resolveQuizEnd({ session, balise, ctx });
    assert.equal(r.action, "next_riddle");
    assert.equal(r.stars, 2);
  });
  it("parfait, toutes faites → finish_run", () => {
    const session = { questions: [{}], score: 1, index: 1 };
    const r = resolveQuizEnd({ session, balise, ctx: { ...ctx, completedCount: 5 } });
    assert.equal(r.action, "finish_run");
  });
  it("imparfait, pas fin → unlock_and_continue", () => {
    const session = { questions: [{}, {}], score: 1, index: 2 };
    const r = resolveQuizEnd({ session, balise, ctx });
    assert.equal(r.action, "unlock_and_continue");
    assert.equal(r.stars, 1);
  });
  it("imparfait, toutes faites → finish_run", () => {
    const session = { questions: [{}], score: 0, index: 1 };
    const r = resolveQuizEnd({ session, balise, ctx: { ...ctx, completedCount: 5 } });
    assert.equal(r.action, "finish_run");
    assert.equal(r.stars, 0);
  });
});

/* ---- computePalmares ---- */
describe("computePalmares", () => {
  const profiles = [
    { name: "A", stars: 10, seconds: 120, finishedWeek: "2025-W30" },
    { name: "B", stars: 8, seconds: 100, finishedWeek: "2025-W30" },
    { name: "C", stars: 10, seconds: 90, finishedWeek: "2024-W01" },
    { name: "D", stars: 0, seconds: 0, finishedWeek: "2025-W30", completed: ["B1", "B2", "B3", "B4", "B5"] },
  ];
  it("filtre par semaine courante", () => {
    const r = computePalmares({ profiles, balisesCount: 5, currentWeek: "2025-W30" });
    assert.equal(r.length, 3);
    assert.equal(r[0].name, "A");
  });
  it("inclut les profils ayant fini toutes les balises", () => {
    const r = computePalmares({ profiles, balisesCount: 5, currentWeek: "2025-W99" });
    assert.equal(r.length, 1);
    assert.equal(r[0].name, "D");
  });
  it("tri par stars puis temps", () => {
    const r = computePalmares({ profiles, balisesCount: 5, currentWeek: "2025-W30" });
    assert.equal(r[0].stars, 10);
    assert.equal(r[1].stars, 8);
  });
});

/* ---- formatTime ---- */
describe("formatTime", () => {
  it("0s → 0:00", () => assert.equal(formatTime(0), "0:00"));
  it("65s → 1:05", () => assert.equal(formatTime(65), "1:05"));
  it("3661s → 1:01:01", () => assert.equal(formatTime(3661), "1:01:01"));
  it("négatif → 0:00", () => assert.equal(formatTime(-10), "0:00"));
  it("undefined → 0:00", () => assert.equal(formatTime(undefined), "0:00"));
});
