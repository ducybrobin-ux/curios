/* hub-api.js — Client API CURIOS Project Hub
 *
 * Fetch JSON vers les endpoints du serveur avec le token Hub
 * quand il existe. Renvoie null en cas d'échec (mode sans backend,
 * hors-ligne, 401) : les appels restent silencieux et non bloquants.
 * Zero dependencies (requiert window.HubAuth optionnel pour le token).
 */
(function () {
  "use strict";

  async function getJson(path) {
    var opts = { method: "GET", headers: { "Content-Type": "application/json" } };
    var token = null;
    try {
      if (window.HubAuth && typeof window.HubAuth.getToken === "function") {
        token = window.HubAuth.getToken();
      }
    } catch {}
    if (token) opts.headers.Authorization = "Bearer " + token;

    try {
      var res = await fetch(path, opts);
      if (!res.ok) return null;
      return await res.json().catch(function () { return null; });
    } catch {
      return null;
    }
  }

  window.HubApi = {
    getJson: getJson,
  };
})();