/* answers.js — Vérification de réponse à une énigme.
 *
 * compare une réponse utilisateur aux réponses acceptées (normalisées),
 * en ignorant les articles initiaux (le/la/les/un/une/des/du/de/aux/l'/d'…),
 * ET en acceptant l'absence d'article côté joueur quand la référence en porte un
 * (et inversement). La tolérance aux articles est donc SYMÉTRIQUE.
 *
 * Extrait de js/data.js (héritage Multi JDP), corrigé CURIOS.
 */

import { normalize } from "./normalize.js";

/* Déterminants initiaux français tolérés (à appliquer APRÈS normalisation :
 * les apostrophes sont déjà converties en espaces par normalize, donc
 * "l'urgence" → "l urgence" et "d'école" → "d ecole").
 * L'ordre compte : on teste les déterminants multi-mots d'abord. */
const INITIAL_ARTICLES = [
  "de la ", "de l ", "de ",
  "le ", "la ", "les ", "l ",
  "un ", "une ", "des ", "du ", "aux ", "d ",
];

/**
 * Retire un déterminant initial éventuel (uniquement s'il est suivi d'un
 * espace, pour ne pas toucher aux mots "de", "des"… qui ne seraient pas des
 * articles). Ne modifie pas la chaîne si aucun article n'est présent.
 * @param {string} s chaîne normalisée
 * @returns {string}
 */
function stripInitialArticle(s) {
  for (const art of INITIAL_ARTICLES) {
    if (s.startsWith(art)) return s.slice(art.length).trim();
  }
  return s;
}

/**
 * Vérifie si `answer` correspond à l'une des réponses de `enigme`.
 * Compare de façon tolérante : normalisation (accents/casse/espaces),
 * articles initiaux ignorés des deux côtés, et prise en compte de l'un
 * ou l'autre des champs `reponses` / `answers` (sans ignorer un champ
 * renseigné au profit d'un champ vide).
 * @param {{ reponses?: string[], answers?: string[] }} enigme
 * @param {string} answer
 * @returns {boolean}
 */
export function checkAnswer(enigme, answer) {
  const a = normalize(answer);
  if (!a) return false;
  const list =
    Array.isArray(enigme?.reponses) && enigme.reponses.length
      ? enigme.reponses
      : (enigme?.answers || []);
  return list.some((r) => {
    const rn = normalize(r);
    return (
      rn === a ||
      stripInitialArticle(rn) === a ||
      rn === stripInitialArticle(a) ||
      stripInitialArticle(rn) === stripInitialArticle(a)
    );
  });
}
