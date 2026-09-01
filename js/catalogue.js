/* =========================================================
   CURIOS — Catalogue :  js/catalogue.js
   Rendu immersif du catalogue de packs (Netflix / musée).
   Dépend de js/catalogue-data.js (window.CATALOGUE_DATA).
   ========================================================= */
(function () {
  "use strict";

  var DATA = window.CATALOGUE_DATA || { packs: [], collections: [] };
  var packsById = {};
  var liveStates = {};   /* états réels remontés par /api/packs */
  var state = {
    query: "",
    collection: "Toutes",
    activeId: null
  };

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------------- États / fusion ---------------- */

  function packState(p) {
    var live = liveStates[p.id];
    if (live && live.state) return live.state;
    return null;
  }
  function isActive(p) {
    var live = liveStates[p.id];
    return live ? !!live.actif : (p.id === DATA.activePack);
  }

  function nbBalises(p) {
    var live = liveStates[p.id];
    if (live && typeof live.stations === "number") return live.stations;
    if (live && live.balises) return live.balises;
    return p.nbBalises || 1;
  }
  function nbMissions(p) {
    var live = liveStates[p.id];
    return (live && typeof live.missions === "number") ? live.missions : null;
  }
  function agesText(p) {
    var live = liveStates[p.id];
    if (live && live.audience && live.audience.length) {
      return live.audience[0] === live.audience[1]
        ? live.audience[0] + " ans"
        : live.audience[0] + "-" + live.audience[1] + " ans";
    }
    return (p.ages && p.ages.length) ? p.ages[0] + "-" + p.ages[1] + " ans" : "";
  }

  function coverSrc(p) {
    return p.cover ? "img/covers/" + p.cover + ".png" : null;
  }
  function icon(name) { return '<svg class="cur-icon" aria-hidden="true"><use xlink:href="img/curios-icons-sprite.svg#' + esc(name) + '"></use></svg>'; }
  function coverMarkup(p, big) {
    var src = coverSrc(p);
    var badge = stateBadge(p);
    if (src) {
      return '<img src="' + esc(src) + '" alt="' + esc(p.nom) + '" loading="lazy" onerror="this.replaceWith(CatalogueUI.fallback(' + JSON.stringify(p.id) + '))">' + (badge || "");
    }
    return window.CatalogueUI.fallback(p.id) + (badge || "");
  }
  function stateBadge(p) {
    var st = packState(p);
    var label;
    var cls;
    if (isActive(p)) { label = "ACTIF"; cls = "cat-card-badge--active"; }
    else if (st === "DISABLED") { label = "DÉSACTIVÉ"; cls = "cat-card-badge--disabled"; }
    else { label = "DISPONIBLE"; cls = "cat-card-badge--available"; }
    return '<span class="cat-card-badge ' + cls + '">● ' + label + '</span>';
  }
  function cardMeta(p) {
    var parts = [];
    parts.push('<span class="cat-meta-pill">' + icon('location') + ' ' + esc(p.location || "Sentier") + '</span>');
    parts.push('<span class="cat-meta-pill">' + icon('map') + ' ' + nbBalises(p) + ' balises</span>');
    parts.push('<span class="cat-meta-pill">' + icon('timer') + ' ~' + p.durationMin + ' min</span>');
    var age = agesText(p);
    if (age) parts.push('<span class="cat-meta-pill">' + icon('badge') + ' ' + esc(age) + '</span>');
    return '<div class="cat-card-meta">' + parts.join("") + '</div>';
  }
  function cardMarkup(p) {
    var flag = isActive(p) ? '<span class="cat-card-flag">★</span>' : "";
    var tags = (p.badges || []).slice(0, 2).map(function (t) {
      return '<span class="cat-tag">' + esc(t) + '</span>';
    }).join("");
    return '' +
      '<article class="cat-card" data-id="' + esc(p.id) + '" tabindex="0" role="button" ' +
      'aria-label="Voir ' + esc(p.nom) + '">' +
        flag +
        '<div class="cat-card-cover">' + coverMarkup(p, false) + '</div>' +
        '<div class="cat-card-body">' +
          '<div class="cat-card-tags">' + tags + '</div>' +
          '<h3>' + esc(p.nom) + '</h3>' +
          '<div class="cat-card-tagline">' + esc(p.tagline || "") + '</div>' +
          cardMeta(p) +
        '</div>' +
      '</article>';
  }

  /* ---------------- Rendu sections / collections ---------------- */

  function renderCollectionsBar() {
    var bar = $("#cat-collections");
    if (!bar) return;
    var names = ["Toutes"].concat(DATA.collections.map(function (c) { return c.nom; }));
    bar.innerHTML = names.map(function (n) {
      return '<button class="cat-chip' + (state.collection === n ? " is-on" : "") + '" data-col="' + esc(n) + '">' + esc(n) + '</button>';
    }).join("");
  }

  function renderAllGrid() {
    var grid = $("#cat-all-grid");
    if (!grid) return;
    var list = matches().map(cardMarkup).join("");
    grid.innerHTML = list || '<div class="cat-empty"><div class="cat-empty-ico">🔍</div><p>Aucun pack ne correspond à ta recherche.</p></div>';
  }

  function renderCollections() {
    var wrap = $("#cat-collections-sections");
    if (!wrap) return;
    var filteredIds = new Set(matches().map(function (p) { return p.id; }));

    var html = "";
    DATA.collections.forEach(function (col) {
      var packs = col.packs
        .map(function (id) { return packsById[id]; })
        .filter(Boolean)
        .filter(function (p) { return filteredIds.has(p.id); });
      if (!packs.length) return;
      var featured = packs.filter(function (p) { return p.featured; })[0] || packs[0];
      if (featured) {
        html += heroMarkup(featured);
      }
      html += sectionMarkup(col.nom, packs);
    });

    /* Collection communautaire (import atelier) */
    html += communityMarkup();

    wrap.innerHTML = html || '<div class="cat-empty"><div class="cat-empty-ico">🗺️</div><p>Aucune collection à afficher pour ce filtre.</p></div>';
  }

  function heroMarkup(p) {
    var onClick = 'onclick="Catalog.open(' + JSON.stringify(p.id) + ')"';
    return '' +
      '<div class="cat-hero-feature" id="cat-hero-feature" data-id="' + esc(p.id) + '">' +
        '<div class="cat-hf-media">' + (coverSrc(p) ? '<img src="' + esc(coverSrc(p)) + '" alt="">' : window.CatalogueUI.fallback(p.id)) + '</div>' +
        '<div class="cat-hf-content">' +
          '<div class="cat-hf-kicker">✨ À la une · ' + esc(p.collection) + '</div>' +
          '<h2>' + esc(p.nom) + '</h2>' +
          '<div class="cat-hf-tagline">' + esc(p.tagline || "") + '</div>' +
          '<div class="cat-hf-meta">' +
            '<span class="cat-meta-pill">' + icon('map') + ' ' + nbBalises(p) + ' balises</span>' +
            '<span class="cat-meta-pill">' + icon('timer') + ' ~' + p.durationMin + ' min</span>' +
            (agesText(p) ? '<span class="cat-meta-pill">' + icon('badge') + ' ' + esc(agesText(p)) + '</span>' : "") +
          '</div>' +
          '<div class="cat-hf-actions">' +
            '<button class="cur-btn cur-btn--primary" onclick="Catalog.play(' + JSON.stringify(p.id) + ')">' + icon('play') + ' Jouer</button>' +
            '<button class="cur-btn cur-btn--ghost" onclick="Catalog.open(' + JSON.stringify(p.id) + ')">Découvrir</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function sectionMarkup(name, packs) {
    return '' +
      '<section class="cat-section" data-section="' + esc(name) + '">' +
        '<div class="cat-section-head">' +
          '<h2><span class="cat-dot">◆</span> ' + esc(name) + '</h2>' +
          '<span class="cat-count">' + packs.length + ' expédition' + (packs.length > 1 ? "s" : "") + '</span>' +
        '</div>' +
        '<div class="cat-rail">' + packs.map(cardMarkup).join("") + '</div>' +
      '</section>';
  }

  function communityMarkup() {
    return '' +
      '<section class="cat-section" data-section="communautaires">' +
        '<div class="cat-section-head">' +
          '<h2><span class="cat-dot">➕</span> Communautaires &amp; créés par toi</h2>' +
          '<span class="cat-count">import depuis l\'atelier</span>' +
        '</div>' +
        '<div class="cat-community">' +
          '<div class="cat-comm-ico">🧩</div>' +
          '<div class="cat-comm-text">' +
            '<p>Crée, personnalise ou importe un parcours depuis l\'atelier Curi🧭s.</p>' +
            '<p class="cat-dim">Tes packs communautaires apparaîtront ici.</p>' +
          '</div>' +
          '<button class="cur-btn cur-btn--primary" onclick="Catalog.community()">Ouvrir l\'atelier</button>' +
        '</div>' +
      '</section>';
  }

  function matches() {
    var q = state.query.trim().toLowerCase();
    return DATA.packs.filter(function (p) {
      if (state.collection !== "Toutes" && p.collection !== state.collection) return false;
      if (!q) return true;
      var hay = (p.nom + " " + (p.tagline || "") + " " + (p.collection || "") + " " + (p.badges || []).join(" ") + " " + (p.skills || []).join(" ")).toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  /* ---------------- Modale ---------------- */

  function openModal(id) {
    var p = packsById[id];
    if (!p) return;
    state.activeId = id;
    var b = $("#cat-modal-bg");
    var body = $("#cat-modal");
    b.classList.add("is-open");
    document.body.style.overflow = "hidden";

    var meta = [
      metaItem("Difficulté", p.difficulty),
      metaItem("Durée", "~" + p.durationMin + " min"),
      metaItem("Joueurs", p.players.join(" – ")),
      metaItem("Balises", String(nbBalises(p))),
      metaItem("Lieu", p.location),
      agesText(p) ? metaItem("Âges", agesText(p)) : "",
      metaItem("Animateur", p.staff ? "Recommandé" : "Non requis")
    ].join("");

    function chips(list, cls) {
      return '<div class="cat-md-chips">' + (list || []).map(function (t) {
        return '<span class="cat-tag">' + esc(t) + '</span>';
      }).join("") + '</div>';
    }

    body.innerHTML =
      '<div class="cat-modal-hero">' + (coverSrc(p) ? '<img src="' + esc(coverSrc(p)) + '" alt="">' : window.CatalogueUI.fallback(p.id)) + '</div>' +
      '<button class="cat-modal-close" id="cat-modal-close" aria-label="Fermer">×</button>' +
      '<div id="cat-modal-body-content"></div>';

    $("#cat-modal-body-content", body).innerHTML =
      '<div class="cat-modal-title"><span class="cat-md-emoji">' + p.emoji + '</span><h2>' + esc(p.nom) + '</h2></div>' +
      '<div class="cat-md-tagline">' + esc(p.tagline || "") + '</div>' +
      '<p class="cat-md-desc">' + esc(p.description || "") + '</p>' +
      '<div class="cat-md-meta">' + meta + '</div>' +
      '<div class="cat-md-block"><h4>Objectifs</h4>' + chips(p.goals) + '</div>' +
      '<div class="cat-md-block"><h4>Compétences</h4>' + chips(p.skills) + '</div>' +
      '<div class="cat-md-block"><h4>Matériel</h4>' + chips(p.material) + '</div>' +
      '<div class="cat-md-actions">' + actionsMarkup(p) + '</div>';

    $("#cat-modal-close", body).addEventListener("click", closeModal);
  }
  function metaItem(k, v) {
    return '<div class="cat-md-meta-item"><div class="cat-md-k">' + esc(k) + '</div><div class="cat-md-v">' + esc(v) + '</div></div>';
  }
  function actionsMarkup(p) {
    var play = displayPlayButton(p);
    return '' +
      (play ? play : "") +
      '<button class="cur-btn cur-btn--ghost" onclick="Catalog.prepare(' + JSON.stringify(p.id) + ')">Préparer</button>' +
      '<button class="cur-btn cur-btn--ghost" onclick="Catalog.customize(' + JSON.stringify(p.id) + ')">Personnaliser</button>' +
      '<button class="cur-btn cur-btn--ghost" onclick="Catalog.download(' + JSON.stringify(p.id) + ')">Télécharger</button>';
  }
  function displayPlayButton(p) {
    if (isActive(p)) {
      return '<button class="cur-btn cur-btn--primary" onclick="Catalog.play(' + JSON.stringify(p.id) + ')">▶ Jouer</button>';
    }
    return '<button class="cur-btn cur-btn--primary" onclick="Catalog.activate(' + JSON.stringify(p.id) + ')">Activer &amp; Jouer</button>';
  }
  function closeModal() {
    $("#cat-modal-bg").classList.remove("is-open");
    document.body.style.overflow = "";
    state.activeId = null;
  }

  /* ---------------- Actions ---------------- */

  function play(id) {
    var p = packsById[id];
    if (!p) return;
    if (!isActive(p)) { activate(id); return; }
    window.location.href = "index.html";
  }
  function activate(id) {
    fetch("/api/packs/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id })
    }).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, j: j }; });
    }).then(function (res) {
      if (res.ok) { toast("Parcours activé ✔"); setTimeout(function () { window.location.reload(); }, 600); }
      else {
        var msg = res.j && res.j.error ? res.j.error : "Sélection réservée à l'organisateur.";
        toast(msg);
      }
    }).catch(function () {
      toast("Hors ligne : activation impossible. Connecte-toi à l'organisateur.");
    });
  }
  function prepare(id) {
    window.open("dashboard", "_blank") || window.location.assign("dashboard.html");
  }
  function customize(id) {
    window.open("editeur.html", "_blank") || window.location.assign("editeur.html");
  }
  function community() {
    window.open("atelier.html", "_blank") || window.location.assign("atelier.html");
  }
  function download(id) {
    var p = packsById[id];
    if (!p) return;
    var url = "/api/packs/" + id;
    fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("r");
      return r.blob();
    }).then(function (blob) {
      saveBlob(blob, id + ".json");
      toast("Bundle téléchargé ✔");
    }).catch(function () {
      /* repli hors-ligne : bundle déjà présent en static */
      var fallback = "content/bundles/" + id + ".json";
      fetch(fallback).then(function (r) { return r.blob(); }).then(function (blob) {
        saveBlob(blob, id + ".json");
        toast("Bundle téléchargé (hors-ligne) ✔");
      }).catch(function () { toast("Téléchargement indisponible."); });
    });
  }
  function saveBlob(blob, name) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function toast(msg) {
    var t = $("#cat-toast");
    t.textContent = msg;
    t.classList.add("is-show");
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.classList.remove("is-show"); }, 2600);
  }

  /* ---------------- Fallbacks visuels (packs sans image) ---------------- */

  function fallbackSvg(id) {
    var p = packsById[id];
    var a = p.accent || "#073b5c";
    var b = "#092235";
    var emo = p.emoji || "🧭";
    var name = (p.nom || "").toUpperCase();
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice">' +
      '<defs>' +
      '<linearGradient id="g' + esc(id) + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>' +
      '<radialGradient id="r' + esc(id) + '" cx="0.5" cy="0.4" r="0.9">' +
      '<stop offset="0" stop-color="rgba(125,221,229,.22)"/><stop offset="1" stop-color="rgba(125,221,229,0)"/></radialGradient>' +
      '</defs>' +
      '<rect width="600" height="400" fill="url(#g' + esc(id) + ')"/>' +
      '<rect width="600" height="400" fill="url(#r' + esc(id) + ')"/>' +
      '<circle cx="0" cy="400" r="220" fill="rgba(6,21,34,.25)"/>' +
      '<circle cx="600" cy="0" r="160" fill="rgba(6,21,34,.18)"/>' +
      '<g opacity=".18" stroke="#B8F5F3" stroke-width="1.5" fill="none">' +
      '<path d="M0,300 Q150,260 300,310 T600,290"/>' +
      '<path d="M0,340 Q160,300 320,350 T600,330"/>' +
      '</g>' +
      '<text x="300" y="190" font-size="120" text-anchor="middle" dominant-baseline="central">' + emo + '</text>' +
      '<text x="300" y="330" font-size="20" text-anchor="middle" font-family="Inter,Segoe UI,sans-serif" font-weight="700" fill="#E9F0F2" letter-spacing="2">' + esc(name) + '</text>' +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function fallbackMarkup(id) {
    return '<img class="cat-cover-fallback-img" src="' + fallbackSvg(id) + '" alt="" loading="lazy">';
  }

  /* ---------------- Init ---------------- */

  function load() {
    DATA.packs.forEach(function (p) { packsById[p.id] = p; });
    renderStats();
    renderCollectionsBar();
    renderCollections();
    renderAllGrid();
    bind();
    fetchLive();
  }

  function renderStats() {
    var el = $("#cat-hero-stats");
    if (!el) return;
    var totalBalises = DATA.packs.reduce(function (a, p) { return a + (p.nbBalises || 1); }, 0);
    el.innerHTML =
      '<div class="cat-stat"><b>' + DATA.packs.length + '</b><span>expéditions</span></div>' +
      '<div class="cat-stat"><b>' + totalBalises + '</b><span>balises à découvrir</span></div>' +
      '<div class="cat-stat"><b>' + DATA.collections.length + '</b><span>collections</span></div>';
  }

  function fetchLive() {
    if (!window.fetch) return;
    fetch("/api/packs", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("r"); return r.json(); })
      .then(function (j) {
        if (!j || !j.packs) return;
        (j.packs || []).forEach(function (pp) { liveStates[pp.id] = pp; });
        /* réexécuter le rendu pour refléter les états live */
        renderCollectionsBar();
        renderCollections();
        renderAllGrid();
        highlightActive();
      })
      .catch(function () { /* hors-ligne : on garde les données embarquées */ });
  }

  function highlightActive() {
    DATA.packs.forEach(function (p) {
      if (isActive(p)) {
        var card = $('[data-section="' + p.collection + '"] [data-id="' + p.id + '"]');
        if (card) card.classList.add("is-active");
      }
    });
  }

  function bind() {
    var bg = $("#cat-modal-bg");
    bg.addEventListener("click", function (e) { if (e.target === bg) closeModal(); });

    $("#cat-search").addEventListener("input", function (e) {
      state.query = e.target.value;
      renderCollections();
      renderAllGrid();
    });

    $("#cat-collections").addEventListener("click", function (e) {
      var chip = e.target.closest(".cat-chip");
      if (!chip) return;
      state.collection = chip.getAttribute("data-col");
      renderCollectionsBar();
      renderCollections();
      renderAllGrid();
    });

    document.addEventListener("click", function (e) {
      var card = e.target.closest(".cat-card");
      if (card) {
        var id = card.getAttribute("data-id");
        if (id) openModal(id);
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { if (bg.classList.contains("is-open")) closeModal(); return; }
      var card = e.target && e.target.closest ? e.target.closest(".cat-card") : null;
      if (card && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        var id = card.getAttribute("data-id");
        if (id) openModal(id);
      }
    });

    $("#btn-cat-home").addEventListener("click", function () { window.location.href = "index.html"; });
    $("#btn-cat-hub").addEventListener("click", function () { window.location.href = "hub/app.html"; });

    var rail = document.querySelector('[data-scroll-rail]');
    if (rail) {
      rail.addEventListener("click", function () {
        var first = document.querySelector(".cat-hero-feature, [data-section]");
        if (first) first.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }

  /* API exposée (utilisée depuis les attributs onclick) */
  window.Catalog = { open: openModal, close: closeModal, play: play, activate: activate, prepare: prepare, customize: customize, download: download, community: community };
  window.CatalogueUI = { fallback: fallbackMarkup };
})();
