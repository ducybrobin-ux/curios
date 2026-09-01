#!/usr/bin/env node
/**
 * build-sw.mjs — génère sw.js (service worker) depuis packages/offline.
 * Usage : node tools/build-sw.mjs [--check]
 *
 * Le service worker doit rester un fichier unique (pas d'imports ESM).
 * On génère un IIFE qui contient la config + les event handlers.
 *
 * La liste PRECACHE est auto-générée par scan du filesystem.
 * Ne plus modifier PRECACHE manuellement dans config.js.
 */

import {
  readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync,
} from "node:fs";
import { resolve, dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "sw.js");
const CHECK = process.argv.includes("--check");

/* ---------- Config depuis packages/offline/src/config.js ---------- */
import { VERSION, CACHE, RUNTIME } from "../packages/offline/src/config.js";

/* ---------- Stratégies depuis packages/offline/src/strategy.js ---------- */
// eslint-disable-next-line no-unused-vars -- inlitées dans le template SW
import { shouldBypassCache, shouldCacheRuntime, cachesToDelete } from "../packages/offline/src/strategy.js";

/* ---------- Scan filesystem pour PRECACHE ---------- */
const INCLUDE_DIRS = ["js", "css", "img", "docs", "hub"];
const INCLUDE_ROOT_FILES = ["index.html", "manifest.json"];
const EXCLUDE_FILES = new Set([
  "sw.js", "package.json", "package-lock.json",
  "eslint.config.js", "admin-data.json",
]);
const EXCLUDE_DIRS = new Set([
  "dist", "node_modules", "packages", "content",
  "tools", "tests", ".git", ".github", "docs",
]);
const EXCLUDE_EXTS = new Set([".mjs", ".md", ".txt", ".lock"]);

function scanDir(dir, prefix = "") {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.name !== ".prettierrc") continue;
    if (EXCLUDE_DIRS.has(entry.name)) continue;
    const fullPath = join(dir, entry.name);
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...scanDir(fullPath, relPath));
    } else {
      const ext = extname(entry.name).toLowerCase();
      if (EXCLUDE_EXTS.has(ext)) continue;
      if (EXCLUDE_FILES.has(entry.name)) continue;
      results.push(relPath);
    }
  }
  return results;
}

function buildPrecache() {
  const files = [];

  // Racine : HTML + manifest
  for (const name of INCLUDE_ROOT_FILES) {
    const p = join(ROOT, name);
    if (existsSync(p)) files.push(name);
  }

  // Dossiers inclus
  for (const dir of INCLUDE_DIRS) {
    const dirPath = join(ROOT, dir);
    if (!existsSync(dirPath)) continue;
    const prefix = dir;
    for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const subFiles = scanDir(join(dirPath, entry.name), `${prefix}/${entry.name}`);
        files.push(...subFiles);
      } else {
        const ext = extname(entry.name).toLowerCase();
        if (EXCLUDE_EXTS.has(ext)) continue;
        if (EXCLUDE_FILES.has(entry.name)) continue;
        files.push(`${prefix}/${entry.name}`);
      }
    }
  }

  // Racine : autres .html non listés
  for (const entry of readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const ext = extname(entry.name).toLowerCase();
    if (ext === ".html" && !files.includes(entry.name)) {
      files.push(entry.name);
    }
  }

  return ["./", ...files.sort()];
}

const PRECACHE = buildPrecache();

/* ---------- Génération ---------- */
const precacheItems = PRECACHE.map((p) => `  "${p}"`).join(",\n");

const out = `/* =========================================================
   Curi🧭s — Service worker
   Généré par tools/build-sw.mjs — NE PAS ÉDITER MANUELLEMENT.
   Source : packages/offline/src/{config,strategy}.js
   ========================================================= */

const VERSION = "${VERSION}";
const CACHE = "${CACHE}";
const RUNTIME = "${RUNTIME}";

const PRECACHE = [
${precacheItems},
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(PRECACHE))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        cachesToDelete(keys, CACHE, RUNTIME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "CACHE") {
    e.waitUntil(
      caches.open(CACHE).then((c) => c.addAll(PRECACHE))
    );
  }
  if (e.data && e.data.type === "SKIP_WAITING") {
    e.waitUntil(self.skipWaiting());
  }
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  if (shouldBypassCache(req.url)) {
    e.respondWith(fetch(req).catch(() => Response.error()));
    return;
  }

  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((resp) => {
          if (shouldCacheRuntime({ ok: resp.ok, url: req.url, origin: self.location.origin })) {
            const copy = resp.clone();
            caches.open(RUNTIME).then((c) => c.put(req, copy));
          }
          return resp;
        })
        .catch(() => {
          if (req.mode === "navigate") return caches.match("index.html");
          return Response.error();
        });
    })
  );
});
`;

if (CHECK) {
  const old = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (old !== out) {
    console.error("[build-sw] Fichier obsolète. Lance `node tools/build-sw.mjs` pour le régénérer.");
    process.exit(1);
  }
  console.log("[build-sw] sw.js est à jour.");
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, out, "utf8");
  console.log(`[build-sw] Généré sw.js (${out.length} octets, ${PRECACHE.length} fichiers précachés).`);
}
