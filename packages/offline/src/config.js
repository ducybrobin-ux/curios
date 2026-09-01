/**
 * @curios/offline — Configuration du service worker.
 *
 * VERSION   : bumpé à chaque déploiement pour invalider les caches.
 * CACHE     : nom du cache principal (précaché au install).
 * RUNTIME   : nom du cache de secours (rempli au fil des navigations).
 *
 * NOTE : La liste PRECACHE est auto-générée par tools/build-sw.mjs
 * (scan du filesystem). Ne plus la maintenir manuellement ici.
 */

export const VERSION = "curios-v5";
export const CACHE = "curios-core-v5";
export const RUNTIME = "curios-runtime-v5";
