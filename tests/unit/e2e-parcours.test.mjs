/* =========================================================
   E2E fonctionnel — Réparation : « Choisir un parcours »
   et création de profil famille.

   Valide la cohérence entre content/, js/data.js (ACTIVE_PACKS),
   js/catalogue-data.js (catalogue embarqué hors-ligne) et le
   flux Store de création/activation de profil.

   Nombre de tests : 15 — exécuter : node --test tests/unit/e2e-parcours.test.mjs
   ========================================================= */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chargerContenu, setRelBase } from "../../packages/content-schema/src/index.js";
import { createStore } from "../../packages/store/src/index.js";

const ROOT = resolve(fileURLToPath(import.meta.url), "../../..");
const MANIFEST = JSON.parse(readFileSync(resolve(ROOT, "content", "manifest.json"), "utf8"));
const DATA_JS = readFileSync(resolve(ROOT, "js", "data.js"), "utf8");
const CATALOGUE_JS = readFileSync(resolve(ROOT, "js", "catalogue-data.js"), "utf8");
const APP_JS = readFileSync(resolve(ROOT, "js", "app.js"), "utf8");

setRelBase(ROOT);
const contenu = chargerContenu(resolve(ROOT, "content"), ROOT);

/* ---- Extraction des ids embarqués dans js/catalogue-data.js ---- */
function catalogueIds() {
  const ids = [];
  const re = /id:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(CATALOGUE_JS)) !== null) ids.push(m[1]);
  return ids;
}

/* ---- Extraction de ACTIVE_PACKS depuis js/data.js ---- */
function activePacksFromData() {
  const m = /ACTIVE_PACKS\s*=\s*\[([\s\S]*?)\]/m.exec(DATA_JS);
  if (!m) return [];
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

/* ---- Miroir de renderParcours : état d'un pack ---- */
function stateOf(id, activeIds) {
  return activeIds.includes(id) ? "ACTIVE" : "AVAILABLE";
}

/* ---- Store en mémoire (même signature que packages/store) ---- */
function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
}
function makeStore(overrides = {}) {
  return createStore({ baliseCount: 9, storage: memoryStorage(), log: () => {}, ...overrides });
}

/* ================================================================
   1) DONNÉES DU « CHOIX DE PARCOURS »
   ================================================================ */
