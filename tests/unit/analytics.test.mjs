/* analytics.test.mjs — Tests unitaires pour @curios/analytics
 *
 * Tests du tracker, du module d'adaptation, et du bundle browser (js/analytics.js).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createTracker } from "../../packages/analytics/src/tracker.js";
import { createAdaptation } from "../../packages/analytics/src/adaptation.js";

// Storage en mémoire pour les tests
function createMemoryStorage() {
  const mem = {};
  return {
    get: (k) => (mem[k] ? JSON.parse(mem[k]) : null),
    set: (k, v) => { mem[k] = JSON.stringify(v); },
  };
}

describe("createTracker", () => {
  it("starts with empty data", () => {
    const tracker = createTracker(createMemoryStorage());
    const report = tracker.getReport();
    assert.equal(report.summary.totalBalises, 0);
    assert.equal(report.summary.completedBalises, 0);
  });

  describe("Balise tracking", () => {
    it("startBalise creates entry", () => {
      const tracker = createTracker(createMemoryStorage());
      const b = tracker.startBalise("B1");
      assert.equal(b.enigmeAttempts, 0);
      assert.ok(b.startedAt > 0);
    });

    it("recordEnigmeAttempt increments count", () => {
      const tracker = createTracker(createMemoryStorage());
      tracker.startBalise("B1");
      const count = tracker.recordEnigmeAttempt("B1", false);
      assert.equal(count, 1);
      const count2 = tracker.recordEnigmeAttempt("B1", true);
      assert.equal(count2, 2);

      const report = tracker.getReport();
      assert.equal(report.balises["B1"].enigmeAttempts, 2);
      assert.equal(report.balises["B1"].enigmeSuccess, true);
    });

    it("completeBalise sets duration", () => {
      const tracker = createTracker(createMemoryStorage());
      tracker.startBalise("B1");
      // Simulate 5 seconds passed
      const b = tracker.getReport().balises["B1"] || {};
      tracker.completeBalise("B1", 3);

      const report = tracker.getReport();
      assert.ok(report.balises["B1"].completedAt);
      assert.equal(report.balises["B1"].stars, 3);
    });

    it("recordHintUsed increments", () => {
      const tracker = createTracker(createMemoryStorage());
      tracker.startBalise("B1");
      tracker.recordHintUsed("B1");
      tracker.recordHintUsed("B1");

      const report = tracker.getReport();
      assert.equal(report.balises["B1"].hintsUsed, 2);
    });
  });

  describe("Quiz tracking", () => {
    it("startQuiz creates entry", () => {
      const tracker = createTracker(createMemoryStorage());
      tracker.startQuiz("B1", 5);
      const report = tracker.getReport();
      assert.equal(report.quizzes["B1"].questions, 5);
      assert.equal(report.quizzes["B1"].correct, 0);
    });

    it("recordQuizAnswer tracks correct/incorrect", () => {
      const tracker = createTracker(createMemoryStorage());
      tracker.startQuiz("B1", 3);
      tracker.recordQuizAnswer("B1", true);
      tracker.recordQuizAnswer("B1", false);
      tracker.recordQuizAnswer("B1", true);

      const report = tracker.getReport();
      assert.equal(report.quizzes["B1"].correct, 2);
      assert.equal(report.quizzes["B1"].incorrect, 1);
    });

    it("completeQuiz marks as done", () => {
      const tracker = createTracker(createMemoryStorage());
      tracker.startQuiz("B1", 3);
      tracker.recordQuizAnswer("B1", true);
      tracker.recordQuizAnswer("B1", true);
      tracker.recordQuizAnswer("B1", false);
      tracker.completeQuiz("B1", 2, 3);

      const report = tracker.getReport();
      assert.equal(report.quizzes["B1"].completed, true);
      assert.equal(report.quizzes["B1"].score, 2);
    });

    it("retryQuiz increments attempts", () => {
      const tracker = createTracker(createMemoryStorage());
      tracker.startQuiz("B1", 3);
      tracker.completeQuiz("B1", 1, 3);
      tracker.retryQuiz("B1");

      const report = tracker.getReport();
      assert.equal(report.quizzes["B1"].attempts, 2);
    });
  });

  describe("Screen tracking", () => {
    it("recordScreen tracks transitions", () => {
      const tracker = createTracker(createMemoryStorage());
      tracker.recordScreen("map");
      tracker.recordScreen("riddle");
      tracker.recordScreen("map");

      const report = tracker.getReport();
      assert.equal(report.screens.length, 3);
      assert.equal(report.screens[0].id, "map");
      assert.equal(report.screens[1].id, "riddle");
      assert.equal(report.screens[2].id, "map");
    });
  });

  describe("Report", () => {
    it("computes summary stats", () => {
      const tracker = createTracker(createMemoryStorage());
      tracker.startBalise("B1");
      tracker.recordEnigmeAttempt("B1", true);
      tracker.recordHintUsed("B1");
      tracker.completeBalise("B1", 3);

      tracker.startQuiz("B1", 3);
      tracker.recordQuizAnswer("B1", true);
      tracker.recordQuizAnswer("B1", true);
      tracker.recordQuizAnswer("B1", false);
      tracker.completeQuiz("B1", 2, 3);

      const report = tracker.getReport();
      assert.equal(report.summary.totalBalises, 1);
      assert.equal(report.summary.completedBalises, 1);
      assert.equal(report.summary.totalEnigmeAttempts, 1);
      assert.equal(report.summary.totalHints, 1);
      assert.equal(report.summary.totalQuizQuestions, 3);
      assert.equal(report.summary.totalQuizCorrect, 2);
      assert.equal(report.summary.totalQuizIncorrect, 1);
      assert.equal(report.summary.quizAccuracy, 67);
    });

    it("detects blockages", () => {
      const tracker = createTracker(createMemoryStorage());
      tracker.startBalise("B1");
      for (let i = 0; i < 5; i++) tracker.recordEnigmeAttempt("B1", false);

      const report = tracker.getReport();
      assert.equal(report.blockages.length, 1);
      assert.equal(report.blockages[0].baliseId, "B1");
      assert.equal(report.blockages[0].attempts, 5);
    });

    it("clear resets data", () => {
      const tracker = createTracker(createMemoryStorage());
      tracker.startBalise("B1");
      tracker.clear();
      const report = tracker.getReport();
      assert.equal(report.summary.totalBalises, 0);
    });
  });
});

describe("createAdaptation", () => {
  it("shouldShowHint returns true after enough attempts", () => {
    const adapt = createAdaptation(null);
    assert.equal(adapt.shouldShowHint("B1", "facile", 2, 10), true);
    assert.equal(adapt.shouldShowHint("B1", "facile", 1, 10), false);
  });

  it("shouldShowHint returns true after enough seconds", () => {
    const adapt = createAdaptation(null);
    assert.equal(adapt.shouldShowHint("B1", "moyen", 0, 50), true);
    assert.equal(adapt.shouldShowHint("B1", "moyen", 0, 30), false);
  });

  it("getHintLevel returns level based on usage", () => {
    const adapt = createAdaptation(null);
    assert.equal(adapt.getHintLevel("B1", 0), 1);
    assert.equal(adapt.getHintLevel("B1", 1), 2);
    assert.equal(adapt.getHintLevel("B1", 2), 3);
    assert.equal(adapt.getHintLevel("B1", 3), null); // max reached
  });

  it("getAvailableHints returns hints from enigme", () => {
    const adapt = createAdaptation(null);
    const enigme = {
      indice: "C'est un arbre",
      saviez: "Le chêne vit 500 ans",
      answers: ["chêne"],
    };
    const hints = adapt.getAvailableHints(enigme);
    assert.equal(hints.length, 3);
    assert.equal(hints[0].level, 1);
    assert.equal(hints[1].level, 2);
    assert.equal(hints[2].level, 3);
    assert.ok(hints[2].text.includes("C"));
  });

  it("getBonusMissions returns based on score", () => {
    const adapt = createAdaptation(null);
    const bonuses = adapt.getBonusMissions(5, 300);
    assert.ok(bonuses.some((b) => b.id === "bonus-decouverte"));
    assert.ok(bonuses.some((b) => b.id === "bonus-rapidite"));
  });

  it("isBlockage checks analytics", () => {
    const tracker = createTracker(createMemoryStorage());
    tracker.startBalise("B1");
    for (let i = 0; i < 4; i++) tracker.recordEnigmeAttempt("B1", false);

    const adapt = createAdaptation(tracker);
    assert.equal(adapt.isBlockage("B1"), true);
    assert.equal(adapt.isBlockage("B2"), false);
  });

  it("getSuggestedDifficulty adapts based on performance", () => {
    const tracker = createTracker(createMemoryStorage());
    tracker.startBalise("B1");
    for (let i = 0; i < 5; i++) tracker.recordEnigmeAttempt("B1", false);
    tracker.recordHintUsed("B1");
    tracker.recordHintUsed("B1");

    const adapt = createAdaptation(tracker);
    assert.equal(adapt.getSuggestedDifficulty("B1"), "facile");
  });
});

describe("Bundle js/analytics.js", () => {
  it("exposes window.CurAnalytics with createTracker and createAdaptation", async () => {
    // Simulate browser-like environment
    globalThis.window = {};
    await import("../../js/analytics.js");

    const api = window.CurAnalytics;
    assert.ok(api, "window.CurAnalytics must be defined");
    assert.equal(typeof api.createTracker, "function");
    assert.equal(typeof api.createAdaptation, "function");

    // Functional check: tracker round-trip
    const tracker = api.createTracker();
    tracker.startBalise("test");
    assert.equal(tracker.getReport().summary.totalBalises, 1);

    // Functional check: adaptation round-trip
    const adapt = api.createAdaptation(tracker);
    assert.equal(typeof adapt.shouldShowHint, "function");
    assert.equal(typeof adapt.getSuggestedDifficulty, "function");

    delete globalThis.window;
  });
});
