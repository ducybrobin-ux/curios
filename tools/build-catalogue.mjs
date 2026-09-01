#!/usr/bin/env node
/* build-catalogue.mjs — Génère js/catalogue-data.js (version embarquée du
 * catalogue) depuis la source de vérité :
 *   • content/catalog/packs/*.json          → fiche curatée (tagline, cover, difficulté, matériel…)
 *   • content/packs/<id>/pack.json          → public (ages), version, thème, description runtime
 *   • content/curios-parcours/<id>.json     → objectifs, compétences, métadonnées, stations (x/y/lat/lng)
 *   • content/packs/<id>/balises/*.json     → énigmes réelles (facile/moyen/difficile : texte/indice/saviez/âges)
 *   • content/packs/<id>/decouvertes/*.json → découvertes (emoji/couleur → illustrations)
 *   • content/packs/<id>/guide/*.json       → notions
 *
 *   node tools/build-catalogue.mjs            régénère js/catalogue-data.js
 *   node tools/build-catalogue.mjs --check    vérifie la synchro (exit 1 si obsolète)
 *
 * Ne jamais modifier js/catalogue-data.js à la main.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, setRelBase, sortedJsonFiles } from "../packages/content-schema/src/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "js", "catalogue-data.js");
const CATALOG = path.join(ROOT, "content", "catalog", "packs");
const PACKS = path.join(ROOT, "content", "packs");
const PARCOURS = path.join(ROOT, "content", "curios-parcours");
setRelBase(ROOT);

const checkOnly = process.argv.includes("--check");

/* ---- Ordre : le Pack Démo d'abord, puis l'index catalog ---- */
function ordreIds(catalogDir) {
  const indexPath = path.join(ROOT, "content", "catalog", "packs.json");
  let ids = [];
  if (fs.existsSync(indexPath)) {
    const idx = readJson(indexPath, ROOT);
    ids = Array.isArray(idx.packs) ? idx.packs.slice() : [];
  }
  const fichierIds = sortedJsonFiles(catalogDir).map((f) => path.basename(f, ".json"));
  ids = ids.filter((id) => fichierIds.includes(id));
  if (fichierIds.includes("demo") && !ids.includes("demo")) ids.unshift("demo");
  for (const id of fichierIds) if (!ids.includes(id)) ids.push(id);
  return ids;
}

/* ---- Lecture défensive d'un dossier de JSON ---- */
function lireDossier(dir) {
  if (!fs.existsSync(dir)) return [];
  const docs = [];
  for (const f of sortedJsonFiles(dir)) {
    try { docs.push(readJson(f, ROOT)); } catch (_) { /* doc non conforme : ignoré */ }
  }
  return docs;
}

/* ---- Énigmes réelles par balise (source = balises/*.json) ---- */
function enigmesParBalise(balise) {
  const e = balise.enigmes || {};
  const out = {};
  for (const k of ["facile", "moyen", "difficile"]) {
    const ev = e[k];
    if (!ev || !(ev.text || (Array.isArray(ev.reponses) && ev.reponses.length))) continue;
    const level = {};
    if (ev.text) level.text = ev.text;
    if (ev.indice) level.indice = ev.indice;
    if (ev.saviez) level.saviez = ev.saviez;
    if (Array.isArray(ev.ages)) level.ages = ev.ages;
    if (Array.isArray(ev.reponses)) level.nReponses = ev.reponses.length;
    out[k] = level;
  }
  return out;
}

/* ---- Stations (map + épreuves) : curios-parcours si dispo, sinon balises ---- */
function lireStations(packDir, parcours) {
  const balises = lireDossier(path.join(packDir, "balises"));
  const balById = {};
  balises.forEach((b) => { balById[b.id] = b; });

  let rawStations = [];
  if (parcours && Array.isArray(parcours.stations) && parcours.stations.length) {
    rawStations = parcours.stations;
  } else {
    rawStations = balises.map((b) => ({
      id: b.id, label: b.label, code: b.code, discoveryId: b.bird,
      x: b.x, y: b.y, lat: b.lat, lng: b.lng,
    }));
  }

  return rawStations.map((s) => {
    const b = balById[s.id] || {};
    const enigmes = enigmesParBalise(b);
    const missions = Array.isArray(s.missions) ? s.missions.length : (Object.keys(enigmes).length ? 1 : 0);
    const st = {
      id: s.id,
      label: s.label || b.label,
      code: s.code || b.code,
      decouverte: s.discoveryId || b.bird,
      x: s.x ?? b.x ?? null,
      y: s.y ?? b.y ?? null,
      lat: s.lat ?? b.lat ?? null,
      lng: s.lng ?? b.lng ?? null,
      missions,
    };
    if (Object.keys(enigmes).length) st.enigmes = enigmes;
    for (const k of Object.keys(st)) if (st[k] == null) delete st[k];
    return st;
  });
}

