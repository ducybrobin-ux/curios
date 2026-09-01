/* hub-pages/catalogue.js — Page « Catalogue » du CURIOS Project Hub.
 *
 * Vue organisateur : liste des expéditions (données embarquées CATALOGUE_DATA
 * fusionnées avec l'état réel de GET /api/packs), accès au catalogue immersif,
 * actions activation / jeu / fiche.
 */
(function () {
  "use strict";

  var DATA = window.CATALOGUE_DATA || { packs: [], collections: [] };
  var liveStates = {};
  DATA.packs.forEach(function (p) { liveStates[p.id] = undefined; });

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function ico(name, cls) {
    return '<img class="cur-icon' + (cls ? " " + cls : "") + '" src="../img/icons/' + name + '.svg" alt="">';
  }
  function isActive(p) {
    var live = liveStates[p.id];
    return live ? !!live.actif : false;
  }
  function liveState(p) {
    return (liveStates[p.id] && liveStates[p.id].state) || null;
  }
  function stationCount(p) {
    var live = liveStates[p.id];
    if (live && typeof live.stations === "number") return live.stations;
    return p.nbBalises || 1;
  }
  function badgeFor(p) {
    var st = liveState(p);
    if (isActive(p)) return '<span class="hub-tag hub-tag-active">● ACTIF</span>';
    if (st === "DISABLED") return '<span class="hub-tag hub-tag-draft">● DÉSACTIVÉ</span>';
    return '<span class="hub-badge-ok" style="display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;">DISPONIBLE</span>';
  }

  function renderCatalogue(user) {
    var rows = DATA.packs.map(function (p) {
      return (
        "<tr>" +
        "<td><strong>" + esc(p.emoji || "🧭") + " " + esc(p.nom) + "</strong><br>" +
        '<span style="font-size:12px;color:var(--hub-ink-dim);">' + esc(p.tagline || "") + "</span></td>" +
        "<td>" + esc(p.collection || "—") + "</td>" +
        "<td>" + stationCount(p) + "</td>" +
        "<td>~" + (p.durationMin || "—") + " min</td>" +
        "<td>" + badgeFor(p) + "</td>" +
        "<td>" +
        (isActive(p)
          ? '<button class="hub-btn hub-btn-primary cat-hub-play" data-id="' + esc(p.id) + '">' + ico("play", "cur-icon--xs") + ' Jouer</button>'
          : '<button class="hub-btn hub-btn-outline cat-hub-activate" data-id="' + esc(p.id) + '">Activer</button>') +
        '<button class="hub-btn cat-hub-detail" data-id="' + esc(p.id) + '">Fiche</button>' +
        "</td>" +
        "</tr>"
      );
    }).join("");

    return (
      '<div class="hub-page-header">' +
      "<div>" +
      '<h1 class="hub-page-title">🎨 Catalogue</h1>' +
      '<p class="hub-page-sub">Les expéditions Curi🧭s, leur état et leurs actions</p>' +
      "</div>" +
      '<div class="hub-page-actions">' +
      '<a class="hub-btn hub-btn-primary" href="../catalogue.html">🖥️ Ouvrir le catalogue immersif</a>' +
      "</div></div>" +
      '<div class="hub-card" style="padding:0;overflow:hidden;">' +
      '<table class="hub-table">' +
      "<thead><tr>" +
      "<th>Expédition</th><th>Collection</th><th>Balises</th><th>Durée</th><th>État</th><th>Actions</th>" +
      "</tr></thead>" +
      "<tbody>" + rows + "</tbody>" +
      "</table>" +
      "</div>" +
      '<div class="hub-card" style="margin-top:16px;">' +
      '<div class="hub-empty" style="padding:16px;text-align:left;">' +
      '<div class="hub-empty-desc">' + ico("hint") + ' Retrouve les expéditions officielles et communautaires dans le catalogue immersif, ou gère l\'activation du parcours actif depuis cette table.</div>' +
      "</div></div>"
    );
  }

  function loadLive() {
    if (!window.fetch) return;
    fetch("/api/packs", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("r"); return r.json(); })
      .then(function (j) {
        (j.packs || []).forEach(function (pp) { liveStates[pp.id] = pp; });
        var cur = window.location.hash;
        if (cur.indexOf("catalogue") !== -1 && HubShell && HubShell.navigate) HubShell.navigate("catalogue");
      })
      .catch(function () {});
  }

  function activate(id) {
    fetch("/api/packs/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id })
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.ok) { HubShell.toast("Parcours activé ✔"); setTimeout(loadLive, 400); }
      else HubShell.toast((j && j.error) || "Activation impossible (réservé à l'organisateur).");
    }).catch(function () {
      HubShell.toast("Hors ligne : activation impossible.");
    });
  }

  function bindActions() {
    document.addEventListener("click", function (e) {
      var el = e.target && e.target.closest ? e.target.closest(".cat-hub-activate, .cat-hub-play, .cat-hub-detail") : null;
      if (!el) return;
      var id = el.getAttribute("data-id");
      if (!id) return;
      if (el.classList.contains("cat-hub-activate")) activate(id);
      else if (el.classList.contains("cat-hub-play")) window.open("../index.html", "_blank");
      else if (el.classList.contains("cat-hub-detail")) window.open("../catalogue.html", "_blank");
    });
  }

  window.renderCatalogue = renderCatalogue;
  window.hubAction_catalogue = loadLive;

  if (document.readyState === "complete" || document.readyState === "interactive") {
    bindActions();
    loadLive();
  } else {
    document.addEventListener("DOMContentLoaded", function () { bindActions(); loadLive(); });
  }
})();
