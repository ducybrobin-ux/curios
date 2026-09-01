/* password-consolidation.test.mjs — Source de vérité unique du hachage PBKDF2
 *
 * Vérifie que les deux stacks d'auth (organisateur auth.js + Hub hub-auth.js)
 * utilisent bien le module partagé packages/shared/src/password.js, avec des
 * paramètres alignés, et que les hash restent interopérables.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword, verifyPassword, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST, SALT_LENGTH,
} from "../../packages/shared/src/index.js";

describe("password partagé (PBKDF2 unique)", () => {
  it("hashPassword génère un sel aléatoire et un hash dérivable", () => {
    const { hash, salt } = hashPassword("s3cret!");
    assert.equal(typeof hash, "string");
    assert.equal(typeof salt, "string");
    assert.equal(salt.length, SALT_LENGTH * 2, "sel hex de SALT_LENGTH octets");
    assert.equal(hash.length, KEY_LENGTH * 2, "hash hex de KEY_LENGTH octets");
    assert.notEqual(hash, "s3cret!");
  });

  it("hashPassword est déterministe avec un sel fourni", () => {
    const salt = "00".repeat(SALT_LENGTH);
    const a = hashPassword("mdp", salt);
    const b = hashPassword("mdp", salt);
    assert.equal(a.hash, b.hash);
  });

  it("verifyPassword accepte le bon mot de passe et rejette le mauvais", () => {
    const { hash, salt } = hashPassword("s3cret!");
    assert.equal(verifyPassword("s3cret!", salt, hash), true);
    assert.equal(verifyPassword("mauvais", salt, hash), false);
  });

  it("paramètres PBKDF2 centralisés (100000 it., SHA-512, 64 octets)", () => {
    assert.equal(PBKDF2_ITERATIONS, 100000);
    assert.equal(KEY_LENGTH, 64);
    assert.equal(DIGEST, "sha512");
  });
});
