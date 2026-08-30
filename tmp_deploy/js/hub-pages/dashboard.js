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

    return (
      '<div class="hub-page-header">' +
      "<div>" +
      '<h1 class="hub-page-title">' + greeting + " " + HubShell.escHtml(user ? user.name : "") + "</h1>" +
      '<p class="hub-page-sub">' + dateStr + "</p>" +
      "</div>" +
      "</div>" +

      '<div class="hub-stats">' +
      statCard("📁", "blue", "—", "Projets actifs") +
      statCard("🎯", "green", "—", "Sessions en cours") +
      statCard("📦", "gold", "—", "Packs disponibles") +
      statCard("👥", "red", "—", "Équipes connectées") +
      "</div>" +

      '<div class="hub-grid">' +

      '<div class="hub-card">' +
      '<div class="hub-card-header">' +
      "<h2>🚀 Accès rapides</h2>" +
      "</div>" +
      '<div class="hub-quick-actions">' +
      quickAction("📁", "Nouveau projet", "new-projet") +
      quickAction("🗺️", "Nouveau parcours", "new-parcours") +
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
      "✅ Aucune alerte pour le moment." +
      "</div></div></div>" +

      "</div>" +

      '<div class="hub-card">' +
      '<div class="hub-card-header">' +
      "<h2>🔗 Outils de création</h2>" +
      "</div>" +
      '<div class="hub-quick-actions">' +
      '<a class="hub-quick-action" href="../player/studio.html">' +
      '<span class="qa-icon">🎨</span><span class="qa-label">Studio de création<span style="display:block;font-size:12px;font-weight:400;color:var(--hub-ink-dim);">Workflow guidé en 8 étapes</span></span></a>' +
      '<a class="hub-quick-action" href="../player/editeur.html">' +
      '<span class="qa-icon">✏️</span><span class="qa-label">Éditeur de contenu<span style="display:block;font-size:12px;font-weight:400;color:var(--hub-ink-dim);">Modifier balises, découvertes, quiz</span></span></a>' +
      '<a class="hub-quick-action" href="../player/atelier.html">' +
      '<span class="qa-icon">🧩</span><span class="qa-label">Atelier de packs<span style="display:block;font-size:12px;font-weight:400;color:var(--hub-ink-dim);">Créer et exporter des bundles</span></span></a>' +
      '<a class="hub-quick-action" href="../player/dashboard.html">' +
      '<span class="qa-icon">🎛️</span><span class="qa-label">Dashboard organisateur<span style="display:block;font-size:12px;font-weight:400;color:var(--hub-ink-dim);">Suivi en direct des équipes</span></span></a>' +
      "</div></div>"
    );
  }

  function statCard(icon, color, value, label) {
    return (
      '<div class="hub-stat">' +
      '<div class="hub-stat-icon ' + color + '">' + icon + "</div>" +
      "<div>" +
      '<div class="hub-stat-value">' + value + "</div>" +
      '<div class="hub-stat-label">' + label + "</div>" +
      "</div></div>"
    );
  }

  function quickAction(icon, label, action) {
    return (
      '<a class="hub-quick-action" href="#" data-page-action="' + action + '">' +
      '<span class="qa-icon">' + icon + "</span>" +
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
})();
