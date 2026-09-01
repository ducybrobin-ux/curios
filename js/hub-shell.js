/* hub-shell.js — App Shell CURIOS Project Hub
 *
 * Top bar navigation, hash routing, page rendering.
 * Zero dependencies.
 */
(function () {
  "use strict";

  var NAV_ITEMS = [
    /* Les icônes nommées ASCII → img/img/icons/*.svg du pack officiel ;
       les émojis restants n'ont pas d'équivalent 1:1 dans le pack. */
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "projets", label: "Projets", icon: "📁" },
    { id: "parcours", label: "Parcours", icon: "map" },
    { id: "catalogue", label: "Catalogue", icon: "🎨" },
    { id: "packs", label: "Packs", icon: "📦" },
    { id: "sessions", label: "Sessions", icon: "🎯" },
    { id: "clients", label: "Clients", icon: "team" },
    { id: "materiel", label: "Matériel", icon: "🔧" },
    { id: "planning", label: "Planning", icon: "📅" },
    { id: "commercial", label: "Commercial", icon: "💰" },
    { id: "analytics", label: "Analytics", icon: "📈" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  var PAGES = {};
  var currentPage = null;

  function registerPage(id, renderFn) {
    PAGES[id] = renderFn;
  }

  function getRoute() {
    var hash = window.location.hash.replace("#/", "").split("?")[0];
    return hash || "dashboard";
  }

  function navigate(pageId) {
    if (!PAGES[pageId]) pageId = "dashboard";
    currentPage = pageId;
    window.location.hash = "#/" + pageId;
    renderShell();
  }

  function renderShell() {
    var user = HubAuth.getUser();
    var pageId = getRoute();
    var container = document.getElementById("hub-content");
    if (!container) return;

    renderTopbar(user, pageId);

    if (PAGES[pageId]) {
      try {
        var html = PAGES[pageId](user);
        container.innerHTML = typeof html === "string" ? html : "";
      } catch (err) {
        container.innerHTML =
          '<div class="hub-empty"><div class="hub-empty-icon">' + iconTag("warning") + '</div>' +
          '<div class="hub-empty-title">Erreur de chargement</div>' +
          '<div class="hub-empty-desc">' + escHtml(err.message) + "</div></div>";
      }
    } else {
      container.innerHTML =
        '<div class="hub-empty"><div class="hub-empty-icon">' + iconTag("search") + '</div>' +
        '<div class="hub-empty-title">Page introuvable</div>' +
        '<div class="hub-empty-desc">La page "' + escHtml(pageId) + '" n\'existe pas.</div></div>';
    }

    bindNavEvents();
    bindPageEvents();
  }

  function iconTag(icon) {
    if (icon && /^[A-Za-z0-9.-]+$/.test(icon)) {
      return '<img class="cur-icon" src="../img/icons/' + icon + '.svg" alt="">';
    }
    return icon;
  }

  function renderTopbar(user, activePageId) {
    var topbar = document.getElementById("hub-topbar");
    if (!topbar) return;

    var navHtml = NAV_ITEMS.map(function (item) {
      var active = item.id === activePageId ? " active" : "";
      return (
        '<button class="hub-nav-item' + active + '" data-nav="' + item.id + '">' +
        '<span class="icon">' + iconTag(item.icon) + "</span>" +
        "<span>" + item.label + "</span></button>"
      );
    }).join("");

    var initials = HubAuth.getInitials(user ? user.name : "?");

    topbar.innerHTML =
      '<a class="hub-topbar-logo" href="../index.html">' +
      '<img src="../img/logo.svg" alt="CURIOS"> CURIOS Hub</a>' +
      '<button class="hub-btn-icon hub-hamburger" id="hub-hamburger" aria-label="Menu">☰</button>' +
      '<nav class="hub-topbar-nav" id="hub-nav">' + navHtml + "</nav>" +
      '<div class="hub-topbar-right">' +
      '<div class="hub-topbar-user">' +
      '<span class="avatar">' + initials + "</span>" +
      "<span>" + escHtml(user ? user.name : "") + "</span></div>" +
      '<button class="hub-btn-icon" id="hub-logout" aria-label="Déconnexion" title="Se déconnecter">🚪</button>' +
      "</div>";
  }

  function bindNavEvents() {
    var items = document.querySelectorAll("[data-nav]");
    for (var i = 0; i < items.length; i++) {
      items[i].addEventListener("click", function () {
        navigate(this.getAttribute("data-nav"));
      });
    }

    var hamburger = document.getElementById("hub-hamburger");
    var nav = document.getElementById("hub-nav");
    if (hamburger && nav) {
      hamburger.addEventListener("click", function () {
        nav.classList.toggle("open");
      });
    }

    var logoutBtn = document.getElementById("hub-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        HubAuth.logout();
      });
    }
  }

  function bindPageEvents() {
    var els = document.querySelectorAll("[data-page-action]");
    for (var i = 0; i < els.length; i++) {
      els[i].addEventListener("click", function () {
        var action = this.getAttribute("data-page-action");
        if (typeof window["hubAction_" + action] === "function") {
          window["hubAction_" + action]();
        } else {
          // Fonctionnalité non encore câblée : on le signale au lieu de ne rien faire.
          toast("Fonctionnalité « " + action + " » à venir");
        }
      });
    }
  }

  function escHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function toast(msg, duration) {
    var el = document.getElementById("hub-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "hub-toast";
      el.className = "hub-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._timer);
    el._timer = setTimeout(function () {
      el.classList.remove("show");
    }, duration || 3000);
  }

  function init() {
    if (!HubAuth.requireAuth()) return;

    window.addEventListener("hashchange", renderShell);
    renderShell();
  }

  window.HubShell = {
    init: init,
    navigate: navigate,
    registerPage: registerPage,
    toast: toast,
    escHtml: escHtml,
  };
})();
