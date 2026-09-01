import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalize, checkAnswer, makeQuiz, getEnigme } from "../../packages/game-engine/src/index.js";

/* ---- normalize ---- */
describe("normalize", () => {
  it("met en minuscules et supprime les accents", () => {
    assert.equal(normalize("ÉTÉ"), "ete");
  });
  it("normalise les apostrophes typographiques", () => {
    assert.equal(normalize("l\u2019eau"), "l eau");
  });
  it("compresse les espaces multiples", () => {
    assert.equal(normalize("  bon   jour  "), "bon jour");
  });
  it("retourne \"\" pour null / undefined / \"\"", () => {
    assert.equal(normalize(null), "");
    assert.equal(normalize(undefined), "");
    assert.equal(normalize(""), "");
  });
});

/* ---- checkAnswer ---- */
describe("checkAnswer", () => {
  const enigme = { reponses: ["biais de confirmation", "confirmation", "le biais de confirmation"] };
  it("accepte une réponse exacte normalisée", () => {
    assert.equal(checkAnswer(enigme, "BIAIS DE CONFIRMATION"), true);
  });
  it("ignore l'article initial", () => {
    assert.equal(checkAnswer(enigme, "le biais de confirmation"), true);
  });
  it("ignore accents et casse", () => {
    assert.equal(checkAnswer(enigme, "Biais de Confirmation"), true);
  });
  it("rejette une réponse vide", () => {
    assert.equal(checkAnswer(enigme, ""), false);
  });
  it("rejette une mauvaise réponse", () => {
    assert.equal(checkAnswer(enigme, "ancrage"), false);
  });
  it("fonctionne avec le champ `answers` (format curios-parcours)", () => {
    assert.equal(checkAnswer({ answers: ["fontaine", "la fontaine"] }, "La Fontaine"), true);
  });

  /* Régression CURIOS — Bug A : les articles initiaux doivent être ignorés
   * des DEUX côtés (référence avec article + joueur sans, et inversement). */
  it("accepte une réponse exacte quand la référence porte un article (sans article côté joueur)", () => {
    assert.equal(checkAnswer({ reponses: ["l'urgence artificielle", "l'urgence"] }, "urgence artificielle"), true);
  });
  it("accepte « troisième » pour la référence « la troisième »", () => {
    assert.equal(checkAnswer({ reponses: ["la troisième", "la troisième notification", "la C"] }, "troisieme"), true);
  });
  it("accepte une réponse sans article pour la référence « l'adresse du site »", () => {
    assert.equal(checkAnswer({ reponses: ["l'adresse du site", "l'URL"] }, "adresse du site"), true);
  });
  it("tolère les déterminants pluriels / invariants (les, des, du)", () => {
    assert.equal(checkAnswer({ reponses: ["les métadonnées"] }, "métadonnées"), true);
    assert.equal(checkAnswer({ reponses: ["des traces"] }, "traces"), true);
    assert.equal(checkAnswer({ reponses: ["du temps"] }, "temps"), true);
  });
  it("accentue sans casser l'égalité avec déterminant composé « de la »", () => {
    assert.equal(checkAnswer({ reponses: ["de la lune"] }, "lune"), true);
  });
  it("n'accepte pas une réponse partielle quand aucun mot complet ne correspond", () => {
    assert.equal(checkAnswer({ reponses: ["le biais de confirmation"] }, "biais"), false);
  });
  it("ne retire pas un article qui serait le mot lui-même (pas de faux positif)", () => {
    assert.equal(checkAnswer({ reponses: ["la"] }, "la"), true); // égalité exacte conservée
    assert.equal(checkAnswer({ reponses: ["la relative"] }, "relative"), true); // article ignoré
    assert.equal(checkAnswer({ reponses: ["decor"] }, "décor"), true); // « de » non suivi d'espace → pas retiré
  });
  it("ne tombe pas sur `answers` quand `reponses` est présent mais vide (robustesse)", () => {
    assert.equal(checkAnswer({ reponses: [], answers: ["fontaine"] }, "fontaine"), true);
    assert.equal(checkAnswer({ reponses: [], answers: ["la fontaine"] }, "fontaine"), true);
  });
});

/* ---- makeQuiz ---- */
describe("makeQuiz", () => {
  const bird = {
    id: "test",
    quiz: [
      { q: "Q1?", options: ["a", "b", "c"], reponse: 0 },
      { q: "Q2?", options: ["x", "y"], reponse: 1 },
    ],
  };
  it("retient la même taille et les mêmes options (multiset)", () => {
    const q = makeQuiz(bird, () => 0);
    assert.equal(q.length, 2);
    assert.deepEqual(q[0].options.sort(), ["a", "b", "c"]);
  });
  it("la reponse pointe vers la bonne option après mélange", () => {
    const rng = (() => { let v = 0; return () => { v = (v + 0.3) % 1; return v; }; })();
    const q = makeQuiz(bird, rng);
    for (let i = 0; i < q.length; i++) {
      const expected = bird.quiz[i].options[bird.quiz[i].reponse];
      assert.equal(q[i].options[q[i].reponse], expected);
    }
  });
  it("conserve bird id et numéro", () => {
    const q = makeQuiz(bird, () => 0);
    assert.equal(q[0].bird, "test");
    assert.equal(q[0].num, 0);
  });
});

/* ---- getEnigme ---- */
describe("getEnigme", () => {
  const balise = {
    enigmes: { facile: { text: "E-F" }, moyen: { text: "E-M" }, difficile: { text: "E-D" } },
    enigme: { text: "legacy" },
  };
  it("retourne le niveau demandé", () => {
    assert.equal(getEnigme(balise, "moyen").text, "E-M");
  });
  it("défaut à facile", () => {
    assert.equal(getEnigme(balise).text, "E-F");
  });
  it("fallback legacy si enigmes absent", () => {
    assert.equal(getEnigme({ enigme: { text: "old" } }).text, "old");
  });
  it("null si balise null", () => {
    assert.equal(getEnigme(null), null);
  });
});
