/* screens/god.js — Écran admin (god mode), extrait de app.js.
 *
 * Expose window.Screens.god.render() pour usage dans app.js.
 */
(function () {
  "use strict";
  if (typeof window === "undefined") globalThis.window = {};

  function makeQR(code) {
    try {
      if (typeof qrcode !== "function") return "";
      const qr = qrcode(0, "M");
      qr.addData(code);
      qr.make();
      return qr.createSvgTag(3, 0);
    } catch (_e) {
      return "";
    }
  }

  function renderBalisesList({ $, Store, I18N, esc, BALISES, makeQR: _makeQR, getBalise, getBird, showRiddle, showBirdOnly, App, toggleBalise }) {
    const list = $("god-list");
    list.innerHTML = BALISES.map((b) => {
      const done = Store.isDone(b.id);
      return `
        <div class="god-card ${done ? "done" : ""}" data-id="${b.id}">
          <div class="god-head">
            <strong>${esc(b.id)} \u2014 ${esc(b.label)}</strong>
            <span class="god-code">${esc(b.code)}</span>
          </div>
          <div class="god-coords">\ud83d\udccd ${b.lat.toFixed(5)}, ${b.lng.toFixed(5)}</div>
          <div class="god-qr">${_makeQR(b.code)}</div>
          <div class="god-actions">
            <button class="btn btn-ghost" data-god="riddle">${esc(I18N.t("god_open_riddle"))}</button>
            <button class="btn btn-ghost" data-god="bird">${esc(I18N.t("god_open_bird"))}</button>
            <button class="btn ${done ? "btn-danger" : "btn-primary"}" data-god="toggle">${done ? esc(I18N.t("god_mark_undo")) : esc(I18N.t("god_mark_done"))}</button>
          </div>
        </div>`;
    }).join("");

    list.querySelectorAll("[data-god]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const card = btn.closest(".god-card");
        const b = getBalise(card.dataset.id);
        if (!b) return;
        if (btn.dataset.god === "riddle") { App.target = b; showRiddle(b); }
        else if (btn.dataset.god === "bird") { App.target = b; App.activeBird = getBird(b.bird); App.backScreen = "god"; showBirdOnly(getBird(b.bird)); }
        else if (btn.dataset.god === "toggle") toggleBalise(b);
      });
    });
  }

  function render({ $, Store, I18N, esc, isGodProfile, BALISES, SITE, getBalise, getBird, showRiddle, showBirdOnly, App, toggleBalise, renderHome, toast }) {
    const p = Store.getActive();
    const list = $("god-list");
    if (!isGodProfile(p)) {
      list.innerHTML = `<p class="note">${esc(I18N.t("god_sam_only"))}</p>`;
      return;
    }

    const photos = $("god-photos");
    photos.innerHTML = `<h3 class="subtitle">${esc(I18N.t("god_photos"))}</h3>${
      SITE.photos.map((ph) => `<img class="god-photo" src="${ph.src}" alt="${esc(ph.label)}" loading="lazy">`).join("")}`;

    renderBalisesList({ $, Store, I18N, esc, BALISES, makeQR, getBalise, getBird, showRiddle, showBirdOnly, App, toggleBalise });

    $("btn-god-all-done").onclick = () => {
      const active = Store.getActive();
      if (!active) return;
      BALISES.forEach((b) => { if (!Store.isDone(b.id)) Store.unlockBalise(b.id, b.bird, 0); });
      render({ $, Store, I18N, esc, isGodProfile, BALISES, SITE, getBalise, getBird, showRiddle, showBirdOnly, App, toggleBalise, renderHome, toast });
      renderHome();
      toast(`\u2705 ${I18N.t("god_all_done")}`);
    };
    $("btn-god-all-reset").onclick = () => {
      const active = Store.getActive();
      if (!active) return;
      Store.resetProgress(active.id);
      render({ $, Store, I18N, esc, isGodProfile, BALISES, SITE, getBalise, getBird, showRiddle, showBirdOnly, App, toggleBalise, renderHome, toast });
      renderHome();
      toast(I18N.t("god_all_reset"));
    };
  }

  window.Screens = window.Screens || {};
  window.Screens.god = { render, makeQR };
})();
