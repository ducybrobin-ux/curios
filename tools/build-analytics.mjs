#!/usr/bin/env node
/* build-analytics.mjs — Génère js/analytics.js (script classique navigateur)
 * à partir des modules ES de packages/analytics/src/.
 *
 *   node tools/build-analytics.mjs            régénère js/analytics.js
 *   node tools/build-analytics.mjs --check    vérifie la synchro (exit 1 si obsolète)
 *
 * Concatène tracker + adaptation et expose `createTracker` / `createAdaptation`
 * sur `window.CurAnalytics` (zéro import, zéro dépendance DOM).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "packages", "analytics", "src");
const OUT = path.join(ROOT, "js", "analytics.js");
const checkOnly = process.argv.includes("--check");

const FILES = ["tracker.js", "adaptation.js"];
const EXPOSED = ["createTracker", "createAdaptation"];

function header() {
  return `/* analytics.js — Analytics locales + adaptation Curi🧭s
 * (généré automatiquement depuis packages/analytics/src/).
 * NE PAS ÉDITER DIRECTEMENT — modifier la source dans packages/analytics/src/.
 * Régénérer : node tools/build-analytics.mjs
 */\n`;
}

function stripExports(src) {
  const lines = src.split("\n");
  const out = [];
  let skipBlock = false;
  for (const line of lines) {
    const trimmed = line.trimStart();
    if (skipBlock) {
      if (trimmed.includes("}")) skipBlock = false;
      continue;
    }
    if (trimmed.startsWith("import ") || trimmed.startsWith("export ")) {
      if (trimmed.startsWith("import ")) {
        if (!trimmed.includes("}")) skipBlock = true;
        continue;
      }
      if (trimmed.startsWith("export function")) {
        out.push(line.replace("export function", "function"));
      } else if (trimmed.startsWith("export {")) {
        if (!trimmed.includes("}")) skipBlock = true;
        continue;
      }
      // autres `export` (ex. export const) ignorés
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}

function generate() {
  let body = "";
  for (const f of FILES) {
    const src = fs.readFileSync(path.join(SRC, f), "utf8");
    body += `${stripExports(src)}\n`;
  }
  body += `\nwindow.CurAnalytics = { ${EXPOSED.join(", ")} };\n`;
  return header() + body;
}

const nouveau = generate();

if (checkOnly) {
  if (!fs.existsSync(OUT) || fs.readFileSync(OUT, "utf8") !== nouveau) {
    console.error(`✗ ${path.relative(ROOT, OUT)} obsolète — lancez : node tools/build-analytics.mjs`);
    process.exit(1);
  }
  console.log(`OK ${path.relative(ROOT, OUT)} synchronisé avec packages/analytics/src/`);
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, nouveau, "utf8");
  console.log(`généré : ${path.relative(ROOT, OUT)} (${EXPOSED.length} fonctions exposées)`);
}