/* ---- Fusionne TOUTES les sources pour un pack ---- */
function assemblerPack(id, catalogDir, packsRoot) {
  const fiche = readJson(path.join(catalogDir, `${id}.json`), ROOT);
  const packDir = path.join(packsRoot, id);
  const pack = fs.existsSync(path.join(packDir, "pack.json")) ? readJson(path.join(packDir, "pack.json"), ROOT) : null;
  const parcoursPath = path.join(PARCOURS, `${id}.json`);
  const parcours = fs.existsSync(parcoursPath) ? readJson(parcoursPath, ROOT) : null;

  const stations = lireStations(packDir, parcours);
  const nbEnigmes = stations.reduce((s, st) => s + Object.keys(st.enigmes || {}).length, 0);
  const nbMissions = stations.reduce((s, st) => s + (st.missions || 1), 0) || stations.length;

  const decouvertes = lireDossier(path.join(packDir, "decouvertes"))
    .map((d) => ({ id: d.id, nom: d.nom, latin: d.latin, emoji: d.emoji, couleur: d.couleur, categorie: d.categorie, taille: d.taille }))
    .filter((d) => d.id);
  const notions = lireDossier(path.join(packDir, "guide"))
    .map((g) => ({ id: g.id, nom: g.nom, description: g.description }))
    .filter((g) => g.id);

  const competencies = Array.isArray(parcours?.pedagogy?.competencies)
    ? parcours.pedagogy.competencies.map((c) => ({ id: c.id, nom: c.nom, emoji: c.emoji, description: c.description }))
    : [];
  const objectifs = Array.isArray(parcours?.pedagogy?.objectives)
    ? parcours.pedagogy.objectives.slice()
    : [];

  const ages = Array.isArray(pack?.ages) ? pack.ages.slice()
    : Array.isArray(parcours?.audience) ? [parcours.audience[0], parcours.audience[1]]
    : Array.isArray(fiche.ages) ? fiche.ages.slice()
    : null;

  const p = {
    id: fiche.id || id,
    nom: fiche.nom || id,
    tagline: fiche.tagline || "",
    description: fiche.description || parcours?.description || pack?.description || "",
    cover: fiche.cover ?? null,
    accent: fiche.accent || "#073b5c",
    emoji: fiche.emoji || "🧭",
    difficulty: fiche.difficulty || "facile",
    durationMin: fiche.durationMin ?? 60,
    players: fiche.players || [1, 6],
    location: fiche.location || "Sur le terrain",
    environment: fiche.environment || (fiche.location ? "extérieur" : "intérieur / extérieur"),
    skills: fiche.skills || [],
    material: fiche.material || [],
    goals: fiche.goals || [],
    staff: !!fiche.staff,
    badges: fiche.badges || [],
    collection: fiche.collection || "Découvertes",
    featured: !!fiche.featured,
    ages,
    theme: fiche.theme || parcours?.theme || pack?.theme || null,
    version: pack?.version ?? parcours?.$version ?? null,
    author: fiche?.author || pack?.author || parcours?.metadata?.author || "",
    nbBalises: stations.length || 1,
    nbMissions,
    nbEnigmes,
    // Source de la carte (schématique x/y ou GPS)
    carte: {
      provider: parcours?.location?.provider || "schematic",
      center: parcours?.location?.center || null,
      gps: stations.some((s) => s.lat != null && s.lng != null),
    },
    // Lieux + épreuves + énigmes réels
    stations: stations.map((s) => {
      const o = { id: s.id, label: s.label, code: s.code, decouverte: s.decouverte, x: s.x, y: s.y, lat: s.lat, lng: s.lng, missions: s.missions };
      for (const k of Object.keys(o)) if (o[k] == null) delete o[k];
      return o;
    }),
    enigmes: stations.reduce((acc, s) => { if (s.enigmes) acc[s.id] = s.enigmes; return acc; }, {}),
    // Illustrations / découvertes / notions / pédagogie réelles
    decouvertes,
    notions,
    objectifs,
    competences: competencies,
    metadata: parcours?.metadata
      ? { author: parcours.metadata.author, organization: parcours.metadata.organization, language: parcours.metadata.language, license: parcours.metadata.license, createdAt: parcours.metadata.createdAt, updatedAt: parcours.metadata.updatedAt }
      : (fiche.itinerance ? { remark: fiche.itinerance } : null),
    // Blocs optionnels — rendus seulement si présents dans la source
    dramatisation: fiche.dramatisation ?? null,
    public: fiche.public ?? null,
    epreuves: Array.isArray(fiche.epreuves) ? fiche.epreuves : null,
  };
  for (const k of Object.keys(p)) if (p[k] == null || (Array.isArray(p[k]) && !p[k].length)) delete p[k];
  return p;
}

