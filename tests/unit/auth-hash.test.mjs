/* auth-hash.test.mjs — Tests du hachage PBKDF2 du mot de passe organisateur
 *
 * Vérifie : (1) le stockage est toujours haché (jamais en clair),
 * (2) la migration d'un ancien auth.json en clair → hash, (3) les échecs.
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createAuth } from "../../packages/server/src/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let tmp;
let authFile;

before(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "curios-auth-"));
  authFile = path.join(tmp, "data", "auth.json");
});

after(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("auth hashing (organisateur)", () => {
  it("savePassword stocke un hash, jamais le clair", () => {
    const auth = createAuth(tmp);
    auth.savePassword("s3cret!");
    const raw = JSON.parse(fs.readFileSync(authFile, "utf8"));
    assert.equal(typeof raw.salt, "string");
    assert.equal(typeof raw.hash, "string");
    assert.ok(raw.salt.length > 0 && raw.hash.length > 0);
    assert.ok(!("password" in raw), "aucun champ clair ne doit persister");
    assert.notEqual(raw.hash, "s3cret!");
    assert.equal(auth.checkPassword("s3cret!"), true);
    assert.equal(auth.checkPassword("mauvais"), false);
  });

  it("checkPassword rejette un mauvais mot de passe haché", () => {
    const auth = createAuth(tmp); // recharge depuis le fichier haché
    assert.equal(auth.hasPassword(), true);
    assert.equal(auth.checkPassword("s3cret!"), true);
    assert.equal(auth.checkPassword("autre"), false);
  });

  it("migre un ancien auth.json en clair vers un hash", () => {
    // Simule l'ancien format { password: "legacy" }
    fs.writeFileSync(authFile, JSON.stringify({ password: "legacy" }), "utf8");
    let auth = createAuth(tmp);
    assert.equal(auth.hasPassword(), true, "le clair hérité compte comme défini");
    assert.equal(auth.checkPassword("legacy"), true);
    // Après vérification, le fichier doit être réécrit en hash
    const raw = JSON.parse(fs.readFileSync(authFile, "utf8"));
    assert.ok(!("password" in raw), "le clair doit être remplacé par un hash");
    assert.equal(typeof raw.hash, "string");

    // Recharge : le nouveau hash fonctionne, l'ancien clair est oublié
    auth = createAuth(tmp);
    assert.equal(auth.checkPassword("legacy"), true);
    assert.equal(auth.checkPassword("autre"), false);
  });

  it("rejette le mauvais mot de passe dans le chemin de migration", () => {
    fs.writeFileSync(authFile, JSON.stringify({ password: "legacy" }), "utf8");
    const auth = createAuth(tmp);
    assert.equal(auth.checkPassword("nawak"), false);
    // Le fichier ne doit PAS avoir été réécrit (pas de migration sur échec)
    const raw = JSON.parse(fs.readFileSync(authFile, "utf8"));
    assert.ok("password" in raw, "le fichier reste en clair tant que l'auth échoue");
  });
});
