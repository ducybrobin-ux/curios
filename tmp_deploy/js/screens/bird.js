/* screens/bird.js — Fiche oiseau + carnet, extrait de app.js.
 *
 * Expose window.Screens.bird.renderCard() et window.Screens.carnet.render().
 */
(function () {
  "use strict";
  if (typeof window === "undefined") globalThis.window = {};

  function renderCard({ $, showScreen, esc, I18N, AudioSys, App, bird, birdLabel, BALISES, renderGod, renderGuide, renderCarnet }) {
    const card = $("bird-card");
    card.innerHTML = `
      ${bird.img
        ? `<img class="bird-illustration-img" src="${bird.img}" alt="${esc(bird.nom)}" loading="lazy">`
        : `<div class="bird-illustration" style="--bird:${bird.couleur}">${bird.emoji}</div>`}
      <h2 class="bird-name">${esc(birdLabel(bird))}</h2>
      <p class="bird-latin">${esc(bird.latin)}</p>
      <div class="bird-tags">
        <span class="tag">Taille : ${bird.taille}</span>
        <span class="tag ${bird.categorie === "nocturne" ? "tag-night" : ""}">${bird.categorie === "nocturne" ? I18N.t("bird_nocturne") : I18N.t("bird_diurne")}</span>
      </div>
      <div class="bird-anecdotes">
        ${bird.description ? `<div class="bird-desc"><p>${esc(bird.description)}</p></div>` : ""}
        <p class="kicker">${I18N.t("bird_stories")}</p>
        <ul>${bird.anecdotes.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
      </div>
      <button class="btn btn-primary" id="btn-bird-sound">${I18N.t("bird_btn_sound")}</button>
      <button class="btn btn-ghost" id="btn-bird-back">\ud83d\uddfa\ufe0f ${App.backScreen === "god" || App.backScreen === "guide" ? I18N.t("god_back") : I18N.t("nav_map")}</button>`;
    $("btn-bird-sound").addEventListener("click", () => {
      if (bird.audioFile) { const a = new Audio(bird.audioFile); a.volume = 0.8; a.play().catch(() => {}); }
      else AudioSys.playBird(bird, 1);
    });
    $("btn-bird-back").addEventListener("click", () => {
      if (App.backScreen === "god") { showScreen("god"); renderGod(); }
      else if (App.backScreen === "guide") { showScreen("guide"); renderGuide(); }
      else { showScreen("carnet"); renderCarnet(); }
    });
  }

  function renderCarnet({ $, esc, I18N, Store, BIRDS, BALISES, birdLabel, getBird, App, showScreen, showBirdOnly }) {
    const p = Store.getActive();
    const grid = $("carnet-grid");
    if (!p) { $("carnet-summary").textContent = "Cr\u00e9\u00e9 d'abord un profil."; grid.innerHTML = ""; return; }
    $("carnet-summary").textContent = `${esc(p.name)} a valid\u00e9 ${p.birds.length} d\u00e9couverte${p.birds.length > 1 ? "s" : ""} sur ${BIRDS.length}.`;
    grid.innerHTML = BIRDS.map((b) => {
      const found = p.birds.includes(b.id);
      return `
        <button class="carnet-card ${found ? "" : "empty"}" data-open="${b.id}" ${found ? "" : "disabled"}>
          <span class="carnet-emoji">${found ? b.emoji : "\u2753"}</span>
          <span class="carnet-name">${found ? esc(birdLabel(b)) : "\u00c0 d\u00e9couvrir"}</span>
          ${b.categorie === "nocturne" ? `<span class="carnet-night">\ud83c\udf19</span>` : ""}
        </button>`;
    }).join("");
    grid.querySelectorAll("[data-open]").forEach((b) => {
      b.addEventListener("click", () => {
        const bird = getBird(b.dataset.open);
        App.target = BALISES.find((x) => x.bird === bird.id);
        App.activeBird = bird;
        showBirdOnly(bird);
      });
    });
  }

  window.Screens = window.Screens || {};
  window.Screens.bird = { renderCard };
  window.Screens.carnet = { render: renderCarnet };
})();
