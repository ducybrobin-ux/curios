/* password.js — Hachage PBKDF2 partagé (source de vérité unique).
 *
 * Fonctions pures, zéro dépendance (Node.js crypto uniquement).
 * Utilisé par les deux stacks d'auth du serveur :
 *   - packages/server/src/auth.js            (organisateur, session)
 *   - packages/server/src/routes/hub-auth.js (multi-utilisateurs Hub)
 *
 * Les paramètres PBKDF2 sont centralisés ici pour éviter tout désalignement
 * entre les stacks (itérations, longueur de clé, digest).
 */

import crypto from "node:crypto";

export const PBKDF2_ITERATIONS = 100000;
export const KEY_LENGTH = 64;
export const DIGEST = "sha512";
export const SALT_LENGTH = 16;

/**
 * Dérive un mot de passe en PBKDF2 et renvoie `{ hash, salt }`.
 * Si `salt` est fourni, il est réutilisé (vérification) ; sinon généré aléatoirement.
 * @param {string} password
 * @param {string} [salt] — hex
 * @returns {{ hash: string, salt: string }}
 */
export function hashPassword(password, salt) {
  if (!salt) salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const derived = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST);
  return { hash: derived.toString("hex"), salt };
}

/**
 * Vérifie un mot de passe contre un hash PBKDF2 + sel (comparaison à temps constant).
 * @param {string} password
 * @param {string} salt — hex
 * @param {string} expectedHash — hex
 * @returns {boolean}
 */
export function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt);
  return timingSafeEqualString(hash, expectedHash);
}

/**
 * Comparaison à temps constant de deux chaînes hexadécimales.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function timingSafeEqualString(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