describe("E2E — Données du choix de parcours", () => {
  it("01. content/manifest.json déclare exactement un pack actif", () => {
    const actifs = MANIFEST.packs.filter((p) => p.actif);
    assert.equal(actifs.length, 1);
    assert.equal(actifs[0].id, "packdemo");
  });

  it("02. chargerContenu expose packsActifs cohérent avec le manifest", () => {
    const att = MANIFEST.packs.filter((p) => p.actif).map((p) => p.id);
    assert.deepEqual([...contenu.packsActifs].sort(), att.sort());
    assert.equal(contenu.packsActifs.length, 1);
  });

  it("03. js/data.js embarque l'id actif (ACTIVE_PACKS) et src est synchronisée", () => {
    const ids = activePacksFromData();
    assert.deepEqual(ids, contenu.packsActifs);
    assert.ok(ids.includes("packdemo"));
  });

  it("04. js/app.js contient le fallback offline du catalogue (réparation en place)", () => {
    assert.match(APP_JS, /CATALOGUE_DATA/);
    assert.match(APP_JS, /renderPackList/);
    assert.match(APP_JS, /ACTIVE_PACKS/);
  });

  it("05. js/catalogue-data.js liste tous les packs du manifest (listable hors-ligne)", () => {
    const ids = catalogueIds();
    for (const p of MANIFEST.packs) {
      assert.ok(ids.includes(p.id), `pack absent du catalogue : ${p.id}`);
    }
  });

  it("06. les packs Cosmos et Passeurs sont présents dans le catalogue", () => {
    const ids = catalogueIds();
    assert.ok(ids.includes("cosmos-mission-orion"));
    assert.ok(ids.includes("passeur-relais"));
  });

  it("07. mapping état : pack actif→ACTIVE, les autres→AVAILABLE (rendu renderParcours)", () => {
    const activeIds = contenu.packsActifs;
    const ids = catalogueIds();
    for (const id of ids) {
      const expected = activeIds.includes(id) ? "ACTIVE" : "AVAILABLE";
      assert.equal(stateOf(id, activeIds), expected, `état incohérent pour ${id}`);
    }
    // exactement un ACTIVE, les autres disponibles pour « Choisir ce parcours »
    assert.equal(ids.filter((id) => stateOf(id, activeIds) === "ACTIVE").length, 1);
    assert.ok(ids.filter((id) => stateOf(id, activeIds) === "AVAILABLE").length > 1);
  });

  it("08. chaque pack du catalogue a id et nom non vides", () => {
    const re = /\{\s*id:\s*"([^"]+)",\s*nom:\s*"([^"]+)"/g;
    let m;
    let count = 0;
    while ((m = re.exec(CATALOGUE_JS)) !== null) {
      count++;
      assert.ok(m[1].length > 0, "id vide");
      assert.ok(m[2].length > 0, "nom vide");
    }
    assert.equal(count, catalogueIds().length, "tous les packs ont un nom");
  });
});

/* ================================================================
   2) CRÉATION DE PROFIL FAMILLE (Store)
   ================================================================ */
describe("E2E — Création de profil famille (Store)", () => {
  it("09. createProfile crée, active et persiste (seeds = nb balises)", () => {
    const s = makeStore();
    const p = s.createProfile("Famille Dupont", 2, "#0c8f4f", "🧭");
    assert.equal(p.name, "Famille Dupont");
    assert.equal(p.kids, 2);
    assert.equal(p.seeds, 9);
    assert.equal(s.getActive().id, p.id);
    assert.equal(s.getProfiles().length, 1);
  });

  it("10. mode par défaut : classic (ni race ni random)", () => {
    const s = makeStore();
    s.createProfile("Famille Martin", 1, "#2f6fd0", "🦊");
    assert.equal(s.raceEnabled(), false);
    assert.equal(s.randomEnabled(), false);
  });

  it("11. mode race : réglage global + playMode du profil", () => {
    const s = makeStore();
    const p = s.createProfile("Famille Race", 2, "#333", "🐺");
    s.setSettings({ race: true });
    s.updateProfile(p.id, { playMode: "race", raceOrder: null });
    assert.equal(s.raceEnabled(), true);
  });

  it("12. mode random : raceOrder généré non vide", () => {
    const s = makeStore();
    const p = s.createProfile("Famille Alea", 2, "#333", "🎲");
    s.updateProfile(p.id, { playMode: "random", raceOrder: ["b1", "b2", "b3"] });
    assert.equal(s.randomEnabled(), true);
    assert.ok(s.getRaceOrder(p).length > 0);
  });

  it("13. setActive bascule le profil actif", () => {
    const s = makeStore();
    const a = s.createProfile("Alpha", 1, "#111", "A");
    const b = s.createProfile("Beta", 1, "#222", "B");
    assert.equal(s.getActive().id, b.id);
    s.setActive(a.id);
    assert.equal(s.getActive().id, a.id);
    assert.equal(s.getProfiles().length, 2);
  });

  it("14. updateProfile renomme un profil persistant", () => {
    const s = makeStore();
    const p = s.createProfile("Ancien", 2, "#c00", "🔍");
    s.updateProfile(p.id, { name: "Nouveau nom" });
    assert.equal(s.getActive().name, "Nouveau nom");
  });

  it("15. resetProgress remet à zéro, puis deleteProfile recalcule l'actif", () => {
    const s = makeStore();
    const a = s.createProfile("Alpha", 1, "#111", "A");
    s.unlockBalise("b1", "d1", 3);
    assert.equal(s.getActive().completed.length, 1);
    s.resetProgress(a.id);
    assert.equal(s.getActive().completed.length, 0);
    s.setActive(a.id);
    s.deleteProfile(a.id);
    assert.equal(s.getProfiles().length, 0);
    assert.equal(s.getActive(), null);
  });
});
