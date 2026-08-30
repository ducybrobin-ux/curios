/* engine-helpers.js — Utilitaires partagés pour les modules de jeu.
 *
 * Réexporte depuis packages/shared/ et packages/game-engine/ pour
 * éviter les imports ESM dans les fichiers concaténés par le build.
 */

/**
 * Échappement HTML (depuis packages/shared/src/escape.js).
 * @param {*} s
 * @returns {string}
 */
export function esc(s) {
  const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ESC_MAP[c]);
}

/**
 * Normalisation de réponse (depuis packages/game-engine/src/normalize.js).
 * @param {*} s
 * @returns {string}
 */
export function normalize(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''\u2019]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
