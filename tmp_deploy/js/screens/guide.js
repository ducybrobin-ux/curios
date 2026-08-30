/* screens/guide.js — Guide des oiseaux, extrait de app.js.
 *
 * Expose window.Screens.guide.render() pour usage dans app.js.
 * Contient aussi les utilitaires SVG (birdSvg, shade) et shuffle (Fisher-Yates).
 */
(function () {
  "use strict";
  if (typeof window === "undefined") globalThis.window = {};

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function shade(hex, amt) {
    const n = parseInt(String(hex).replace("#", ""), 16);
    if (isNaN(n)) return hex;
    const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt)));
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `#${[f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  }

  function birdSvg(bird, escFn) {
    const esc = escFn || ((s) => String(s));
    const c = bird.couleur || "#5a5a5a";
    const body = shade(c, 8);
    const belly = shade(c, 42);
    const dark = shade(c, -32);
    const beak = "#e8a33d";
    const leg = "#8a6b3f";
    let accent = "";
    switch (bird.id) {
      case "pinson": accent = '<path d="M112 100 q30 6 44 26 l-10 12 q-20 -18 -46 -20 Z" fill="#d96b36" opacity="0.95"/>'; break;
      case "hirondelle": accent = '<path d="M92 100 q8 18 26 24 q-22 -4 -26 -24 Z" fill="#b0402a"/>'; break;
      case "verdier": accent = '<ellipse cx="148" cy="104" rx="22" ry="9" fill="#f2d13d" transform="rotate(-10 148 104)"/>'; break;
      case "grive": accent = '<circle cx="118" cy="104" r="3.6" fill="#5a4632"/><circle cx="133" cy="114" r="3.6" fill="#5a4632"/><circle cx="146" cy="102" r="3.6" fill="#5a4632"/>'; break;
      case "chouette": case "hibou": accent = '<circle cx="168" cy="46" r="10" fill="#d8b13a"/><circle cx="192" cy="46" r="10" fill="#d8b13a"/>'; break;
      case "pic": accent = '<path d="M166 34 l12 15 l-12 6 Z" fill="#c8302e"/><path d="M194 34 l-12 15 l12 6 Z" fill="#c8302e"/>'; break;
    }
    return `<svg class="bird-svg" viewBox="0 0 260 190" role="img" aria-label="${esc(bird.nom)}">
      <rect x="16" y="140" width="228" height="9" rx="4.5" fill="#7a5a3a" opacity="0.6"/>
      <path d="M76 92 L14 70 L30 112 Z" fill="${dark}"/>
      <ellipse cx="122" cy="100" rx="52" ry="38" fill="${body}"/>
      <ellipse cx="128" cy="112" rx="36" ry="20" fill="${belly}"/>
      <path d="M92 88 q34 -18 70 -2 q-34 6 -70 2 Z" fill="${dark}" opacity="0.85"/>
      ${accent}
      <circle cx="176" cy="62" r="26" fill="${body}"/>
      <circle cx="172" cy="58" r="6.5" fill="#fff"/>
      <circle cx="173" cy="58" r="3" fill="#1a1a1a"/>
      <path d="M197 57 l19 7 l-19 9 Z" fill="${beak}"/>
      <path d="M114 128 l-3 12 M132 126 l3 14" stroke="${leg}" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`;
  }

  function render({ $, esc, allBirds, birdLabel, getBird, App, showBirdOnly }) {
    const grid = $("guide-grid");
    grid.innerHTML = shuffle(allBirds()).map((b) => `
      <button class="guide-card" data-guide="${b.id}">
        <div class="guide-photo">${b.img ? `<img class="guide-photo-img" src="${b.img}" alt="${esc(b.nom)}" loading="lazy">` : birdSvg(b, esc)}</div>
        <div class="guide-info">
          <strong class="guide-name">${esc(birdLabel(b))}</strong>
          <small class="guide-latin">${esc(b.latin)}</small>
          <span class="tag">${esc(b.taille)}</span>
        </div>
      </button>`).join("");
    grid.querySelectorAll("[data-guide]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const bird = getBird(btn.dataset.guide);
        if (!bird) return;
        App.activeBird = bird;
        App.backScreen = "guide";
        showBirdOnly(bird);
      });
    });
  }

  window.Screens = window.Screens || {};
  window.Screens.guide = { render, shuffle, shade, birdSvg };
})();
