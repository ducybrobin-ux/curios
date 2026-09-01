#!/usr/bin/env node
/* build-game-flow.mjs — Génère js/game-flow.js (IIFE navigateur → window.GameFlow)
 * à partir de la source de vérité packages/game-engine/src/game-flow.js.
 *
 *   node tools/build-game-flow.mjs            régénère js/game-flow.js
 *   node tools/build-game-flow.mjs --check    vérifie la synchro (exit 1 si obsolète)
 *
 * Transforme les déclarations `export function` en déclarations classiques,
 * enveloppe dans une IIFE et assigne toutes les fonctions à window.GameFlow.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "packages", "game-engine", "src", "game-flow.js");
const OUT = path.join(ROOT, "js", "game-flow.js");
const checkOnly = process.argv.includes("--check");

const EXPOSED = [
  "validateBaliseFound",
  "resolveBaliseAction",
  "checkRiddleAnswer",
  "createQuizSession",
  "answerQuizQuestion",
  "quizResult",
  "resolveQuizEnd",
  "computePalmares",
  "formatTime",
];

function header() {
  return `/* game-flow.js — Logique de jeu pure (généré automatiquement depuis packages/game-engine/src/game-flow.js).
 * NE PAS ÉDITER DIRECTEMENT — modifier la source dans packages/game-engine/src/game-flow.js.
 * Régénérer : node tools/build-game-flow.mjs
 */\n`;
}

function stripExports(src) {
  return src
    .split("\n")
    .map((line) =>
      line.trimStart().startsWith("export function")
        ? line.replace("export function", "function")
        : line
    )
    .join("\n");
}

function generate() {
  const src = fs.readFileSync(SRC, "utf8");
  const body = stripExports(src);
  const iife = `(function () {
  "use strict";
  /* Node.js compat : simule window si absent (pour les tests) */
  if (typeof window === "undefined") globalThis.window = {};

${body}

  /* Expose sur window */
  window.GameFlow = {
    ${EXPOSED.join(",\n    ")},
  };
})();\n`;
  return header() + iife;
}

const nouveau = generate();

if (checkOnly) {
  if (!fs.existsSync(OUT) || fs.readFileSync(OUT, "utf8") !== nouveau) {
    console.error(`✗ ${path.relative(ROOT, OUT)} obsolète — lancez : node tools/build-game-flow.mjs`);
    process.exit(1);
  }
  console.log(`OK ${path.relative(ROOT, OUT)} synchronisé avec packages/game-engine/src/game-flow.js`);
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, nouveau, "utf8");
  console.log(`généré : ${path.relative(ROOT, OUT)} (${EXPOSED.length} fonctions exposées)`);
}
