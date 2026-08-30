/* =========================================================
   Curi🧭s — Tableau de bord : réception côté participants
   Interroge le serveur (/api/board) pour afficher le message
   diffusé par l'organisateur et les épreuves aléatoires.
   Les réponses sont envoyées sur /api/answer.
   ========================================================= */

(function () {
  "use strict";

  const POLL_MS = 5000;
  let seq = -1;
  let challengeSeq = -1;
  let logoutSeq = -1;
  let busy = false;

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function teamName() {
    try { return (typeof Store !== "undefined" && Store.getActive()) ? Store.getActive().name : ""; }
    catch (e) { return ""; }
  }

  function localizedMessage(msg) {
    if (!msg) return "";
    if (typeof msg === "string") return msg;
    let lang = "fr";
    try { if (typeof I18N !== "undefined" && I18N.lang) lang = I18N.lang; } catch (e) {}
    if (msg[lang]) return msg[lang];
    if (msg.fr) return msg.fr;
    for (const k in msg) { if (msg[k]) return msg[k]; }
    return "";
  }

  function showBanner(text) {
    const b = $("board-banner");
    if (!b) return;
    b.classList.remove("hidden");
    b.innerHTML = `<span style="font-size:24px;">📣</span><span class="board-banner-text">${  esc(text)  }</span>` +
      `<button type="button" class="board-banner-close" aria-label="Fermer">✕</button>`;
    const close = b.querySelector(".board-banner-close");
    if (close) close.addEventListener("click", () => b.classList.add("hidden"));
  }

  function hideBanner() {
    const b = $("board-banner");
    if (b) b.classList.add("hidden");
  }

  function typeTag(t) {
    const k = `chal_type_${  t || ""}`;
    const v = I18N.t(k);
    return v === k ? (t || "") : v;
  }

  function showChallenge(ch) {
    const ov = $("challenge-overlay");
    if (!ov) return;
    if (!ch) {
      ov.classList.add("hidden");
      return;
    }
    window._currentChallengeId = ch.id || "";
    $("challenge-title").textContent = I18N.t("chal_title");
    $("challenge-tag").textContent = typeTag(ch.type);
    $("challenge-question").textContent = ch.question || "";
    $("challenge-answer").value = "";
    $("challenge-status").textContent = "";
    ov.classList.remove("hidden");
  }

  function hideChallenge() {
    const ov = $("challenge-overlay");
    if (ov) ov.classList.add("hidden");
  }

  async function sendAnswer() {
    const ov = $("challenge-overlay");
    const input = $("challenge-answer");
    const text = (input.value || "").trim();
    if (!text) { $("challenge-status").textContent = I18N.t("chal_empty"); return; }
    if (busy) return;
    busy = true;
    $("challenge-status").textContent = I18N.t("chal_sending");
    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team: teamName(),
          text: text,
          challengeId: window._currentChallengeId || "",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        $("challenge-status").textContent = I18N.t("chal_sent");
        input.value = "";
        setTimeout(() => ov.classList.add("hidden"), 1400);
      } else {
        $("challenge-status").textContent = I18N.t("chal_fail");
      }
    } catch (e) {
      $("challenge-status").textContent = I18N.t("chal_fail");
    } finally {
      busy = false;
    }
  }

  async function poll() {
    if (document.visibilityState === "hidden") return;
    try {
      const res = await fetch("/api/board");
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.seq === "number" && data.seq !== seq) {
        seq = data.seq;
        const m = localizedMessage(data.message);
        if (m) showBanner(m);
        else hideBanner();
      }
      if (data.challengeSeq !== challengeSeq) {
        challengeSeq = data.challengeSeq;
        showChallenge(data.challenge);
      }
      const team = teamName();
      if (team && data.logoutSeq !== logoutSeq) {
        const wanted = (data.logoutTeams || []).some((t) => String(t).toLowerCase() === String(team).toLowerCase());
        if (wanted) {
          logoutSeq = data.logoutSeq;
          hideBanner();
          hideChallenge();
          try { Store.logout(); } catch (e) {}
          window.dispatchEvent(new CustomEvent("board:logout"));
          try {
            fetch("/api/board", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "logoutAck", team: team }),
            }).catch(() => {});
          } catch (e) {}
        }
      }
    } catch (e) { /* hors-ligne : silencieux */ }
  }

  function start() {
    const close = $("chal-close");
    if (close) close.addEventListener("click", hideChallenge);
    const send = $("chal-send");
    if (send) send.addEventListener("click", sendAnswer);
    poll();
    setInterval(poll, POLL_MS);
  }

  window.Board = { start: start };
})();