/* Sérialise un pack dans le format historique : clés d'objet NON quotées
 * ({ id: "x", nom: "y", ... }) pour les parsers regex existants. Les valeurs
 * imbriquées restent du JSON compact (clés quotées, non parsées ailleurs). */
function serializePack(p) {
  const parts = Object.keys(p).map((k) => `${k}: ${JSON.stringify(p[k])}`);
  return `{ ${parts.join(", ")} }`;
}
function serializePacks(packs) {
  return "[\n" + packs.map((p) => "  " + serializePack(p)).join(",\n") + "\n]";
}

function construire() {
  const ids = ordreIds(CATALOG);
  const packs = ids.map((id) => assemblerPack(id, CATALOG, PACKS));

  const byCollection = {};
  for (const p of packs) {
    if (!byCollection[p.collection]) byCollection[p.collection] = [];
    byCollection[p.collection].push(p.id);
  }
  const collections = Object.keys(byCollection).sort().map((name) => ({ nom: name, packs: byCollection[name] }));

  const data = { version: 2, updatedAt: new Date().toISOString().slice(0, 10), packs, collections };
  return {
    data,
    js: header() +
      "(function (global) {\n  \"use strict\";\n  var packs = " +
      serializePacks(packs) +
      ";\n\n  var byCollection = {};\n  packs.forEach(function (p) {\n" +
      "    if (!byCollection[p.collection]) byCollection[p.collection] = [];\n" +
      "    byCollection[p.collection].push(p.id);\n  });\n\n" +
      "  var collections = Object.keys(byCollection).sort().map(function (name) {\n" +
      "    return { nom: name, packs: byCollection[name] };\n  });\n\n" +
      "  global.CATALOGUE_DATA = {\n    version: " + JSON.stringify(data.version) + ",\n" +
      "    updatedAt: " + JSON.stringify(data.updatedAt) + ",\n    packs: packs,\n    collections: collections\n  };\n" +
      "})(typeof window !== \"undefined\" ? window : this);\n",
  };
}

function header() {
  return "/* ============================================================================\n" +
    " * catalogue-data.js — Données embarquées du Catalogue (générées).\n" +
    " * Source : tools/build-catalogue.mjs.\n" +
    " * ========================================================================== */\n";
}

const { data, js } = construire();

if (checkOnly) {
  if (!fs.existsSync(OUT) || fs.readFileSync(OUT, "utf8") !== js) {
    console.error("✗ js/catalogue-data.js obsolète — lancez : node tools/build-catalogue.mjs");
    process.exit(1);
  }
  console.log(`OK : js/catalogue-data.js synchronisé (${data.packs.length} packs, source de vérité complète)`);
} else {
  fs.writeFileSync(OUT, js, "utf8");
  const totEnigmes = data.packs.reduce((s, p) => s + (p.nbEnigmes || 0), 0);
  const totStations = data.packs.reduce((s, p) => s + (p.stations ? p.stations.length : 0), 0);
  const totDisc = data.packs.reduce((s, p) => s + (p.decouvertes ? p.decouvertes.length : 0), 0);
  console.log(`généré : js/catalogue-data.js (${data.packs.length} packs, ${data.collections.length} collections, ${totStations} épreuves, ${totEnigmes} énigmes, ${totDisc} découvertes)`);
  const sansDesc = data.packs.filter((p) => !p.description);
  if (sansDesc.length) console.warn("  ⚠ packs sans description :", sansDesc.map((p) => p.id).join(", "));
  const sansAges = data.packs.filter((p) => !p.ages);
  if (sansAges.length) console.warn("  ⚠ packs sans public/ages :", sansAges.map((p) => p.id).join(", "));
  const sansStations = data.packs.filter((p) => !p.stations || !p.stations.length);
  if (sansStations.length) console.warn("  ⚠ packs sans épreuves :", sansStations.map((p) => p.id).join(", "));
}