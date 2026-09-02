/* hub-pages/dashboard.js — Dashboard initial CURIOS Project Hub
 *
 * Stats, dernières sessions, accès rapides, alertes.
 */
(function () {
  "use strict";

  function renderDashboard(user) {
    var now = new Date();
    var greeting = getGreeting(now);
    var dateStr = now.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    loadStats();

    return (
      '<div class="hub-page-header">' +
      "<div>" +
      '<h1 class="hub-page-title">' + greeting + " " + HubShell.escHtml(user ? user.name : "") + "</h1>" +
      '<p class="hub-page-sub">' + dateStr + "</p>" +
      "</div>" +
      "</div>" +

      '<div class="hub-stats">' +
      statCard("hub-stat-projets", "📁", "blue", "—", "Projets actifs") +
      statCard("hub-stat-sessions", "🎯", "green", "—", "Sessions en cours") +
      statCard("hub-stat-packs", "📦", "gold", "—", "Packs disponibles") +
      statCard("hub-stat-teams", "team", "red", "—", "Équipes connectées") +
      "</div>" +

      '<div class="hub-grid">' +

      '<div class="hub-card">' +
      '<div class="hub-card-header">' +
      "<h2>🚀 Accès rapides</h2>" +
      "</div>" +
      '<div class="hub-quick-actions">' +
      quickAction("📁", "Nouveau projet", "new-projet") +
      quickAction("map", "Nouveau parcours", "new-parcours") +
      quickAction("🧩", "Créer un pack", "create-pack") +
      quickAction("🎯", "Lancer une session", "new-session") +
      "</div></div>" +

      '<div class="hub-card">' +
      '<div class="hub-card-header">' +
      "<h2>📋 Dernières sessions</h2>" +
      "</div>" +
      '<div id="hub-recent-sessions">' +
      '<div class="hub-empty" style="padding:24px;">' +
      '<div class="hub-empty-icon" style="font-size:32px;">🎯</div>' +
      '<div class="hub-empty-desc">Aucune session récente</div>' +
      "</div></div></div>" +

      '<div class="hub-card">' +
      '<div class="hub-card-header">' +
      "<h2>⚡ Alertes</h2>" +
      "</div>" +
      '<div id="hub-alerts">' +
      '<div style="padding:8px 0;color:var(--hub-ink-dim);font-size:14px;">' +
      iconEl("check") + " Aucune alerte pour le moment." +
      "</div></div></div>" +

      "</div>" +

      '<div class="hub-card">' +
      '<div class="hub-card-header">' +
      "<h2>🔗 Outils de création</h2>" +
      "</div>" +
      '<div class="hub-quick-actions">' +
      '<a class="hub-quick-action" href="../studio.html">' +
      '<span class="qa-icon">🎨</span><span class="qa-label">Studio de création<span style="display:block;font-size:12px;font-weight:400;color:var(--hub-ink-dim);">Workflow guidé en 8 étapes</span></span></a>' +
      '<a class="hub-quick-action" href="../editeur.html">' +
      '<span class="qa-icon">✏️</span><span class="qa-label">Éditeur de contenu<span style="display:block;font-size:12px;font-weight:400;color:var(--hub-ink-dim);">Modifier balises, découvertes, quiz</span></span></a>' +
      '<a class="hub-quick-action" href="../atelier.html">' +
      '<span class="qa-icon">🧩</span><span class="qa-label">Atelier de packs<span style="display:block;font-size:12px;font-weight:400;color:var(--hub-ink-dim);">Créer et exporter des bundles</span></span></a>' +
      '<a class="hub-quick-action" href="../dashboard.html">' +
      '<span class="qa-icon">🎛️</span><span class="qa-label">Dashboard organisateur<span style="display:block;font-size:12px;font-weight:400;color:var(--hub-ink-dim);">Suivi en direct des équipes</span></span></a>' +
      "</div></div>"
    );
  }

  function iconEl(icon) {
    if (icon && /^[A-Za-z0-9.-]+$/.test(icon)) {
      return '<img class="cur-icon" src="../img/icons/' + icon + '.svg" alt="">';
    }
    return icon;
  }

  function statCard(id, icon, color, value, label) {
    return (
      '<div class="hub-stat">' +
      '<div class="hub-stat-icon ' + color + '">' + iconEl(icon) + "</div>" +
      "<div>" +
      '<div class="hub-stat-value" id="' + id + '">' + value + "</div>" +
      '<div class="hub-stat-label">' + label + "</div>" +
      "</div></div>"
    );
  }

  /* --- Stats câblées sur les endpoints serveur (silencieux si indisponible) --- */

  var _gen = 0;

  async function loadStats() {
    _gen++;
    var g = _gen;

    // Projets actifs + sessions en cours : agrégat Hub (auth Hub).
    var ana = await window.HubApi.getJson("/api/hub/analytics");
    if (ana && ana.totals && g === _gen) {
      setValue("hub-stat-projets", ana.byStatus && ana.byStatus.projetsActive != null ? ana.byStatus.projetsActive : ana.totals.projets);
      setValue("hub-stat-sessions", ana.byStatus && ana.byStatus.sessionsActive != null ? ana.byStatus.sessionsActive : ana.totals.sessions);
    }

    // Packs réellement installés / disponibles (public) : /api/packs.
    var packs = await window.HubApi.getJson("/api/packs");
    if (packs && packs.total != null && g === _gen) {
      setValue("hub-stat-packs", packs.total);
    }

    // Équipes connectées (positions GPS fraîches 3 min, public) : /api/pos.
    var pos = await window.HubApi.getJson("/api/pos");
    if (pos && g === _gen) {
      setValue("hub-stat-teams", Array.isArray(pos.positions) ? pos.positions.length : 0);
    }
  }

  function setValue(id, val) {
    var el = document.getElementById(id);
    var shown = val == null ? "—" : String(val);
    if (el) el.textContent = shown;
  }

  function quickAction(icon, label, action) {
    return (
      '<a class="hub-quick-action" href="#" data-page-action="' + action + '">' +
      '<span class="qa-icon">' + iconEl(icon) + "</span>" +
      '<span class="qa-label">' + label + "</span></a>"
    );
  }

  function getGreeting(date) {
    var h = date.getHours();
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  }

  window.renderDashboard = renderDashboard;
  window.HubDashboard = { load: loadStats };
})();
