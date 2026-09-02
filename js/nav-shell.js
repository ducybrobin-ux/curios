/* =========================================================
   Curi🧭s — Shell de navigation unifiée
   Espaces : JOUER / PARCOURS / CRÉER / PILOTER / ⚙ (Hub).
   Injecté dans les pages qui déclarent :
     <div id="cur-nav" data-nav-current="jouer|parcours|creer|piloter|hub"></div>
   L'attribut data-nav-current marque l'espace actif de la page.
   Homogénéise les chemins (fichiers .html, pas d'alias serveur).
   ========================================================= */
(function () {
  "use strict";

  const ITEMS = [
    { id: "jouer", href: "index.html", icon: "&#127918;", label: "Jouer" },
    { id: "parcours", href: "catalogue.html", icon: "&#128506;", label: "Parcours" },
    { id: "creer", href: "atelier.html", icon: "&#129691;", label: "Créer" },
    { id: "piloter", href: "dashboard.html", icon: "&#128202;", label: "Piloter" },
    { id: "hub", href: "hub/app.html", icon: "&#9881;&#65039;", label: "Hub" },
  ];

  function build(current) {
    const links = ITEMS.map(
      (it) =>
        `<a class="cur-nav__link${it.id === current ? " cur-nav__link--active" : ""}" ` +
        `href="${it.href}" data-nav="${it.id}">` +
        `<span aria-hidden="true">${it.icon}</span> ${it.label}</a>`
    ).join("");
    return (
      `<nav class="cur-navbar" aria-label="Espaces" data-cur-navbar>` +
      `<a class="cur-navbar__brand" href="index.html"><span class="cur-navbar__logo" aria-hidden="true">🧭</span><span class="cur-navbar__name">Curi🧭s</span></a>` +
      `<div class="cur-nav">${links}</div>` +
      `</nav>`
    );
  }

  function mount() {
    const anchor = document.getElementById("cur-nav");
    if (!anchor || anchor.getAttribute("data-cur-nav-mounted") === "1") return;
    const current = anchor.getAttribute("data-nav-current") || "";
    anchor.setAttribute("data-cur-nav-mounted", "1");
    anchor.innerHTML = build(current);
    /* Delegate : garder le focus/aria corrects sur les liens */
    const brand = anchor.querySelector(".cur-navbar__brand");
    if (brand) brand.setAttribute("aria-current", current === "jouer" ? "page" : "false");
    const active = anchor.querySelector(".cur-nav__link--active");
    if (active) active.setAttribute("aria-current", "page");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }

  window.CurNavShell = { mount, build, ITEMS };
})();