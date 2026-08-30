/* screens/palmares.js — Écran palmarès, extrait de app.js.
 *
 * Expose window.Screens.palmares.render() pour usage dans app.js.
 */
(function () {
  "use strict";
  if (typeof window === "undefined") globalThis.window = {};

  const esc = window.GameFlow ? null : null; // esc est un global

  function fmtTime(s) {
    if (!s && s !== 0) return "\u2014";
    const m = Math.floor(s / 60), sec = s % 60;
    return m > 0 ? `${m} min ${sec} s` : `${sec} s`;
  }

  function avatarHTML(p, extraCls, escFn) {
    const _esc = escFn || window.esc || ((s) => s);
    const glyph = (p.emoji && p.emoji.trim()) ? p.emoji : _esc((p.name[0] || "?").toUpperCase());
    return `<span class="avatar ${extraCls || ""}" style="background:${p.avatar}">${glyph}</span>`;
  }

  function render($, Store, I18N, escFn) {
    const _esc = escFn || window.esc || ((s) => s);
    const list = $("palmares-list");
    const rows = Store.palmares();
    const active = Store.getActive();
    const msgBtn = $("btn-message");
    if (msgBtn) {
      msgBtn.textContent = active && ((active.message || "").trim() || active.selfie)
        ? I18N.t("guestbook_palmares_btn_edit")
        : I18N.t("guestbook_palmares_btn");
    }
    if (!rows.length) {
      list.innerHTML = '<p class="note">Aucune famille n\'a encore termin\u00e9 le parcours cette semaine. \u00c0 vous de jouer !</p>';
    } else {
      list.innerHTML = rows.map((r, i) => `
        <div class="palmares-row ${active && active.name === r.name ? "me" : ""}">
          <span class="palmares-rank">${i + 1}</span>
          ${avatarHTML(r, "", _esc)}
          ${r.selfie ? `<img class="palmares-selfie" src="${r.selfie}" alt="${_esc(r.name)}">` : ""}
          <div class="palmares-info">
            <strong>${_esc(r.name)}</strong>
            <small>${r.birds} d\u00e9couvertes \u00b7 \u2b50 ${r.stars} \u00b7 \u23f1\ufe0f ${fmtTime(r.seconds)}${r.offered ? ` \u00b7 \ud83e\udde0 ${r.offered}` : ""}</small>
            ${r.message ? `<em class="palmares-msg">\u00ab ${_esc(r.message)} \u00bb</em>` : ""}
          </div>
        </div>`).join("");
    }
    const note = $("palmares-note");
    if (note) note.textContent = "Le palmar\u00e8s de la semaine est enregistr\u00e9 sur cet appareil.";
  }

  window.Screens = window.Screens || {};
  window.Screens.palmares = { render, fmtTime, avatarHTML };
})();
